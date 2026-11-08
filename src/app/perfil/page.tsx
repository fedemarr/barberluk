import { requireUser } from '@/lib/auth';
import { saveProfile } from '@/lib/actions';
import { ActionForm, Field } from '@/components/action-form';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { profile, user } = await requireUser();
  return (
    <div className="page-shell narrow">
      <p className="eyebrow">TU ESPACIO</p>
      <h1 className="page-title">
        Mi <em>perfil.</em>
      </h1>
      <p className="page-intro">Tus datos para acompañar tu próxima reserva.</p>
      <ActionForm action={saveProfile}>
        <Field
          label="Nombre"
          name="name"
          minLength={2}
          maxLength={100}
          defaultValue={profile?.display_name}
          required
        />
        <Field
          label="Teléfono (opcional)"
          name="phone"
          maxLength={40}
          defaultValue={profile?.phone}
        />
        <p className="muted">Email de Google: {user.email}</p>
      </ActionForm>
      <form action="/auth/logout" method="post">
        <button className="button secondary">Cerrar sesión</button>
      </form>
    </div>
  );
}
