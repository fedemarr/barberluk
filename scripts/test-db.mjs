import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const container = 'barberluke-test-db';
const database = `barberluke_test_${Date.now()}`;
const run = (sql) =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      database,
      '-X',
      '-q',
      '-t',
      '-A',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  ).trim();
execFileSync('docker', ['exec', container, 'createdb', '-U', 'postgres', database]);
run(`DO $$ BEGIN IF NOT EXISTS(select from pg_roles where rolname='anon') THEN CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; END IF; END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`);
run(readFileSync('supabase/migrations/202611050001_core.sql', 'utf8'));
const admin = '00000000-0000-4000-8000-000000000001',
  a = '00000000-0000-4000-8000-000000000002',
  b = '00000000-0000-4000-8000-000000000003',
  svc = '00000000-0000-4000-8000-000000000004';
run(
  `INSERT INTO auth.users(id,email) VALUES('${admin}','admin@example.test'),('${a}','a@example.test'),('${b}','b@example.test');UPDATE profiles SET role='admin' WHERE id='${admin}';INSERT INTO services(id,name,price_cents) VALUES('${svc}','Corte',1000000);`,
);
const as = (u, sql) => `SET ROLE authenticated;SET request.jwt.claim.sub='${u}';${sql}`;
const day = run(`select ((now() at time zone 'America/Argentina/Buenos_Aires')::date+3)::text;`),
  start = `${day}T09:00:00-03:00`;
const weekly = JSON.stringify(
  Array.from({ length: 7 }, (_, weekday) => ({ weekday, starts: '09:00', ends: '18:00' })),
);
run(
  as(
    admin,
    `SELECT configure_schedule('weekly','${weekly}');SELECT configure_schedule('settings','{"name":"Barber Luke","slot_minutes":40,"buffer_minutes":0,"min_notice_hours":1,"horizon_days":30,"booking_enabled":true}');`,
  ),
);
let passed = 0;
function check(name, fn) {
  fn();
  console.log(`PASS ${++passed}: ${name}`);
}
function rejects(u, sql, expected) {
  let rejected = false;
  try {
    run(as(u, sql));
  } catch (e) {
    rejected = String(e.stderr).includes(expected);
  }
  assert.ok(rejected, `Expected rejection: ${expected}`);
}
const parallel = (sql) =>
  new Promise((resolve) => {
    const p = spawn('docker', [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      database,
      '-X',
      '-q',
      '-t',
      '-A',
      '-v',
      'ON_ERROR_STOP=1',
    ]);
    let out = '',
      err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('exit', (code) => resolve({ code, out: out.trim(), err }));
    p.stdin.end(sql);
  });
const [r1, r2] = await Promise.all([
  parallel(
    as(a, `SELECT book_appointment('${svc}','${start}','10000000-0000-4000-8000-000000000001');`),
  ),
  parallel(
    as(b, `SELECT book_appointment('${svc}','${start}','10000000-0000-4000-8000-000000000002');`),
  ),
]);
check('dos conexiones concurrentes: exactamente una reserva confirmada', () =>
  assert.equal([r1, r2].filter((r) => r.code === 0).length, 1),
);
const winner = r1.code === 0 ? a : b,
  loser = winner === a ? b : a,
  id = r1.code === 0 ? r1.out : r2.out,
  key =
    r1.code === 0 ? '10000000-0000-4000-8000-000000000001' : '10000000-0000-4000-8000-000000000002';
