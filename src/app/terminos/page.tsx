export const metadata = { title: 'Términos' };
export default function Page() {
  return (
    <article className="page-shell narrow prose">
      <p className="eyebrow">TEXTO INICIAL · PENDIENTE DE VALIDACIÓN LEGAL</p>
      <h1 className="page-title">
        Cada detalle, <em>claro.</em>
      </h1>
      <h2>Reservas</h2>
      <p>
        Un turno queda confirmado cuando el sistema muestra la confirmación. Consultá su estado en
        Mis turnos. La disponibilidad puede cambiar hasta que confirmes. Todos los horarios se
        muestran en la zona de Buenos Aires.
      </p>
      <h2>Cancelación y cambios</h2>
      <p>
        Podés cancelar o reprogramar hasta 24 horas antes del inicio. Después de ese plazo, contactá
        al estudio. Un cambio queda confirmado únicamente si se guarda correctamente el nuevo
        horario.
      </p>
      <h2>Precios y pagos</h2>
      <p>
        El importe acordado al reservar se conserva aunque cambien los precios publicados. No se
        solicita seña ni se realizan pagos online. El cobro se registra en el estudio.
      </p>
      <h2>Disponibilidad del servicio</h2>
      <p>
        El estudio podrá contactar al cliente si necesita resolver una incidencia. Este texto deberá
        ser revisado y completado por el titular antes de habilitar reservas públicas.
      </p>
    </article>
  );
}
