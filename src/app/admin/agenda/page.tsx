import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { publicData } from '@/lib/data';
import { localDay, dateTime, money } from '@/lib/format';
import { statusLabel, type Appointment } from '@/lib/types';
import { ActionForm, Field, Amount } from '@/components/action-form';
import { changeAppointment, adminMutation } from '@/lib/actions';
import { Booking } from '@/components/booking';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const { supabase } = await requireUser(true);
  const { services, settings } = await publicData();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(p.day ?? '') ? p.day! : localDay(),
    view = ['day', 'week', 'month'].includes(p.view ?? '') ? p.view! : 'day';
  const base = new Date(`${day}T12:00:00-03:00`);
  if (Number.isNaN(base.getTime())) return <p className="message error">Fecha inválida.</p>;
  const first = new Date(base),
    last = new Date(base);
  if (view === 'month') {
    first.setDate(1);
    last.setMonth(last.getMonth() + 1, 0);
  }
  if (view === 'week') {
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    last.setTime(first.getTime());
    last.setDate(last.getDate() + 6);
  }
  const start = localDay(first),
    end = localDay(last),
    page = Math.max(1, Math.min(1000, Number(p.page) || 1)),
    status = ['confirmed', 'completed', 'cancelled', 'no_show'].includes(p.status ?? '')
      ? p.status!
      : '';
  let query = supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .gte('starts_at', `${start}T00:00:00-03:00`)
    .lte('starts_at', `${end}T23:59:59.999-03:00`)
    .order('starts_at');
  if (status) query = query.eq('status', status);
  const { data, error, count } = await query.range((page - 1) * 50, page * 50 - 1);
  const ids = (data ?? []).map((a) => a.id);
  const { data: payments } = ids.length
    ? await supabase.from('payments').select('appointment_id').in('appointment_id', ids)
    : { data: [] };
  const paid = new Set((payments ?? []).map((p) => p.appointment_id));
  const { data: calendar } =
    view !== 'day'
      ? await supabase
          .from('appointments')
          .select('starts_at,status')
          .gte('starts_at', `${start}T00:00:00-03:00`)
          .lte('starts_at', `${end}T23:59:59.999-03:00`)
          .eq('status', 'confirmed')
          .limit(1000)
      : { data: [] };
  const calendarDays = Array.from(
    { length: Math.round((last.getTime() - first.getTime()) / 86400000) + 1 },
    (_, i) => {
      const d = new Date(first);
      d.setDate(d.getDate() + i);
      return localDay(d);
    },
  );
  const { data: edit } = p.edit
    ? await supabase.from('appointments').select('id,status').eq('id', p.edit).single()
    : { data: null };
  return (
    <>
      <p className="eyebrow">CADA MOMENTO, ORGANIZADO</p>
      <h1>Agenda.</h1>
      <p className="page-intro">
        Consultá, reprogramá y gestioná los turnos del estudio. Horarios de Buenos Aires.
      </p>
      <form className="filter-bar">
        <Field label="Fecha" name="day" type="date" defaultValue={day} />
        <label className="field">
          Vista
          <select name="view" defaultValue={view}>
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </label>
        <label className="field">
          Estado
          <select name="status" defaultValue={status}>
            <option value="">Todos</option>
            {Object.entries(statusLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="button">Consultar</button>
      </form>
      {view !== 'day' && (
        <div className="calendar-month">
          {calendarDays.map((d) => (
            <Link href={`/admin/agenda?day=${d}&view=day`} key={d} className="calendar-cell">
              <strong>
                {d.slice(8)}/{d.slice(5, 7)}
              </strong>
              <span>
                {(calendar ?? []).filter((a) => localDay(new Date(a.starts_at)) === d).length}{' '}
                confirmados
              </span>
            </Link>
          ))}
        </div>
      )}
      {error ? (
        <p className="message error">No pudimos cargar la agenda.</p>
      ) : (
        <>
          <p className="muted">
            {count ?? 0} turnos · {start} al {end} · página {page}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Cliente / servicio</th>
                  <th>Estado</th>
                  <th>Gestión</th>
                  <th>Cobro</th>
                </tr>
              </thead>
              <tbody>
                {((data as Appointment[]) ?? []).map((a) => (
                  <tr key={a.id}>
                    <td>
                      {dateTime(a.starts_at)}
                      <br />
                      {money(a.price_cents)}
                    </td>
                    <td>
                      {a.contact_name}
                      <br />
                      {a.service_name}
                      <br />
                      {a.contact_phone}
                    </td>
                    <td>
                      <span className={`badge ${a.status}`}>{statusLabel[a.status]}</span>
                    </td>
                    <td className="wrap">
                      {a.status === 'confirmed' && (
                        <details>
                          <summary>Gestionar turno</summary>
                          <Link
                            className="text-link"
                            href={`/admin/agenda?day=${day}&edit=${a.id}`}
                          >
                            Reprogramar ↗
                          </Link>
                          <ActionForm action={changeAppointment} submit="Aplicar estado">
                            <input name="id" type="hidden" value={a.id} />
                            <label className="field">
                              Acción
                              <select name="action">
                                <option value="completed">Marcar completado</option>
                                <option value="no_show">No asistió</option>
                                <option value="cancel">Cancelar turno</option>
                              </select>
                            </label>
                          </ActionForm>
                        </details>
                      )}
                    </td>
                    <td className="wrap">
                      {paid.has(a.id) ? (
                        <span className="badge completed">Cobro registrado</span>
                      ) : ['confirmed', 'completed'].includes(a.status) ? (
                        <details>
                          <summary>Registrar cobro</summary>
                          <ActionForm action={adminMutation} submit="Confirmar cobro">
                            <input name="kind" type="hidden" value="payment" />
                            <input name="appointment_id" type="hidden" value={a.id} />
                            <Amount defaultCents={a.price_cents} />
                            <label className="field">
                              Método
                              <select name="method">
                                <option value="cash">Efectivo</option>
                                <option value="transfer">Transferencia</option>
                                <option value="other">Otro</option>
                              </select>
                            </label>
                          </ActionForm>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.length && (
                  <tr>
                    <td colSpan={5}>No hay turnos para esta selección.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="filter-bar">
            {page > 1 && (
              <Link
                className="button secondary small"
                href={`/admin/agenda?day=${day}&view=${view}&status=${status}&page=${page - 1}`}
              >
                Anterior
              </Link>
            )}
            {(count ?? 0) > page * 50 && (
              <Link
                className="button secondary small"
                href={`/admin/agenda?day=${day}&view=${view}&status=${status}&page=${page + 1}`}
              >
                Siguiente
              </Link>
            )}
          </div>
        </>
      )}
      {edit?.status === 'confirmed' && (
        <section className="panel" style={{ marginTop: 30 }}>
          <h2>Reprogramar turno</h2>
          <p className="muted">
            El precio histórico se conserva. La reserva original se mantiene si el nuevo horario no
            está disponible.
          </p>
          <Booking
            services={services}
            enabled={Boolean(settings?.booking_enabled)}
            loggedIn
            minutes={settings?.slot_minutes ?? 40}
            horizon={settings?.horizon_days}
            rescheduleId={edit.id}
          />
        </section>
      )}
      <details className="panel details-panel">
        <summary>+ Crear turno manual</summary>
        <p className="muted">
          Para clientes sin Google. Se aplican las mismas reglas de disponibilidad.
        </p>
        <Booking
          services={services}
          enabled={Boolean(settings?.booking_enabled)}
          loggedIn
          minutes={settings?.slot_minutes ?? 40}
          horizon={settings?.horizon_days}
          manual
        />
      </details>
      <div className="export-links">
        <a href={`/api/admin/export?type=appointments&from=${start}&to=${end}`}>
          Exportar turnos CSV ↓
        </a>
      </div>
    </>
  );
}
