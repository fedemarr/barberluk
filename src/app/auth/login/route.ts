import { db, configured } from '@/lib/supabase';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  if (!configured()) return NextResponse.redirect(new URL('/ingresar?error=configuracion', origin));
  const s = await db();
  const { data, error } = await s.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) return NextResponse.redirect(new URL('/ingresar?error=google', origin));
  return NextResponse.redirect(data.url);
}
