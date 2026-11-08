'use client';
import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/types';
type Props = {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submit?: string;
  className?: string;
};
export function ActionForm({
  action,
  children,
  submit = 'Guardar cambios',
  className = '',
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={`form-stack ${className}`} aria-busy={pending}>
      {children}
      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="message error">
            {state.error}
          </p>
        )}
        {state.success && <p className="message success">{state.success}</p>}
      </div>
      <button className="button" disabled={pending}>
        {pending ? 'Guardando…' : submit}
      </button>
    </form>
  );
}
export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function Amount({
  name = 'amount_cents',
  label = 'Importe (ARS)',
  defaultCents = 0,
}: {
  name?: string;
  label?: string;
  defaultCents?: number;
}) {
  const [value, setValue] = useState((defaultCents / 100).toFixed(2));
  const parts = value.replace(',', '.').split('.');
  const valid = /^\d{1,7}([.,]\d{0,2})?$/.test(value);
  const cents = valid ? Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0')) : '';
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        pattern="[0-9]+([.,][0-9]{1,2})?"
        required
      />
      <input type="hidden" name={name} value={cents} />
      <small>Pesos argentinos. Hasta dos decimales.</small>
    </label>
  );
}
export function DateTimeField({ name, label }: { name: string; label: string }) {
  const [value, setValue] = useState('');
  return (
    <label className="field">
      <span>{label} · Buenos Aires</span>
      <input
        type="datetime-local"
        value={value}
        required
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        type="hidden"
        name={name}
        value={value ? new Date(`${value}:00-03:00`).toISOString() : ''}
      />
    </label>
  );
}
