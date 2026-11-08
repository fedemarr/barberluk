import { describe, it, expect } from 'vitest';
import {
  createDemoState,
  demoSlots,
  addDemoAppointment,
  nextDemoDay,
  parseDemoState,
} from './demo-model';
import { monthDays, shiftDay, shiftMonth, weekStart } from './calendar';

const today = '2026-11-08',
  now = '2026-11-08T15:00:00Z';
describe('Calendario de reserva', () => {
  it('empieza las semanas en lunes incluso al cruzar de año', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
    expect(monthDays('2027-01')[0]).toBe('2026-12-28');
    expect(monthDays('2027-01')).toHaveLength(42);
  });
  it('incluye el día extra solo en años bisiestos', () => {
    expect(monthDays('2028-02')).toContain('2028-02-29');
    expect(monthDays('2027-02')).not.toContain('2027-02-29');
  });
  it('navega entre meses y días sin depender de la zona del navegador', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(nextDemoDay(today)).toBe('2026-11-09');
  });
});
describe('Agenda de demostración aislada', () => {
  it('al reservar se ocupa el horario y un segundo intento se rechaza', () => {
    const state = createDemoState(today),
      input = {
        day: '2026-11-09',
        time: '10:40',
        serviceId: 'demo-corte',
        name: 'Visita de prueba',
      };
    expect(demoSlots(state, input.day, now).find((s) => s.time === input.time)?.available).toBe(
      true,
    );
    const next = addDemoAppointment(state, input, now);
    expect(next.appointments).toHaveLength(state.appointments.length + 1);
    expect(demoSlots(next, input.day, now).find((s) => s.time === input.time)?.available).toBe(
      false,
    );
    expect(() => addDemoAppointment(next, input, now)).toThrow('no está disponible');
  });
  it('cancelar el turno de muestra libera su intervalo', () => {
    const state = createDemoState(today);
    expect(demoSlots(state, '2026-11-09', now).find((s) => s.time === '10:00')?.available).toBe(
      false,
    );
    const next = {
      ...state,
      appointments: state.appointments.map((a) =>
        a.day === '2026-11-09' && a.time === '10:00' ? { ...a, status: 'cancelled' as const } : a,
      ),
    };
    expect(demoSlots(next, '2026-11-09', now).find((s) => s.time === '10:00')?.available).toBe(
      true,
    );
  });
  it('respeta descansos, domingos, cierres y horarios pasados', () => {
    const state = createDemoState(today);
    expect(
      demoSlots(state, '2026-11-09', now).some((s) => s.time >= '14:00' && s.time < '15:00'),
    ).toBe(false);
    expect(demoSlots(state, today, now)).toEqual([]);
    expect(
      demoSlots(
        { ...state, settings: { ...state.settings, closedDates: ['2026-11-09'] } },
        '2026-11-09',
        now,
      ),
    ).toEqual([]);
    expect(
      demoSlots(state, '2026-11-09', '2026-11-09T16:00:00Z')
        .filter((s) => s.time < '13:00')
        .every((s) => !s.available),
    ).toBe(true);
  });
  it('un cambio de duración no permite invadir un turno existente', () => {
    const state = createDemoState(today);
    const next = { ...state, settings: { ...state.settings, minutes: 30 } };
    expect(demoSlots(next, '2026-11-09', now).find((s) => s.time === '10:30')?.available).toBe(
      false,
    );
  });
  it('guarda el precio y duración históricos de la reserva de muestra', () => {
    const state = createDemoState(today),
      next = addDemoAppointment(
        state,
        { day: '2026-11-09', time: '10:40', serviceId: 'demo-corte', name: 'Visita de prueba' },
        now,
      );
    const changed = {
      ...next,
      services: next.services.map((s) => ({ ...s, price_cents: 999999 })),
      settings: { ...next.settings, minutes: 30 },
    };
    expect(changed.appointments.at(-1)?.price).toBe(1200000);
    expect(changed.appointments.at(-1)?.duration).toBe(40);
  });
  it('rechaza datos corruptos de almacenamiento sin aceptar duraciones de cero', () => {
    const state = createDemoState(today);
    expect(parseDemoState(state).success).toBe(true);
    expect(parseDemoState({ ...state, settings: { ...state.settings, minutes: 0 } }).success).toBe(
      false,
    );
    expect(parseDemoState({ role: 'admin' }).success).toBe(false);
  });
});
