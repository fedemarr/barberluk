import { session } from '@/lib/auth';
import { reportRange, reportRows, csv } from '@/lib/reporting';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const s = await session();
  if (!s || s.profile?.role !== 'admin')
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  if (type !== 'appointments' && type !== 'payments' && type !== 'expenses')
    return Response.json({ error: 'Reporte inválido' }, { status: 400 });
  try {
    const { from, to } = reportRange({
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    });
    const rows = await reportRows(s.supabase, type, from, to);
    const columns =
      type === 'appointments'
        ? [
            'id',
            'contact_name',
            'contact_email',
            'service_name',
            'starts_at',
            'ends_at',
            'status',
            'price_cents',
          ]
        : type === 'payments'
          ? ['id', 'appointment_id', 'paid_at', 'method', 'amount_cents']
          : ['id', 'expense_date', 'category', 'description', 'amount_cents'];
    return new Response(csv([columns, ...rows.map((r) => columns.map((c) => r[c]))]), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="barber-luke-${type}-${from}-${to}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return Response.json(
      {
        error:
          'No se pudo exportar. Elegí un rango válido de hasta 366 días y menos de 20.000 registros.',
      },
      { status: 400 },
    );
  }
}
