import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { localDay, money, dateTime } from '@/lib/format';
import { Stats } from '@/components/stats';
import { statusLabel, type Appointment } from '@/lib/types';
import { reportRows } from '@/lib/reporting';
export default async function Page() {
  const { supabase } = await requireUser(true);
  const today = localDay(),
    month = today.slice(0, 7) + '-01',
    start = `${today}T00:00:00-03:00`,
    end = `${today}T23:59:59.999-03:00`;
  const sixDaysAgo = new Date(`${today}T12:00:00-03:00`);
  sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);
  const paymentFrom = localDay(sixDaysAgo) < month ? localDay(sixDaysAgo) : month;
  const monthLast = new Date(`${month}T12:00:00-03:00`);
  monthLast.setUTCMonth(monthLast.getUTCMonth() + 1, 0);
  let paymentRows: Record<string, unknown>[],
    expenseRows: Record<string, unknown>[],
    appointmentRows: Record<string, unknown>[];
  try {
    [paymentRows, expenseRows, appointmentRows] = await Promise.all([
      reportRows(supabase, 'payments', paymentFrom, today),
      reportRows(supabase, 'expenses', month, today),
      reportRows(supabase, 'appointments', month, localDay(monthLast)),
    ]);
  } catch {
    return (
      <p className="message error">
        No pudimos calcular el resumen completo. Probá los reportes por período en Finanzas.
      </p>
    );
  }
  const payments = {
    data: paymentRows.map((p) => ({
      amount_cents: Number(p.amount_cents),
      paid_at: String(p.paid_at),
    })),
  };
  const expenses = { data: expenseRows.map((p) => ({ amount_cents: Number(p.amount_cents) })) };
  const monthAppointments = {
    data: appointmentRows.map((a) => ({
      status: String(a.status),
      service_name: String(a.service_name),
    })),
  };
  const results = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .gte('starts_at', start)
      .lte('starts_at', end)
      .order('starts_at')
      .limit(200),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('starts_at', new Date().toISOString()),
  ]);
  if (results.some((r) => r.error))
    return (
      <p className="message error">
        No pudimos cargar el resumen. Revisá la conexión e intentá otra vez.
      </p>
    );
  const [agenda, future] = results;
  const income = (payments.data ?? [])
      .filter((p) => localDay(new Date(p.paid_at)) >= month)
      .reduce((n, p) => n + p.amount_cents, 0),
    out = (expenses.data ?? []).reduce((n, p) => n + p.amount_cents, 0);
  const { data: occupancy } = await supabase.rpc('day_occupancy', { p_day: today });
  const occ = occupancy?.[0];
  const occupancyPercent =
    occ && Number(occ.capacity_minutes) > 0
      ? Math.round((Number(occ.booked_minutes) / Number(occ.capacity_minutes)) * 100)
      : 0;
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00-03:00`);
    d.setDate(d.getDate() - 6 + i);
    const day = localDay(d);
    return {
      day,
      value: (payments.data ?? [])
        .filter((p) => localDay(new Date(p.paid_at)) === day)
        .reduce((n, p) => n + p.amount_cents, 0),
    };
  });
  const max = Math.max(...bars.map((b) => b.value), 1);
  const popular = Object.entries(
    (monthAppointments.data ?? [])
      .filter((a) => a.status === 'completed')
      .reduce<Record<string, number>>(
        (map, a) => ({ ...map, [a.service_name]: (map[a.service_name] ?? 0) + 1 }),
        {},
      ),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <p className="eyebrow">BARBER LUKE / RESUMEN</p>
      <h1>El estudio, de un vistazo.</h1>
      <p className="page-intro">
        Hoy, {today.split('-').reverse().join('/')} · Datos de tu negocio, en tiempo real.
      </p>
      <Stats
        items={[
          {
            label: 'TURNOS DE HOY',
            value: String((agenda.data ?? []).filter((a) => a.status === 'confirmed').length),
            note: 'Confirmados para hoy',
          },
          {
            label: 'PRÓXIMOS TURNOS',
            value: String(future.count ?? 0),
            note: 'Reservas confirmadas',
          },
          { label: 'COBRADO ESTE MES', value: money(income), note: 'Solo cobros registrados' },
          {
            label: 'RESULTADO DE CAJA',
            value: money(income - out),
            note: 'Cobros menos gastos del mes',
          },
        ]}
      />
      <p className="message">
        Ocupación de hoy: {occupancyPercent}% · Minutos de turnos no cancelados / minutos laborales
        disponibles, descontando bloqueos y descansos.
      </p>
      <div className="admin-columns">
        <section className="panel">
          <div className="section-heading">
            <h2>Agenda de hoy</h2>
            <Link className="text-link" href="/admin/agenda">
              Ver agenda ↗
            </Link>
          </div>
          {!(agenda.data ?? []).length ? (
            <p className="muted">No hay turnos para hoy.</p>
          ) : (
            <div className="mini-list">
              {(agenda.data as Appointment[]).map((a) => (
                <div className="mini-row" key={a.id}>
                  <div>
                    <strong>{a.contact_name}</strong>
                    <p>
                      {a.service_name} · {dateTime(a.starts_at)}
                    </p>
                  </div>
                  <span className={`badge ${a.status}`}>{statusLabel[a.status]}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <h2>Cobros · últimos 7 días</h2>
          <p className="muted">
            Importes efectivamente registrados. La ausencia de una barra indica $0.
          </p>
          <div
            className="bar-chart"
            role="img"
            aria-label={bars.map((b) => `${b.day}: ${money(b.value)}`).join('; ')}
          >
            {bars.map((b) => (
              <div className="chart-column" key={b.day}>
                <span style={{ height: `${(b.value / max) * 115}px` }} title={money(b.value)} />
                <small>{b.day.slice(8)}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="admin-columns" style={{ marginTop: 25 }}>
        <section className="panel">
          <h2>Servicios más elegidos</h2>
          {popular.length ? (
            popular.map(([name, total]) => (
              <div key={name} className="mini-row">
                <span>{name}</span>
                <strong>{total} completados</strong>
              </div>
            ))
          ) : (
            <p className="muted">Todavía no hay servicios completados este mes.</p>
          )}
        </section>
        <section className="panel">
          <h2>Actividad del mes</h2>
          <div className="mini-row">
            <span>Cancelados</span>
            <strong>
              {(monthAppointments.data ?? []).filter((a) => a.status === 'cancelled').length}
            </strong>
          </div>
          <div className="mini-row">
            <span>No asistieron</span>
            <strong>
              {(monthAppointments.data ?? []).filter((a) => a.status === 'no_show').length}
            </strong>
          </div>
          <div className="mini-row">
            <span>Gastos registrados</span>
            <strong>{money(out)}</strong>
          </div>
          <p className="muted">Resumen limitado por categoría. Reportes detallados en Finanzas.</p>
        </section>
      </div>
    </>
  );
}
