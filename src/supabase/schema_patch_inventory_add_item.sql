-- Allow managers to create inventory items (ingredients) from the app.
-- Run this after your main schema in Supabase SQL Editor.

drop policy if exists "ingredients_insert_manager_only" on public.ingredients;

create policy "ingredients_insert_manager_only"
on public.ingredients
for insert
to authenticated
with check (public.is_manager());

grant insert on public.ingredients to authenticated;
