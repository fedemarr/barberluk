import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="page-shell empty">
      <p className="eyebrow">404</p>
      <h1 className="page-title">
        Por acá <em>no era.</em>
      </h1>
      <p>La página que buscás no está disponible.</p>
      <Link href="/" className="button">
        Volver al inicio
      </Link>
    </div>
  );
}
