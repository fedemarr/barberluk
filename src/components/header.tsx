import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Barber Luke, inicio">
      <Image
        className="brand-logo"
        src="/brand/barber-luke.png"
        alt=""
        width={64}
        height={64}
        sizes="64px"
      />
      <span>
        BARBER LUKE<small>BARBERÍA & ESTILO</small>
      </span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegación principal">
          <Link href="/#experiencia">El estudio</Link>
          <Link href="/#servicios">Servicios</Link>
          <Link href="/#galeria">La firma</Link>
          <Link href="/mis-turnos">Mis turnos</Link>
        </nav>
        <Link href="/reservar" className="button small">
          Reservar <ArrowUpRight size={16} />
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Abrir navegación">Menú</summary>
          <nav>
            <Link href="/#experiencia">El estudio</Link>
            <Link href="/#servicios">Servicios</Link>
            <Link href="/#galeria">La firma</Link>
            <Link href="/mis-turnos">Mis turnos</Link>
            <Link href="/perfil">Mi perfil</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Brand />
        <p>Más que un corte. Una forma de ser.</p>
      </div>
      <div className="footer-links">
        <Link href="/reservar">Reservar turno</Link>
        <Link href="/mis-turnos">Mis turnos</Link>
        <Link href="/admin">Administración</Link>
      </div>
      <div className="footer-links">
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/terminos">Términos</Link>
        <span>© {new Date().getFullYear()} Barber Luke</span>
      </div>
    </footer>
  );
}
