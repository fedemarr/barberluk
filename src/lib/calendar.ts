/** Fechas de calendario sin depender de la zona horaria del navegador. */
export function shiftDay(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
export function weekStart(day: string) {
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  return shiftDay(day, -((dow + 6) % 7));
}
export function monthDays(month: string) {
  const first = `${month.slice(0, 7)}-01`,
    start = weekStart(first);
  return Array.from({ length: 42 }, (_, i) => shiftDay(start, i));
}
export function dayTitle(
  day: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' },
) {
  return new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' }).format(
    new Date(`${day}T12:00:00Z`),
  );
}
export function clock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function minuteOf(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
