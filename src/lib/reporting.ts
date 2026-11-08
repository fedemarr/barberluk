import 'server-only';
import { z } from 'zod';
import { localDay } from './format';
import type { SupabaseClient } from '@supabase/supabase-js';
export function reportRange(input: { from?: string; to?: string }) {
  const today = localDay();
  const range = z
    .object({ from: z.iso.date(), to: z.iso.date() })
    .parse({ from: input.from || today.slice(0, 7) + '-01', to: input.to || today });
  const diff = Date.parse(range.to) - Date.parse(range.from);
  if (diff < 0 || diff > 366 * 86400000) throw new Error('Elegí un período de hasta 366 días.');
  return range;
}
export async function reportRows(
  db: SupabaseClient,
  table: 'payments' | 'expenses' | 'appointments',
  from: string,
  to: string,
) {
  const col =
    table === 'payments' ? 'paid_at' : table === 'expenses' ? 'expense_date' : 'starts_at';
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const { data, error } = await db
      .from(table)
      .select('*')
      .gte(col, table === 'expenses' ? from : `${from}T00:00:00-03:00`)
      .lte(col, table === 'expenses' ? to : `${to}T23:59:59.999-03:00`)
      .order(col)
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error('No se pudo consultar el reporte');
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
  throw new Error('El período supera 20.000 registros. Elegí un rango más corto.');
}
export function csv(rows: unknown[][]) {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((v) => {
            let s = String(v ?? '');
            if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
            return '"' + s.replaceAll('"', '""') + '"';
          })
          .join(','),
      )
      .join('\r\n')
  );
}
