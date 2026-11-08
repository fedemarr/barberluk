import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { publicData } from '@/lib/data';
import { canCancel } from '@/lib/format';
import { Booking } from '@/components/booking';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from('appointments')
    .select('id,starts_at,status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!data) notFound();
  const { services, settings } = await publicData();
  return (
    <div className="page-shell">
      <p className="eyebrow">CAMBIÁ TU MOMENTO</p>
      <h1 className="page-title">
        Un nuevo <em>horario.</em>
      </h1>
      {data.status === 'confirmed' && canCancel(data.starts_at) ? (
        <Booking
          services={services}
          enabled={Boolean(settings?.booking_enabled)}
          loggedIn
          minutes={settings?.slot_minutes ?? 40}
          horizon={settings?.horizon_days}
          rescheduleId={id}
        />
      ) : (
        <p className="message">Este turno ya no admite cambios online. Contactá al estudio.</p>
      )}
    </div>
  );
}
