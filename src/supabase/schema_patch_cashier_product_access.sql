-- Patch: allow cashier to read sellable products (same live product table as manager)
-- Run this after your base schema.

begin;

drop policy if exists "products_select_for_staff" on public.products;

create policy "products_select_for_staff"
on public.products
for select
to authenticated
using (
  public.is_manager()
  or (available = true and stock > 0)
);

commit;
