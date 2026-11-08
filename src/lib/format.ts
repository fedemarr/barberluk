export const ZONE = 'America/Argentina/Buenos_Aires';
export const money = (cents: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date(value));
export const localDay = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export const canCancel = (start: string, now = Date.now()) =>
  new Date(start).getTime() - now >= 86400000;
export function financials(
  payments: { amount_cents: number }[],
  expenses: { amount_cents: number }[],
  completed: number,
  variableCost: number,
  fixedCost: number,
) {
  const income = payments.reduce((n, p) => n + p.amount_cents, 0),
    spent = expenses.reduce((n, p) => n + p.amount_cents, 0);
  return {
    income,
    spent,
    cash: income - spent,
    estimated: income - completed * variableCost - fixedCost,
    ticket: payments.length ? Math.round(income / payments.length) : 0,
  };
}
