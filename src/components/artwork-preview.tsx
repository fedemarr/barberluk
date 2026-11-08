'use client';
import { useId, useRef } from 'react';
export function ArtworkPreview({ title, children }: { title: string; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null),
    id = useId();
  return (
    <div className="artwork-preview">
      {children}
      <button
        className="artwork-expand"
        type="button"
        aria-label={`Ampliar ${title}`}
        onClick={() => dialog.current?.showModal()}
      >
        Ampliar ↗
      </button>
      <dialog
        className="artwork-dialog"
        ref={dialog}
        aria-labelledby={id}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-toolbar">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="button secondary small"
            onClick={() => dialog.current?.close()}
          >
            Cerrar ×
          </button>
        </div>
        {children}
        <p>
          Composición editorial de la identidad de Barber Luke. Próximamente incorporaremos
          fotografías reales del estudio y sus trabajos.
        </p>
      </dialog>
    </div>
  );
}
