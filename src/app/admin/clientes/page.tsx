import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Field } from '@/components/action-form';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const p = await searchParams;
  const { supabase } = await requireUser(true);
  const q = (p.q ?? '').slice(0, 100).replace(/[%_\\]/g, '');
  const page = Math.max(1, Math.min(1000, Number(p.page) || 1));
  let query = supabase
    .from('profiles')
    .select('id,display_name,email,phone,created_at', { count: 'exact' })
    .order('display_name');
  if (q) query = query.ilike('display_name', `%${q}%`);
  const { data, error, count } = await query.range((page - 1) * 50, page * 50 - 1);
  return (
    <>
      <p className="eyebrow">LAS PERSONAS DEL ESTUDIO</p>
      <h1>Clientes.</h1>
      <p className="page-intro">
        Perfiles con acceso Google. Los contactos de turnos manuales se consultan en Agenda.
      </p>
      <form className="filter-bar">
        <Field name="q" label="Buscar por nombre" defaultValue={q} maxLength={100} />
        <button className="button">Buscar</button>
      </form>
      {error ? (
        <p className="message error">No pudimos cargar los clientes.</p>
      ) : (
        <>
          <p className="muted">
            {count ?? 0} clientes · página {page}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((c) => (
                  <tr key={c.id}>
                    <td>{c.display_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <Link href={`/admin/clientes/${c.id}`}>Ver historial ↗</Link>
                    </td>
                  </tr>
                ))}
                {!data?.length && (
                  <tr>
                    <td colSpan={4}>No hay resultados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="filter-bar">
            {page > 1 && (
              <Link
                className="button secondary small"
                href={`/admin/clientes?q=${encodeURIComponent(q)}&page=${page - 1}`}
              >
                Anterior
              </Link>
            )}
            {(count ?? 0) > page * 50 && (
              <Link
                className="button secondary small"
                href={`/admin/clientes?q=${encodeURIComponent(q)}&page=${page + 1}`}
              >
                Siguiente
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
