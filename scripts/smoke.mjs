import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://localhost:3001';
for (let i = 0; i < 30; i++) {
  try {
    await fetch(base);
    break;
  } catch (error) {
    if (i === 29) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
const routes = [
  ['/', 200],
  ['/reservar', 200],
  ['/ingresar', 200],
  ['/privacidad', 200],
  ['/terminos', 200],
  ['/robots.txt', 200],
  ['/sitemap.xml', 200],
  ['/brand/barber-luke.png', 200],
  ['/_next/image?url=%2Fbrand%2Fbarber-luke.png&w=640&q=75', 200],
  ['/opengraph-image', 200],
  ['/mis-turnos', 307],
  ['/perfil', 307],
  ['/admin', 307],
  ['/admin/agenda', 307],
  ['/admin/disponibilidad', 307],
  ['/admin/servicios', 307],
  ['/admin/clientes', 307],
  ['/admin/finanzas', 307],
  ['/admin/configuracion', 307],
  ['/api/admin/export?type=payments', 403],
  ['/api/cron/notifications', 401],
  ['/api/availability?day=invalida', 400],
  ['/no-existe', 404],
];
for (const [path, status] of routes) {
  const r = await fetch(base + path, { redirect: 'manual' });
  assert.equal(r.status, status, path);
  if (status === 307) assert.ok(r.headers.get('location')?.includes('/ingresar'), path);
  console.log(`PASS ${status} ${path}`);
}
const r = await fetch(base);
const html = await r.text();
assert.ok(html.includes('EL CORTE.'));
assert.ok(html.includes('barber-luke.png'));
assert.ok(!html.includes('/studio/chair.svg'));
assert.equal(r.headers.get('x-frame-options'), 'DENY');
assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
const availability = await fetch(`${base}/api/availability?day=2026-11-08`);
assert.equal(availability.status, 503);
assert.ok((await availability.json()).error);
console.log(`\n${routes.length + 2} verificaciones HTTP correctas (sin credenciales).`);
