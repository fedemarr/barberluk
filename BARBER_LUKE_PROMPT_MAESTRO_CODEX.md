# PROMPT MAESTRO PARA CODEX — BARBER LUKE

Actuá como un equipo senior de producto, UX/UI, ingeniería full-stack, base de datos, QA y DevOps. Tu misión es construir en este repositorio una aplicación web real, funcional, de alta calidad y lista para pruebas para **BARBER LUKE**, que integra una landing premium, reservas online, portal del cliente y panel administrativo con finanzas.

**IMPORTANTE:** No entregues solo mockups o pantallas estáticas. Implementá flujos completos conectados a datos persistentes. Trabajá de forma autónoma, por fases verificables, sin detenerte a pedir aprobación por cada archivo. Inspeccioná primero el repositorio y respetá su configuración existente cuando sea razonable. No afirmes haber implementado o probado nada que no esté realmente hecho. Cuando falten credenciales externas, implementá los adaptadores y flujos necesarios, dejá `.env.example`, instrucciones, modos de desarrollo seguros y documentá claramente qué falta configurar.

## 1. Identidad del negocio

- Marca: **BARBER LUKE**.
- Instagram de referencia: `@_barber.luk` (verificar antes de publicar enlaces definitivos).
- Ubicación orientativa tomada del perfil provisto: José C. Paz, Montes de Oca 2518 (validar la escritura y dirección antes de mostrar como dato definitivo).
- Imagen de marca: logotipo con monograma dorado sobre fondo negro, estética elegante y exclusiva.
- Paleta principal: negro profundo `#080808` / `#101010`, dorado `#D4AF37` o variantes metálicas, blanco cálido `#F5F1E8`, gris carbón. Usar contraste legible, no saturar el dorado.
- El usuario entregará fotos reales de la barbería, referencias de páginas y posiblemente mejor versión del logo. Diseñar desde ahora un sistema flexible de contenido y assets para incorporarlas fácilmente. No inventar fotos del local ni reseñas reales.
- Nombre visible: **Barber Luke**. Mensajes propuestos, editables: «Tu estilo. Tu identidad.» y «Más que un corte, una experiencia.»
- Idioma: español argentino; moneda ARS; zona horaria `America/Argentina/Buenos_Aires`; fechas `dd/MM/yyyy`; horario 24 h.

## 2. Decisiones confirmadas — NO cambiar sin razón

1. **Un solo barbero** inicialmente. Modelar correctamente para 1, sin sobreingeniería multibarbero; permitir ampliación futura sin rehacer todo.
2. **Reservas confirmadas automáticamente** cuando se guarda exitosamente un turno válido y disponible. No hay aprobación manual como condición inicial.
3. **Duración fija para todos los turnos**, configurable desde el administrador (por ejemplo 30/40/45 minutos; no asumir uno definitivamente hasta configurarlo). El servicio tiene precio y nombre, pero NO cambia la duración en la versión inicial.
4. **Cancelación por cliente permitida hasta 24 horas antes** del inicio del turno. Pasado ese límite, solo administrador puede intervenir. No permitir alterar esto desde el frontend.
5. **Sin señas/pagos online por ahora**. Preparar diseño desacoplado para Mercado Pago en una futura fase, sin implementar cobros ficticios, credenciales ni bloquear reservas por pagos.
6. **Login de clientes con Google**, mediante OAuth real, no pedir contraseña propia. El cliente podrá ver y gestionar únicamente sus turnos.
7. **Correo automático de confirmación** al reservar. Los correos deben tener manejo de errores y reintentos para que un fallo del proveedor no genere una reserva duplicada.
8. **Administrador** con agenda completa, apertura/cierre de días, horarios personalizados, bloqueos, servicios, clientes, cobros y finanzas.

## 3. Objetivo de producto

Entregar un único sistema coherente con tres experiencias:

### A. Landing premium pública

