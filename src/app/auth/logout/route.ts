import { db } from '@/lib/supabase';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  if (request.headers.get('origin') !== origin)
    return new Response('No autorizado', { status: 403 });
  const s = await db();
  await s.auth.signOut();
  return NextResponse.redirect(new URL('/', origin), 303);
}
