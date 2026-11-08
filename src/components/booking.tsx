'use client';
import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, CalendarDays, Clock3 } from 'lucide-react';
import { book, adminMutation, changeAppointment } from '@/lib/actions';
import { money, localDay, dateTime } from '@/lib/format';
import type { Service, ActionState } from '@/lib/types';
type Slot = { starts_at: string; ends_at: string };
export function Booking({
  services,
  enabled,
  loggedIn,
  minutes,
  horizon = 30,
  manual = false,
  rescheduleId,
}: {
  services: Service[];
  enabled: boolean;
  loggedIn: boolean;
  minutes: number;
  horizon?: number;
  manual?: boolean;
  rescheduleId?: string;
}) {
  const [service, setService] = useState(services[0]?.id ?? ''),
    [day, setDay] = useState(localDay()),
    [start, setStart] = useState(''),
    [slots, setSlots] = useState<Slot[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [key, setKey] = useState('');
  const action = rescheduleId ? changeAppointment : manual ? adminMutation : book;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  useEffect(() => {
    const stored =
      !manual && !rescheduleId ? sessionStorage.getItem('barber-luke-selection') : null;
    let selection: { service?: string; day?: string; start?: string } = {};
    try {
      selection = stored ? JSON.parse(stored) : {};
    } catch {}
    // Restaurar la selección después de volver de OAuth, únicamente en el navegador.
    if (selection.service && services.some((s) => s.id === selection.service)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setService(selection.service);
    }
    if (selection.day && selection.day >= localDay()) {
      setDay(selection.day);
      setStart(selection.start ?? '');
    }
    setKey(crypto.randomUUID());
  }, [manual, rescheduleId, services]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    fetch(`/api/availability?day=${day}${rescheduleId ? `&ignore=${rescheduleId}` : ''}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        return body;
      })
      .then((body) => {
        setSlots(body.slots);
        setStart((current) =>
          body.slots.some((s: Slot) => s.starts_at === current) ? current : '',
        );
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'No pudimos consultar los horarios.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [day, enabled, rescheduleId, state.error]);
  const selected = services.find((s) => s.id === service);
  const remember = () =>
    sessionStorage.setItem('barber-luke-selection', JSON.stringify({ service, day, start }));
  const max = new Date();
  max.setDate(max.getDate() + horizon);
  if (state.success)
    return (
      <div className="confirmation panel">
        <Check size={40} />
        <p className="eyebrow">LISTO, NOS VEMOS PRONTO</p>
        <h2>{rescheduleId ? 'Turno reprogramado.' : 'Tu próximo estilo ya tiene fecha.'}</h2>
        <p>{state.success}</p>
        {start && (
          <p>
            {dateTime(start)} · {selected?.name}
          </p>
        )}
        <Link className="button" href={manual ? '/admin/agenda' : '/mis-turnos'}>
          Ver mis turnos <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <form action={formAction} className="booking-grid">
      <div>
        {!rescheduleId && (
          <section className="booking-step">
            <div className="step-heading">
              <span>01</span>
              <h2>Elegí tu servicio</h2>
            </div>
            <div className="service-options">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={`service-option ${service === s.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={s.id}
                    checked={service === s.id}
                    onChange={() => setService(s.id)}
                    required
                  />
                  <div>
                    <strong>{s.name}</strong>
                    <p>{s.description}</p>
                    <small>
                      <Clock3 size={13} /> {minutes} minutos
                    </small>
                  </div>
                  <span>{money(s.price_cents)}</span>
                </label>
              ))}
              {!services.length && (
                <p className="message">
                  Estamos preparando la carta de servicios. Los precios se publicarán al habilitar
                  la agenda.
                </p>
              )}
            </div>
          </section>
        )}
        <section className="booking-step">
          <div className="step-heading">
            <span>{rescheduleId ? '01' : '02'}</span>
            <h2>Encontrá tu momento</h2>
          </div>
          <label className="field">
            <span>
              <CalendarDays size={16} /> Fecha · Buenos Aires
            </span>
            <input
              aria-label="Fecha del turno"
              type="date"
              min={localDay()}
              max={localDay(max)}
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setStart('');
              }}
              disabled={!enabled}
              required
            />
          </label>
          <div className="slot-grid" aria-live="polite">
            {loading ? (
              <p>Consultando agenda…</p>
            ) : error ? (
              <p role="alert" className="message error">
                {error}
              </p>
            ) : !enabled ? (
              <p className="message">La agenda online se habilitará próximamente.</p>
            ) : slots.length ? (
              slots.map((s) => (
                <button
                  type="button"
                  key={s.starts_at}
                  onClick={() => setStart(s.starts_at)}
                  className={`slot ${start === s.starts_at ? 'selected' : ''}`}
                >
                  {new Intl.DateTimeFormat('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }).format(new Date(s.starts_at))}
                </button>
              ))
            ) : (
              <p className="message">No hay horarios disponibles este día. Probá con otra fecha.</p>
            )}
          </div>
        </section>
        {manual && (
          <section className="panel form-stack">
            <h3>Datos del cliente</h3>
            <label className="field">
              Nombre
              <input name="name" required minLength={2} maxLength={100} />
            </label>
            <label className="field">
              Email (opcional)
              <input name="email" type="email" />
            </label>
            <label className="field">
              Teléfono
              <input name="phone" maxLength={40} />
            </label>
            <input type="hidden" name="kind" value="manual" />
          </section>
        )}
      </div>
      <aside className="booking-summary panel">
        <p className="eyebrow">TU EXPERIENCIA</p>
        <h3>{rescheduleId ? 'Un nuevo momento.' : selected?.name || 'Tu próximo turno'}</h3>
        <div className="summary-row">
          <span>Duración</span>
          <strong>{minutes} min</strong>
        </div>
        <div className="summary-row">
          <span>Fecha y hora</span>
          <strong>{start ? dateTime(start) : 'A elección'}</strong>
        </div>
        {!rescheduleId && (
          <div className="summary-row total">
            <span>Total</span>
            <strong>{selected ? money(selected.price_cents) : '—'}</strong>
          </div>
        )}
        <p className="muted">Confirmación automática. Sin seña ni pagos online.</p>
        <p className="policy">Podés cancelar o reprogramar hasta 24 horas antes del inicio.</p>
        <input name="start" type="hidden" value={start} />
        <input name="key" type="hidden" value={key} />
        {rescheduleId && (
          <>
            <input type="hidden" name="id" value={rescheduleId} />
            <input type="hidden" name="action" value="reschedule" />
          </>
        )}
        <label className="check-field">
          <input name="consent" type="checkbox" required />{' '}
          <span>
            Acepto los{' '}
            <Link href="/terminos" target="_blank">
              términos
            </Link>{' '}
            y la{' '}
            <Link href="/privacidad" target="_blank">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        <div aria-live="polite">
          {state.error && (
            <p className="message error" role="alert">
              {state.error}
            </p>
          )}
        </div>
        {loggedIn ? (
          <button
            className="button full"
            disabled={!start || !enabled || pending || (!service && !rescheduleId) || !key}
          >
            {pending ? 'Confirmando…' : rescheduleId ? 'Confirmar cambio' : 'Confirmar turno'}
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            className={`button full ${!enabled ? 'disabled' : ''}`}
            href={enabled ? '/auth/login' : '/ingresar'}
            onClick={remember}
          >
            Continuar con Google <ArrowRight size={16} />
          </Link>
        )}
        <small className="muted">
          {loggedIn
            ? 'El horario se asegura al confirmar.'
            : 'Iniciá sesión para confirmar tu reserva.'}
        </small>
      </aside>
    </form>
  );
}
