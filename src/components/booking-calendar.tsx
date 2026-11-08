'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthDays, shiftMonth, dayTitle } from '@/lib/calendar';

export function BookingCalendar({
  value,
  min,
  max,
  onChange,
  disabled = false,
  closedDays = [],
}: {
  value: string;
  min: string;
  max: string;
  onChange: (day: string) => void;
  disabled?: boolean;
  closedDays?: number[];
}) {
  const [view, setView] = useState<string | null>(null);
  const month = view ?? value.slice(0, 7);
  return (
    <div className="booking-calendar" role="group" aria-label="Elegir fecha del turno">
      <div className="calendar-toolbar">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={disabled || month <= min.slice(0, 7)}
          onClick={() => setView(shiftMonth(month, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <strong aria-live="polite">
          {dayTitle(`${month}-01`, { month: 'long', year: 'numeric' })}
        </strong>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={disabled || month >= max.slice(0, 7)}
          onClick={() => setView(shiftMonth(month, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="calendar-date-grid">
        {monthDays(month).map((day) => {
          const outside = day.slice(0, 7) !== month;
          const closed = closedDays.includes(new Date(`${day}T12:00:00Z`).getUTCDay());
          return (
            <button
              key={day}
              type="button"
              disabled={disabled || day < min || day > max || closed || outside}
              className={`${outside ? 'outside-month' : ''} ${day === value ? 'chosen-date' : ''} ${day === min ? 'calendar-today' : ''}`}
              aria-pressed={day === value}
              aria-label={`${dayTitle(day)}${closed ? ', cerrado' : ''}`}
              onClick={() => {
                setView(month);
                onChange(day);
              }}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="calendar-key">
        <span>
          <i />
          Fecha seleccionada
        </span>
        <span>Horarios de Buenos Aires</span>
      </div>
    </div>
  );
}
