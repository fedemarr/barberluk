import { describe, it, expect } from 'vitest';
import { canCancel, financials, localDay, money } from './format';
describe('Reglas de negocio', () => {
  it('permite cancelar exactamente 24 h antes y rechaza un milisegundo después', () => {
    const now = Date.parse('2026-11-05T12:00:00Z');
    expect(canCancel('2026-11-06T12:00:00Z', now)).toBe(true);
    expect(canCancel('2026-11-06T11:59:59.999Z', now)).toBe(false);
  });
  it('muestra el día de Buenos Aires al cruzar medianoche UTC', () => {
    expect(localDay(new Date('2026-11-06T01:00:00Z'))).toBe('2026-11-05');
  });
  it('no confunde pesos con centavos', () => {
    expect(money(100050)).toContain('1.000,5');
  });
  it('distingue caja y estimación sin duplicar gastos', () => {
    expect(
      financials(
        [{ amount_cents: 1000000 }, { amount_cents: 500000 }],
        [{ amount_cents: 200000 }],
        2,
        100000,
        300000,
      ),
    ).toEqual({
      income: 1500000,
      spent: 200000,
      cash: 1300000,
      estimated: 1000000,
      ticket: 750000,
    });
  });
  it('no divide por cero cuando no hay cobros', () => {
    expect(financials([], [], 0, 0, 0).ticket).toBe(0);
  });
});
