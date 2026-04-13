-- Enable manager-only promotion CRUD while keeping staff read access.
-- Run this in Supabase SQL Editor after your existing schema.

drop policy if exists "promotions_insert_manager_only" on public.promotions;
drop policy if exists "promotions_update_manager_only" on public.promotions;
drop policy if exists "promotions_delete_manager_only" on public.promotions;

create policy "promotions_insert_manager_only"
on public.promotions
for insert
to authenticated
with check (public.is_manager());

create policy "promotions_update_manager_only"
on public.promotions
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy "promotions_delete_manager_only"
on public.promotions
for delete
to authenticated
using (public.is_manager());

grant insert, update, delete on public.promotions to authenticated;
