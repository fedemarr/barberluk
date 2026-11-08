'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell empty">
      <h1 className="page-title">
        Necesitamos un <em>momento.</em>
      </h1>
      <p>No pudimos cargar esta página. Tus datos no se modificaron por este error.</p>
      <button className="button" onClick={reset}>
        Volver a intentar
      </button>
    </div>
  );
}
