import Link from 'next/link';
import { configured } from '@/lib/supabase';
export const metadata = { title: 'Ingresar', robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams;
  return (
    <div className="auth-shell panel">
      <p className="eyebrow">BIENVENIDO A BARBER LUKE</p>
      <h1>
        Tu estilo.
        <br />
        <em>Tu espacio.</em>
      </h1>
      <p>Ingresá para reservar, ver tus próximos turnos y gestionar tu perfil.</p>
      {p.error && (
        <p className="message error">
          {p.error === 'google'
            ? 'No pudimos completar el ingreso. Volvé a intentarlo.'
            : 'La conexión de la agenda está pendiente de configuración.'}
        </p>
      )}
      {configured() ? (
        <Link className="button full" href="/auth/login">
          Continuar con Google <span>↗</span>
        </Link>
      ) : (
        <p className="message">
          Estamos preparando el acceso con Google. La agenda online todavía no está habilitada.
          <Link className="text-link" href="/demo/admin">
            Recorrer el panel de demostración ↗
          </Link>
        </p>
      )}
      <small>
        Al continuar, aceptás los <Link href="/terminos">términos</Link> y la{' '}
        <Link href="/privacidad">política de privacidad</Link>.
      </small>
      <Link href="/" className="text-link">
        Volver al estudio
      </Link>
    </div>
  );
}
