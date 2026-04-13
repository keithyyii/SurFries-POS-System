-- Patch: update drink prices and remove Extra Cheese Sauce add-on
-- Run this after the base schema and prior patches.

begin;

update public.products
set price = 35,
    updated_at = now()
where name = 'Iced Lemon Tea';

update public.products
set price = 30,
    updated_at = now()
where name = 'Fresh Orange Juice';

-- Remove add-on from active catalog and database.
delete from public.products
where name = 'Extra Cheese Sauce'
  and category = 'add-ons';

commit;
