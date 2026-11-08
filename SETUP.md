# Configuración externa de Barber Luke

## 1. Supabase

La demostración está disponible sin conectar servicios: `/reservar` (cuando falta Supabase), `/demo/reservar` y `/demo/admin`. Trabaja exclusivamente con datos de ejemplo en la pestaña. Al configurar Supabase, `/reservar` pasa al flujo real; los ejemplos no se importan a la base ni se convierten en turnos reales. No se debe desactivar la protección de `/admin` para enseñar el panel: usar su ruta `/demo/admin`.

1. Crear o elegir el proyecto destinado exclusivamente a Barber Luke. No ejecutar esta migración sobre una base ajena ni sobre un esquema con tablas homónimas sin revisar compatibilidad.
2. En SQL Editor ejecutar **completo** `supabase/migrations/202611050001_core.sql`. Alternativa: vincular la CLI Supabase y aplicar migraciones con `supabase db push`. La migración está envuelta en una transacción y no instala datos ficticios.
3. En Project Settings / API obtener la URL del proyecto y la clave pública publishable. En versiones anteriores, la clave `anon` funciona en la misma variable pública.
4. Completar `.env.local` para desarrollo, y las variables correspondientes de Vercel para Production y Preview:

| Variable                               | Destino                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública publishable o anon                                                   |
| `NEXT_PUBLIC_SITE_URL`                 | Origen completo sin barra final: dominio definitivo o `http://localhost:3000`      |
| `SUPABASE_SERVICE_ROLE_KEY`            | Clave privada legacy service_role, **solo servidor**, para outbox                  |
| `RESEND_API_KEY`                       | Clave privada de Resend                                                            |
| `EMAIL_FROM`                           | Remitente de dominio verificado, por ejemplo `Barber Luke <turnos@dominio-propio>` |
| `CRON_SECRET`                          | Valor aleatorio largo, privado                                                     |

Obtener claves desde el panel del proveedor; no inventar valores y no pegarlas en el repositorio. Reiniciar desarrollo y redesplegar Vercel después de cambiar variables.

## 2. Google OAuth

1. En Google Cloud Console, configurar pantalla de consentimiento y crear un cliente OAuth de tipo Web. Mientras esté en modo prueba, agregar los usuarios de prueba autorizados.
2. En URIs de redirección autorizadas de Google cargar el callback que muestra Supabase: `https://PROJECT_REF.supabase.co/auth/v1/callback`.
3. En Supabase / Authentication / Providers / Google habilitar proveedor y cargar Client ID y Client Secret de Google. El secreto de Google no se usa en el navegador ni se carga como variable pública de Next.js.
4. En Supabase / Authentication / URL Configuration definir Site URL y allowlist de redirecciones: `http://localhost:3000/auth/callback` y `https://DOMINIO-VERCEL/auth/callback`. Agregar dominios de preview explícitamente si se necesita probar allí; cada entorno debe tener `NEXT_PUBLIC_SITE_URL` coherente.
5. Probar ingreso en `/ingresar`, reservar y salir desde `/perfil`. La selección se conserva en sessionStorage durante el redireccionamiento OAuth. No existe contraseña propia ni acceso administrativo de demostración.

## 3. Dar acceso al administrador

Ingresar una vez con la cuenta Google del propietario. En Supabase Auth copiar su UUID real. Desde el SQL Editor de un operador autorizado, ejecutar:

```sql
update public.profiles set role = 'admin'
where id = 'UUID-VERIFICADO-DEL-PROPIETARIO';
```

No otorgar el rol por un email enviado desde el frontend. La aplicación nunca permite editar roles. Comprobar que una segunda cuenta común no entra a `/admin` ni puede leer clientes, pagos o gastos.

## 4. Habilitar la agenda

1. En `/admin/configuracion` confirmar duración, margen entre turnos, anticipación, dirección, contacto y usuario Instagram. No se publican dirección ni Instagram tomados de referencias sin confirmarlos.
2. En `/admin/servicios` cargar servicios y precios reales.
3. En `/admin/disponibilidad` cargar días e intervalos semanales; usar dos intervalos si hay descanso al mediodía. Configurar feriados, excepciones y vacaciones.
4. En Configuración habilitar reservas. El valor inicial es deshabilitado; no hay seed de servicios u horarios.
5. Reservar desde dos cuentas, comprobar que solo cada propietario ve sus turnos. El precio y la duración deben permanecer históricos al cambiarlos para nuevas reservas.

## 5. Resend y cola

1. Crear una API key en Resend y verificar un dominio remitente configurando los registros DNS que indique el proveedor.
2. Completar `RESEND_API_KEY`, `EMAIL_FROM` y `SUPABASE_SERVICE_ROLE_KEY` en variables de servidor. Completar `CRON_SECRET` en Vercel; Vercel adjunta este Bearer al llamar un cron.
3. Al reservar, cancelar o reprogramar se intenta drenar la cola. Si hay una falla de proveedor, la operación del turno permanece guardada y el email se reintenta desde el outbox, sin crear otra reserva.
4. `vercel.json` programa un drenaje diario a las 12:00 UTC (09:00 Buenos Aires). El cron diario es compatible con un plan Hobby, pero no garantiza reintentos inmediatos. Para frecuencia de cinco minutos se puede usar `*/5 * * * *` en un plan compatible o un programador externo que haga GET al endpoint con el Bearer privado. Revisar la oferta vigente del proveedor antes de cambiar frecuencia.
5. Los eventos se reclaman por lotes de 20, con lease de 10 minutos y hasta 8 intentos; después requieren intervención. Inspeccionar en SQL `email_outbox` (`status`, `attempts`, `next_attempt_at`, `sent_at`). Nunca exponer esta tabla al público. Las claves de idempotencia del proveedor tienen una ventana limitada; revisar envíos antes de reactivar manualmente eventos antiguos para no reenviarlos.
6. Para volver a procesar un evento después de resolver la causa, un operador puede cambiar su estado a `pending`, reiniciar intentos y fecha, **tras comprobar en Resend si ya se envió**. El cron no manda recordatorios de turnos; solo procesa confirmaciones y cambios.

## 6. Publicación y prueba de aceptación

Conectar GitHub y Vercel, configurar variables y redesplegar. Probar desde móvil real: Google → selección → reserva → Mis turnos → reprogramación → cancelación, y luego administrador → turno manual → cobro → gasto → CSV. Confirmar recepción y contenido del email con un destinatario autorizado. Los tests locales de PostgreSQL no sustituyen la prueba de OAuth y correo real.

Antes de abrir la agenda al público faltan datos del responsable y validación de los textos legales, logo original, fotos y revisión visual responsive en navegador. La app incluye cabeceras de seguridad, cuotas por cuenta y RLS; configurar límites por IP en el perímetro si el tráfico lo requiere. Monitorizar cola, errores y backups del proyecto Supabase.

## Referencias oficiales

- [Supabase SSR con Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
- [Google OAuth en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Envío con Resend](https://resend.com/docs/api-reference/emails/send-email)
- [Cron de Vercel](https://vercel.com/docs/cron-jobs)
