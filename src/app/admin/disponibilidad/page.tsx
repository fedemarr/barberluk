import { requireUser } from '@/lib/auth';
import { adminMutation } from '@/lib/actions';
import { WeeklyEditor, ExceptionEditor } from '@/components/schedule-editor';
import { ActionForm, DateTimeField, Field } from '@/components/action-form';
import { dateTime } from '@/lib/format';
export default async function Page() {
  const { supabase } = await requireUser(true);
  const [weekly, exceptions, blocks] = await Promise.all([
    supabase.from('weekly_working_hours').select('weekday,starts,ends').order('weekday'),
    supabase.from('schedule_exceptions').select('*').order('day').limit(200),
    supabase.from('schedule_blocks').select('*').order('starts_at').limit(200),
  ]);
  if ([weekly, exceptions, blocks].some((r) => r.error))
    return <p className="message error">No pudimos cargar la disponibilidad.</p>;
  return (
    <>
      <p className="eyebrow">TU TIEMPO, A TU MANERA</p>
      <h1>Disponibilidad.</h1>
      <p className="page-intro">
        Agregá intervalos separados para descansos. Si un cambio afecta turnos confirmados, el
        sistema lo rechaza hasta que los resuelvas.
      </p>
      <div className="admin-columns">
        <section className="panel">
          <h2>Semana habitual</h2>
          <WeeklyEditor initial={weekly.data ?? []} />
        </section>
        <div className="form-stack">
          <section className="panel">
            <h2>Excepción por fecha</h2>
            <ExceptionEditor />
          </section>
          <section className="panel">
            <h2>Bloqueo / vacaciones</h2>
            <ActionForm action={adminMutation} submit="Bloquear intervalo">
              <input type="hidden" name="kind" value="block" />
              <DateTimeField label="Desde" name="starts_at" />
              <DateTimeField label="Hasta" name="ends_at" />
              <Field label="Motivo" name="reason" maxLength={300} />
            </ActionForm>
          </section>
        </div>
      </div>
      <div className="admin-columns" style={{ marginTop: 25 }}>
        <section className="panel">
          <h2>Excepciones guardadas</h2>
          {!(exceptions.data ?? []).length && <p className="muted">No hay excepciones.</p>}
          {exceptions.data?.map((e) => (
            <div className="mini-row" key={e.id}>
              <div>
                <strong>
                  {e.day} · {e.closed ? 'Cerrado' : 'Horario especial'}
                </strong>
                <p>{e.reason}</p>
                {!e.closed && (
                  <p>
                    {(e.intervals as { starts: string; ends: string }[])
                      .map((i) => `${i.starts}–${i.ends}`)
                      .join(', ')}
                  </p>
                )}
              </div>
              <ActionForm action={adminMutation} submit="Quitar">
                <input name="kind" type="hidden" value="remove_exception" />
                <input name="id" type="hidden" value={e.id} />
              </ActionForm>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Bloqueos guardados</h2>
          {!(blocks.data ?? []).length && <p className="muted">No hay bloqueos.</p>}
          {blocks.data?.map((b) => (
            <div className="mini-row" key={b.id}>
              <div>
                <strong>
                  {dateTime(b.starts_at)} — {dateTime(b.ends_at)}
                </strong>
                <p>{b.reason}</p>
              </div>
              <ActionForm action={adminMutation} submit="Quitar">
                <input name="kind" type="hidden" value="remove_block" />
                <input name="id" type="hidden" value={b.id} />
              </ActionForm>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
