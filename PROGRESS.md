# Progreso Barber Luke

## Auditoría inicial

La carpeta contenía solamente `BARBER_LUKE_PROMPT_MAESTRO_CODEX.md`. El remoto GitHub no tenía commits. Se preservó el documento y se creó la aplicación desde cero. Las sesiones CLI de GitHub y Vercel estaban disponibles. No se recibió todavía una base de datos ni credenciales de Supabase, Google o Resend.

## Fases implementadas

1. **Estructura y estilos:** Next.js/TypeScript estricto, Tailwind, tokens, navegación responsive y componentes reutilizables.
2. **Landing:** composición de cartel de barbería, tipografía condensada, dorado intenso, carta de servicios persistentes, manifiesto, sección de marca y contacto configurable. Logo original recibido e integrado con efecto de medallón 3D, brillo y respuesta al cursor. Se respetan movimiento reducido, pausa manual y foco visible. Fotografías pendientes.
3. **Datos y auth:** migración PostgreSQL, RLS, permisos mínimos, perfiles, SSR Google OAuth, callback y rutas protegidas. Integración escrita; OAuth real pendiente de credenciales.
4. **Reservas:** RPC atómica con exclusión GiST, idempotencia, cuotas, agenda semanal, cierres, descansos, excepciones, bloqueos, conservación de snapshots, cancelación/reprogramación hasta 24 h, rollback de cambios incompatibles.
5. **Portal y correos:** historial propio, perfil, cancelación confirmada por el usuario y reprogramación. Outbox transaccional, leases y Resend con reintentos. Envío real pendiente de configuración.
6. **Administración:** resumen, agenda día/semana/mes, filtros y páginas, turnos manuales, estados, reprogramación, cobros únicos y ocupación basada en intervalos reales.
7. **Gestión:** edición/activación de servicios, perfiles de clientes, historial, notas internas, semana habitual, excepciones, vacaciones y datos del negocio.
8. **Finanzas:** cobros persistentes, gastos, costos por vigencia, snapshot variable al completar, caja, margen modelado, métodos, ticket y CSV protegido.
9. **Calidad y despliegue:** scripts de lint, tipos, build, tests unitarios y tests de DB; pipeline GitHub Actions; configuración Vercel y cron. Verificaciones externas pendientes descritas abajo.

## Verificado

- Primera compilación de producción: correcta, con todas las rutas generadas.
- TypeScript estricto: correcto.
- ESLint: correcto tras corregir la sintaxis SSR.
- 5 pruebas unitarias: límite exacto 24 h, fecha Buenos Aires, ARS, caja vs margen y ausencia de división por cero.
- 26 verificaciones PostgreSQL en Docker con dos conexiones independientes: concurrencia, idempotencia, outbox, RLS, permisos, rollback de agenda, precios/duración históricos, reprogramación fallida sin perder reserva, cancelación, descansos, horizonte, regla de 24 h, constraint directo, cobro único, gastos, leases, auditoría, ocupación, bloqueos y perfil.
- Auditoría completa de dependencias: sin vulnerabilidades reportadas. Se actualizó la dependencia transitiva `minimatch` del parser de TypeScript mediante un override; no hizo falta degradar Next.js.
- 25 comprobaciones HTTP sin credenciales: landing, reserva, ingreso, legales, SEO, assets, redirección de nueve rutas privadas, exportación denegada, cron protegido, validación de fechas y 404. Las rutas privadas redirigen desde proxy antes del streaming.

## Rediseño con el logo del propietario

- Se recibió `e5d40bfe-afb5-4078-9bb2-67d83d4f5802.png` y se copió sin modificar a `public/brand/barber-luke.png`.
- El logo reemplaza al sillón en el hero y al monograma de cabecera/pie; se incorporó también al icono y a la imagen para compartir.
- Nueva composición visual: Bebas Neue, titulares de cartel, negro cálido, oro más intenso, franja diagonal y servicios sobre una pizarra oscura. Se retiraron las composiciones abstractas anteriores y su vista ampliada.
- Efecto del logo: giro oscilante en 3D, reflejo que cruza la superficie, órbita lenta y respuesta al puntero. Incluye botón de pausa y respeta `prefers-reduced-motion`; no requiere WebGL.
- La integración de reservas, permisos y finanzas conserva su implementación.
- Verificado después del rediseño: lint, compilación de producción con TypeScript y 25 comprobaciones HTTP, incluida la versión optimizada del logo. El archivo de marca conserva exactamente el SHA-256 del original entregado.

