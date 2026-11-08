# Progreso Barber Luke

## Auditoría inicial

La carpeta contenía solamente `BARBER_LUKE_PROMPT_MAESTRO_CODEX.md`. El remoto GitHub no tenía commits. Se preservó el documento y se creó la aplicación desde cero. Las sesiones CLI de GitHub y Vercel estaban disponibles. No se recibió todavía una base de datos ni credenciales de Supabase, Google o Resend.

## Fases implementadas

1. **Estructura y estilos:** Next.js/TypeScript estricto, Tailwind, tokens, navegación responsive y componentes reutilizables.
2. **Landing:** hero editorial, secciones de experiencia, servicios persistentes, identidad/galería temporal, proceso y contacto verificado configurable. Motion con movimiento reducido, foco visible, enlace de salto y recursos SVG locales. Fotos y logo original pendientes.
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

## Límites y pendientes

- No se verificaron Google OAuth, Supabase alojado ni entrega de Resend porque aún no se recibieron sus credenciales. La DB local emula `auth.uid()` para probar políticas; no simula un login aprobado.
- La herramienta de navegador no pudo acceder al host de browser y Windows detuvo la revisión porque no pudo identificar la URL con suficiente confianza. No se afirma haber hecho QA visual ni E2E responsive. Requiere revisión posterior en navegador/móvil.
- No se incluyen fotos del estudio, cortes reales ni logo original. La galería es una composición editorial temporal con vista ampliada mediante diálogo nativo (cierre por Escape y restauración de foco); falta incorporar fotografías reales. No hay reseñas inventadas.
- Configuración de marca, logo y plantilla de correo se actualiza en código; no hay CMS de uploads ni editor visual de emails. La dirección y redes se administran desde el panel.
- No hay pagos online, recordatorios 24 h, reembolsos, conciliación ni correcciones contables de cobros. El modelo actual permite un cobro completo por turno; correcciones deben diseñarse con asientos compensatorios en una fase posterior.
- El cron diario drena hasta 20 eventos por ejecución. Para un volumen mayor o reintentos rápidos, aumentar frecuencia con un programador compatible. Tras 8 fallas se requiere revisión.
- Los textos legales son iniciales, requieren datos del titular y validación. Confirmar duración, precios, datos de contacto e Instagram antes de habilitar agenda.

## Mejoras premium sugeridas

Tres prioridades UX: revisión móvil con usuarios reales, contacto contextual para cancelaciones fuera de plazo y agenda de próximos horarios al abrir la reserva. Dos mejoras visuales: incorporar fotografías reales y reemplazar el monograma por el logo original aprobado. Interacción futura: comparar antes/después de trabajos reales con autorización de los clientes.
