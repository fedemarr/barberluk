export const metadata = { title: 'Privacidad' };
export default function Page() {
  return (
    <article className="page-shell narrow prose">
      <p className="eyebrow">TEXTO INICIAL · PENDIENTE DE VALIDACIÓN LEGAL</p>
      <h1 className="page-title">
        Tu <em>privacidad.</em>
      </h1>
      <p>
        Barber Luke utiliza tu nombre, correo de Google y teléfono opcional para gestionar reservas
        y enviarte notificaciones relacionadas con tus turnos.
      </p>
      <h2>Datos y acceso</h2>
      <p>
        Los clientes acceden únicamente a su perfil y reservas. El administrador accede a la
        información necesaria para gestionar el estudio. Supabase procesa autenticación y datos;
        Resend procesa los correos transaccionales.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Podés solicitar acceso, rectificación o eliminación de tus datos contactando al estudio por
        los medios publicados en esta web. Los registros contables podrán conservarse cuando
        corresponda.
      </p>
      <h2>Cookies</h2>
      <p>
        Utilizamos cookies necesarias para mantener tu sesión. La selección de turno puede guardarse
        temporalmente en tu navegador para continuar después de ingresar con Google. No se incluyen
        herramientas publicitarias.
      </p>
      <h2>Antes de habilitar el servicio</h2>
      <p>
        El titular deberá completar sus datos de responsable, contacto de privacidad, plazos de
        conservación y validar este texto según la normativa aplicable.
      </p>
    </article>
  );
}
