'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Scissors,
  Users,
  Wallet,
  Settings,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Check,
  X,
  Download,
  Search,
} from 'lucide-react';
import { useDemo } from './provider';
import { DemoRibbon } from './ribbon';
import { type DemoSection, type DemoAppointment, nextDemoDay } from '@/lib/demo-model';
import {
  dayTitle,
  shiftDay,
  shiftMonth,
  weekStart,
  monthDays,
  minuteOf,
  clock,
} from '@/lib/calendar';
import { money } from '@/lib/format';
import { Amount, Field } from '../action-form';
import { statusLabel } from '@/lib/types';

const sections = [
  ['resumen', 'Resumen', LayoutDashboard],
  ['agenda', 'Agenda', CalendarDays],
  ['disponibilidad', 'Disponibilidad', Clock3],
  ['servicios', 'Servicios', Scissors],
  ['clientes', 'Clientes', Users],
  ['finanzas', 'Finanzas', Wallet],
  ['configuracion', 'Configuración', Settings],
] as const;
function LocalForm({
  children,
  onSubmit,
  submit = 'Guardar en demo',
}: {
  children: React.ReactNode;
  onSubmit: (data: FormData) => void;
  submit?: string;
}) {
  const [message, setMessage] = useState(''),
    [error, setError] = useState(false);
  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          onSubmit(new FormData(event.currentTarget));
          setError(false);
          setMessage('Cambios de demostración guardados en esta pestaña.');
        } catch (e) {
          setError(true);
          setMessage(e instanceof Error ? e.message : 'Revisá los datos.');
        }
      }}
    >
      {children}
      {message && (
        <p className={`message ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      <button className="button">{submit}</button>
    </form>
  );
}
function amount(data: FormData, key = 'amount_cents', allowZero = false) {
  const value = String(data.get(key) ?? '');
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < (allowZero ? 0 : 1) || n > 100000000)
    throw new Error('Ingresá un importe válido, de hasta $1.000.000.');
  return n;
}

function Timeline({
  day,
  onSelect,
  compact = false,
}: {
  day: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const { state } = useDemo();
  const from = minuteOf(state.settings.opens),
    to = minuteOf(state.settings.closes),
    height = (to - from) * 1.25;
  const appointments = state.appointments.filter((a) => a.day === day && a.status !== 'cancelled');
  const closed =
    !state.settings.workingDays.includes(new Date(`${day}T12:00:00Z`).getUTCDay()) ||
    state.settings.closedDates.includes(day);
  if (closed && !appointments.length)
    return (
      <div className="demo-day-closed">
        <CalendarDays size={24} />
        <strong>Sin atención</strong>
        <p>Día cerrado en la demo.</p>
      </div>
    );
  const hours = Array.from({ length: Math.ceil((to - from) / 60) + 1 }, (_, i) => from + i * 60);
  return (
    <div
      className={`demo-day-timeline ${compact ? 'compact' : ''}`}
      style={{ height: height + 25 }}
    >
      <div className="demo-timeline-hours">
        {hours
          .filter((h) => h <= to)
          .map((h) => (
            <span style={{ top: (h - from) * 1.25 }} key={h}>
              {clock(h)}
            </span>
          ))}
      </div>
      <div className="demo-timeline-track" style={{ height }}>
        {hours
          .filter((h) => h <= to)
          .map((h) => (
            <i className="demo-hour-line" key={h} style={{ top: (h - from) * 1.25 }} />
          ))}
        <div
          className="demo-break"
          style={{
            top: (minuteOf(state.settings.breakStart) - from) * 1.25,
            height:
              (minuteOf(state.settings.breakEnd) - minuteOf(state.settings.breakStart)) * 1.25,
          }}
        >
          <span>{compact ? 'Descanso' : 'DESCANSO / TIEMPO PARA RECARGAR'}</span>
        </div>
        {appointments.map((a) => (
          <button
            type="button"
            key={a.id}
            className={`demo-time-event event-${a.status}`}
            style={{
              top: Math.max(0, (minuteOf(a.time) - from) * 1.25),
              height: Math.max(34, a.duration * 1.25 - 4),
            }}
            onClick={() => onSelect(a.id)}
            aria-label={`${a.time}, ${a.name}, ${a.serviceName}, ${statusLabel[a.status]}`}
          >
            <div>
              <strong>{a.name}</strong>
              <time>{a.time}</time>
            </div>
            <span>
              {a.serviceName}
              {!compact && ` · ${a.duration} min`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DemoAdmin({ section, initialDay }: { section: DemoSection; initialDay?: string }) {
  const { state, store, today } = useDemo();
  const [day, setDay] = useState(initialDay ?? nextDemoDay(today)),
    [view, setView] = useState<'day' | 'week' | 'month'>('day'),
    [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const appointment = state.appointments.find((a) => a.id === selected);
  const paidIds = new Set(state.payments.map((p) => p.appointmentId));
  const dayAppointments = state.appointments.filter(
    (a) => a.day === day && a.status !== 'cancelled',
  );
  const income = state.payments.reduce((n, p) => n + p.amount, 0),
    spent = state.expenses.reduce((n, e) => n + e.amount, 0);
  const selectedTitle = sections.find((s) => s[0] === section)?.[1];
  const open = (id: string) => {
    setSelected(id);
    dialog.current?.showModal();
  };
  const setStatus = (id: string, status: DemoAppointment['status']) => {
    store.update((current) => ({
      ...current,
      appointments: current.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    if (status === 'cancelled') dialog.current?.close();
  };
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(weekStart(day), i));
  const [from, setFrom] = useState(shiftDay(today, -6)),
    [to, setTo] = useState(today);
  const filteredPayments = state.payments.filter((p) => p.day >= from && p.day <= to),
    filteredExpenses = state.expenses.filter((e) => e.day >= from && e.day <= to);
  const cashIn = filteredPayments.reduce((n, p) => n + p.amount, 0),
    cashOut = filteredExpenses.reduce((n, e) => n + e.amount, 0);
  return (
    <div className="demo-admin-shell">
      <DemoRibbon admin />
      <aside className="demo-admin-sidebar">
        <div className="demo-admin-brand">
          <span>BL</span>
          <div>
            {state.settings.name}
            <small>PANEL DEL ESTUDIO / DEMO</small>
          </div>
        </div>
        <nav aria-label="Panel de demostración">
          {sections.map(([key, label, Icon]) => (
            <Link
              href={key === 'resumen' ? '/demo/admin' : `/demo/admin/${key}`}
              aria-current={section === key ? 'page' : undefined}
              key={key}
            >
              <Icon size={17} />
              {label}
              {key === 'agenda' && (
                <small>{state.appointments.filter((a) => a.status === 'confirmed').length}</small>
              )}
            </Link>
          ))}
        </nav>
        <div className="demo-sidebar-bottom">
          <p>Todo lo que ves acá es de ejemplo. Podés probar los controles con tranquilidad.</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Reiniciar solo los datos de demostración de esta pestaña?'))
                store.reset();
            }}
          >
            <RotateCcw size={14} /> Reiniciar demo
          </button>
          <Link href="/demo/reservar">
            Ver página de reservas <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="demo-admin-main">
        <div className="demo-admin-topbar">
          <span>
            <i /> ENTORNO DE MUESTRA
          </span>
          <div>
            <span>BL</span>
            <p>
              Barber Luke<small>Vista del administrador</small>
            </p>
          </div>
        </div>
        <div className="demo-admin-title">
          <div>
            <p className="eyebrow">TU ESTUDIO, BIEN ORGANIZADO</p>
            <h1>
              {selectedTitle}
              <span>.</span>
            </h1>
          </div>
          <Link className="button" href="/demo/reservar">
            <Plus size={17} /> Nuevo turno demo
          </Link>
        </div>

        {section === 'resumen' && (
          <>
            <div className="demo-overview-intro">
              <div>
                <h2>
                  EL ESTUDIO.
                  <br />
                  <span>BAJO CONTROL.</span>
                </h2>
                <p>Reservas, clientes y números en un solo lugar.</p>
              </div>
              <div className="demo-overview-day">
                <CalendarDays size={25} />
                <strong>
                  {dayTitle(day, { weekday: 'long', day: 'numeric', month: 'short' })}
                </strong>
                <span>PRÓXIMO DÍA DE EJEMPLO</span>
              </div>
            </div>
            <div className="demo-stat-grid">
              {[
                [
                  'TURNOS DEL DÍA',
                  String(dayAppointments.filter((a) => a.status === 'confirmed').length),
                  'Confirmados de ejemplo',
                ],
                ['COBROS DE MUESTRA', money(income), 'Importes registrados en la demo'],
                ['GASTOS DE MUESTRA', money(spent), 'Solo ejemplos'],
                ['CAJA DE MUESTRA', money(income - spent), 'Cobros − gastos'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                  <p>{note}</p>
                </div>
              ))}
            </div>
            <div className="demo-admin-two-columns">
              <section className="demo-admin-panel">
                <div className="demo-panel-heading">
                  <h2>LO QUE VIENE.</h2>
                  <Link href="/demo/admin/agenda">
                    Abrir agenda <ArrowUpRight size={15} />
                  </Link>
                </div>
                {dayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((a) => (
                    <button
                      type="button"
                      className="demo-upcoming-row"
                      key={a.id}
                      onClick={() => open(a.id)}
                    >
                      <time>{a.time}</time>
                      <div>
                        <strong>{a.name}</strong>
                        <span>{a.serviceName}</span>
                      </div>
                      <span className={`badge ${a.status}`}>{statusLabel[a.status]}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
              </section>
              <section className="demo-admin-panel">
                <h2>LA SEMANA EN AGENDA.</h2>
                <div
                  className="demo-occupancy-bars"
                  role="img"
                  aria-label="Cantidad de turnos confirmados por día, datos de demostración"
                >
                  {Array.from({ length: 7 }, (_, i) => shiftDay(today, i)).map((d) => {
                    const count = state.appointments.filter(
                      (a) => a.day === d && a.status === 'confirmed',
                    ).length;
                    return (
                      <div key={d}>
                        <strong>{count}</strong>
                        <span style={{ height: Math.max(4, count * 20) }} />
                        <small>{dayTitle(d, { weekday: 'short' })}</small>
                      </div>
                    );
                  })}
                </div>
                <p className="muted">
                  Estos indicadores cambian al crear o cancelar turnos dentro de esta demo.
                </p>
                <Link href="/demo/admin/finanzas" className="demo-panel-link">
                  Explorar las finanzas <ArrowUpRight size={17} />
                </Link>
              </section>
            </div>
          </>
        )}

        {section === 'agenda' && (
          <>
            <div className="demo-agenda-toolbar">
              <div className="demo-day-switch">
                <button
                  type="button"
                  aria-label={view === 'month' ? 'Mes anterior' : 'Día anterior'}
                  onClick={() =>
                    setDay(
                      view === 'month'
                        ? `${shiftMonth(day, -1)}-01`
                        : shiftDay(day, view === 'week' ? -7 : -1),
                    )
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <button type="button" className="demo-today-button" onClick={() => setDay(today)}>
                  Hoy
                </button>
                <button
                  type="button"
                  aria-label={view === 'month' ? 'Mes siguiente' : 'Día siguiente'}
                  onClick={() =>
                    setDay(
                      view === 'month'
                        ? `${shiftMonth(day, 1)}-01`
                        : shiftDay(day, view === 'week' ? 7 : 1),
                    )
                  }
                >
                  <ChevronRight size={18} />
                </button>
                <label>
                  <span className="sr-only">Fecha de agenda</span>
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => {
                      if (e.target.value) setDay(e.target.value);
                    }}
                  />
                </label>
              </div>
              <div className="demo-view-switch">
                {[
                  ['day', 'Día'],
                  ['week', 'Semana'],
                  ['month', 'Mes'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={view === key}
                    onClick={() => setView(key as typeof view)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <section className="demo-agenda-board">
              <div className="demo-agenda-day-heading">
                <div>
                  <span>{dayTitle(day, { weekday: 'long' })}</span>
                  <h2>{dayTitle(day, { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                </div>
                <span className="demo-barber-label">
                  <i /> BARBER LUKE · {dayAppointments.length} TURNOS DEMO
                </span>
              </div>
              {view === 'day' && <Timeline day={day} onSelect={open} />}
              {view === 'week' && (
                <div className="demo-week-scroll">
                  <div className="demo-week-grid">
                    {week.map((d) => (
                      <div key={d}>
                        <button
                          className={`demo-week-day ${day === d ? 'chosen' : ''}`}
                          type="button"
                          onClick={() => {
                            setDay(d);
                            setView('day');
                          }}
                        >
                          <span>{dayTitle(d, { weekday: 'short' })}</span>
                          <strong>{Number(d.slice(8))}</strong>
                        </button>
                        <Timeline day={d} onSelect={open} compact />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {view === 'month' && (
                <div className="demo-month">
                  <div className="calendar-weekdays">
                    {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className="demo-month-grid">
                    {monthDays(day.slice(0, 7)).map((d) => {
                      const appointments = state.appointments.filter(
                        (a) => a.day === d && a.status === 'confirmed',
                      );
                      return (
                        <button
                          type="button"
                          key={d}
                          className={d.slice(0, 7) === day.slice(0, 7) ? '' : 'other-month'}
                          onClick={() => {
                            setDay(d);
                            setView('day');
                          }}
                        >
                          <strong>{Number(d.slice(8))}</strong>
                          <span>{appointments.length ? `${appointments.length} turnos` : '—'}</span>
                          {appointments.slice(0, 2).map((a) => (
                            <small key={a.id}>
                              {a.time} · {a.name}
                            </small>
                          ))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
            <p className="demo-agenda-help">
              <span>
                <i />
                Confirmado
              </span>
              <span>
                <i className="is-completed" />
                Completado
              </span>
              Hacé clic en un turno para ver sus detalles, cambiar su estado o registrar un cobro de
              muestra.
            </p>
          </>
        )}

        {section === 'servicios' && (
          <>
            <p className="page-intro">
              Precios de ejemplo para recorrer el sistema. Los cambios acá solo afectan esta
              demostración.
            </p>
            <div className="demo-service-edit-grid">
              {state.services.map((service) => (
                <section className="demo-admin-panel" key={service.id}>
                  <Scissors size={23} />
                  <LocalForm
                    onSubmit={(data) => {
                      const name = String(data.get('name')).trim();
                      if (name.length < 2) throw new Error('Ingresá un nombre.');
                      const price = amount(data, 'price_cents', true);
                      store.update((current) => ({
                        ...current,
                        services: current.services.map((s) =>
                          s.id === service.id
                            ? {
                                ...s,
                                name,
                                price_cents: price,
                                description: String(data.get('description')).slice(0, 300),
                                active: data.get('active') === 'on',
                              }
                            : s,
                        ),
                      }));
                    }}
                  >
                    <Field
                      label="Nombre del servicio"
                      name="name"
                      defaultValue={service.name}
                      minLength={2}
                      maxLength={100}
                      required
                    />
                    <Field
                      label="Descripción"
                      name="description"
                      defaultValue={service.description}
                      maxLength={300}
                    />
                    <Amount
                      name="price_cents"
                      label="Precio de ejemplo (ARS)"
                      defaultCents={service.price_cents}
                    />
                    <label className="check-field">
                      <input type="checkbox" name="active" defaultChecked={service.active} />
                      Visible en las reservas demo
                    </label>
                  </LocalForm>
                </section>
              ))}
              <section className="demo-admin-panel">
                <h2>AGREGAR SERVICIO.</h2>
                <LocalForm
                  submit="Crear servicio demo"
                  onSubmit={(data) => {
                    const name = String(data.get('name')).trim();
                    if (name.length < 2) throw new Error('Ingresá un nombre.');
                    const price = amount(data, 'price_cents', true);
                    store.update((current) => ({
                      ...current,
                      services: [
                        ...current.services,
                        {
                          id: `demo-${crypto.randomUUID()}`,
                          name,
                          description: String(data.get('description')).slice(0, 300),
                          price_cents: price,
                          active: true,
                          sort_order: current.services.length,
                        },
                      ],
                    }));
                  }}
                >
                  <Field name="name" label="Nombre" minLength={2} maxLength={100} required />
                  <Field name="description" label="Descripción" maxLength={300} />
                  <Amount
                    name="price_cents"
                    label="Precio de ejemplo (ARS)"
                    defaultCents={1200000}
                  />
                </LocalForm>
              </section>
            </div>
          </>
        )}

        {section === 'disponibilidad' && (
          <div className="demo-admin-two-columns">
            <section className="demo-admin-panel">
              <h2>LA SEMANA DEL ESTUDIO.</h2>
              <p className="muted">
                Los cambios se reflejan en el calendario de reservas demo. La duración fija se
                aplica a turnos nuevos.
              </p>
              <LocalForm
                onSubmit={(data) => {
                  const opens = String(data.get('opens')),
                    closes = String(data.get('closes')),
                    breakStart = String(data.get('breakStart')),
                    breakEnd = String(data.get('breakEnd'));
                  if (!(opens < breakStart && breakStart < breakEnd && breakEnd < closes))
                    throw new Error('El descanso debe quedar dentro del horario laboral.');
                  const workingDays = data.getAll('workingDay').map(Number),
                    minutes = Number(data.get('minutes'));
                  if (![30, 40, 45].includes(minutes))
                    throw new Error('Elegí una duración válida.');
                  if (
                    state.appointments.some(
                      (a) =>
                        a.status === 'confirmed' &&
                        a.day >= today &&
                        (!workingDays.includes(new Date(`${a.day}T12:00:00Z`).getUTCDay()) ||
                          a.time < opens ||
                          minuteOf(a.time) + a.duration > minuteOf(closes) ||
                          (minuteOf(a.time) < minuteOf(breakEnd) &&
                            minuteOf(a.time) + a.duration > minuteOf(breakStart))),
                    )
                  )
                    throw new Error(
                      'El cambio afecta turnos de ejemplo. Cancelalos o elegí otro horario.',
                    );
                  store.update((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      opens,
                      closes,
                      breakStart,
                      breakEnd,
                      workingDays,
                      minutes,
                    },
                  }));
                }}
              >
                <div className="demo-working-days">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((name, index) => (
                    <label key={index}>
                      <input
                        type="checkbox"
                        name="workingDay"
                        value={index}
                        defaultChecked={state.settings.workingDays.includes(index)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
                <div className="two-fields">
                  <Field
                    label="Apertura"
                    type="time"
                    name="opens"
                    defaultValue={state.settings.opens}
                    required
                  />
                  <Field
                    label="Cierre"
                    type="time"
                    name="closes"
                    defaultValue={state.settings.closes}
                    required
                  />
                </div>
                <div className="two-fields">
                  <Field
                    label="Descanso desde"
                    type="time"
                    name="breakStart"
                    defaultValue={state.settings.breakStart}
                    required
                  />
                  <Field
                    label="Descanso hasta"
                    type="time"
                    name="breakEnd"
                    defaultValue={state.settings.breakEnd}
                    required
                  />
                </div>
                <label className="field">
                  Duración fija
                  <select name="minutes" defaultValue={state.settings.minutes}>
                    <option value={30}>30 minutos</option>
                    <option value={40}>40 minutos</option>
                    <option value={45}>45 minutos</option>
                  </select>
                </label>
              </LocalForm>
            </section>
            <section className="demo-admin-panel">
              <h2>UN DÍA LIBRE.</h2>
              <p className="muted">
                Simulá un cierre completo. No se cancelan turnos existentes de forma automática.
              </p>
              <LocalForm
                submit="Cerrar día en demo"
                onSubmit={(data) => {
                  const date = String(data.get('day'));
                  if (state.appointments.some((a) => a.day === date && a.status === 'confirmed'))
                    throw new Error(
                      'Ese día tiene turnos de muestra. Resolvelos primero en Agenda.',
                    );
                  store.update((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      closedDates: [...new Set([...current.settings.closedDates, date])],
                    },
                  }));
                }}
              >
                <Field
                  label="Fecha"
                  type="date"
                  name="day"
                  min={today}
                  defaultValue={shiftDay(today, 7)}
                  required
                />
              </LocalForm>
              <div className="demo-closed-dates">
                {state.settings.closedDates.map((d) => (
                  <div key={d}>
                    <span>{dayTitle(d)}</span>
                    <button
                      type="button"
                      aria-label={`Reabrir ${d}`}
                      onClick={() =>
                        store.update((current) => ({
                          ...current,
                          settings: {
                            ...current.settings,
                            closedDates: current.settings.closedDates.filter((date) => date !== d),
                          },
                        }))
                      }
                    >
                      Reabrir <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === 'clientes' && (
          <>
            <p className="page-intro">
              Perfiles ficticios generados para mostrar el historial. No se consultan clientes
              reales.
            </p>
            <label className="demo-search">
              <Search size={17} />
              <input
                placeholder="Buscar cliente de ejemplo…"
                aria-label="Buscar cliente de ejemplo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="demo-client-list">
              {[...new Set(state.appointments.map((a) => a.name))]
                .filter((name) => name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
                .map((name) => {
                  const appointments = state.appointments.filter((a) => a.name === name);
                  return (
                    <details key={name} className="demo-client">
                      <summary>
                        <span className="demo-client-avatar">
                          {name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <div>
                          <strong>{name}</strong>
                          <span>Perfil de demostración</span>
                        </div>
                        <span>{appointments.length} turnos</span>
                      </summary>
                      <div>
                        {appointments.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            className="demo-client-history"
                            onClick={() => open(a.id)}
                          >
                            <span>
                              {dayTitle(a.day, { day: 'numeric', month: 'short' })} · {a.time}
                            </span>
                            <strong>{a.serviceName}</strong>
                            <span className={`badge ${a.status}`}>{statusLabel[a.status]}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  );
                })}
            </div>
          </>
        )}

        {section === 'finanzas' && (
          <>
            <p className="page-intro">
              Caja de ejemplo: se suman los cobros registrados, no los turnos reservados.
            </p>
            <div className="demo-finance-filter">
              <label className="field">
                Desde
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="field">
                Hasta
                <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
              </label>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const rows = [
                    ['DATOS DE DEMOSTRACION'],
                    ['Tipo', 'Fecha', 'Descripcion', 'Importe_centavos'],
                    ...filteredPayments.map((p) => ['Cobro demo', p.day, p.method, p.amount]),
                    ...filteredExpenses.map((e) => ['Gasto demo', e.day, e.description, e.amount]),
                  ];
                  const csv =
                    '\uFEFF' +
                    rows
                      .map((row) =>
                        row
                          .map((v) => {
                            let text = String(v);
                            if (/^\s*[=+\-@]/.test(text)) text = "'" + text;
                            return '"' + text.replaceAll('"', '""') + '"';
                          })
                          .join(','),
                      )
                      .join('\r\n');
                  const url = URL.createObjectURL(
                    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
                  );
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'barber-luke-DEMO-finanzas.csv';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <Download size={15} /> CSV demo
              </button>
            </div>
            <div className="demo-stat-grid">
              <div>
                <small>COBROS DE EJEMPLO</small>
                <strong>{money(cashIn)}</strong>
                <p>{filteredPayments.length} registros</p>
              </div>
              <div>
                <small>GASTOS DE EJEMPLO</small>
                <strong>{money(cashOut)}</strong>
                <p>{filteredExpenses.length} registros</p>
              </div>
              <div>
                <small>CAJA DE EJEMPLO</small>
                <strong>{money(cashIn - cashOut)}</strong>
                <p>Cobrado − gastos</p>
              </div>
              <div>
                <small>TICKET PROMEDIO</small>
                <strong>
                  {money(
                    filteredPayments.length ? Math.round(cashIn / filteredPayments.length) : 0,
                  )}
                </strong>
                <p>Por cobro registrado</p>
              </div>
            </div>
            <div className="demo-admin-two-columns">
              <section className="demo-admin-panel">
                <h2>REGISTRAR GASTO.</h2>
                <LocalForm
                  submit="Agregar gasto demo"
                  onSubmit={(data) => {
                    const description = String(data.get('description')).trim();
                    if (description.length < 2) throw new Error('Agregá una descripción.');
                    const value = amount(data);
                    store.update((current) => ({
                      ...current,
                      expenses: [
                        ...current.expenses,
                        {
                          id: crypto.randomUUID(),
                          description,
                          amount: value,
                          day: String(data.get('day')),
                          category: String(data.get('category')),
                        },
                      ],
                    }));
                  }}
                >
                  <Field
                    name="description"
                    label="Descripción de ejemplo"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <Field name="day" label="Fecha" type="date" defaultValue={today} required />
                  <label className="field">
                    Categoría
                    <select name="category">
                      {['Insumos', 'Alquiler', 'Servicios', 'Herramientas', 'Otros'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <Amount defaultCents={250000} />
                </LocalForm>
              </section>
              <section className="demo-admin-panel">
                <h2>MOVIMIENTOS DEL PERÍODO.</h2>
                {filteredPayments.map((p) => (
                  <div className="demo-finance-row" key={p.id}>
                    <div>
                      <strong>Cobro demo</strong>
                      <span>
                        {dayTitle(p.day, { day: 'numeric', month: 'short' })} ·{' '}
                        {p.method === 'cash'
                          ? 'Efectivo'
                          : p.method === 'transfer'
                            ? 'Transferencia'
                            : 'Otro'}
                      </span>
                    </div>
                    <strong className="positive">+{money(p.amount)}</strong>
                  </div>
                ))}
                {filteredExpenses.map((e) => (
                  <div className="demo-finance-row" key={e.id}>
                    <div>
                      <strong>{e.description}</strong>
                      <span>
                        {e.category} · {dayTitle(e.day, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <strong>−{money(e.amount)}</strong>
                  </div>
                ))}
                {!filteredPayments.length && !filteredExpenses.length && (
                  <p className="muted">No hay movimientos de ejemplo en este período.</p>
                )}
                <p className="message">
                  Para registrar un cobro de muestra, abrí un turno desde Agenda. Cada turno admite
                  un único cobro.
                </p>
              </section>
            </div>
          </>
        )}

        {section === 'configuracion' && (
          <section className="demo-admin-panel demo-config-panel">
            <h2>EL SELLO DEL ESTUDIO.</h2>
            <LocalForm
              onSubmit={(data) => {
                const name = String(data.get('name')).trim();
                if (name.length < 2) throw new Error('Ingresá un nombre de al menos 2 caracteres.');
                store.update((current) => ({
                  ...current,
                  settings: { ...current.settings, name },
                }));
              }}
            >
              <Field
                name="name"
                label="Nombre del estudio en esta demo"
                minLength={2}
                maxLength={100}
                defaultValue={state.settings.name}
                required
              />
              <p className="message">
                La configuración real permite definir contacto, dirección y reglas de reserva. Esta
                vista de muestra trabaja solo en tu pestaña y no cambia la web publicada.
              </p>
              <div className="demo-config-facts">
                <span>
                  Un solo barbero<strong>Configuración inicial</strong>
                </span>
                <span>
                  Sin pagos online<strong>No se solicitan señas</strong>
                </span>
                <span>
                  Cancelación real<strong>Hasta 24 horas antes</strong>
                </span>
              </div>
            </LocalForm>
          </section>
        )}

        <dialog
          className="demo-appointment-dialog"
          ref={dialog}
          onClick={(e) => {
            if (e.target === e.currentTarget) dialog.current?.close();
          }}
          aria-labelledby="demo-appointment-title"
        >
          <div className="demo-dialog-heading">
            <span>TURNO DE DEMOSTRACIÓN</span>
            <button
              type="button"
              aria-label="Cerrar detalles"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          {appointment && (
            <>
              <span className={`badge ${appointment.status}`}>
                {statusLabel[appointment.status]}
              </span>
              <h2 id="demo-appointment-title">{appointment.name}</h2>
              <p>{appointment.serviceName}</p>
              <div className="demo-dialog-details">
                <span>
                  <CalendarDays size={16} />
                  {dayTitle(appointment.day)}
                </span>
                <span>
                  <Clock3 size={16} />
                  {appointment.time} · {appointment.duration} minutos
                </span>
                <strong>{money(appointment.price)} · precio de ejemplo</strong>
              </div>
              {appointment.status === 'confirmed' && (
                <div className="demo-dialog-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => setStatus(appointment.id, 'completed')}
                  >
                    <Check size={15} /> Simular atención completada
                  </button>
                  <details>
                    <summary>Cancelar turno de ejemplo</summary>
                    <p className="muted">Se libera el horario solo en la demo.</p>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setStatus(appointment.id, 'cancelled')}
                    >
                      Confirmar cancelación demo
                    </button>
                  </details>
                </div>
              )}
              {paidIds.has(appointment.id) ? (
                <p className="message success">
                  Cobro de muestra registrado. No se realizó ningún pago real.
                </p>
              ) : (
                ['confirmed', 'completed'].includes(appointment.status) && (
                  <div className="demo-dialog-payment">
                    <h3>Registrar cobro de muestra</h3>
                    <LocalForm
                      submit="Registrar cobro demo"
                      onSubmit={(data) => {
                        const value = amount(data);
                        const method = String(data.get('method'));
                        if (!['cash', 'transfer', 'other'].includes(method))
                          throw new Error('Elegí un método.');
                        store.update((current) => {
                          if (current.payments.some((p) => p.appointmentId === appointment.id))
                            throw new Error('Este turno ya tiene un cobro de muestra.');
                          return {
                            ...current,
                            payments: [
                              ...current.payments,
                              {
                                id: crypto.randomUUID(),
                                appointmentId: appointment.id,
                                amount: value,
                                day: today,
                                method: method as 'cash' | 'transfer' | 'other',
                              },
                            ],
                          };
                        });
                      }}
                    >
                      <Amount key={appointment.id} defaultCents={appointment.price} />
                      <label className="field">
                        Método
                        <select name="method">
                          <option value="cash">Efectivo</option>
                          <option value="transfer">Transferencia</option>
                          <option value="other">Otro</option>
                        </select>
                      </label>
                    </LocalForm>
                  </div>
                )
              )}
            </>
          )}
        </dialog>
      </div>
    </div>
  );
}
