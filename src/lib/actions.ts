'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { requireUser } from './auth';
import type { ActionState } from './types';
import { dispatchEmails } from './notifications';
const uuid = z.string().uuid();
const cents = z.coerce.number().int().min(0).max(100000000);
const text = (max = 100) => z.string().trim().min(2).max(max);
const iso = z.iso.datetime({ offset: true });
function friendly(error: { code?: string; message: string }): string {
  if (error.code === 'P0001') return error.message;
  if (error.code === '23P01') return 'Ese horario acaba de ocuparse. Elegí otro.';
  if (error.code === '23505')
    return 'Este registro ya existe. Actualizá la página para consultarlo.';
  return 'No pudimos guardar el cambio. Revisá los datos e intentá otra vez.';
}
export async function book(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({ service: uuid, start: iso, key: uuid, consent: z.literal('on') })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Elegí servicio y horario y aceptá la política de privacidad.' };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('book_appointment', {
    p_service: parsed.data.service,
    p_start: parsed.data.start,
    p_key: parsed.data.key,
  });
  if (error) return { error: friendly(error) };
  revalidatePath('/mis-turnos');
  after(async () => {
    await dispatchEmails().catch(() => {
      /* El evento queda persistido para reintento. */
    });
  });
  return { success: 'Tu turno está confirmado. Lo encontrás en Mis turnos.', id: data as string };
}
export async function changeAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: uuid,
      action: z.enum(['cancel', 'reschedule', 'completed', 'no_show']),
      start: iso.optional(),
    })
    .safeParse({
      id: form.get('id'),
      action: form.get('action'),
      start: form.get('start') || undefined,
    });
  if (!parsed.success || (parsed.data.action === 'reschedule' && !parsed.data.start))
    return { error: 'Elegí un horario válido.' };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc('change_appointment', {
    p_id: parsed.data.id,
    p_action: parsed.data.action,
    p_start: parsed.data.start ?? null,
  });
  if (error) return { error: friendly(error) };
  revalidatePath('/mis-turnos');
  revalidatePath('/admin', 'layout');
  after(async () => {
    await dispatchEmails().catch(() => {});
  });
  return { success: 'Turno actualizado.' };
}
export async function saveProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const p = z
    .object({ name: text(), phone: z.string().trim().max(40) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'Ingresá un nombre de 2 a 100 caracteres y un teléfono válido.' };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc('update_profile', {
    p_name: p.data.name,
    p_phone: p.data.phone,
  });
  if (error) return { error: friendly(error) };
  revalidatePath('/perfil');
  return { success: 'Perfil actualizado.' };
}
export async function adminMutation(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser(true);
  const v = Object.fromEntries(form);
  let error: { code?: string; message: string } | null = null;
  try {
    switch (v.kind) {
      case 'service': {
        const p = z
          .object({
            id: uuid.optional(),
            name: text(),
            description: z.string().max(1000),
            price_cents: cents,
            sort_order: z.coerce.number().int().min(0).max(1000),
            active: z.boolean(),
          })
          .parse({ ...v, id: v.id || undefined, active: v.active === 'on' });
        const result = p.id
          ? await supabase
              .from('services')
              .update({ ...p, updated_at: new Date().toISOString() })
              .eq('id', p.id)
          : await supabase.from('services').insert(p);
        error = result.error;
        break;
      }
      case 'payment': {
        const p = z
          .object({
            appointment_id: uuid,
            amount_cents: cents.min(1),
            method: z.enum(['cash', 'transfer', 'other']),
          })
          .parse(v);
        ({ error } = await supabase.from('payments').insert({ ...p, created_by: user.id }));
        break;
      }
      case 'expense': {
        const p = z
          .object({
            expense_date: z.iso.date(),
            category: z.enum([
              'alquiler',
              'insumos',
              'servicios',
              'herramientas',
              'limpieza',
              'otros',
            ]),
            description: text(300),
            amount_cents: cents.min(1),
          })
          .parse(v);
        ({ error } = await supabase.from('expenses').insert({ ...p, created_by: user.id }));
        break;
      }
      case 'costs': {
        const p = z
          .object({
            month: z.iso.date().refine((s) => s.endsWith('-01')),
            variable_cost_cents: cents,
            fixed_cost_cents: cents,
          })
          .parse(v);
        ({ error } = await supabase.from('cost_settings').upsert(p));
        break;
      }
      case 'note': {
        const p = z.object({ client_id: uuid, note: z.string().trim().max(2000) }).parse(v);
        ({ error } = await supabase
          .from('client_notes')
          .upsert({ ...p, updated_at: new Date().toISOString() }));
        break;
      }
      case 'manual': {
        const p = z
          .object({
            service: uuid,
            start: iso,
            key: uuid,
            name: text(),
            email: z.union([z.email(), z.literal('')]),
            phone: z.string().max(40),
          })
          .parse(v);
        ({ error } = await supabase.rpc('book_appointment', {
          p_service: p.service,
          p_start: p.start,
          p_key: p.key,
          p_name: p.name,
          p_email: p.email,
          p_phone: p.phone,
        }));
        break;
      }
      case 'settings': {
        const p = z
          .object({
            name: text(),
            address: z.string().max(300),
            contact: z.string().max(100),
            instagram: z
              .string()
              .max(100)
              .regex(/^$|^[a-zA-Z0-9_.]+$/),
            slot_minutes: z.coerce.number().int().min(10).max(180),
            buffer_minutes: z.coerce.number().int().min(0).max(60),
            min_notice_hours: z.coerce.number().int().min(0).max(168),
            horizon_days: z.coerce.number().int().min(1).max(90),
            booking_enabled: z.boolean(),
          })
          .parse({ ...v, booking_enabled: v.booking_enabled === 'on' });
        ({ error } = await supabase.rpc('configure_schedule', { p_kind: 'settings', p_data: p }));
        break;
      }
      case 'weekly': {
        const p = z
          .array(
            z.object({
              weekday: z.number().int().min(0).max(6),
              starts: z.string().regex(/^\d{2}:\d{2}$/),
              ends: z.string().regex(/^\d{2}:\d{2}$/),
            }),
          )
          .max(28)
          .parse(JSON.parse(String(v.intervals)));
        ({ error } = await supabase.rpc('configure_schedule', { p_kind: 'weekly', p_data: p }));
        break;
      }
      case 'exception': {
        const p = z
          .object({ day: z.iso.date(), closed: z.boolean(), reason: z.string().max(300) })
          .parse({ ...v, closed: v.closed === 'on' });
        const intervals = p.closed
          ? []
          : z
              .array(
                z.object({
                  starts: z.string().regex(/^\d{2}:\d{2}$/),
                  ends: z.string().regex(/^\d{2}:\d{2}$/),
                }),
              )
              .min(1)
              .max(10)
              .parse(JSON.parse(String(v.intervals)));
        ({ error } = await supabase.rpc('configure_schedule', {
          p_kind: 'exception',
          p_data: { ...p, intervals },
        }));
        break;
      }
      case 'block': {
        const p = z.object({ starts_at: iso, ends_at: iso, reason: z.string().max(300) }).parse(v);
        ({ error } = await supabase.rpc('configure_schedule', { p_kind: 'block', p_data: p }));
        break;
      }
      case 'remove_block':
      case 'remove_exception': {
        const id = uuid.parse(v.id);
        ({ error } = await supabase.rpc('configure_schedule', { p_kind: v.kind, p_data: { id } }));
        break;
      }
      default:
        return { error: 'Acción inválida.' };
    }
  } catch {
    return { error: 'Revisá los campos: hay datos inválidos o incompletos.' };
  }
  if (error) return { error: friendly(error) };
  revalidatePath('/', 'layout');
  if (v.kind === 'manual')
    after(async () => {
      await dispatchEmails().catch(() => {});
    });
  return { success: 'Cambios guardados.' };
}