- Inicio con hero cinematográfico: logo BARBER LUKE, titular fuerte, imagen o video del estudio (cuando estén disponibles), CTA «Reservar turno» siempre fácil de encontrar.
- Barra de navegación elegante, sticky, menú responsive, accesibilidad completa.
- Secciones: presentación, servicios y precios, experiencia del estudio, galería de cortes, cómo reservar, ubicación/contacto, Instagram y footer.
- CTA repetido estratégicamente; acceso a «Mis turnos» y al panel según rol.
- Estética editorial premium, no plantilla genérica. Fondos oscuros, microdetalles dorados, tipografía de display + sans moderna, grandes fotografías y buen espacio negativo.
- Animaciones avanzadas bien ejecutadas: reveal por scroll, stagger de textos, parallax controlado, entradas de imágenes, hover refinado en botones y tarjetas, reflejo sutil del logo, transiciones de navegación. Considerar GSAP/ScrollTrigger o Framer Motion (Motion) según necesidad. Three.js únicamente para un detalle 3D que aporte valor; NO comprometer rendimiento.
- Respetar `prefers-reduced-motion`; evitar scroll-jacking; fallback sin video/3D; mantener LCP, CLS y accesibilidad.
- Galería preparada para insertar fotos reales posteriormente. Hasta recibirlas, usar placeholders claramente identificados, no presentarlos como fotos del local.
- SEO: metadata, Open Graph, sitemap, robots, datos estructurados `LocalBusiness` solo con información verificada, buen rendimiento móvil.

### B. Portal del cliente

Flujo sugerido:
1. Desde «Reservar turno», visualizar servicios reales y precios configurados.
2. Elegir servicio.
3. Elegir día y horario **disponibles** en agenda, según reglas y duración fija.
4. Iniciar sesión con Google si todavía no inició; preservar selección previa.
5. Confirmar resumen (servicio, precio, fecha, hora, dirección y política de cancelación).
6. Guardar reserva **atómicamente**; confirmar en pantalla y generar notificación por email.
7. En «Mis turnos», visualizar próximos turnos e historial, estado, servicio, fecha y hora; cancelar hasta 24 h antes; reprogramar si está permitido, aplicando las mismas reglas de disponibilidad. Reprogramar sin crear turnos superpuestos y notificar cambios.
8. Página de cancelación/errores con mensajes comprensibles. No mostrar detalles internos de base de datos.

Requisitos:
- Nunca confiar en un cliente para indicar precio definitivo, horario disponible o propietario del turno.
- Bloquear el doble booking incluso con solicitudes simultáneas y reintentos.
- Manejar zona horaria y horario de verano correctamente usando timestamps UTC en DB y visualización local.
- Evitar que el cliente vea datos privados de otros clientes.
- Evitar turnos pasados, cierres, feriados/bloqueos, descansos y reservas fuera del horario.
- Configurar ventana de anticipación (por ejemplo mínimo 1 h, máximo 30/60 días) desde administrador.
- Si el slot deja de estar disponible mientras se confirma, responder conflicto y refrescar disponibilidad.
- Mostrar política de privacidad y consentimiento básico de tratamiento de datos, adaptables al negocio.

### C. Panel de administración `/admin`

Acceso protegido por **rol de administrador almacenado y comprobado en servidor/DB**; nunca otorgar rol admin por email enviado por frontend, ni por claims manipulables. Incluye:

**Dashboard:** turnos de hoy, turnos futuros, cancelaciones, ingresos cobrados, gastos, resultado neto estimado, servicios populares, tasa de ocupación, gráficos de períodos.

**Agenda:** vistas día/semana/mes; detalles de cada turno; filtros por estado; crear turno manual; editar, cancelar, reprogramar; marcar asistió/no asistió/servicio completado; marcar pago. Permitir reserva manual para clientes sin Google, con datos mínimos y control de duplicados.

**Disponibilidad:** definir días de trabajo, hora de inicio/fin, descansos, días cerrados, vacaciones, feriados personalizados, excepciones por fecha (abrir/cerrar parcialmente), bloqueos por trámites/descanso; duración fija global editable; intervalo entre turnos si se decide añadirlo. Advertir cuando un cambio de horario afecta reservas existentes; **no cancelar reservas silenciosamente**: mostrar conflictos y pedir resolverlos en panel.

