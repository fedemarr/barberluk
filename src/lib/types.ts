export type Service = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  active: boolean;
  sort_order: number;
};
export type Appointment = {
  id: string;
  user_id: string | null;
  service_id: string;
  service_name: string;
  price_cents: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  variable_cost_cents: number;
};
export type Settings = {
  name: string;
  address: string;
  contact: string;
  instagram: string;
  booking_enabled: boolean;
  slot_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  horizon_days: number;
};
export type ActionState = { error?: string; success?: string; id?: string };
export const statusLabel = {
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
};
