import 'server-only';
import { redirect } from 'next/navigation';
import { configured, db } from './supabase';
export async function session() {
  if (!configured()) return null;
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,display_name,email,phone,role')
    .eq('id', user.id)
    .single();
  return { user, profile, supabase };
}
export async function requireUser(admin = false) {
  const s = await session();
  if (!s) redirect('/ingresar');
  if (admin && s.profile?.role !== 'admin') redirect('/mis-turnos?error=sin-permiso');
  return s;
}