**Servicios:** CRUD con nombre, descripción, precio ARS, duración global aplicable, orden visual, activo/inactivo, imagen opcional; cambios de precio no deben alterar el importe histórico pactado de turnos ya creados.

**Clientes:** lista y búsqueda, perfil básico, historial de citas, asistencia, cancelaciones, notas internas solo admin (no sensibles innecesarias), protección de datos personales.

**Finanzas:**
- Ingresos **registrados por cobros efectivos**, nunca contar un turno solo reservado como dinero ingresado.
- Cargar pago de un servicio manualmente: efectivo, transferencia, otro; importe y fecha; evitar dobles cobros involuntarios.
- Registrar egresos con categoría (alquiler, productos/insumos, luz, internet, herramientas, limpieza, otros), fecha, descripción, importe y recurrencia opcional futura.
- Configurar costos de insumos variables por corte (por servicio si conviene, o promedio configurable), costos fijos mensuales y cálculo transparente.
- Mostrar ingreso bruto, egresos, margen estimado, utilidad estimada, costos por corte, ticket promedio, cortes completados, ingresos por método y reportes por día/semana/mes/rango.
- Balance: explicar fórmula de cada indicador; aclarar que resultado de caja y rentabilidad estimada no son lo mismo. Evitar duplicar costos si ya se cargaron como gastos.
- Exportar CSV (y si es posible Excel) de turnos, cobros y gastos.

**Configuración:** nombre, logo, datos del local, redes sociales, ubicación, contacto, plantilla de correos, duración fija, política de cancelación de 24 h en fase inicial, plazos de reservas, precio visible, reglas de privacidad; preparar assets editables.

## 4. Arquitectura recomendada

Si el repo es nuevo, elegir:
- **Next.js App Router + TypeScript** (versión estable compatible).
- **Tailwind CSS** y componentes accesibles con shadcn/ui o Radix donde beneficie.
- **Motion/Framer Motion** para UI; GSAP para secuencias especiales solo si justifica complejidad; optimización de media con Next/Image.
- **Supabase PostgreSQL** como DB y **Supabase Auth con OAuth Google**.
- **Row Level Security** en tablas con datos privados, además de comprobaciones de autorización del servidor.
- **Resend** o proveedor SMTP transaccional configurable para correos; sistema de eventos/outbox o cola segura de reintentos.
- **Vercel** para despliegue y jobs programados si se implementan recordatorios.
- Validación `zod`, formularios accesibles, manejo sólido de errores, observabilidad simple.

No incorporar servicios pagos innecesarios. No hardcodear claves ni publicar secrets; `.env.example` sin valores sensibles.

## 5. Modelo de datos (proponer migrations SQL reales)

Diseñar como mínimo:
- `profiles`: id UUID asociado a auth.users, display_name, email, teléfono opcional, rol, timestamps.
- `services`: nombre, descripción, precio actual, activo, orden, foto opcional.
- `business_settings`: duración fija en minutos, zona horaria, datos del negocio, límites para reservar, etc.
- `weekly_working_hours`: día de semana, intervalos laborales, habilitado.
- `schedule_exceptions`: fecha, abierto/cerrado, intervalos alternativos, motivo opcional.
- `schedule_blocks`: intervalos bloqueados y descripción.
- `appointments`: usuario cliente nullable para alta manual, contacto snapshot, servicio, precio snapshot, inicio y fin UTC, estado, timestamps, origen, notas admin; historial de cambios/audit log.
- `payments`: appointment_id, monto, método, fecha, estado, referencia opcional; sin gateway integrado en MVP.
- `expenses`: fecha, categoría, monto, descripción, creado_por.
- `cost_settings` / `service_costs` si corresponde: costos configurables y fechas de vigencia para reportes históricos.
- `notification_events` / `email_outbox`: tipo, destinatario, referencia a turno, idempotencia, estado de envío, intentos, timestamps.
- `audit_logs`: actor, acción, recurso, antes/después de cambios sensibles cuando corresponda, sin filtrar secretos.

