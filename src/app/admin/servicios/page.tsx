import { requireUser } from '@/lib/auth';
import { adminMutation } from '@/lib/actions';
import { ActionForm, Amount, Field } from '@/components/action-form';
import type { Service } from '@/lib/types';
function ServiceForm({ service }: { service?: Service }) {
  return (
    <ActionForm action={adminMutation} submit={service ? 'Guardar servicio' : 'Crear servicio'}>
      <input name="kind" type="hidden" value="service" />
      {service && <input name="id" type="hidden" value={service.id} />}
      <Field
        label="Nombre"
        name="name"
        required
        minLength={2}
        maxLength={100}
        defaultValue={service?.name}
      />
      <label className="field">
        Descripción
        <textarea name="description" maxLength={1000} defaultValue={service?.description} />
      </label>
      <Amount name="price_cents" label="Precio (ARS)" defaultCents={service?.price_cents ?? 0} />
      <Field
        label="Orden de aparición"
        type="number"
        min={0}
        max={1000}
        name="sort_order"
        defaultValue={service?.sort_order ?? 0}
      />
      <label className="check-field">
        <input name="active" type="checkbox" defaultChecked={service?.active ?? true} />
        Servicio activo
      </label>
    </ActionForm>
  );
}
export default async function Page() {
  const { supabase } = await requireUser(true);
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order')
    .limit(200);
  return (
    <>
      <p className="eyebrow">CARTA DEL ESTUDIO</p>
      <h1>Servicios.</h1>
      <p className="page-intro">
        Los cambios de precio se aplican a nuevas reservas. Los turnos existentes conservan el
        importe acordado.
      </p>
      {error && <p className="message error">No pudimos consultar los servicios.</p>}
      <details className="panel details-panel">
        <summary>+ Agregar un servicio</summary>
        <ServiceForm />
      </details>
      <div className="admin-grid" style={{ marginTop: 25 }}>
        {((data as Service[]) ?? []).map((s) => (
          <section key={s.id} className="panel">
            <ServiceForm service={s} />
          </section>
        ))}
      </div>
    </>
  );
}
