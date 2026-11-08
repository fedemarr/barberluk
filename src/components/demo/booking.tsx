'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Clock3, Scissors, CalendarDays, ShieldCheck } from 'lucide-react';
import { useDemo } from './provider';
import { DemoRibbon } from './ribbon';
import { BookingCalendar } from '../booking-calendar';
import { nextDemoDay, demoSlots, addDemoAppointment } from '@/lib/demo-model';
import { dayTitle, shiftDay } from '@/lib/calendar';
import { money } from '@/lib/format';

export function DemoBooking() {
  const { state, store, today, now } = useDemo();
  const [day, setDay] = useState(nextDemoDay(today)),
    [serviceId, setServiceId] = useState(state.services[0]?.id ?? ''),
    [time, setTime] = useState(''),
    [name, setName] = useState('Visita demo'),
    [error, setError] = useState(''),
    [confirmed, setConfirmed] = useState(false);
  const services = state.services.filter((s) => s.active),
    service = services.find((s) => s.id === serviceId) ?? services[0];
  const slots = demoSlots(state, day, now);
  const available = slots.filter((s) => s.available).length;
  if (confirmed)
    return (
      <div className="reservation-shell">
        <DemoRibbon />
        <section className="demo-confirmation">
          <div className="demo-confirmation-check">
            <Check size={34} />
          </div>
          <p className="eyebrow">ASÍ SE VERÍA TU CONFIRMACIÓN</p>
          <h1 id="demo-confirmation-title" tabIndex={-1}>
            YA TENÉS
            <br />
            <span>TU MOMENTO.</span>
          </h1>
          <p>Simulación completada. Agregamos un turno de ejemplo a la agenda de esta pestaña.</p>
          <div className="demo-ticket">
            <div>
              <small>SERVICIO DE EJEMPLO</small>
              <strong>{service?.name}</strong>
            </div>
            <div>
              <small>FECHA Y HORA</small>
              <strong>
                {dayTitle(day)} · {time}
              </strong>
            </div>
            <div>
              <small>PRECIO DE EJEMPLO</small>
              <strong>{service && money(service.price_cents)}</strong>
            </div>
          </div>
          <div className="demo-confirmation-actions">
            <Link className="button" href={`/demo/admin/agenda?day=${day}`}>
              Verlo en el panel admin <ArrowUpRight size={18} />
            </Link>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setConfirmed(false);
                setTime('');
              }}
            >
              Probar otro turno
            </button>
          </div>
          <p className="muted">No se creó una reserva real ni se envió un correo.</p>
        </section>
      </div>
    );
  return (
    <div className="reservation-shell">
      <DemoRibbon />
      <div className="reservation-heading">
        <div>
          <p className="eyebrow">BARBER LUKE / AGENDA ONLINE</p>
          <h1>
            HACÉ LUGAR
            <br />
            PARA <span>VOS.</span>
          </h1>
        </div>
        <div className="reservation-heading-note">
          <CalendarDays size={24} />
          <p>
            Tu servicio.
            <br />
            Tu día. Tu horario.
          </p>
        </div>
      </div>
      <div className="booking-progress" aria-label="Pasos de la reserva">
        <span className="done">
          <b>01</b> SERVICIO
        </span>
        <i />
        <span className={time ? 'done' : ''}>
          <b>02</b> DÍA Y HORA
        </span>
        <i />
        <span>
          <b>03</b> CONFIRMACIÓN
        </span>
      </div>
      <form
        className="demo-booking-layout"
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          try {
            if (!service) throw new Error('Elegí un servicio.');
            store.update((current) =>
              addDemoAppointment(current, { day, time, serviceId: service.id, name }, now),
            );
            setConfirmed(true);
            requestAnimationFrame(() => {
              document.getElementById('demo-confirmation-title')?.focus({ preventScroll: true });
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              });
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No pudimos completar la simulación.');
          }
        }}
      >
        <div className="demo-booking-main">
          <section className="demo-booking-section">
            <div className="reservation-section-title">
              <span>01 /</span>
              <h2>¿QUÉ HACEMOS HOY?</h2>
              <small>PRECIOS DE EJEMPLO</small>
            </div>
            <div className="demo-service-grid">
              {services.map((s) => (
                <button
                  type="button"
                  className={`demo-service-card ${service?.id === s.id ? 'is-selected' : ''}`}
                  aria-pressed={service?.id === s.id}
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                >
                  <div>
                    <Scissors size={20} />
                    <span className="service-tick">
                      {service?.id === s.id && <Check size={12} />}
                    </span>
                  </div>
                  <strong>{s.name}</strong>
                  <p>{s.description}</p>
                  <footer>
                    <span>{money(s.price_cents)}</span>
                    <small>{state.settings.minutes} MIN</small>
                  </footer>
                </button>
              ))}
              {!services.length && (
                <p className="message">
                  No hay servicios activos en esta demo. Activá uno desde el panel de muestra.
                </p>
              )}
            </div>
          </section>
          <section className="demo-booking-section">
            <div className="reservation-section-title">
              <span>02 /</span>
              <h2>ELEGÍ TU MOMENTO.</h2>
            </div>
            <div className="demo-calendar-and-slots">
              <BookingCalendar
                value={day}
                min={today}
                max={shiftDay(today, 30)}
                closedDays={[0, 1, 2, 3, 4, 5, 6].filter(
                  (d) => !state.settings.workingDays.includes(d),
                )}
                onChange={(value) => {
                  setDay(value);
                  setTime('');
                  setError('');
                }}
              />
              <div className="demo-slots-panel">
                <div className="demo-slots-heading">
                  <strong>{dayTitle(day, { weekday: 'long', day: 'numeric' })}</strong>
                  <span>
                    <i />
                    {available} libres · demo
                  </span>
                </div>
                {slots.length ? (
                  (['Mañana', 'Tarde'] as const).map((period) => (
                    <div className="demo-slot-period" key={period}>
                      <p>
                        <Clock3 size={13} />
                        {period}
                      </p>
                      <div className="demo-time-grid">
                        {slots
                          .filter((s) => s.period === period)
                          .map((s) => (
                            <button
                              type="button"
                              key={s.time}
                              disabled={!s.available}
                              aria-pressed={time === s.time}
                              aria-label={`${s.time}${s.available ? ', disponible de ejemplo' : ', ocupado de ejemplo'}`}
                              className={time === s.time ? 'is-selected' : ''}
                              onClick={() => {
                                setTime(s.time);
                                setError('');
                              }}
                            >
                              {s.time}
                              {!s.available && <small>Ocupado</small>}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="demo-no-slots">
                    <CalendarDays size={28} />
                    <strong>Un día para descansar.</strong>
                    <p>No hay horarios este día. Elegí otra fecha en el calendario.</p>
                  </div>
                )}
                <p className="demo-slot-hint">
                  Los horarios tachados ya tienen un turno de ejemplo.
                </p>
              </div>
            </div>
          </section>
        </div>
        <aside className="demo-reservation-summary">
          <div className="summary-brand-line">
            <span>BARBER LUKE</span>
            <Scissors size={18} />
          </div>
          <p className="eyebrow">TU PRÓXIMO ESTILO</p>
          <h2>{service?.name ?? 'Elegí tu servicio'}</h2>
          <div className="demo-summary-item">
            <CalendarDays size={17} />
            <div>
              <small>FECHA</small>
              <strong>{dayTitle(day)}</strong>
            </div>
          </div>
          <div className="demo-summary-item">
            <Clock3 size={17} />
            <div>
              <small>HORA Y DURACIÓN</small>
              <strong>
                {time || 'Elegí un horario'} · {state.settings.minutes} min
              </strong>
            </div>
          </div>
          <label className="field">
            Nombre de prueba
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoComplete="off"
            />
          </label>
          <div className="demo-summary-total">
            <span>Precio de ejemplo</span>
            <strong>{service ? money(service.price_cents) : '—'}</strong>
          </div>
          {error && (
            <p role="alert" className="message error">
              {error}
            </p>
          )}
          <button className="button full" disabled={!time || !service}>
            Probar reserva <ArrowUpRight size={18} />
          </button>
          <div className="demo-summary-note">
            <ShieldCheck size={15} />
            <p>
              Esta es una simulación. Para reservar de verdad vamos a habilitar Google y la base de
              datos.
            </p>
          </div>
          <Link href="/demo/admin" className="demo-admin-shortcut">
            Recorrer el panel del barbero <ArrowUpRight size={15} />
          </Link>
        </aside>
      </form>
    </div>
  );
}