**Integridad crítica:** PostgreSQL debe impedir solapamiento de turnos activos en un único recurso/barbero, incluso ante concurrencia. Preferir restricción `EXCLUDE USING gist` sobre rango temporal con filtro por estados ocupantes (requiere `btree_gist` si hace falta), o una estrategia transaccional equivalente demostrablemente segura. Evitar confiar solo en check previo desde JS. Definir estados (`confirmed`, `completed`, `cancelled`, `no_show`) de forma coherente con unicidad y disponibilidad. Usar fechas y horas UTC y zona horaria local en cálculos de negocio.

Crear índices adecuados, migraciones versionadas y seeds **solo de demostración** claramente distinguibles. Preparar políticas RLS para que cada cliente vea únicamente sus citas y el admin vea/gestione todo. No confiar en el correo para autorizar acceso de administrador.

## 6. Reglas de agenda

- Solo 1 barbero de inicio.
- Turnos con duración fija global, configurable por admin.
- Slots generados a partir de horario semanal + excepciones + bloqueos - turnos existentes.
- Intervalos deben caber íntegros en el horario habilitado; evitar solaparse con descansos/bloqueos.
- No mostrar slots que ya pasaron ni superar horizonte máximo de anticipación.
- El cliente puede cancelar **si faltan al menos 24 horas**, medido contra la hora actual del servidor. Para reprogramaciones aplicar política definida inicialmente (misma antelación de 24 h salvo configuración futura).
- Las cancelaciones liberan disponibilidad.
- El admin puede resolver excepciones y modificar turnos, con registro de auditoría.
- Cualquier cambio de duración fija debe aplicarse a **nuevas reservas**; los turnos ya confirmados conservan su inicio/fin histórico salvo reprogramación explícita.
- Emails: confirmación, cancelación, reprogramación; recordatorio 24 h antes como mejora opcional si el proveedor/cron están configurados. Plantillas con marca y texto en español.

## 7. UX y páginas

Rutas orientativas:
- `/` Landing
- `/servicios` opcional, o sección de landing
- `/reservar` Selección de servicio, día y horario
- `/auth/callback` OAuth seguro
- `/mis-turnos` Próximos e historial
- `/perfil` Datos básicos
- `/admin` Dashboard
- `/admin/agenda`
- `/admin/disponibilidad`
- `/admin/servicios`
- `/admin/clientes`
- `/admin/finanzas`
- `/admin/configuracion`
- `/privacidad` y `/terminos` (textos iniciales claramente pendientes de validación legal)

Requisitos visuales: excelente móvil primero, diseño desktop refinado, loading/skeletons, estados vacíos, toasts, formularios claros, calendario táctil, mensajes de éxito/error, accesibilidad de teclado, contraste AA, focus visibles. El CTA de reservar debe ser prominente sin obstaculizar la lectura. Panel administrativo más funcional y sobrio que la landing.

## 8. Diseño adaptable a futuras fotos y referencias

Crear carpeta de assets (`public/brand`, `public/studio`, `public/cuts`) y componentes desacoplados. Actualmente se dispone de **referencias visuales proporcionadas por el propietario** (logo circular negro/dorado y captura del perfil de Instagram). Si estos archivos están en el repo, reutilizarlos. Si no, crear placeholders y documentar dónde reemplazarlos. No intentar extraer imágenes desde enlaces privados ni afirmar que se tienen assets que no existen. Dejar parámetros de colores, tipografías, efectos y secciones centralizados para que sea fácil actualizar cuando lleguen referencias de otras webs y fotografías.

## 9. Seguridad, privacidad y calidad

