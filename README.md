# Barber Luke

Sitio publicado para revisión: **https://barberluk.vercel.app**. Las reservas permanecen cerradas hasta configurar los servicios externos y cargar datos reales del estudio.

Plataforma en español argentino: landing editorial negro/dorado, reservas de un barbero, portal con Google y administración de agenda y finanzas. Next.js App Router + TypeScript, Tailwind, Motion, Supabase PostgreSQL/Auth y Resend.

## Estado real

La implementación funciona sin credenciales para mostrar la landing y los estados de configuración pendiente. **No inventa servicios, precios, usuarios ni turnos.** La agenda se instala deshabilitada; la integración real con Supabase, Google y Resend requiere la configuración de [SETUP.md](SETUP.md). El sitio utiliza el logo original entregado por el propietario y un diseño de cartel negro/dorado con medallón 3D; las fotografías del estudio todavía están pendientes. Ver [PROGRESS.md](PROGRESS.md) para las pruebas y límites de verificación.

## Desarrollo

Requiere Node.js 24 y npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Completar .env.local y ejecutar la migración en Supabase.
npm run dev
```

Abrir http://localhost:3000. Sin configuración externa, se puede recorrer la landing, reservar (agenda pendiente), ingresar y textos legales; las rutas privadas redirigen al acceso.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Con el servidor iniciado, `TEST_BASE_URL` permite dirigir `npm run test:smoke` al entorno de verificación. Por defecto usa `http://localhost:3001` y comprueba rutas, redirecciones de acceso, cabeceras y estados sin credenciales. No reemplaza pruebas visuales o una sesión Google real.

Las pruebas de integridad requieren Docker:

```powershell
docker run --name barberluke-test-db -e POSTGRES_PASSWORD=local-test-only -p 127.0.0.1:55439:5432 -d postgres:17-alpine
npm run test:db
```

Si ese contenedor ya existe y está detenido, ejecutar `docker start barberluke-test-db`. El script crea una base nueva aislada en cada ejecución y emula exclusivamente las primitivas de Auth necesarias para comprobar RLS. No toca Supabase ni necesita credenciales productivas. Usa dos conexiones reales para verificar carreras de reservas. CI ejecuta estas mismas comprobaciones.

## Arquitectura

- `src/app`: páginas públicas, portal y panel `/admin`; endpoints y callback OAuth.
- `src/components`: formularios, selector de turnos, editor de horarios, navegación, animaciones.
- `src/lib`: acceso a sesión, validación de acciones, reportes, formatos ARS y envío de emails.
- `src/proxy.ts`: renovación de cookies SSR; las páginas y cada acción vuelven a comprobar identidad y rol.
- `supabase/migrations`: esquema, índices, RLS, auditoría, reserva y reprogramación transaccionales, outbox.
- `public/brand`, `public/studio`, `public/cuts`: reemplazos de recursos aprobados.

El navegador no recibe la clave administrativa. Las operaciones normales usan la sesión Supabase del usuario y RPC con autorización en PostgreSQL. La clave `service_role` está reservada al worker de emails. Ninguna función permite asignarse el rol administrador.

## Reglas del negocio

Los slots provienen de horarios semanales, excepciones por fecha, bloqueos y turnos existentes. Duración inicial **40 minutos, pendiente de confirmación**, configurable globalmente. No hay horarios ni precios preinstalados. La política del cliente es de 24 horas exactas tanto para cancelar como para reprogramar, medida en DB. Al reservar se guardan nombre del servicio, precio, duración y contacto históricos.

Una restricción PostgreSQL `EXCLUDE USING gist` impide solapamientos aunque se omita el chequeo previo. Un lock transaccional compartido serializa reservas y cambios de agenda. Los cambios incompatibles con turnos existentes hacen rollback; el administrador debe resolver cada turno explícitamente. Una clave UUID hace idempotentes los reintentos de creación. Los clientes tienen un máximo de tres turnos futuros y ocho altas por hora; el administrador, sesenta por hora. Estas cuotas viven en DB; no sustituyen un límite por IP en el perímetro para tráfico abusivo.

La confirmación y el evento de correo se guardan en la misma transacción. El outbox usa leases, `SKIP LOCKED`, reintentos y claves de idempotencia de Resend. Si faltan credenciales de correo, los eventos permanecen pendientes; la web no afirma que el email fue entregado. El endpoint protegido de cron procesa la cola. En Vercel Hobby se dejó un cron diario; para reintentos más frecuentes, configurar un programador adecuado al plan, ver SETUP.

## Finanzas

Todos los importes se almacenan como **centavos enteros**. La UI recibe pesos argentinos. Los cobros se registran en Agenda y están restringidos a uno por turno. Los gastos se registran por categoría y fecha.

- Resultado de caja = cobros efectivos − gastos registrados.
- Margen estimado = cobros − costo variable histórico de turnos completados − costos fijos modelados prorrateados por días.
- Los gastos reales no se restan nuevamente del margen modelado. No es una liquidación contable.
- La fecha del cobro y la fecha del turno pueden pertenecer a períodos diferentes; la interfaz lo explicita.

Los reportes de Finanzas y CSV consultan por páginas de 1.000 registros, con máximo de 20.000 por categoría y 366 días por solicitud. Si se excede, se pide acortar el rango; no se muestra un balance truncado como completo. Las tablas del portal y el resumen tienen límites visibles. CSV incluye BOM UTF-8, comillas escapadas y protección contra fórmulas; las columnas `_cents` están expresadas en centavos.

## Endpoints

| Ruta                                                  | Uso                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /api/availability?day=AAAA-MM-DD`                | Solo horas disponibles, sin datos de terceros                         |
| `GET /auth/login` y `/auth/callback`                  | OAuth Google con PKCE/cookies SSR                                     |
| `POST /auth/logout`                                   | Salida con comprobación de origen                                     |
| `GET /api/admin/export?type=payments&from=...&to=...` | CSV exclusivo de administradores; también `expenses` y `appointments` |
| `GET /api/cron/notifications`                         | Worker protegido por `Authorization: Bearer CRON_SECRET`              |

Las mutaciones son Server Actions validadas con Zod. Next.js comprueba origen/host en Server Actions y la DB vuelve a verificar permisos.

## Deploy

Proyecto previsto: GitHub `fedemarr/barberluk`, Vercel equipo `fmcodes-projects`, framework Next.js, Node 24. Cargar variables de `.env.example`, ejecutar la migración y desplegar con `vercel --prod --scope fmcodes-projects` desde el proyecto vinculado. No cargar claves en Git. El sitio puede publicarse antes de conectar Supabase, pero la reserva permanece cerrada.

El contrato `DepositProvider` reserva el punto de integración para Mercado Pago. No hay gateway, webhook público de pagos, señas ni checkout activos. La fase futura deberá incorporar firma, referencias únicas, idempotencia, expiración y conciliación sin modificar los snapshots históricos.
