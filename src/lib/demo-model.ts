import { z } from 'zod';
import { shiftDay, clock, minuteOf } from './calendar';

export const DEMO_SERVICES = [
  {
    id: 'demo-corte',
    name: 'Corte clásico',
    description: 'Corte a tijera o máquina, terminaciones y estilo.',
    price_cents: 1200000,
    active: true,
    sort_order: 0,
  },
  {
    id: 'demo-barba',
    name: 'Perfilado de barba',
    description: 'Forma, detalle y terminación de barba.',
    price_cents: 800000,
    active: true,
    sort_order: 1,
  },
  {
    id: 'demo-combo',
    name: 'Corte + barba',
    description: 'El look completo, con el sello de la casa.',
    price_cents: 1800000,
    active: true,
    sort_order: 2,
  },
];
const appointmentSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  serviceId: z.string(),
  serviceName: z.string(),
  price: z.number().int().nonnegative(),
  day: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(10).max(180),
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']),
});
const stateSchema = z.object({
  version: z.literal(1),
  appointments: z.array(appointmentSchema).max(500),
  payments: z
    .array(
      z.object({
        id: z.string(),
        appointmentId: z.string(),
        amount: z.number().int().positive(),
        method: z.enum(['cash', 'transfer', 'other']),
        day: z.iso.date(),
      }),
    )
    .max(500),
  expenses: z
    .array(
      z.object({
        id: z.string(),
        description: z.string().max(100),
        amount: z.number().int().positive(),
        category: z.string(),
        day: z.iso.date(),
      }),
    )
    .max(500),
  services: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        price_cents: z.number().int().nonnegative(),
        active: z.boolean(),
        sort_order: z.number(),
      }),
    )
    .max(100),
  settings: z.object({
    minutes: z.number().int().min(10).max(180),
    opens: z.string().regex(/^\d{2}:\d{2}$/),
    closes: z.string().regex(/^\d{2}:\d{2}$/),
    breakStart: z.string().regex(/^\d{2}:\d{2}$/),
    breakEnd: z.string().regex(/^\d{2}:\d{2}$/),
    workingDays: z.array(z.number().int().min(0).max(6)),
    closedDates: z.array(z.iso.date()).max(100),
    name: z.string().max(100),
  }),
});
export type DemoState = z.infer<typeof stateSchema>;
export type DemoAppointment = DemoState['appointments'][number];
export type DemoSection =
  'resumen' | 'agenda' | 'disponibilidad' | 'servicios' | 'clientes' | 'finanzas' | 'configuracion';
export const DEMO_SECTIONS: DemoSection[] = [
  'resumen',
  'agenda',
  'disponibilidad',
  'servicios',
  'clientes',
  'finanzas',
  'configuracion',
];
export function nextDemoDay(today: string) {
  let day = shiftDay(today, 1);
  if (new Date(`${day}T12:00:00Z`).getUTCDay() === 0) day = shiftDay(day, 1);
  return day;
}
export function createDemoState(today: string): DemoState {
  const tomorrow = nextDemoDay(today);
  let previous = shiftDay(today, -1);
  if (new Date(`${previous}T12:00:00Z`).getUTCDay() === 0) previous = shiftDay(previous, -1);
  const appointments: DemoAppointment[] = [];
  for (let offset = 0; offset < 4; offset++) {
    const day = shiftDay(tomorrow, offset);
    if (new Date(`${day}T12:00:00Z`).getUTCDay() === 0) continue;
    ['10:00', '11:20', '15:00', '17:00', '18:20'].forEach((time, i) => {
      const service = DEMO_SERVICES[i % 3];
      appointments.push({
        id: `sample-${offset}-${i}`,
        name: `Cliente demo ${String(offset * 5 + i + 1).padStart(2, '0')}`,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price_cents,
        day,
        time,
        duration: 40,
        status: 'confirmed',
      });
    });
  }
  const history = ['10:00', '11:20', '15:00', '16:20'].map((time, i) => ({
    id: `history-${i}`,
    name: `Cliente demo ${String(i + 30)}`,
    serviceId: DEMO_SERVICES[i % 3].id,
    serviceName: DEMO_SERVICES[i % 3].name,
    price: DEMO_SERVICES[i % 3].price_cents,
    day: previous,
    time,
    duration: 40,
    status: 'completed' as const,
  }));
  return {
    version: 1,
    appointments: [...appointments, ...history],
    payments: history.map((a, i) => ({
      id: `payment-${i}`,
      appointmentId: a.id,
      amount: a.price,
      day: previous,
      method: i % 2 ? 'transfer' : 'cash',
    })),
    expenses: [
      {
        id: 'expense-1',
        description: 'Insumos de ejemplo',
        amount: 750000,
        category: 'Insumos',
        day: previous,
      },
      {
        id: 'expense-2',
        description: 'Servicios de ejemplo',
        amount: 400000,
        category: 'Servicios',
        day: previous,
      },
    ],
    services: DEMO_SERVICES.map((s) => ({ ...s })),
    settings: {
      minutes: 40,
      opens: '10:00',
      closes: '20:00',
      breakStart: '14:00',
      breakEnd: '15:00',
      workingDays: [1, 2, 3, 4, 5, 6],
      closedDates: [],
      name: 'Barber Luke',
    },
  };
}
export function parseDemoState(value: unknown) {
  return stateSchema.safeParse(value);
}
export function demoSlots(state: DemoState, day: string, now: string) {
  const { settings } = state;
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  if (!settings.workingDays.includes(weekday) || settings.closedDates.includes(day)) return [];
  const result: { time: string; available: boolean; period: 'Mañana' | 'Tarde' }[] = [];
  const intervals = [
    [minuteOf(settings.opens), minuteOf(settings.breakStart)],
    [minuteOf(settings.breakEnd), minuteOf(settings.closes)],
  ];
  for (const [from, to] of intervals)
    for (let start = from; start + settings.minutes <= to; start += settings.minutes) {
      const time = clock(start),
        end = start + settings.minutes;
      const occupied = state.appointments.some(
        (a) =>
          a.day === day &&
          a.status !== 'cancelled' &&
          start < minuteOf(a.time) + a.duration &&
          end > minuteOf(a.time),
      );
      const past = Date.parse(`${day}T${time}:00-03:00`) <= Date.parse(now);
      result.push({
        time,
        available: !occupied && !past,
        period: start < 14 * 60 ? 'Mañana' : 'Tarde',
      });
    }
  return result;
}
export function addDemoAppointment(
  state: DemoState,
  input: { day: string; time: string; serviceId: string; name: string },
  now: string,
): DemoState {
  if (!demoSlots(state, input.day, now).some((s) => s.time === input.time && s.available))
    throw new Error('Ese horario no está disponible. Elegí otro.');
  const service = state.services.find((s) => s.id === input.serviceId && s.active);
  if (!service) throw new Error('Elegí un servicio activo.');
  if (input.name.trim().length < 2 || input.name.length > 100)
    throw new Error('Ingresá un nombre de 2 a 100 caracteres.');
  return {
    ...state,
    appointments: [
      ...state.appointments,
      {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        serviceId: service.id,
        serviceName: service.name,
        price: service.price_cents,
        day: input.day,
        time: input.time,
        duration: state.settings.minutes,
        status: 'confirmed',
      },
    ],
  };
}