check('reintento idempotente devuelve el mismo turno', () =>
  assert.equal(run(as(winner, `select book_appointment('${svc}','${start}','${key}');`)), id),
);
check('solo una notificación por reserva pese al reintento', () =>
  assert.equal(run(`select count(*) from email_outbox where appointment_id='${id}';`), '1'),
);
check('RLS oculta turno ajeno', () =>
  assert.equal(run(as(loser, `select count(*) from appointments where id='${id}';`)), '0'),
);
check('cliente no puede cancelar turno ajeno', () =>
  rejects(loser, `select change_appointment('${id}','cancel');`, 'No autorizado'),
);
check('cliente no puede elevar su rol', () => {
  rejects(loser, `update profiles set role='admin' where id='${loser}';`, 'permission denied');
  assert.equal(run(as(loser, `select role from profiles where id='${loser}';`)), 'client');
});
check('cliente no puede configurar agenda', () =>
  rejects(loser, `select configure_schedule('weekly','[]');`, 'Solo administrador'),
);
check('cliente no puede insertar cobros', () =>
  rejects(
    loser,
    `insert into payments(appointment_id,amount_cents,method,created_by)values('${id}',100,'cash','${loser}');`,
    'row-level security',
  ),
);
check('cliente no puede acceder a notas internas ni outbox', () => {
  assert.equal(run(as(loser, `select count(*) from client_notes;`)), '0');
  rejects(loser, `select * from email_outbox;`, 'permission denied');
});
check('cerrar día ocupado se rechaza y hace rollback', () => {
  rejects(
    admin,
    `select configure_schedule('exception','{"day":"${day}","closed":true}');`,
    'afecta turnos',
  );
  assert.equal(run(`select count(*) from schedule_exceptions;`), '0');
});
check('bloqueo que afecta un turno se rechaza', () =>
  rejects(
    admin,
    `select configure_schedule('block','{"starts_at":"${start}","ends_at":"${day}T10:00:00-03:00"}');`,
    'afecta turnos',
  ),
);
check('actualizar precio conserva snapshot histórico', () => {
  run(as(admin, `update services set price_cents=2000000 where id='${svc}';`));
  assert.equal(
    run(as(winner, `select price_cents from appointments where id='${id}';`)),
    '1000000',
  );
});
check('duración nueva conserva duración del turno original', () => {
  run(
    as(
      admin,
      `select configure_schedule('settings','{"name":"Barber Luke","slot_minutes":30,"buffer_minutes":0,"min_notice_hours":1,"horizon_days":30,"booking_enabled":true}');`,
    ),
  );
  assert.equal(
    run(`select extract(epoch from ends_at-starts_at)::int from appointments where id='${id}';`),
    '2400',
  );
});
check('reprogramar a horario ocupado conserva turno original', () => {
  const second = run(
    as(
      loser,
      `select book_appointment('${svc}','${day}T11:00:00-03:00','20000000-0000-4000-8000-000000000001');`,
    ),
  );
  rejects(
    loser,
    `select change_appointment('${second}','reschedule','${start}');`,
    'no está disponible',
  );
  assert.equal(
    run(
      `select to_char(starts_at at time zone 'America/Argentina/Buenos_Aires','HH24:MI') from appointments where id='${second}';`,
    ),
    '11:00',
  );
});
check('cancelación libera horario y encola email', () => {
  run(as(winner, `select change_appointment('${id}','cancel');`));
  assert.equal(
    run(as(loser, `select count(*) from available_slots('${day}') where starts_at='${start}';`)),
    '1',
  );
  assert.equal(
    run(`select count(*) from email_outbox where appointment_id='${id}' and event='cancelled';`),
    '1',
  );
});
check('cierres y descansos respetados', () => {
  run(
    as(
      admin,
      `select configure_schedule('exception','{"day":"${day}","closed":false,"intervals":[{"starts":"10:00","ends":"12:00"},{"starts":"14:00","ends":"16:00"}]}');`,
    ),
  );
  assert.equal(
    run(
      `select count(*) from available_slots('${day}') where (starts_at at time zone 'America/Argentina/Buenos_Aires')::time='13:00';`,
    ),
    '0',
  );
});
check('turnos pasados y fuera del horizonte rechazados', () => {
  assert.equal(run(`select count(*) from available_slots(current_date-2);`), '0');
  assert.equal(run(`select count(*) from available_slots(current_date+100);`), '0');
});
check('límite de 24 horas medido por servidor', () => {
  const close = run(
    `insert into appointments(user_id,created_by,service_id,service_name,price_cents,contact_name,contact_email,starts_at,ends_at,occupied_until,source,idempotency_key) values('${winner}','${winner}','${svc}','Corte',100,'Cliente','a@example.test',now()+interval '23 hours',now()+interval '23 hours 30 minutes',now()+interval '23 hours 30 minutes','web',gen_random_uuid()) returning id;`,
  );
  rejects(winner, `select change_appointment('${close}','cancel');`, '24 horas');
  run(as(admin, `select change_appointment('${close}','cancel');`));
});
check('constraint de exclusión funciona incluso con INSERT directo', () => {
  const occupied = run(`select id from appointments where status='confirmed' limit 1;`);
  assert.ok(occupied);
  let rejected = false;
  try {
    run(
      `insert into appointments(user_id,created_by,service_id,service_name,price_cents,contact_name,contact_email,starts_at,ends_at,occupied_until,source,idempotency_key) select user_id,created_by,service_id,service_name,price_cents,contact_name,contact_email,starts_at,ends_at,occupied_until,source,gen_random_uuid() from appointments where id='${occupied}';`,
    );
  } catch (e) {
    rejected = String(e.stderr).includes('exclusion constraint');
  }
  assert.ok(rejected);
});
check('no se puede cobrar dos veces un turno', () => {
  const turn = run(`select id from appointments where status='confirmed' limit 1;`);
  const sql = `insert into payments(appointment_id,amount_cents,method,created_by)values('${turn}',2000000,'cash','${admin}');`;
  run(as(admin, sql));
  rejects(admin, sql, 'duplicate key');
});
check('finanzas persiste importes enteros y gastos independientes', () => {
  run(
    as(
      admin,
      `insert into expenses(expense_date,category,description,amount_cents,created_by)values(current_date,'insumos','Compra',100050,'${admin}');`,
    ),
  );
  assert.equal(
    run(
      as(
        admin,
        `select (select sum(amount_cents) from payments)-(select sum(amount_cents) from expenses);`,
      ),
    ),
    '1899950',
  );
});
check('claim de correos es exclusivo y cliente no puede invocarlo', () => {
  rejects(loser, `select claim_emails();`, 'permission denied');
  const c1 = run(`set role service_role; select count(*) from claim_emails();`),
    c2 = run(`set role service_role; select count(*) from claim_emails();`);
  assert.ok(Number(c1) > 0);
  assert.equal(c2, '0');
});
check('auditoría registra cambios', () =>
  assert.ok(Number(run(`select count(*) from audit_logs;`)) > 10),
);
check('ocupación descuenta descansos y cuenta reservas efectivas', () => {
  assert.equal(run(as(admin, `select capacity_minutes::int from day_occupancy('${day}');`)), '240');
  assert.equal(run(as(admin, `select booked_minutes::int from day_occupancy('${day}');`)), '30');
  rejects(loser, `select day_occupancy('${day}');`, 'Solo administrador');
});
check('bloqueos libres y cierres completos eliminan disponibilidad', () => {
  run(
    as(
      admin,
      `select configure_schedule('block','{"starts_at":"${day}T14:00:00-03:00","ends_at":"${day}T15:00:00-03:00","reason":"Descanso"}');`,
    ),
  );
  assert.equal(
    run(
      `select count(*) from available_slots('${day}') where (starts_at at time zone 'America/Argentina/Buenos_Aires')::time >= '14:00' and (starts_at at time zone 'America/Argentina/Buenos_Aires')::time < '15:00';`,
    ),
    '0',
  );
  assert.equal(run(as(admin, `select capacity_minutes::int from day_occupancy('${day}');`)), '180');
  run(
    as(
      admin,
      `select configure_schedule('exception',jsonb_build_object('day','${day}'::date+1,'closed',true));`,
    ),
  );
  assert.equal(run(`select count(*) from available_slots('${day}'::date+1);`), '0');
});
check('perfil editable no permite cambiar email ni rol', () => {
  run(as(loser, `select update_profile('Cliente actualizado','1123456789');`));
  assert.equal(
    run(as(loser, `select display_name||':'||role from profiles where id='${loser}';`)),
    'Cliente actualizado:client',
  );
});
console.log(`\n${passed} verificaciones PostgreSQL correctas. Base aislada: ${database}`);
