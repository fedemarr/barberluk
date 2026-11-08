'use client';
import { useState } from 'react';
import { adminMutation } from '@/lib/actions';
import { ActionForm, Field } from './action-form';
type Interval = { weekday: number; starts: string; ends: string };
const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export function WeeklyEditor({ initial }: { initial: Interval[] }) {
  const [rows, setRows] = useState(
    initial.map((i) => ({ ...i, starts: i.starts.slice(0, 5), ends: i.ends.slice(0, 5) })),
  );
  return (
    <ActionForm action={adminMutation} submit="Guardar semana">
      <input name="kind" type="hidden" value="weekly" />
      <input name="intervals" type="hidden" value={JSON.stringify(rows)} />
      {days.map((day, index) => (
        <div key={day} className="schedule-day">
          <h3>{day}</h3>
          {!rows.some((r) => r.weekday === index) && <p className="muted">Cerrado</p>}
          {rows.map(
            (r, i) =>
              r.weekday === index && (
                <div key={i} className="interval-row">
                  <input
                    type="time"
                    aria-label={`Apertura ${day}`}
                    required
                    value={r.starts}
                    onChange={(e) =>
                      setRows(rows.map((x, j) => (j === i ? { ...x, starts: e.target.value } : x)))
                    }
                  />
                  <span>—</span>
                  <input
                    type="time"
                    aria-label={`Cierre ${day}`}
                    required
                    value={r.ends}
                    onChange={(e) =>
                      setRows(rows.map((x, j) => (j === i ? { ...x, ends: e.target.value } : x)))
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Eliminar intervalo ${day}`}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              ),
          )}
          <button
            className="text-link"
            type="button"
            onClick={() => setRows([...rows, { weekday: index, starts: '09:00', ends: '18:00' }])}
          >
            + Agregar intervalo
          </button>
        </div>
      ))}
    </ActionForm>
  );
}
export function ExceptionEditor() {
  const [closed, setClosed] = useState(true),
    [starts, setStarts] = useState('09:00'),
    [ends, setEnds] = useState('18:00');
  return (
    <ActionForm action={adminMutation} submit="Guardar excepción">
      <input type="hidden" name="kind" value="exception" />
      <Field label="Fecha" name="day" type="date" required />
      <Field label="Motivo" name="reason" maxLength={300} />
      <label className="check-field">
        <input
          name="closed"
          type="checkbox"
          checked={closed}
          onChange={(e) => setClosed(e.target.checked)}
        />
        Cerrar todo el día
      </label>
      {!closed && (
        <div className="interval-row">
          <input
            aria-label="Apertura excepcional"
            type="time"
            required
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
          />
          <span>—</span>
          <input
            aria-label="Cierre excepcional"
            type="time"
            required
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
          />
        </div>
      )}
      <input name="intervals" type="hidden" value={JSON.stringify([{ starts, ends }])} />
      <p className="muted">
        Este horario reemplaza al semanal en esa fecha. Para cerrar varios días, usá un bloqueo por
        vacaciones.
      </p>
    </ActionForm>
  );
}
