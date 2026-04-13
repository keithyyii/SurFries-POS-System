-- Run this in a fresh Supabase project.
-- It creates the POS schema, seeds the required manager and cashier accounts,
-- and enforces access with Supabase Auth + RLS.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.role_type as enum ('manager', 'cashier');
create type public.category_type as enum ('fries', 'drinks', 'add-ons', 'combos');
create type public.size_type as enum ('small', 'medium', 'large', 'none');
create type public.flavor_type as enum ('cheese', 'barbecue', 'sour cream', 'classic', 'none');
create type public.sales_velocity_type as enum ('fast', 'normal', 'slow');
create type public.ingredient_category_type as enum ('raw', 'packaging', 'sauce');
create type public.promotion_discount_type as enum ('percentage', 'fixed');
create type public.payment_method_type as enum ('cash', 'gcash', 'card', 'e-wallet');
create type public.transaction_status_type as enum ('completed', 'refunded', 'voided');
create type public.inventory_log_type as enum ('in', 'out', 'waste', 'sale');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.staff_users (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.role_type not null default 'cashier',
  avatar_url text,
  last_login timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0,
  cost numeric(10, 2) not null default 0,
  category public.category_type not null,
  size public.size_type not null default 'none',
  flavor public.flavor_type not null default 'none',
  image_url text,
  available boolean not null default true,
  stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  ingredients jsonb not null default '[]'::jsonb,
  sales_velocity public.sales_velocity_type not null default 'normal',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ingredients (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique,
  stock numeric(10, 2) not null default 0,
  unit text not null,
  low_stock_threshold numeric(10, 2) not null default 0,
  category public.ingredient_category_type not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.promotions (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  description text not null,
  discount_type public.promotion_discount_type not null,
  value numeric(10, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  discount_code text,
  payment_method public.payment_method_type not null,
  status public.transaction_status_type not null default 'completed',
  cashier_id uuid not null references public.staff_users(id) on delete restrict,
  cashier_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.transaction_items (
  id uuid primary key default extensions.gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  category public.category_type not null,
  size public.size_type not null,
  flavor public.flavor_type not null,
  image_url text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null,
  item_name text not null,
  item_type text not null check (item_type in ('product', 'ingredient')),
  type public.inventory_log_type not null,
  quantity numeric(10, 2) not null default 0,
  unit text not null,
  reason text,
  user_id uuid references public.staff_users(id) on delete set null,
  user_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.activity_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references public.staff_users(id) on delete set null,
  user_name text not null,
  action text not null,
  details text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index idx_products_category on public.products(category);
create index idx_products_available on public.products(available);
create index idx_transactions_cashier_id on public.transactions(cashier_id);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_transaction_items_transaction_id on public.transaction_items(transaction_id);
create index idx_inventory_logs_created_at on public.inventory_logs(created_at desc);
create index idx_activity_logs_created_at on public.activity_logs(created_at desc);

create trigger set_staff_users_updated_at
before update on public.staff_users
for each row execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_ingredients_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

create trigger set_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

create or replace function public.current_staff_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.staff_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_staff_role()
returns public.role_type
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.staff_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_staff_role() = 'manager', false);
$$;

create or replace function public.list_cashier_products()
returns table (
  id uuid,
  name text,
  price numeric,
  category public.category_type,
  size public.size_type,
  flavor public.flavor_type,
  image_url text,
  available boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.price,
    p.category,
    p.size,
    p.flavor,
    p.image_url,
    p.available
  from public.products p
  where p.available = true
    and p.stock > 0
  order by p.created_at asc;
$$;

create or replace function public.create_auth_user(
  p_email text,
  p_password text,
  p_user_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_user_id uuid := extensions.gen_random_uuid();
  v_now timestamptz := timezone('utc', now());
begin
  if v_email = '' then
    raise exception 'Email is required';
  end if;

  if p_password is null or length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'An auth user already exists for %', v_email;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    v_now,
    v_now,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    coalesce(p_user_meta, '{}'::jsonb),
    false,
    v_now,
    v_now,
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    extensions.gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true
    ),
    'email',
    v_now,
    v_now,
    v_now
  );

  return v_user_id;
end;
$$;

create or replace function public.seed_staff_account(
  p_name text,
  p_email text,
  p_password text,
  p_role public.role_type,
  p_avatar_url text default null
)
returns public.staff_users
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_existing_staff public.staff_users;
  v_auth_user_id uuid;
  v_staff public.staff_users;
begin
  select * into v_existing_staff
  from public.staff_users
  where email = v_email;

  if found then
    return v_existing_staff;
  end if;

  select id into v_auth_user_id
  from auth.users
  where email = v_email
  limit 1;

  if v_auth_user_id is null then
    v_auth_user_id := public.create_auth_user(
      v_email,
      p_password,
      jsonb_build_object('name', p_name, 'staff_role', p_role)
    );
  end if;

  insert into public.staff_users (
    auth_user_id,
    name,
    email,
    role,
    avatar_url,
    last_login
  ) values (
    v_auth_user_id,
    trim(p_name),
    v_email,
    p_role,
    p_avatar_url,
    timezone('utc', now())
  )
  returning * into v_staff;

  return v_staff;
end;
$$;

create or replace function public.create_staff_account(
  p_name text,
  p_email text,
  p_password text,
  p_role public.role_type,
  p_avatar_url text default null
)
returns public.staff_users
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_auth_user_id uuid;
  v_staff public.staff_users;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create staff accounts';
  end if;

  if not public.is_manager() then
    raise exception 'Only managers can create staff accounts';
  end if;

  if trim(p_name) = '' then
    raise exception 'Name is required';
  end if;

  if v_email = '' then
    raise exception 'Email is required';
  end if;

  if exists (select 1 from public.staff_users where email = v_email) then
    raise exception 'A staff account already exists for %', v_email;
  end if;

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'A Supabase Auth user already exists for %', v_email;
  end if;

  v_auth_user_id := public.create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'staff_role', p_role)
  );

  insert into public.staff_users (
    auth_user_id,
    name,
    email,
    role,
    avatar_url
  ) values (
    v_auth_user_id,
    trim(p_name),
    v_email,
    p_role,
    p_avatar_url
  )
  returning * into v_staff;

  return v_staff;
end;
$$;

create or replace function public.touch_staff_last_login()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid := public.current_staff_user_id();
  v_timestamp timestamptz := timezone('utc', now());
begin
  if auth.uid() is null or v_staff_id is null then
    raise exception 'No authenticated staff profile found';
  end if;

  update public.staff_users
  set last_login = v_timestamp
  where id = v_staff_id;

  return v_timestamp;
end;
$$;

create or replace function public.append_activity_log(
  p_action text,
  p_details text
)
returns public.activity_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff public.staff_users;
  v_log public.activity_logs;
  v_action text := trim(p_action);
  v_details text := trim(p_details);
begin
  select * into v_staff
  from public.staff_users
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'No authenticated staff profile found';
  end if;

  if v_action not in (
    'Login',
    'Logout',
    'Sale',
    'Product Add',
    'Product Edit',
    'Product Delete',
    'Product Toggle',
    'Stock In',
    'Stock Out',
    'Waste Recorded',
    'User Add'
  ) then
    raise exception 'Unsupported activity type';
  end if;

  if v_staff.role <> 'manager' and v_action not in ('Login', 'Logout', 'Sale') then
    raise exception 'Cashiers cannot record that activity type';
  end if;

  if v_details = '' then
    raise exception 'Activity details are required';
  end if;

  insert into public.activity_logs (
    user_id,
    user_name,
    action,
    details
  ) values (
    v_staff.id,
    v_staff.name,
    v_action,
    v_details
  )
  returning * into v_log;

  return v_log;
end;
$$;

create or replace function public.adjust_ingredient_stock(
  p_ingredient_id uuid,
  p_type public.inventory_log_type,
  p_quantity numeric,
  p_reason text,
  p_user_id uuid
)
returns public.inventory_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.staff_users;
  v_ingredient public.ingredients;
  v_log public.inventory_logs;
  v_new_stock numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to adjust stock';
  end if;

  select * into v_user
  from public.staff_users
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Staff user not found';
  end if;

  if v_user.role <> 'manager' then
    raise exception 'Only managers can adjust stock';
  end if;

  if p_user_id is distinct from v_user.id then
    raise exception 'Stock adjustments can only be submitted for the signed-in manager';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  if p_type not in ('in', 'out', 'waste') then
    raise exception 'Invalid stock adjustment type';
  end if;

  select * into v_ingredient
  from public.ingredients
  where id = p_ingredient_id
  for update;

  if not found then
    raise exception 'Ingredient not found';
  end if;

  if p_type in ('out', 'waste') and v_ingredient.stock < p_quantity then
    raise exception 'Insufficient stock for %', v_ingredient.name;
  end if;

  v_new_stock := case
    when p_type = 'in' then v_ingredient.stock + p_quantity
    else v_ingredient.stock - p_quantity
  end;

  update public.ingredients
  set stock = v_new_stock
  where id = v_ingredient.id
  returning * into v_ingredient;

  insert into public.inventory_logs (
    item_id,
    item_name,
    item_type,
    type,
    quantity,
    unit,
    reason,
    user_id,
    user_name
  ) values (
    v_ingredient.id,
    v_ingredient.name,
    'ingredient',
    p_type,
    p_quantity,
    v_ingredient.unit,
    coalesce(nullif(trim(p_reason), ''), case when p_type = 'in' then 'Stock replenishment' else 'Adjustment' end),
    v_user.id,
    v_user.name
  )
  returning * into v_log;

  return v_log;
end;
$$;

create or replace function public.process_sale(
  p_cashier_id uuid,
  p_payment_method public.payment_method_type,
  p_discount_code text,
  p_discount numeric,
  p_subtotal numeric,
  p_tax numeric,
  p_total numeric,
  p_items jsonb
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cashier public.staff_users;
  v_transaction public.transactions;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_promo public.promotions;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_net numeric(10, 2) := 0;
  v_tax numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to process a sale';
  end if;

  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  select * into v_cashier
  from public.staff_users
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Cashier not found';
  end if;

  if p_cashier_id is distinct from v_cashier.id then
    raise exception 'Sales can only be submitted for the signed-in staff account';
  end if;

  for v_item in
    select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(coalesce((v_item ->> 'quantity')::integer, 0), 1);

    select * into v_product
    from public.products
    where id = (v_item ->> 'id')::uuid;

    if not found then
      raise exception 'Product not found for item %', v_item ->> 'id';
    end if;

    if not v_product.available then
      raise exception 'Product % is unavailable', v_product.name;
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if nullif(trim(coalesce(p_discount_code, '')), '') is not null then
    select * into v_promo
    from public.promotions
    where upper(code) = upper(trim(p_discount_code))
      and active = true;

    if not found then
      raise exception 'Invalid or inactive promo code';
    end if;

    v_discount := case
      when v_promo.discount_type = 'percentage' then round((v_subtotal * v_promo.value) / 100, 2)
      else least(v_subtotal, v_promo.value)
    end;
  end if;

  v_net := greatest(v_subtotal - v_discount, 0);
  v_tax := round(v_net * 0.10, 2);
  v_total := round(v_net + v_tax, 2);

  insert into public.transactions (
    subtotal,
    discount,
    tax,
    total,
    discount_code,
    payment_method,
    status,
    cashier_id,
    cashier_name
  ) values (
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    nullif(trim(p_discount_code), ''),
    p_payment_method,
    'completed',
    v_cashier.id,
    v_cashier.name
  )
  returning * into v_transaction;

  for v_item in
    select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(coalesce((v_item ->> 'quantity')::integer, 0), 1);

    select * into v_product
    from public.products
    where id = (v_item ->> 'id')::uuid
    for update;

    if not found then
      raise exception 'Product not found for item %', v_item ->> 'id';
    end if;

    if not v_product.available then
      raise exception 'Product % is unavailable', v_product.name;
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    update public.products
    set stock = stock - v_quantity
    where id = v_product.id;

    insert into public.transaction_items (
      transaction_id,
      product_id,
      product_name,
      category,
      size,
      flavor,
      image_url,
      quantity,
      unit_price,
      line_total
    ) values (
      v_transaction.id,
      v_product.id,
      v_product.name,
      v_product.category,
      v_product.size,
      v_product.flavor,
      v_product.image_url,
      v_quantity,
      v_product.price,
      v_product.price * v_quantity
    );

    insert into public.inventory_logs (
      item_id,
      item_name,
      item_type,
      type,
      quantity,
      unit,
      reason,
      user_id,
      user_name
    ) values (
      v_product.id,
      v_product.name,
      'product',
      'sale',
      v_quantity,
      'pcs',
      'Sale ' || v_transaction.id,
      v_cashier.id,
      v_cashier.name
    );
  end loop;

  return v_transaction;
end;
$$;

alter table public.staff_users enable row level security;
alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.promotions enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.activity_logs enable row level security;

create policy "staff_users_select_self_or_manager"
on public.staff_users
for select
to authenticated
using (auth.uid() = auth_user_id or public.is_manager());

create policy "products_select_for_staff"
on public.products
for select
to authenticated
using (public.is_manager());

create policy "products_insert_manager_only"
on public.products
for insert
to authenticated
with check (public.is_manager());

create policy "products_update_manager_only"
on public.products
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy "products_delete_manager_only"
on public.products
for delete
to authenticated
using (public.is_manager());

create policy "ingredients_manager_only"
on public.ingredients
for select
to authenticated
using (public.is_manager());

create policy "promotions_select_for_staff"
on public.promotions
for select
to authenticated
using (public.is_manager() or active = true);

create policy "transactions_select_manager_or_owner"
on public.transactions
for select
to authenticated
using (public.is_manager() or cashier_id = public.current_staff_user_id());

create policy "transaction_items_select_manager_or_owner"
on public.transaction_items
for select
to authenticated
using (
  public.is_manager()
  or exists (
    select 1
    from public.transactions t
    where t.id = transaction_id
      and t.cashier_id = public.current_staff_user_id()
  )
);

create policy "inventory_logs_select_manager_or_owner"
on public.inventory_logs
for select
to authenticated
using (public.is_manager() or user_id = public.current_staff_user_id());

create policy "activity_logs_select_manager_or_owner"
on public.activity_logs
for select
to authenticated
using (public.is_manager() or user_id = public.current_staff_user_id());

grant usage on schema public to anon, authenticated;
grant select on public.staff_users, public.products, public.ingredients, public.promotions, public.transactions, public.transaction_items, public.inventory_logs, public.activity_logs to authenticated;
grant insert, update, delete on public.products to authenticated;

grant execute on function public.current_staff_user_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.list_cashier_products() to authenticated;
grant execute on function public.create_staff_account(text, text, text, public.role_type, text) to authenticated;
grant execute on function public.touch_staff_last_login() to authenticated;
grant execute on function public.append_activity_log(text, text) to authenticated;
grant execute on function public.adjust_ingredient_stock(uuid, public.inventory_log_type, numeric, text, uuid) to authenticated;
grant execute on function public.process_sale(uuid, public.payment_method_type, text, numeric, numeric, numeric, numeric, jsonb) to authenticated;

revoke all on function public.create_auth_user(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.seed_staff_account(text, text, text, public.role_type, text) from public, anon, authenticated;

select public.seed_staff_account(
  'SurFries Manager',
  'surfries@manager.com',
  'surfriesmanager',
  'manager',
  'https://i.pravatar.cc/150?u=surfries-manager'
);

select public.seed_staff_account(
  'SurFries Cashier',
  'surfries@cashier.com',
  'surfriescashier',
  'cashier',
  'https://i.pravatar.cc/150?u=surfries-cashier'
);

insert into public.ingredients (id, name, stock, unit, low_stock_threshold, category)
values
  ('10000000-0000-0000-0000-000000000001', 'Potatoes', 500, 'kg', 50, 'raw'),
  ('10000000-0000-0000-0000-000000000002', 'Salt', 20, 'kg', 5, 'raw'),
  ('10000000-0000-0000-0000-000000000003', 'Cheese Sauce', 10, 'L', 2, 'sauce'),
  ('10000000-0000-0000-0000-000000000004', 'BBQ Sauce', 8, 'L', 2, 'sauce'),
  ('10000000-0000-0000-0000-000000000005', 'Paper Box', 1000, 'pcs', 100, 'packaging'),
  ('10000000-0000-0000-0000-000000000006', 'Paper Cup', 800, 'pcs', 100, 'packaging');

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
)
values
  ('20000000-0000-0000-0000-000000000001', 'POORITA (Single Fries)', 49, 20, 'fries', 'small', 'classic', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', true, 50, 10, '[{"name":"Potatoes","quantity":1,"unit":"bag"},{"name":"Salt","quantity":0.01,"unit":"kg"},{"name":"Paper Box","quantity":1,"unit":"pcs"}]'::jsonb, 'fast'),
  ('20000000-0000-0000-0000-000000000002', 'NAKAKALUWAG (Fries w/ HB or C.POP)', 79, 32, 'fries', 'medium', 'classic', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop', true, 30, 5, '[{"name":"Potatoes","quantity":1,"unit":"bag"},{"name":"Cheese Sauce","quantity":0.1,"unit":"L"},{"name":"Paper Box","quantity":1,"unit":"pcs"}]'::jsonb, 'fast'),
  ('20000000-0000-0000-0000-000000000003', 'RICH KID (Double Fries)', 89, 38, 'fries', 'large', 'classic', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=400&fit=crop', true, 40, 8, '[]'::jsonb, 'normal'),
  ('20000000-0000-0000-0000-000000000004', 'CONTRACTOR (2 Fries w/ HB or C.PooritaOP)', 119, 50, 'fries', 'large', 'classic', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop', true, 20, 5, '[]'::jsonb, 'normal'),
  ('20000000-0000-0000-0000-000000000009', 'TAGAPAGMANA (Trio)', 119, 52, 'fries', 'large', 'classic', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', true, 18, 4, '[]'::jsonb, 'normal'),
  ('20000000-0000-0000-0000-000000000005', 'Iced Lemon Tea', 1.8, 0.5, 'drinks', 'medium', 'none', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop', true, 100, 20, '[]'::jsonb, 'fast'),
  ('20000000-0000-0000-0000-000000000006', 'Fresh Orange Juice', 2.2, 0.8, 'drinks', 'medium', 'none', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop', true, 60, 15, '[]'::jsonb, 'normal'),
  ('20000000-0000-0000-0000-000000000007', 'Extra Cheese Sauce', 0.5, 0.1, 'add-ons', 'none', 'cheese', '/src/extracheese.jpg', true, 200, 30, '[]'::jsonb, 'fast'),
  ('20000000-0000-0000-0000-000000000008', 'Family Combo', 12, 5, 'combos', 'large', 'none', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop', true, 15, 3, '[]'::jsonb, 'normal');

insert into public.promotions (id, code, description, discount_type, value, active)
values
  ('30000000-0000-0000-0000-000000000001', 'WELCOME10', '10% off for new customers', 'percentage', 10, true),
  ('30000000-0000-0000-0000-000000000002', 'FRIESDAY', '₱2 off on Fridays', 'fixed', 2, true);
