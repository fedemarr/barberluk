import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const privatePath = ['/admin', '/mis-turnos', '/perfil'].some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/'),
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return privatePath ? NextResponse.redirect(new URL('/ingresar', request.url)) : response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (privatePath && !user) {
    const redirect = NextResponse.redirect(new URL('/ingresar', request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: [
    '/reservar/:path*',
    '/mis-turnos/:path*',
    '/perfil/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/ingresar',
  ],
};
