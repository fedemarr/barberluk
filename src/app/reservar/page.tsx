import { Booking } from '@/components/booking';
import { publicData } from '@/lib/data';
import { session } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reservar turno' };
export default async function Page() {
  const [{ services, settings }, s] = await Promise.all([publicData(), session()]);
  return (
    <div className="page-shell">
      <p className="eyebrow">UN MOMENTO PARA VOS</p>
      <h1 className="page-title">
        Tu próximo <em>estilo.</em>
      </h1>
      <p className="page-intro">
        Elegí tu servicio. Encontrá tu horario. Del resto nos ocupamos nosotros.
      </p>
      {settings?.address && <p className="message">Te esperamos en {settings.address}</p>}
      <Booking
        services={services}
        enabled={Boolean(settings?.booking_enabled)}
        loggedIn={Boolean(s)}
        minutes={settings?.slot_minutes ?? 40}
        horizon={settings?.horizon_days}
      />
    </div>
  );
}
