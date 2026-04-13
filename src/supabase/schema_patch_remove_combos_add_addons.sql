-- Patch: remove combos from active menu and add new add-ons
-- Run this in Supabase SQL Editor after your base schema has been applied.

begin;

-- Hide combo items from the active catalog.
update public.products
set available = false,
    updated_at = now()
where category = 'combos';

-- Add or update Hashbrown add-on.
insert into public.products (
  id,
  name,
  price,
  cost,
  category,
  size,
  flavor,
  image_url,
  available,
  stock,
  low_stock_threshold,
  ingredients,
  sales_velocity
) values (
  '20000000-0000-0000-0000-000000000009',
  'Hashbrown',
  45,
  20,
  'add-ons',
  'none',
  'none',
  'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=400&fit=crop',
  true,
  80,
  15,
  '[]'::jsonb,
  'normal'
)
on conflict (id) do update
set name = excluded.name,
    price = excluded.price,
    cost = excluded.cost,
    category = excluded.category,
    size = excluded.size,
    flavor = excluded.flavor,
    image_url = excluded.image_url,
    available = excluded.available,
    stock = excluded.stock,
    low_stock_threshold = excluded.low_stock_threshold,
    ingredients = excluded.ingredients,
    sales_velocity = excluded.sales_velocity,
    updated_at = now();

-- Add or update Chicken Poppers add-on.
insert into public.products (
  id,
  name,
  price,
  cost,
  category,
  size,
  flavor,
  image_url,
  available,
  stock,
  low_stock_threshold,
  ingredients,
  sales_velocity
) values (
  '20000000-0000-0000-0000-000000000010',
  'Chicken Poppers',
  89,
  45,
  'add-ons',
  'none',
  'none',
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
  true,
  60,
  12,
  '[]'::jsonb,
  'fast'
)
on conflict (id) do update
set name = excluded.name,
    price = excluded.price,
    cost = excluded.cost,
    category = excluded.category,
    size = excluded.size,
    flavor = excluded.flavor,
    image_url = excluded.image_url,
    available = excluded.available,
    stock = excluded.stock,
    low_stock_threshold = excluded.low_stock_threshold,
    ingredients = excluded.ingredients,
    sales_velocity = excluded.sales_velocity,
    updated_at = now();

commit;
