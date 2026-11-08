import { db } from '@/lib/supabase';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get('code'),
    origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  if (code) {
    const s = await db();
    const { error } = await s.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/reservar', origin));
  }
  return NextResponse.redirect(new URL('/ingresar?error=google', origin));
}
