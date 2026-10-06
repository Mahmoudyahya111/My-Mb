-- Run once in Supabase > SQL Editor
create table if not exists admins(email text primary key, role text not null default 'admin', created_at timestamptz default now());
insert into admins(email,role) values ('mahmoudyahya66@gmail.com','owner') on conflict do nothing;
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admins where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $$;
create or replace function is_owner() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admins where role='owner' and lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $$;
create table if not exists events(id bigint generated always as identity primary key, created_at timestamptz default now(), type text not null check (type in ('visit','package','booking')), sid text, pkg text, lang text);
create table if not exists bookings(id bigint generated always as identity primary key, created_at timestamptz default now(), name text not null, phone text not null, pkg text, meeting_date date, slot text, message text, lang text, status text not null default 'new');
create table if not exists portfolio(id bigint generated always as identity primary key, created_at timestamptz default now(), title_en text, title_ar text, desc_en text, desc_ar text, image_url text, link_url text, active boolean not null default true);
alter table admins enable row level security; alter table events enable row level security; alter table bookings enable row level security; alter table portfolio enable row level security;
create policy ev_ins on events for insert to anon, authenticated with check (true);
create policy ev_sel on events for select to authenticated using (is_admin());
create policy bk_ins on bookings for insert to anon, authenticated with check (true);
create policy bk_sel on bookings for select to authenticated using (is_admin());
create policy bk_upd on bookings for update to authenticated using (is_admin()) with check (is_admin());
create policy pf_pub on portfolio for select to anon, authenticated using (active);
create policy pf_adm on portfolio for all to authenticated using (is_admin()) with check (is_admin());
create policy ad_sel on admins for select to authenticated using (is_admin());
create policy ad_ins on admins for insert to authenticated with check (is_owner() and role='admin');
create policy ad_del on admins for delete to authenticated using (is_owner() and role<>'owner');
create or replace function get_stats(days int default 30) returns json language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'denied'; end if;
return json_build_object(
 'visitors',(select count(distinct sid) from events where type='visit' and created_at>now()-make_interval(days=>days)),
 'bookings',(select count(*) from bookings where created_at>now()-make_interval(days=>days)),
 'packages',(select coalesce(json_object_agg(pkg,c),'{}'::json) from (select pkg,count(*) c from events where type='package' and created_at>now()-make_interval(days=>days) group by pkg) t),
 'booked',(select coalesce(json_object_agg(coalesce(pkg,'x'),c),'{}'::json) from (select pkg,count(*) c from bookings where created_at>now()-make_interval(days=>days) group by pkg) t));
end $$;

-- Run once in Supabase > SQL Editor (adds private storage for Funnel Check)
create table if not exists private_pages(name text primary key, html text not null, updated_at timestamptz default now());
alter table private_pages enable row level security;
create policy pp_sel on private_pages for select to authenticated using (is_admin());
create policy pp_ins on private_pages for insert to authenticated with check (is_owner());
create policy pp_upd on private_pages for update to authenticated using (is_owner()) with check (is_owner());