- Autenticación Google OAuth real y callback correcto; cookies de sesión seguras.
- Autorización real de cliente/admin en todos los endpoints y acciones sensibles.
- Validación de entrada en servidor; protección de CSRF donde aplique, rate limiting de reservas y formularios, sanitización de textos, no exponer datos personales.
- RLS y mínimo privilegio; claves `service_role` únicamente en servidor seguro.
- Idempotencia para crear citas y enviar notificaciones; logs sin datos sensibles innecesarios.
- Testear concurrencia (dos reservas simultáneas mismo slot), límites de 24 h, cierres, excepciones, zona horaria, cambio de duración, role access y cambios de precios.
- No exponer rutas administrativas ni paneles por mera ocultación visual.
- Optimizar imágenes y efectos; reducir animaciones en móviles de bajo rendimiento y en `prefers-reduced-motion`.

## 10. Integración Mercado Pago futura — solo preparar

Diseñar una interfaz desacoplada para futuras señas: posible `deposit_required`, `deposit_amount`, `payment_provider`, `provider_reference`, `payment_status`, webhook y expiración de reserva pendiente. **No habilitar ni simular pagos reales en esta entrega.** No crear flujo de «seña obligatoria» ni exigir credenciales de Mercado Pago en MVP. Documentar exactamente cómo integrarlo después sin romper las reservas existentes.

## 11. Plan de ejecución obligatorio para Codex

1. **Auditar repositorio** y resumir lo existente. Crear `README.md` con arquitectura, instalación, scripts, variables de entorno, configuración de Supabase/Google OAuth/Resend y despliegue.
2. **Crear estructura base** y design system premium de Barber Luke, responsive. Implementar landing con contenido editable y placeholders.
3. **Crear esquema DB y migraciones**, con constraints e índices de disponibilidad, RLS y roles.
4. **Implementar Google OAuth**, perfil del cliente y protección de rutas.
5. **Implementar motor de disponibilidad y reserva**, escritura atómica, estados, cancelación y reprogramación.
6. **Implementar notificaciones email** transaccionales con manejo de fallos; en desarrollo, log/mode seguro explícito si faltan credenciales.
7. **Implementar admin**: dashboard, agenda, excepciones laborales, bloqueos, servicios, clientes.
8. **Implementar finanzas**: pagos manuales, egresos, costos, KPIs, filtros y exportación.
9. **Pruebas y pulido**: unit tests, integración de reglas, e2e de flujo principal cuando sea posible, lint, typecheck, build, responsive y accesibilidad.
10. **Informe final**: qué se implementó realmente, qué se probó, comandos, variables faltantes, limitaciones y siguientes pasos concretos.

Trabajar iterativamente, manteniendo la aplicación ejecutable. Si se necesitan credenciales reales que no están disponibles, avanzar con el resto y dejar configuraciones/instrucciones explícitas. Usar datos seed solo como demostración local; no mostrar dashboards inventados en producción como si fueran reales.

## 12. Criterios de aceptación

- Un visitante puede ver la landing en móvil y llegar a reservar en pocos pasos.
- Puede acceder con Google y reservar un slot libre; queda confirmado y aparece en Mis turnos.
- Dos usuarios no pueden reservar simultáneamente el mismo horario.
- La confirmación por email se intenta de forma robusta y no se duplica el turno ante fallas.
- El cliente solo accede a sus turnos y cancela hasta 24 h antes, nunca después.
- Admin puede abrir/cerrar un día, crear una excepción, bloquear tiempo y ver la disponibilidad cambiar.
- Admin puede registrar un turno y un cobro, registrar un gasto y ver el balance recalculado sin confundir reservado con cobrado.
- Precios históricos no cambian cuando se edita un servicio.
- No se solicitan señas ni se ejecutan pagos online.
- El proyecto ejecuta scripts de build/test/lint documentados y queda listo para configurar servicios externos y desplegar.

**Empezá ahora auditando el repositorio y luego ejecutá las fases en orden. No te limites a explicar el plan: creá el código y los archivos necesarios. Ante incertidumbres no críticas, elegí defaults razonables y documentalos. Priorizá un producto funcional, seguro y elegante.**
