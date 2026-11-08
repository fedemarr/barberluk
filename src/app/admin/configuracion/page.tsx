import { requireUser } from '@/lib/auth';
import { adminMutation } from '@/lib/actions';
import { ActionForm, Field } from '@/components/action-form';
import type { Settings } from '@/lib/types';
export default async function Page() {
  const { supabase } = await requireUser(true);
  const { data, error } = await supabase.from('business_settings').select('*').single();
  if (error || !data)
    return <p className="message error">No pudimos consultar la configuración.</p>;
  const s = data as Settings;
  return (
    <>
      <p className="eyebrow">LAS REGLAS, CLARAS</p>
      <h1>Configuración.</h1>
      <p className="page-intro">
        La duración de 40 minutos es un valor inicial pendiente de confirmación. Los cambios de
        duración conservan los turnos existentes.
      </p>
      <ActionForm action={adminMutation} className="panel">
        <input name="kind" type="hidden" value="settings" />
        <div className="admin-columns">
          <div className="form-stack">
            <h2>El negocio</h2>
            <Field label="Nombre" name="name" defaultValue={s.name} required />
            <Field label="Dirección confirmada" name="address" defaultValue={s.address} />
            <Field label="Contacto" name="contact" defaultValue={s.contact} />
            <Field
              label="Usuario de Instagram (sin @)"
              name="instagram"
              defaultValue={s.instagram}
              pattern="[a-zA-Z0-9_.]*"
            />
            <p className="muted">
              Publicá únicamente datos que hayas verificado. El logo y las fotos se reemplazan en
              public/brand, public/studio y public/cuts.
            </p>
          </div>
          <div className="form-stack">
            <h2>La agenda</h2>
            <div className="two-fields">
              <Field
                label="Duración fija (minutos)"
                name="slot_minutes"
                type="number"
                min={10}
                max={180}
                defaultValue={s.slot_minutes}
                required
              />
              <Field
                label="Intervalo entre turnos (min)"
                name="buffer_minutes"
                type="number"
                min={0}
                max={60}
                defaultValue={s.buffer_minutes}
                required
              />
            </div>
            <div className="two-fields">
              <Field
                label="Anticipación mínima (horas)"
                name="min_notice_hours"
                type="number"
                min={0}
                max={168}
                defaultValue={s.min_notice_hours}
                required
              />
              <Field
                label="Anticipación máxima (días)"
                name="horizon_days"
                type="number"
                min={1}
                max={90}
                defaultValue={s.horizon_days}
                required
              />
            </div>
            <p className="message">
              Zona horaria: Buenos Aires. Cancelaciones y reprogramaciones hasta 24 horas antes. No
              se solicitan señas.
            </p>
            <label className="check-field config-switch">
              <input type="checkbox" name="booking_enabled" defaultChecked={s.booking_enabled} />
              <span>
                Habilitar reservas online. Antes, cargá servicios, horarios y datos verificados del
                estudio.
              </span>
            </label>
          </div>
        </div>
      </ActionForm>
    </>
  );
}
