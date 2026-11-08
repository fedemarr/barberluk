-- Barber Luke · ejecutar en un proyecto Supabase nuevo.
begin;
create extension if not exists btree_gist;
create type public.appointment_status as enum ('confirmed','completed','cancelled','no_show');
create table public.profiles (
 id uuid primary key references auth.users on delete cascade, display_name text not null default '', email text not null, phone text not null default '', role text not null default 'client' check(role in ('client','admin')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_settings (
 id boolean primary key default true check(id), name text not null default 'Barber Luke', address text not null default '', contact text not null default '', instagram text not null default '', booking_enabled boolean not null default false,
 slot_minutes integer not null default 40 check(slot_minutes between 10 and 180), buffer_minutes integer not null default 0 check(buffer_minutes between 0 and 60), min_notice_hours integer not null default 1 check(min_notice_hours between 0 and 168), horizon_days integer not null default 30 check(horizon_days between 1 and 90), timezone text not null default 'America/Argentina/Buenos_Aires' check(timezone='America/Argentina/Buenos_Aires'), updated_at timestamptz not null default now()
);
insert into public.business_settings(id) values(true);
create table public.services (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100), description text not null default '', price_cents bigint not null check(price_cents between 0 and 100000000), active boolean not null default true, sort_order integer not null default 0, image_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Múltiples intervalos por día permiten descansos sin reglas especiales.
create table public.weekly_working_hours (id uuid primary key default gen_random_uuid(), weekday integer not null check(weekday between 0 and 6), starts time not null, ends time not null, check(ends>starts));
create table public.schedule_exceptions (id uuid primary key default gen_random_uuid(), day date not null unique, closed boolean not null default true, intervals jsonb not null default '[]', reason text not null default '');
create table public.schedule_blocks (id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz not null, reason text not null default '', check(ends_at>starts_at));
create table public.appointments (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles, created_by uuid not null references public.profiles, service_id uuid not null references public.services, service_name text not null, price_cents bigint not null check(price_cents>=0), contact_name text not null, contact_email text not null, contact_phone text not null default '', starts_at timestamptz not null, ends_at timestamptz not null, occupied_until timestamptz not null,
 status public.appointment_status not null default 'confirmed', source text not null check(source in ('web','admin')), idempotency_key uuid not null, variable_cost_cents bigint not null default 0 check(variable_cost_cents>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at), check(occupied_until>=ends_at), unique(created_by,idempotency_key),
 exclude using gist (tstzrange(starts_at,occupied_until,'[)') with &&) where (status <> 'cancelled')
);
create index appointments_user_idx on public.appointments(user_id,starts_at);
create index appointments_start_idx on public.appointments(starts_at);
create index appointments_service_idx on public.appointments(service_id);
create table public.client_notes (client_id uuid primary key references public.profiles, note text not null default '', updated_at timestamptz not null default now());
create table public.payments (id uuid primary key default gen_random_uuid(), appointment_id uuid not null unique references public.appointments, amount_cents bigint not null check(amount_cents between 1 and 100000000), method text not null check(method in ('cash','transfer','other')), paid_at timestamptz not null default now(), created_by uuid not null references public.profiles, created_at timestamptz not null default now());
create table public.expenses (id uuid primary key default gen_random_uuid(), expense_date date not null, category text not null check(category in ('alquiler','insumos','servicios','herramientas','limpieza','otros')), description text not null check(length(description) between 2 and 300), amount_cents bigint not null check(amount_cents between 1 and 100000000), created_by uuid not null references public.profiles, created_at timestamptz not null default now());
create index expenses_date_idx on public.expenses(expense_date);
create index payments_date_idx on public.payments(paid_at);
create table public.cost_settings (month date primary key check(extract(day from month)=1), variable_cost_cents bigint not null default 0 check(variable_cost_cents between 0 and 100000000), fixed_cost_cents bigint not null default 0 check(fixed_cost_cents between 0 and 100000000));
create table public.email_outbox (id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments, event text not null, recipient text not null, payload jsonb not null, status text not null default 'pending' check(status in ('pending','processing','sent','failed')), attempts integer not null default 0, next_attempt_at timestamptz not null default now(), locked_at timestamptz, sent_at timestamptz, created_at timestamptz not null default now());
create index email_pending_idx on public.email_outbox(status,next_attempt_at);
create table public.audit_logs (id bigint generated always as identity primary key, actor uuid, action text not null, resource_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now());

create function public.is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin insert into public.profiles(id,email,display_name) values(new.id,coalesce(new.email,''),left(coalesce(new.raw_user_meta_data->>'full_name','Cliente'),100)); return new; end; $$;
create trigger auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin insert into public.audit_logs(actor,action,resource_id,details) values(auth.uid(),tg_table_name||':'||tg_op,coalesce((to_jsonb(new)->>'id')::uuid,(to_jsonb(old)->>'id')::uuid),jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(new))); return coalesce(new,old); end; $$;
create trigger appointment_audit after insert or update on public.appointments for each row execute function public.audit_change();
create trigger service_audit after insert or update on public.services for each row execute function public.audit_change();
create trigger payment_audit after insert on public.payments for each row execute function public.audit_change();
create trigger expense_audit after insert on public.expenses for each row execute function public.audit_change();
create function public.notify_appointment() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare kind text;
begin
 if tg_op='INSERT' then kind:='confirmed'; elsif new.status='cancelled' and old.status<>'cancelled' then kind:='cancelled'; elsif new.starts_at<>old.starts_at then kind:='rescheduled'; else return new; end if;
 if new.contact_email<>'' then insert into public.email_outbox(appointment_id,event,recipient,payload) values(new.id,kind,new.contact_email,jsonb_build_object('service',new.service_name,'starts_at',new.starts_at,'price_cents',new.price_cents)); end if;
 return new;
end; $$;
create trigger appointment_notification after insert or update on public.appointments for each row execute function public.notify_appointment();

-- Solo devuelve horas: nunca nombres, contactos o identificadores de otras reservas.
create function public.available_slots(p_day date, p_ignore uuid default null) returns table(starts_at timestamptz,ends_at timestamptz) language plpgsql stable security definer set search_path=public,pg_temp as $$
declare cfg public.business_settings; ex public.schedule_exceptions; hours jsonb; item jsonb; s timestamptz; e timestamptz; finish timestamptz; occupied timestamptz;
begin
 select * into cfg from public.business_settings where id;
 if not cfg.booking_enabled or p_day < (now() at time zone cfg.timezone)::date or p_day > (now() at time zone cfg.timezone)::date+cfg.horizon_days then return; end if;
 -- Ignorar un turno requiere propiedad y estado modificable.
 if p_ignore is not null and not exists(select 1 from public.appointments a where a.id=p_ignore and a.status='confirmed' and (a.user_id=auth.uid() or public.is_admin())) then raise exception 'No autorizado'; end if;
 select * into ex from public.schedule_exceptions where day=p_day;
 if found then if ex.closed then return; end if; hours:=ex.intervals;
 else select coalesce(jsonb_agg(jsonb_build_object('starts',w.starts,'ends',w.ends)),'[]') into hours from public.weekly_working_hours w where weekday=extract(dow from p_day); end if;
 for item in select * from jsonb_array_elements(hours) loop
 s:=(p_day+(item->>'starts')::time) at time zone cfg.timezone;
 finish:=(p_day+(item->>'ends')::time) at time zone cfg.timezone;
 while s+make_interval(mins=>cfg.slot_minutes)<=finish loop
 e:=s+make_interval(mins=>cfg.slot_minutes); occupied:=e+make_interval(mins=>cfg.buffer_minutes);
 if s>=now()+make_interval(hours=>cfg.min_notice_hours) and not exists(select 1 from public.appointments a where a.status<>'cancelled' and (p_ignore is null or a.id<>p_ignore) and tstzrange(a.starts_at,a.occupied_until,'[)') && tstzrange(s,occupied,'[)')) and not exists(select 1 from public.schedule_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(s,occupied,'[)')) then starts_at:=s; ends_at:=e; return next; end if;
 s:=occupied;
 end loop;
 end loop;
end; $$;

create function public.book_appointment(p_service uuid,p_start timestamptz,p_key uuid,p_name text default null,p_email text default null,p_phone text default null) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid(); cfg public.business_settings; svc public.services; prof public.profiles; existing uuid; result uuid; slot_end timestamptz; admin boolean:=public.is_admin();
begin
 if u is null then raise exception 'Iniciá sesión para reservar'; end if;
 perform pg_advisory_xact_lock(420011);
 select id into existing from public.appointments where created_by=u and idempotency_key=p_key;
 if found then return existing; end if;
 if (select count(*) from public.appointments where created_by=u and created_at>now()-interval '1 hour') >= (case when admin then 60 else 8 end) then raise exception 'Límite de reservas alcanzado. Intentá más tarde'; end if;
 if not admin and (select count(*) from public.appointments where user_id=u and status='confirmed' and starts_at>now())>=3 then raise exception 'Podés tener hasta 3 turnos futuros'; end if;
 select * into cfg from public.business_settings where id;
 select * into svc from public.services where id=p_service and active;
 if not found then raise exception 'El servicio ya no está disponible'; end if;
 select * into prof from public.profiles where id=u;
 select a.ends_at into slot_end from public.available_slots((p_start at time zone cfg.timezone)::date) a where a.starts_at=p_start limit 1;
 if slot_end is null then raise exception 'El horario ya no está disponible'; end if;
 if admin and p_name is not null and (length(trim(p_name))<2 or length(p_name)>100 or length(coalesce(p_email,''))>254 or length(coalesce(p_phone,''))>40) then raise exception 'Revisá los datos de contacto'; end if;
 insert into public.appointments(user_id,created_by,service_id,service_name,price_cents,contact_name,contact_email,contact_phone,starts_at,ends_at,occupied_until,source,idempotency_key)
 values(case when admin and p_name is not null then null else u end,u,svc.id,svc.name,svc.price_cents,case when admin and p_name is not null then trim(p_name) else prof.display_name end,case when admin and p_name is not null then coalesce(p_email,'') else prof.email end,case when admin and p_name is not null then coalesce(p_phone,'') else prof.phone end,p_start,slot_end,slot_end+make_interval(mins=>cfg.buffer_minutes),case when admin then 'admin' else 'web' end,p_key) returning id into result;
 return result;
end; $$;

create function public.change_appointment(p_id uuid,p_action text,p_start timestamptz default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.appointments; cfg public.business_settings; e timestamptz; admin boolean:=public.is_admin(); cost bigint;
begin
 perform pg_advisory_xact_lock(420011);
 select * into a from public.appointments where id=p_id for update;
 if not found or auth.uid() is null or (not admin and a.user_id is distinct from auth.uid()) then raise exception 'No autorizado'; end if;
 if a.status<>'confirmed' then raise exception 'El turno ya no se puede modificar'; end if;
 if not admin and a.starts_at<now()+interval '24 hours' then raise exception 'Solo podés modificar hasta 24 horas antes'; end if;
 if p_action='cancel' then update public.appointments set status='cancelled',updated_at=now() where id=p_id;
 elsif p_action='reschedule' then
 select * into cfg from public.business_settings where id;
 select x.ends_at into e from public.available_slots((p_start at time zone cfg.timezone)::date,p_id) x where x.starts_at=p_start limit 1;
 if e is null then raise exception 'El horario ya no está disponible'; end if;
 update public.appointments set starts_at=p_start,ends_at=e,occupied_until=e+make_interval(mins=>cfg.buffer_minutes),updated_at=now() where id=p_id;
 elsif admin and p_action in ('completed','no_show') then
 if a.starts_at>now() then raise exception 'El turno todavía no comenzó'; end if;
 select variable_cost_cents into cost from public.cost_settings where month<=date_trunc('month',a.starts_at at time zone 'America/Argentina/Buenos_Aires')::date order by month desc limit 1;
 update public.appointments set status=p_action::public.appointment_status,variable_cost_cents=coalesce(cost,0),updated_at=now() where id=p_id;
 else raise exception 'Acción no permitida'; end if;
end; $$;

create function public.update_profile(p_name text,p_phone text) returns void language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if auth.uid() is null or length(trim(p_name)) not between 2 and 100 or length(p_phone)>40 then raise exception 'Datos inválidos'; end if;
 update public.profiles set display_name=trim(p_name),phone=p_phone,updated_at=now() where id=auth.uid(); end; $$;

-- Todas las mutaciones de agenda comparten el mismo lock que las reservas.
-- Rechaza cambios incompatibles con turnos confirmados sin cancelarlos silenciosamente.
create function public.configure_schedule(p_kind text,p_data jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row jsonb; n integer; dayval date; item jsonb;
begin
 if not public.is_admin() then raise exception 'Solo administrador'; end if;
 perform pg_advisory_xact_lock(420011);
 if p_kind='settings' then update public.business_settings set name=left(p_data->>'name',100),address=left(coalesce(p_data->>'address',''),300),contact=left(coalesce(p_data->>'contact',''),100),instagram=left(coalesce(p_data->>'instagram',''),100),booking_enabled=(p_data->>'booking_enabled')::boolean,slot_minutes=(p_data->>'slot_minutes')::int,buffer_minutes=(p_data->>'buffer_minutes')::int,min_notice_hours=(p_data->>'min_notice_hours')::int,horizon_days=(p_data->>'horizon_days')::int,updated_at=now() where id;
 elsif p_kind='weekly' then
 delete from public.weekly_working_hours;
 for row in select * from jsonb_array_elements(p_data) loop insert into public.weekly_working_hours(weekday,starts,ends) values((row->>'weekday')::int,(row->>'starts')::time,(row->>'ends')::time); end loop;
 if exists(select 1 from public.weekly_working_hours a join public.weekly_working_hours b on a.id<>b.id and a.weekday=b.weekday and a.starts<b.ends and a.ends>b.starts) then raise exception 'Los intervalos de trabajo se superponen'; end if;
 elsif p_kind='exception' then
 dayval:=(p_data->>'day')::date;
 for row in select * from jsonb_array_elements(coalesce(p_data->'intervals','[]')) loop
 if (row->>'starts')::time >= (row->>'ends')::time then raise exception 'Intervalo inválido'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_data->'intervals') with ordinality a(v,i),jsonb_array_elements(p_data->'intervals') with ordinality b(v,i) where a.i<b.i and (a.v->>'starts')::time<(b.v->>'ends')::time and (a.v->>'ends')::time>(b.v->>'starts')::time) then raise exception 'Intervalos superpuestos'; end if;
 insert into public.schedule_exceptions(day,closed,intervals,reason) values(dayval,(p_data->>'closed')::boolean,coalesce(p_data->'intervals','[]'),left(coalesce(p_data->>'reason',''),300)) on conflict(day) do update set closed=excluded.closed,intervals=excluded.intervals,reason=excluded.reason;
 elsif p_kind='remove_exception' then delete from public.schedule_exceptions where id=(p_data->>'id')::uuid;
 elsif p_kind='block' then insert into public.schedule_blocks(starts_at,ends_at,reason) values((p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,left(coalesce(p_data->>'reason',''),300));
 elsif p_kind='remove_block' then delete from public.schedule_blocks where id=(p_data->>'id')::uuid;
 else raise exception 'Configuración no válida'; end if;
 if exists(select 1 from public.appointments a,public.business_settings cfg where a.status='confirmed' and a.starts_at>now() and (
 exists(select 1 from public.schedule_blocks b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(a.starts_at,a.occupied_until,'[)'))
 or case when exists(select 1 from public.schedule_exceptions ex where ex.day=(a.starts_at at time zone cfg.timezone)::date) then not exists(select 1 from public.schedule_exceptions ex,jsonb_array_elements(ex.intervals) it where ex.day=(a.starts_at at time zone cfg.timezone)::date and not ex.closed and (a.starts_at at time zone cfg.timezone)::time>=(it->>'starts')::time and (a.ends_at at time zone cfg.timezone)::date=ex.day and (a.ends_at at time zone cfg.timezone)::time<=(it->>'ends')::time) else not exists(select 1 from public.weekly_working_hours w where w.weekday=extract(dow from a.starts_at at time zone cfg.timezone) and (a.starts_at at time zone cfg.timezone)::time>=w.starts and (a.ends_at at time zone cfg.timezone)::time<=w.ends and (a.starts_at at time zone cfg.timezone)::date=(a.ends_at at time zone cfg.timezone)::date) end
 )) then raise exception 'El cambio afecta turnos confirmados. Reprogramalos o cancelalos antes'; end if;
 insert into public.audit_logs(actor,action,details) values(auth.uid(),'schedule:'||p_kind,p_data);
end; $$;

-- Cola con leases: SKIP LOCKED evita dos workers procesando el mismo evento.
create function public.claim_emails() returns setof public.email_outbox language plpgsql security definer set search_path=public,pg_temp as $$ begin
 return query with todo as (select id from public.email_outbox where ((status in ('pending','failed') and next_attempt_at<=now()) or (status='processing' and locked_at<now()-interval '10 minutes')) and attempts<8 order by created_at for update skip locked limit 20) update public.email_outbox e set status='processing',attempts=e.attempts+1,locked_at=now() from todo where e.id=todo.id returning e.*;
end; $$;

create function public.day_occupancy(p_day date) returns table(capacity_minutes numeric,booked_minutes numeric) language plpgsql stable security definer set search_path=public,pg_temp as $$
declare cfg public.business_settings; ex public.schedule_exceptions; hours jsonb; work tstzmultirange; blocks tstzmultirange; booked tstzmultirange; net tstzmultirange;
begin
 if not public.is_admin() then raise exception 'Solo administrador'; end if;
 select * into cfg from public.business_settings where id;
 select * into ex from public.schedule_exceptions where day=p_day;
 if found then hours:=case when ex.closed then '[]'::jsonb else ex.intervals end;
 else select coalesce(jsonb_agg(jsonb_build_object('starts',w.starts,'ends',w.ends)),'[]') into hours from public.weekly_working_hours w where weekday=extract(dow from p_day); end if;
 select coalesce(range_agg(tstzrange((p_day+(h->>'starts')::time) at time zone cfg.timezone,(p_day+(h->>'ends')::time) at time zone cfg.timezone,'[)')),'{}'::tstzmultirange) into work from jsonb_array_elements(hours) h;
 select coalesce(range_agg(tstzrange(starts_at,ends_at,'[)')),'{}'::tstzmultirange) into blocks from public.schedule_blocks where tstzrange(starts_at,ends_at,'[)') && work;
 net:=work-blocks;
 select coalesce(range_agg(tstzrange(starts_at,ends_at,'[)')),'{}'::tstzmultirange) into booked from public.appointments where status<>'cancelled' and tstzrange(starts_at,ends_at,'[)') && net;
 select coalesce(sum(extract(epoch from upper(r)-lower(r))/60),0) into capacity_minutes from unnest(net) r;
 select coalesce(sum(extract(epoch from upper(r)-lower(r))/60),0) into booked_minutes from unnest(booked*net) r;
 return next;
end; $$;
revoke all on function public.day_occupancy(date) from public,anon,authenticated;
grant execute on function public.day_occupancy(date) to authenticated;

-- RLS: ningún cliente escribe directamente en tablas de negocio.
alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
alter table public.business_settings enable row level security;
create policy settings_read on public.business_settings for select using(true);
alter table public.services enable row level security;
create policy services_read on public.services for select using(active or public.is_admin());
create policy services_admin on public.services for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.appointments enable row level security;
create policy appointments_read on public.appointments for select to authenticated using(user_id=auth.uid() or public.is_admin());
alter table public.weekly_working_hours enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.schedule_blocks enable row level security;
create policy weekly_admin on public.weekly_working_hours for select to authenticated using(public.is_admin());
create policy exceptions_admin on public.schedule_exceptions for select to authenticated using(public.is_admin());
create policy blocks_admin on public.schedule_blocks for select to authenticated using(public.is_admin());
alter table public.client_notes enable row level security;
create policy notes_admin on public.client_notes for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.payments enable row level security;
create policy payments_admin_read on public.payments for select to authenticated using(public.is_admin());
create policy payments_admin_insert on public.payments for insert to authenticated with check(public.is_admin() and created_by=auth.uid() and exists(select 1 from public.appointments a where a.id=appointment_id and a.status in ('confirmed','completed')));
alter table public.expenses enable row level security;
create policy expenses_admin_read on public.expenses for select to authenticated using(public.is_admin());
create policy expenses_admin_insert on public.expenses for insert to authenticated with check(public.is_admin() and created_by=auth.uid());
alter table public.cost_settings enable row level security;
create policy costs_admin on public.cost_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.email_outbox enable row level security;
alter table public.audit_logs enable row level security;
create policy audit_admin on public.audit_logs for select to authenticated using(public.is_admin());

-- Mínimo privilegio incluso si el proyecto no tiene default grants de Supabase.
grant usage on schema public to anon,authenticated,service_role;
grant select on public.services,public.business_settings to anon,authenticated;
grant select on public.profiles,public.appointments,public.weekly_working_hours,public.schedule_exceptions,public.schedule_blocks,public.audit_logs to authenticated;
grant select,insert,update on public.services,public.client_notes,public.cost_settings to authenticated;
grant select,insert on public.payments,public.expenses to authenticated;
grant all on public.email_outbox to service_role;
revoke all on function public.is_admin(), public.handle_new_user(), public.audit_change(), public.notify_appointment(), public.available_slots(date,uuid), public.book_appointment(uuid,timestamptz,uuid,text,text,text), public.change_appointment(uuid,text,timestamptz), public.update_profile(text,text), public.configure_schedule(text,jsonb), public.claim_emails() from public,anon,authenticated;
grant execute on function public.is_admin() to anon,authenticated;
grant execute on function public.available_slots(date,uuid) to anon,authenticated;
grant execute on function public.book_appointment(uuid,timestamptz,uuid,text,text,text), public.change_appointment(uuid,text,timestamptz), public.update_profile(text,text), public.configure_schedule(text,jsonb) to authenticated;
grant execute on function public.claim_emails() to service_role;
commit;
