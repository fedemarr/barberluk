import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { ActionForm } from '@/components/action-form';
import { adminMutation } from '@/lib/actions';
import { dateTime, money } from '@/lib/format';
import { statusLabel, type Appointment } from '@/lib/types';
import { Stats } from '@/components/stats';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser(true);
  const [profile, appointments, note] = await Promise.all([
    supabase.from('profiles').select('id,display_name,email,phone').eq('id', id).single(),
    supabase
      .from('appointments')
      .select('*')
      .eq('user_id', id)
      .order('starts_at', { ascending: false })
      .limit(200),
    supabase.from('client_notes').select('note').eq('client_id', id).maybeSingle(),
  ]);
  if (!profile.data) notFound();
  if (appointments.error || note.error)
    return <p className="message error">No pudimos consultar el historial.</p>;
  const a = appointments.data as Appointment[];
  return (
    <>
      <p className="eyebrow">PERFIL DEL CLIENTE</p>
      <h1>{profile.data.display_name}</h1>
      <p className="page-intro">
        {profile.data.email} · {profile.data.phone || 'Sin teléfono'}
      </p>
      <Stats
        items={[
          { label: 'TURNOS', value: String(a.length), note: 'Hasta 200 recientes' },
          { label: 'COMPLETADOS', value: String(a.filter((x) => x.status === 'completed').length) },
          { label: 'CANCELADOS', value: String(a.filter((x) => x.status === 'cancelled').length) },
          { label: 'NO ASISTIÓ', value: String(a.filter((x) => x.status === 'no_show').length) },
        ]}
      />
      <div className="admin-columns">
        <section className="panel">
          <h2>Historial</h2>
          {a.map((x) => (
            <div className="mini-row" key={x.id}>
              <div>
                <strong>{x.service_name}</strong>
                <p>
                  {dateTime(x.starts_at)} · {money(x.price_cents)}
                </p>
              </div>
              <span className={`badge ${x.status}`}>{statusLabel[x.status]}</span>
            </div>
          ))}
          {!a.length && <p className="muted">Sin turnos registrados.</p>}
        </section>
        <section className="panel">
          <h2>Nota interna</h2>
          <ActionForm action={adminMutation}>
            <input name="kind" type="hidden" value="note" />
            <input name="client_id" type="hidden" value={id} />
            <label className="field">
              Solo visible para el administrador
              <textarea
                name="note"
                rows={6}
                maxLength={2000}
                defaultValue={note.data?.note ?? ''}
              />
            </label>
            <p className="muted">
              Registrá solo información necesaria para la atención. Evitá datos sensibles.
            </p>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
