-- Seed transactions from Excel (Jan-Feb 2026) + mock data (Mar 01 to Apr 13, 2026)
-- Run this in Supabase SQL Editor.
-- Safe to re-run: it replaces transactions in the seeded date range.

begin;

create temporary table tmp_sales_daily (
  day_date date not null,
  orders integer not null,
  total_sales numeric(10,2) not null,
  best_seller text not null,
  peak_hour text not null,
  source text not null
) on commit drop;

insert into tmp_sales_daily (day_date, orders, total_sales, best_seller, peak_hour, source)
values
  ('2026-01-01', 33, 2040.00, 'Tagapagmana', '6-8 PM', 'excel'),
  ('2026-01-02', 41, 3524.00, 'Nakakaluwag', '4-6 PM', 'excel'),
  ('2026-01-03', 37, 4033.00, 'Rich Kid', '5-7 PM', 'excel'),
  ('2026-01-04', 24, 2160.00, 'Contractor', '5-7 PM', 'excel'),
  ('2026-01-05', 18, 2274.00, 'Nakakaluwag', '6-8 PM', 'excel'),
  ('2026-01-06', 43, 5134.00, 'Nakakaluwag', '6-9 PM', 'excel'),
  ('2026-01-07', 29, 3335.00, 'Rich Kid', '7-9 PM', 'excel'),
  ('2026-01-08', 33, 3714.00, 'Contractor', '7-9 PM', 'excel'),
  ('2026-01-09', 43, 3609.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-01-10', 29, 1936.00, 'Nakakaluwag', '6-8 PM', 'excel'),
  ('2026-01-11', 32, 3158.00, 'Nakakaluwag', '5-7 PM', 'excel'),
  ('2026-01-12', 17, 1406.00, 'Rich Kid', '6-9 PM', 'excel'),
  ('2026-01-13', 19, 2132.00, 'Rich Kid', '5-7 PM', 'excel'),
  ('2026-01-14', 15, 1750.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-01-15', 15, 1050.00, 'Tagapagmana', '4-6 PM', 'excel'),
  ('2026-01-16', 33, 4040.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-01-17', 23, 1923.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-01-18', 30, 3340.00, 'Nakakaluwag', '4-6 PM', 'excel'),
  ('2026-01-19', 45, 5010.00, 'Poorita', '7-9 PM', 'excel'),
  ('2026-01-20', 20, 1680.00, 'Rich Kid', '7-9 PM', 'excel'),
  ('2026-01-21', 30, 3090.00, 'Contractor', '4-6 PM', 'excel'),
  ('2026-01-22', 25, 3150.00, 'Tagapagmana', '5-7 PM', 'excel'),
  ('2026-01-23', 44, 4416.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-01-24', 27, 1747.00, 'Tagapagmana', '4-6 PM', 'excel'),
  ('2026-01-25', 22, 2614.00, 'Rich Kid', '4-6 PM', 'excel'),
  ('2026-01-26', 17, 1542.00, 'Tagapagmana', '7-9 PM', 'excel'),
  ('2026-01-27', 28, 3136.00, 'Contractor', '5-7 PM', 'excel'),
  ('2026-01-28', 29, 2467.00, 'Tagapagmana', '4-6 PM', 'excel'),
  ('2026-01-29', 21, 1953.00, 'Nakakaluwag', '5-7 PM', 'excel'),
  ('2026-01-30', 25, 2315.00, 'Rich Kid', '6-8 PM', 'excel'),
  ('2026-01-31', 31, 3789.00, 'Tagapagmana', '5-7 PM', 'excel'),
  ('2026-02-01', 30, 3010.00, 'Nakakaluwag', '4-6 PM', 'excel'),
  ('2026-02-02', 15, 1905.00, 'Poorita', '4-6 PM', 'excel'),
  ('2026-02-03', 25, 2875.00, 'Nakakaluwag', '6-8 PM', 'excel'),
  ('2026-02-04', 22, 2768.00, 'Rich Kid', '4-6 PM', 'excel'),
  ('2026-02-05', 45, 4870.00, 'Poorita', '5-7 PM', 'excel'),
  ('2026-02-06', 24, 2100.00, 'Rich Kid', '6-9 PM', 'excel'),
  ('2026-02-07', 37, 2667.00, 'Poorita', '4-6 PM', 'excel'),
  ('2026-02-08', 19, 1371.00, 'Tagapagmana', '5-7 PM', 'excel'),
  ('2026-02-09', 24, 1708.00, 'Tagapagmana', '6-9 PM', 'excel'),
  ('2026-02-10', 37, 3410.00, 'Tagapagmana', '6-8 PM', 'excel'),
  ('2026-02-11', 25, 2405.00, 'Tagapagmana', '6-8 PM', 'excel'),
  ('2026-02-12', 34, 3482.00, 'Nakakaluwag', '5-7 PM', 'excel'),
  ('2026-02-13', 28, 1848.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-02-14', 27, 1801.00, 'Poorita', '6-8 PM', 'excel'),
  ('2026-02-15', 17, 1553.00, 'Tagapagmana', '7-9 PM', 'excel'),
  ('2026-02-16', 33, 2592.00, 'Tagapagmana', '5-7 PM', 'excel'),
  ('2026-02-17', 20, 1440.00, 'Nakakaluwag', '7-9 PM', 'excel'),
  ('2026-02-18', 37, 3962.00, 'Poorita', '7-9 PM', 'excel'),
  ('2026-02-19', 33, 3747.00, 'Nakakaluwag', '5-7 PM', 'excel'),
  ('2026-02-20', 16, 1580.00, 'Rich Kid', '5-7 PM', 'excel'),
  ('2026-02-21', 19, 1575.00, 'Rich Kid', '7-9 PM', 'excel'),
  ('2026-02-22', 34, 2496.00, 'Contractor', '6-8 PM', 'excel'),
  ('2026-02-23', 28, 2348.00, 'Poorita', '5-7 PM', 'excel'),
  ('2026-02-24', 17, 2173.00, 'Rich Kid', '5-7 PM', 'excel'),
  ('2026-02-25', 20, 2160.00, 'Contractor', '6-9 PM', 'excel'),
  ('2026-02-26', 19, 1957.00, 'Rich Kid', '6-9 PM', 'excel'),
  ('2026-02-27', 22, 1320.00, 'Tagapagmana', '4-6 PM', 'excel'),
  ('2026-02-28', 17, 1426.00, 'Nakakaluwag', '5-7 PM', 'excel'),
  ('2026-03-01', 31, 3753.07, 'Tagapagmana', '6-9 PM', 'mock'),
  ('2026-03-02', 26, 2737.55, 'Chicken Poppers', '7-9 PM', 'mock'),
  ('2026-03-03', 24, 2854.91, 'Poorita', '4-6 PM', 'mock'),
  ('2026-03-04', 22, 2162.20, 'Tagapagmana', '7-9 PM', 'mock'),
  ('2026-03-05', 21, 2266.55, 'Iced Lemon Tea', '7-9 PM', 'mock'),
  ('2026-03-06', 38, 2806.07, 'Nakakaluwag', '7-9 PM', 'mock'),
  ('2026-03-07', 44, 4309.38, 'Iced Lemon Tea', '4-6 PM', 'mock'),
  ('2026-03-08', 34, 4157.03, 'Rich Kid', '5-7 PM', 'mock'),
  ('2026-03-09', 34, 3503.21, 'Contractor', '5-7 PM', 'mock'),
  ('2026-03-10', 22, 2026.11, 'Nakakaluwag', '7-9 PM', 'mock'),
  ('2026-03-11', 23, 1638.64, 'Nakakaluwag', '7-9 PM', 'mock'),
  ('2026-03-12', 37, 4388.52, 'Contractor', '5-7 PM', 'mock'),
  ('2026-03-13', 29, 3140.81, 'Rich Kid', '4-6 PM', 'mock'),
  ('2026-03-14', 35, 3676.16, 'Rich Kid', '6-8 PM', 'mock'),
  ('2026-03-15', 38, 3429.92, 'Nakakaluwag', '4-6 PM', 'mock'),
  ('2026-03-16', 19, 1292.50, 'Contractor', '4-6 PM', 'mock'),
  ('2026-03-17', 21, 1633.58, 'Poorita', '6-9 PM', 'mock'),
  ('2026-03-18', 35, 2965.96, 'Poorita', '4-6 PM', 'mock'),
  ('2026-03-19', 33, 3042.72, 'Nakakaluwag', '5-7 PM', 'mock'),
  ('2026-03-20', 23, 2371.51, 'Poorita', '6-9 PM', 'mock'),
  ('2026-03-21', 26, 1430.00, 'Iced Lemon Tea', '7-9 PM', 'mock'),
  ('2026-03-22', 31, 3000.23, 'Chicken Poppers', '7-9 PM', 'mock'),
  ('2026-03-23', 34, 3358.88, 'Nakakaluwag', '5-7 PM', 'mock'),
  ('2026-03-24', 21, 2108.07, 'Contractor', '6-8 PM', 'mock'),
  ('2026-03-25', 26, 2449.18, 'Rich Kid', '6-8 PM', 'mock'),
  ('2026-03-26', 23, 3078.94, 'Nakakaluwag', '5-7 PM', 'mock'),
  ('2026-03-27', 29, 3015.08, 'Iced Lemon Tea', '4-6 PM', 'mock'),
  ('2026-03-28', 36, 3567.63, 'Poorita', '6-8 PM', 'mock'),
  ('2026-03-29', 18, 1224.81, 'Poorita', '6-8 PM', 'mock'),
  ('2026-03-30', 30, 2582.47, 'Contractor', '7-9 PM', 'mock'),
  ('2026-03-31', 33, 3191.25, 'Contractor', '5-7 PM', 'mock'),
  ('2026-04-01', 26, 2153.46, 'Tagapagmana', '4-6 PM', 'mock'),
  ('2026-04-02', 28, 2341.49, 'Poorita', '6-8 PM', 'mock'),
  ('2026-04-03', 43, 4793.58, 'Rich Kid', '5-7 PM', 'mock'),
  ('2026-04-04', 31, 2429.01, 'Poorita', '7-9 PM', 'mock'),
  ('2026-04-05', 23, 2139.36, 'Poorita', '6-8 PM', 'mock'),
  ('2026-04-06', 34, 4462.67, 'Nakakaluwag', '4-6 PM', 'mock'),
  ('2026-04-07', 28, 2575.75, 'Chicken Poppers', '7-9 PM', 'mock'),
  ('2026-04-08', 23, 2005.39, 'Nakakaluwag', '6-8 PM', 'mock'),
  ('2026-04-09', 36, 2267.43, 'Rich Kid', '4-6 PM', 'mock'),
  ('2026-04-10', 34, 2750.82, 'Poorita', '4-6 PM', 'mock'),
  ('2026-04-11', 38, 2932.38, 'Contractor', '4-6 PM', 'mock'),
  ('2026-04-12', 29, 3163.43, 'Rich Kid', '5-7 PM', 'mock'),
  ('2026-04-13', 30, 2750.39, 'Nakakaluwag', '5-7 PM', 'mock');

-- Remove existing transactions in this period to avoid duplicates
-- transaction_items will be deleted via ON DELETE CASCADE
delete from public.transactions
where created_at::date between date '2026-01-01' and date '2026-04-13';

do $$
declare
  d record;
  i integer;
  remaining numeric(10,2);
  v_total numeric(10,2);
  v_base numeric(10,2);
  v_pick text;
  v_product_id uuid;
  v_product_name text;
  v_product_image text;
  v_category public.category_type;
  v_size public.size_type;
  v_flavor public.flavor_type;
  v_ts timestamptz;
  v_payment public.payment_method_type;
  v_cashier_id uuid;
  v_cashier_name text;
  v_cashier_staff_id uuid;
  v_cashier_staff_name text;
  v_manager_staff_id uuid;
  v_manager_staff_name text;
  v_tx_id uuid;
begin
  select id, name into v_cashier_staff_id, v_cashier_staff_name
  from public.staff_users
  where role = 'cashier'
  order by created_at asc
  limit 1;

  select id, name into v_manager_staff_id, v_manager_staff_name
  from public.staff_users
  where role = 'manager'
  order by created_at asc
  limit 1;

  if v_cashier_staff_id is null and v_manager_staff_id is null then
    raise exception 'No staff_users found. Seed users first.';
  end if;

  if v_cashier_staff_id is null then
    v_cashier_staff_id := v_manager_staff_id;
    v_cashier_staff_name := coalesce(v_manager_staff_name, 'SurFries Cashier');
  end if;

  if v_manager_staff_id is null then
    v_manager_staff_id := v_cashier_staff_id;
    v_manager_staff_name := coalesce(v_cashier_staff_name, 'SurFries Manager');
  end if;

  for d in
    select *
    from tmp_sales_daily
    order by day_date asc
  loop
    remaining := d.total_sales;
    v_base := round(d.total_sales / greatest(d.orders, 1), 2);

    for i in 1..d.orders loop
      if i = d.orders then
        v_total := round(greatest(35, remaining), 2);
      else
        v_total := round(greatest(35, v_base + ((random() - 0.5) * v_base * 0.35)), 2);
        if v_total > remaining - ((d.orders - i) * 35) then
          v_total := round(greatest(35, remaining - ((d.orders - i) * 35)), 2);
        end if;
      end if;

      remaining := round(remaining - v_total, 2);

      -- Choose product (favor best seller from sheet)
      if random() < 0.58 then
        v_pick := lower(d.best_seller);
      else
        case (1 + floor(random() * 8))::int
          when 1 then v_pick := 'poorita';
          when 2 then v_pick := 'nakakaluwag';
          when 3 then v_pick := 'contractor';
          when 4 then v_pick := 'rich kid';
          when 5 then v_pick := 'tagapagmana';
          when 6 then v_pick := 'iced lemon tea';
          when 7 then v_pick := 'fresh orange juice';
          else v_pick := 'chicken poppers';
        end case;
      end if;

      if v_pick like '%poorita%' then
        v_category := 'fries'; v_size := 'small'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%poorita%' limit 1;
      elsif v_pick like '%nakakaluwag%' then
        v_category := 'fries'; v_size := 'medium'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%nakakaluwag%' limit 1;
      elsif v_pick like '%contractor%' then
        v_category := 'fries'; v_size := 'large'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%contractor%' limit 1;
      elsif v_pick like '%rich kid%' then
        v_category := 'fries'; v_size := 'large'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%rich kid%' limit 1;
      elsif v_pick like '%tagapagmana%' then
        v_category := 'fries'; v_size := 'medium'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%tagapagmana%' limit 1;
      elsif v_pick like '%iced lemon tea%' then
        v_category := 'drinks'; v_size := 'medium'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%iced%lemon%tea%' limit 1;
      elsif v_pick like '%fresh orange juice%' then
        v_category := 'drinks'; v_size := 'medium'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%fresh%orange%juice%' limit 1;
      else
        v_category := 'add-ons'; v_size := 'none'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products where lower(name) like '%chicken%pop%' limit 1;
      end if;

      if v_product_name is null then
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products
        where category = v_category
        order by created_at asc
        limit 1;
      end if;

      if v_product_name is null then
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products
        order by created_at asc
        limit 1;
      end if;

      if random() < 0.62 then
        v_cashier_id := v_cashier_staff_id;
        v_cashier_name := coalesce(v_cashier_staff_name, 'SurFries Cashier');
      else
        v_cashier_id := v_manager_staff_id;
        v_cashier_name := coalesce(v_manager_staff_name, 'SurFries Manager');
      end if;

      v_payment := case when random() < 0.28 then 'gcash'::public.payment_method_type else 'cash'::public.payment_method_type end;

      -- Peak-hour aligned timestamp
      if d.peak_hour like '4-%' then
        v_ts := d.day_date::timestamptz + make_interval(hours => 16 + floor(random() * 2)::int, mins => floor(random() * 60)::int);
      elsif d.peak_hour like '5-%' then
        v_ts := d.day_date::timestamptz + make_interval(hours => 17 + floor(random() * 2)::int, mins => floor(random() * 60)::int);
      elsif d.peak_hour like '6-9%' then
        v_ts := d.day_date::timestamptz + make_interval(hours => 18 + floor(random() * 3)::int, mins => floor(random() * 60)::int);
      elsif d.peak_hour like '6-%' then
        v_ts := d.day_date::timestamptz + make_interval(hours => 18 + floor(random() * 2)::int, mins => floor(random() * 60)::int);
      else
        v_ts := d.day_date::timestamptz + make_interval(hours => 19 + floor(random() * 2)::int, mins => floor(random() * 60)::int);
      end if;

      v_tx_id := extensions.gen_random_uuid();

      insert into public.transactions (
        id, subtotal, discount, tax, total, discount_code, payment_method, status, cashier_id, cashier_name, created_at
      ) values (
        v_tx_id,
        v_total,
        0,
        0,
        v_total,
        null,
        v_payment,
        'completed',
        v_cashier_id,
        v_cashier_name,
        v_ts
      );

      insert into public.transaction_items (
        transaction_id, product_id, product_name, category, size, flavor, image_url,
        quantity, unit_price, line_total, created_at
      ) values (
        v_tx_id,
        v_product_id,
        coalesce(v_product_name, initcap(v_pick)),
        v_category,
        v_size,
        v_flavor,
        v_product_image,
        1,
        v_total,
        v_total,
        v_ts
      );
    end loop;
  end loop;
end
$$;

commit;
