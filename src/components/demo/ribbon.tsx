import Link from 'next/link';
import { FlaskConical, ArrowUpRight } from 'lucide-react';
export function DemoRibbon({ admin = false }: { admin?: boolean }) {
  return (
    <div className="demo-ribbon">
      <FlaskConical size={20} />
      <div>
        <strong>VISTA DE DEMOSTRACIÓN</strong>
        <p>
          Datos y precios de ejemplo. Los cambios quedan solo en esta pestaña; no se crean turnos
          reales ni se envían correos.
        </p>
      </div>
      <Link href={admin ? '/demo/reservar' : '/demo/admin'}>
        {admin ? 'Ver reservas' : 'Ver panel admin'}
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
