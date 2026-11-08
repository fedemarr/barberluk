'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Scissors,
  Users,
  Wallet,
  Settings,
} from 'lucide-react';
const links = [
  ['', 'Resumen', LayoutDashboard],
  ['agenda', 'Agenda', CalendarDays],
  ['disponibilidad', 'Disponibilidad', Clock3],
  ['servicios', 'Servicios', Scissors],
  ['clientes', 'Clientes', Users],
  ['finanzas', 'Finanzas', Wallet],
  ['configuracion', 'Configuración', Settings],
] as const;
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administración">
      {links.map(([url, label, Icon]) => (
        <Link
          key={url}
          href={`/admin${url ? `/${url}` : ''}`}
          aria-current={path === `/admin${url ? `/${url}` : ''}` ? 'page' : undefined}
        >
          <Icon size={15} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
