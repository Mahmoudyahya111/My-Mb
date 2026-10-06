-- Run once in Supabase > SQL Editor (adds private storage for Funnel Check)
create table if not exists private_pages(name text primary key, html text not null, updated_at timestamptz default now());
alter table private_pages enable row level security;
create policy pp_sel on private_pages for select to authenticated using (is_admin());
create policy pp_ins on private_pages for insert to authenticated with check (is_owner());
create policy pp_upd on private_pages for update to authenticated using (is_owner()) with check (is_owner());
