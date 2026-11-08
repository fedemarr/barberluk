import { requireUser } from '@/lib/auth';
import { AdminNav } from '@/components/admin-nav';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administración', robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireUser(true);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">GESTIÓN DEL ESTUDIO</p>
        <AdminNav />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
