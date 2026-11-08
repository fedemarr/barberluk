import { dispatchEmails } from '@/lib/notifications';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  )
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  try {
    return Response.json(await dispatchEmails());
  } catch {
    return Response.json({ error: 'No se pudo procesar la cola' }, { status: 503 });
  }
}