## Agenda y panel de demostración

- Se agregó calendario mensual reutilizable al flujo de reserva, con navegación entre meses, límites de anticipación y formato de Buenos Aires.
- Sin Supabase, `/reservar` ofrece una demo identificada: servicios y precios de muestra, horarios libres/ocupados, selección y confirmación simulada. Los ejemplos no se envían a la base ni generan correos.
- `/demo/admin` incluye resumen, agenda por día/semana/mes, disponibilidad, edición de servicios, clientes de muestra, cobros, gastos, CSV y configuración de ejemplo. Un turno de muestra creado en la reserva aparece en ese panel dentro de la misma pestaña.
- Persistencia acotada a `sessionStorage`, con validación del contenido, reinicio y fecha de Buenos Aires. La agenda real y las políticas de `/admin` conservan su protección; la demo no recibe claves privadas ni invoca sus mutaciones.
- Se aprobaron 14 pruebas unitarias en total: las 5 previas y 9 sobre fechas, agenda demo, solapamientos, cancelación, descansos, cierres, snapshots y validación del almacenamiento.
- Compilación y lint correctos. Se aprobaron 34 comprobaciones HTTP, incluyendo todos los módulos de muestra, su etiqueta demo/noindex y el rechazo de accesos sin sesión a `/admin` y a las APIs privadas reales.

## Publicación inicial verificada

- Sitio: https://barberluk.vercel.app
- Proyecto: https://vercel.com/fmcodes-projects/barberluk
- Código: https://github.com/fedemarr/barberluk
- Primer despliegue de producción: `dpl_2riSPziU2EvjjN4a34Ai67yT4Ztm`, estado Ready.
- Las 25 comprobaciones HTTP también pasaron sobre el dominio público, sin sesión ni credenciales de Supabase.
- GitHub Actions ejecutó correctamente lint, tipos, 5 tests unitarios, 26 verificaciones PostgreSQL, build y 25 comprobaciones HTTP en Linux. Ejecución: https://github.com/fedemarr/barberluk/actions/runs/42532812743

## Límites y pendientes de activación

- No se verificaron Google OAuth, Supabase alojado ni entrega de Resend porque aún no se recibieron sus credenciales. La DB local emula `auth.uid()` para probar políticas; no simula un login aprobado.
- La herramienta de navegador no pudo acceder al host de browser y Windows detuvo la revisión porque no pudo identificar la URL con suficiente confianza. No se afirma haber hecho QA visual ni E2E responsive. Requiere revisión posterior en navegador/móvil.
- El logo original ya está incluido. Faltan fotografías del estudio y cortes reales; mientras tanto, el sitio utiliza composiciones tipográficas y el sello de la marca. No hay fotos ni reseñas inventadas.
- Configuración de marca, logo y plantilla de correo se actualiza en código; no hay CMS de uploads ni editor visual de emails. La dirección y redes se administran desde el panel.
- No hay pagos online, recordatorios 24 h, reembolsos, conciliación ni correcciones contables de cobros. El modelo actual permite un cobro completo por turno; correcciones deben diseñarse con asientos compensatorios en una fase posterior.
- El cron diario drena hasta 20 eventos por ejecución. Para un volumen mayor o reintentos rápidos, aumentar frecuencia con un programador compatible. Tras 8 fallas se requiere revisión.
- Los textos legales son iniciales, requieren datos del titular y validación. Confirmar duración, precios, datos de contacto e Instagram antes de habilitar agenda.

## Mejoras premium sugeridas

Tres prioridades UX: revisión móvil con usuarios reales, contacto contextual para cancelaciones fuera de plazo y agenda de próximos horarios al abrir la reserva. Dos mejoras visuales: incorporar fotografías reales y una secuencia breve del trabajo en el estudio. Interacción futura: comparar antes/después de trabajos reales con autorización de los clientes.
