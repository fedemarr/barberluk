import { requireUser } from '@/lib/auth';
import { reportRange, reportRows } from '@/lib/reporting';
import { localDay, money } from '@/lib/format';
import { Stats } from '@/components/stats';
import { ActionForm, Amount, Field } from '@/components/action-form';
import { adminMutation } from '@/lib/actions';
type Cost = { month: string; variable_cost_cents: number; fixed_cost_cents: number };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const p = await searchParams,
    { supabase } = await requireUser(true);
  let range;
  try {
    range = reportRange(p);
  } catch {
    return <p className="message error">Elegí un período válido, de hasta 366 días.</p>;
  }
  const { from, to } = range;
  let payments: Record<string, unknown>[],
    expenses: Record<string, unknown>[],
    appointments: Record<string, unknown>[];
  try {
    [payments, expenses, appointments] = await Promise.all([
      reportRows(supabase, 'payments', from, to),
      reportRows(supabase, 'expenses', from, to),
      reportRows(supabase, 'appointments', from, to),
    ]);
  } catch {
    return (
      <p className="message error">
        No pudimos cargar el reporte. Revisá la conexión o elegí un rango más corto.
      </p>
    );
  }
  const { data: costs, error } = await supabase
    .from('cost_settings')
    .select('*')
    .lte('month', to)
    .order('month', { ascending: false })
    .limit(1000);
  if (error) return <p className="message error">No pudimos consultar los costos.</p>;
  const income = payments.reduce((n, p) => n + Number(p.amount_cents), 0),
    spent = expenses.reduce((n, e) => n + Number(e.amount_cents), 0),
    completed = appointments.filter((a) => a.status === 'completed'),
    variable = completed.reduce((n, a) => n + Number(a.variable_cost_cents), 0);
  let fixed = 0;
  const cursor = new Date(`${from.slice(0, 7)}-01T12:00:00-03:00`);
  while (localDay(cursor) <= to) {
    const month = localDay(cursor),
      end = new Date(cursor);
    end.setMonth(end.getMonth() + 1, 0);
    const days = end.getDate(),
      firstIncluded = Math.max(Date.parse(from), Date.parse(month)),
      lastIncluded = Math.min(Date.parse(to), Date.parse(localDay(end))),
      included = Math.round((lastIncluded - firstIncluded) / 86400000) + 1;
    const cost = ((costs as Cost[]) ?? []).find((c) => c.month <= month);
    fixed += Math.round(((cost?.fixed_cost_cents ?? 0) * included) / days);
    cursor.setMonth(cursor.getMonth() + 1, 1);
  }
  const estimate = income - variable - fixed;
  const methods = [
    ['cash', 'Efectivo'],
    ['transfer', 'Transferencia'],
    ['other', 'Otro'],
  ];
  return (
    <>
      <p className="eyebrow">NÚMEROS QUE IMPORTAN</p>
      <h1>Finanzas.</h1>
      <p className="page-intro">
        Caja real y costos estimados, con fórmulas claras. Reservar un turno no genera un ingreso.
      </p>
      <form className="filter-bar">
        <Field label="Desde" name="from" type="date" defaultValue={from} required />
        <Field label="Hasta" name="to" type="date" defaultValue={to} required />
        <button className="button">Ver período</button>
      </form>
      <Stats
        items={[
          { label: 'COBRADO', value: money(income), note: `${payments.length} cobros efectivos` },
          { label: 'GASTOS REGISTRADOS', value: money(spent) },
          {
            label: 'RESULTADO DE CAJA',
            value: money(income - spent),
            note: 'Cobrado − gastos registrados',
          },
          { label: 'MARGEN ESTIMADO', value: money(estimate), note: 'Cobrado − costos modelados' },
        ]}
      />
      <div className="admin-columns">
        <section className="panel">
          <h2>El detalle del período</h2>
          <div className="mini-row">
            <span>Ticket promedio por cobro</span>
            <strong>{money(payments.length ? Math.round(income / payments.length) : 0)}</strong>
          </div>
          <div className="mini-row">
            <span>Turnos completados</span>
            <strong>{completed.length}</strong>
          </div>
          <div className="mini-row">
            <span>Costos variables históricos</span>
            <strong>{money(variable)}</strong>
          </div>
          <div className="mini-row">
            <span>Costos fijos prorrateados</span>
            <strong>{money(fixed)}</strong>
          </div>
          {methods.map(([k, v]) => (
            <div key={k} className="mini-row">
              <span>{v}</span>
              <strong>
                {money(
                  payments
                    .filter((p) => p.method === k)
                    .reduce((n, p) => n + Number(p.amount_cents), 0),
                )}
              </strong>
            </div>
          ))}
          <p className="message">
            Caja = cobros − gastos cargados. Margen estimado = cobros − costos variables de turnos
            completados − costos fijos prorrateados por día. El margen usa costos modelados en lugar
            de gastos reales para evitar contarlos dos veces; no representa utilidad contable. Los
            cobros se filtran por fecha de cobro y los servicios por fecha del turno.
          </p>
        </section>
        <section className="panel">
          <h2>Registrar gasto</h2>
          <ActionForm action={adminMutation} submit="Registrar gasto">
            <input name="kind" type="hidden" value="expense" />
            <Field
              label="Fecha del gasto"
              name="expense_date"
              type="date"
              defaultValue={localDay()}
              required
            />
            <label className="field">
              Categoría
              <select name="category">
                {['alquiler', 'insumos', 'servicios', 'herramientas', 'limpieza', 'otros'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </label>
            <Field label="Descripción" name="description" minLength={2} maxLength={300} required />
            <Amount />
          </ActionForm>
        </section>
      </div>
      <details className="panel details-panel">
        <summary>Configurar costos estimados</summary>
        <p className="muted">
          Valores vigentes desde el mes indicado. El costo variable se guarda al completar el turno.
          Los costos fijos se prorratean según los días del reporte. Si no cargás nuevos valores,
          continúa el último vigente.
        </p>
        <ActionForm action={adminMutation}>
          <input name="kind" type="hidden" value="costs" />
          <Field
            label="Vigencia (primer día del mes)"
            name="month"
            type="date"
            defaultValue={localDay().slice(0, 7) + '-01'}
            required
          />
          <Amount
            name="variable_cost_cents"
            label="Costo variable por corte (ARS)"
            defaultCents={costs?.[0]?.variable_cost_cents ?? 0}
          />
          <Amount
            name="fixed_cost_cents"
            label="Costos fijos mensuales (ARS)"
            defaultCents={costs?.[0]?.fixed_cost_cents ?? 0}
          />
        </ActionForm>
      </details>
      <section style={{ marginTop: 30 }}>
        <h2>Gastos del período</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 200).map((e) => (
                <tr key={String(e.id)}>
                  <td>{String(e.expense_date)}</td>
                  <td>{String(e.category)}</td>
                  <td className="wrap">{String(e.description)}</td>
                  <td>{money(Number(e.amount_cents))}</td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan={4}>No hay gastos en este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Tabla de hasta 200 gastos. Los indicadores y CSV incluyen el período completo.
        </p>
      </section>
      <div className="export-links">
        {[
          ['payments', 'Cobros'],
          ['expenses', 'Gastos'],
          ['appointments', 'Turnos'],
        ].map(([type, label]) => (
          <a key={type} href={`/api/admin/export?type=${type}&from=${from}&to=${to}`}>
            {label} CSV ↓
          </a>
        ))}
      </div>
      <p className="muted">
        Para registrar un cobro, abrí el turno en Agenda. Un turno admite un único cobro para evitar
        duplicados involuntarios.
      </p>
    </>
  );
}
