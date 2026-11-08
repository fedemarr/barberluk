import { z } from 'zod';
import { configured, db } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = z
    .object({ day: z.iso.date(), ignore: z.string().uuid().optional() })
    .safeParse({
      day: url.searchParams.get('day'),
      ignore: url.searchParams.get('ignore') ?? undefined,
    });
  if (!p.success) return Response.json({ error: 'Fecha inválida' }, { status: 400 });
  if (!configured())
    return Response.json({ error: 'La agenda todavía no está habilitada.' }, { status: 503 });
  const s = await db();
  const { data, error } = await s.rpc('available_slots', {
    p_day: p.data.day,
    p_ignore: p.data.ignore ?? null,
  });
  if (error) return Response.json({ error: 'No pudimos consultar la agenda.' }, { status: 503 });
  return Response.json({ slots: data }, { headers: { 'Cache-Control': 'no-store' } });
}
