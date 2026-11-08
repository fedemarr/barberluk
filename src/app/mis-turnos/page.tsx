import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { changeAppointment } from '@/lib/actions';
import { canCancel, dateTime, money } from '@/lib/format';
import { statusLabel, type Appointment } from '@/lib/types';
import { ActionForm } from '@/components/action-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis turnos', robots: { index: false, follow: false } };
export default async function Page() {
  const { supabase, user, profile } = await requireUser();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id,user_id,service_id,service_name,price_cents,contact_name,contact_email,contact_phone,starts_at,ends_at,status,variable_cost_cents',
    )
    .eq('user_id', user.id)
    .order('starts_at', { ascending: false })
    .limit(200);
  const appointments = (data ?? []) as Appointment[];
  return (
    <div className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TU ESPACIO</p>
          <h1 className="page-title">
            Hola, <em>{profile?.display_name || 'bienvenido'}.</em>
          </h1>
          <p className="page-intro">Tus próximos encuentros y tu historial en el estudio.</p>
        </div>
        <Link href="/reservar" className="button">
          Nuevo turno ↗
        </Link>
      </div>
      <nav className="tabs">
        <Link href="/mis-turnos">Mis turnos</Link>
        <Link href="/perfil">Mi perfil</Link>
        {profile?.role === 'admin' && <Link href="/admin">Administración</Link>}
      </nav>
      {error ? (
        <p className="message error">No pudimos cargar tus turnos. Volvé a intentar.</p>
      ) : !appointments.length ? (
        <div className="empty panel">
          <h2>Tu historia empieza con un corte.</h2>
          <p>Todavía no tenés turnos. Reservá tu primer momento.</p>
          <Link href="/reservar" className="text-link">
            Elegir un turno ↗
          </Link>
        </div>
      ) : (
        <div className="appointment-list">
          {appointments.map((a) => (
            <article className="appointment-card panel" key={a.id}>
              <div>
                <span className={`badge ${a.status}`}>{statusLabel[a.status]}</span>
                <h2>{a.service_name}</h2>
                <p>{dateTime(a.starts_at)} · Buenos Aires</p>
                <p>{money(a.price_cents)}</p>
              </div>
              {a.status === 'confirmed' &&
                (canCancel(a.starts_at) ? (
                  <div className="appointment-actions">
                    <Link
                      className="button secondary small"
                      href={`/mis-turnos/${a.id}/reprogramar`}
                    >
                      Reprogramar
                    </Link>
                    <details>
                      <summary className="text-link">Cancelar turno</summary>
                      <p>¿Querés cancelar este turno? Se liberará el horario.</p>
                      <ActionForm action={changeAppointment} submit="Sí, cancelar">
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="action" value="cancel" />
                      </ActionForm>
                    </details>
                  </div>
                ) : (
                  <p className="muted">
                    La cancelación online cierra 24 h antes. Contactá al estudio.
                  </p>
                ))}
            </article>
          ))}
        </div>
      )}
      <p className="muted">Se muestran hasta 200 turnos recientes.</p>
    </div>
  );
}
