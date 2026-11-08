import 'server-only';
import { Resend } from 'resend';
import { workerDb } from './supabase';
import { dateTime, money } from './format';
import { siteUrl } from './site-url';
export async function dispatchEmails() {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return { configured: false, sent: 0 };
  const db = workerDb(),
    resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await db.rpc('claim_emails');
  if (error) throw new Error('No se pudo procesar la cola');
  let sent = 0;
  for (const event of data ?? []) {
    const title =
      event.event === 'cancelled'
        ? 'Tu turno fue cancelado'
        : event.event === 'rescheduled'
          ? 'Tu turno fue reprogramado'
          : 'Tu turno está confirmado';
    try {
      const result = await resend.emails.send(
        {
          from: process.env.EMAIL_FROM,
          to: event.recipient,
          subject: `Barber Luke · ${title}`,
          text: `${title}\n\n${event.payload.service}\n${dateTime(event.payload.starts_at)} (Buenos Aires)\n${money(event.payload.price_cents)}\n\nConsultá tus turnos en ${siteUrl()}/mis-turnos\nCancelaciones y reprogramaciones hasta 24 horas antes. No se requiere seña.`,
        },
        { idempotencyKey: event.id },
      );
      if (result.error) throw new Error('Proveedor no disponible');
      const update = await db
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', event.id);
      if (update.error) throw new Error('No se pudo registrar el envío');
      sent++;
    } catch {
      await db
        .from('email_outbox')
        .update({
          status: 'failed',
          next_attempt_at: new Date(
            Date.now() + Math.min(360, 2 ** event.attempts) * 60000,
          ).toISOString(),
        })
        .eq('id', event.id);
    }
  }
  return { configured: true, sent };
}
