-- Revenue-based seed from Excel (Jan-Feb 2026) + generated mock data (Mar-Apr 13, 2026)
-- Uses DAILY REVENUE as source truth, then splits into realistic transactions.
-- Re-runnable: replaces transactions in range 2026-01-01..2026-04-13.

begin;

create temporary table tmp_daily_revenue (
  day_date date not null,
  orders integer not null,
  revenue numeric(10,2) not null,
  best_seller text not null,
  peak_hour text not null,
  source text not null
) on commit drop;

insert into tmp_daily_revenue (day_date, orders, revenue, best_seller, peak_hour, source)
values
  ('2026-01-01', 33, 1980.00, 'Tagapagmana', '6-8 PM', 'excel_revenue'),
  ('2026-01-02', 41, 3444.00, 'Nakakaluwag', '4-6 PM', 'excel_revenue'),
  ('2026-01-03', 37, 4033.00, 'Rich Kid', '5-7 PM', 'excel_revenue'),
  ('2026-01-04', 24, 2160.00, 'Contractor', '5-7 PM', 'excel_revenue'),
  ('2026-01-05', 18, 2124.00, 'Nakakaluwag', '6-8 PM', 'excel_revenue'),
  ('2026-01-06', 43, 5074.00, 'Nakakaluwag', '6-9 PM', 'excel_revenue'),
  ('2026-01-07', 29, 3335.00, 'Rich Kid', '7-9 PM', 'excel_revenue'),
  ('2026-01-08', 33, 3564.00, 'Contractor', '7-9 PM', 'excel_revenue'),
  ('2026-01-09', 43, 3569.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-01-10', 29, 1856.00, 'Nakakaluwag', '6-8 PM', 'excel_revenue'),
  ('2026-01-11', 32, 3008.00, 'Nakakaluwag', '5-7 PM', 'excel_revenue'),
  ('2026-01-12', 17, 1326.00, 'Rich Kid', '6-9 PM', 'excel_revenue'),
  ('2026-01-13', 19, 2052.00, 'Rich Kid', '5-7 PM', 'excel_revenue'),
  ('2026-01-14', 15, 1650.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-01-15', 15, 1050.00, 'Tagapagmana', '4-6 PM', 'excel_revenue'),
  ('2026-01-16', 33, 3960.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-01-17', 23, 1863.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-01-18', 30, 3300.00, 'Nakakaluwag', '4-6 PM', 'excel_revenue'),
  ('2026-01-19', 45, 4860.00, 'Poorita', '7-9 PM', 'excel_revenue'),
  ('2026-01-20', 20, 1580.00, 'Rich Kid', '7-9 PM', 'excel_revenue'),
  ('2026-01-21', 30, 3030.00, 'Contractor', '4-6 PM', 'excel_revenue'),
  ('2026-01-22', 25, 3000.00, 'Tagapagmana', '5-7 PM', 'excel_revenue'),
  ('2026-01-23', 44, 4356.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-01-24', 27, 1647.00, 'Tagapagmana', '4-6 PM', 'excel_revenue'),
  ('2026-01-25', 22, 2464.00, 'Rich Kid', '4-6 PM', 'excel_revenue'),
  ('2026-01-26', 17, 1462.00, 'Tagapagmana', '7-9 PM', 'excel_revenue'),
  ('2026-01-27', 28, 3136.00, 'Contractor', '5-7 PM', 'excel_revenue'),
  ('2026-01-28', 29, 2407.00, 'Tagapagmana', '4-6 PM', 'excel_revenue'),
  ('2026-01-29', 21, 1953.00, 'Nakakaluwag', '5-7 PM', 'excel_revenue'),
  ('2026-01-30', 25, 2275.00, 'Rich Kid', '6-8 PM', 'excel_revenue'),
  ('2026-01-31', 31, 3689.00, 'Tagapagmana', '5-7 PM', 'excel_revenue'),
  ('2026-02-01', 30, 2970.00, 'Nakakaluwag', '4-6 PM', 'excel_revenue'),
  ('2026-02-02', 15, 1755.00, 'Poorita', '4-6 PM', 'excel_revenue'),
  ('2026-02-03', 25, 2725.00, 'Nakakaluwag', '6-8 PM', 'excel_revenue'),
  ('2026-02-04', 22, 2618.00, 'Rich Kid', '4-6 PM', 'excel_revenue'),
  ('2026-02-05', 45, 4770.00, 'Poorita', '5-7 PM', 'excel_revenue'),
  ('2026-02-06', 24, 2040.00, 'Rich Kid', '6-9 PM', 'excel_revenue'),
  ('2026-02-07', 37, 2627.00, 'Poorita', '4-6 PM', 'excel_revenue'),
  ('2026-02-08', 19, 1311.00, 'Tagapagmana', '5-7 PM', 'excel_revenue'),
  ('2026-02-09', 24, 1608.00, 'Tagapagmana', '6-9 PM', 'excel_revenue'),
  ('2026-02-10', 37, 3330.00, 'Tagapagmana', '6-8 PM', 'excel_revenue'),
  ('2026-02-11', 25, 2325.00, 'Tagapagmana', '6-8 PM', 'excel_revenue'),
  ('2026-02-12', 34, 3332.00, 'Nakakaluwag', '5-7 PM', 'excel_revenue'),
  ('2026-02-13', 28, 1848.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-02-14', 27, 1701.00, 'Poorita', '6-8 PM', 'excel_revenue'),
  ('2026-02-15', 17, 1513.00, 'Tagapagmana', '7-9 PM', 'excel_revenue'),
  ('2026-02-16', 33, 2442.00, 'Tagapagmana', '5-7 PM', 'excel_revenue'),
  ('2026-02-17', 20, 1440.00, 'Nakakaluwag', '7-9 PM', 'excel_revenue'),
  ('2026-02-18', 37, 3922.00, 'Poorita', '7-9 PM', 'excel_revenue'),
  ('2026-02-19', 33, 3597.00, 'Nakakaluwag', '5-7 PM', 'excel_revenue'),
  ('2026-02-20', 16, 1520.00, 'Rich Kid', '5-7 PM', 'excel_revenue'),
  ('2026-02-21', 19, 1425.00, 'Rich Kid', '7-9 PM', 'excel_revenue'),
  ('2026-02-22', 34, 2346.00, 'Contractor', '6-8 PM', 'excel_revenue'),
  ('2026-02-23', 28, 2268.00, 'Poorita', '5-7 PM', 'excel_revenue'),
  ('2026-02-24', 17, 2023.00, 'Rich Kid', '5-7 PM', 'excel_revenue'),
  ('2026-02-25', 20, 2100.00, 'Contractor', '6-9 PM', 'excel_revenue'),
  ('2026-02-26', 19, 1957.00, 'Rich Kid', '6-9 PM', 'excel_revenue'),
  ('2026-02-27', 22, 1320.00, 'Tagapagmana', '4-6 PM', 'excel_revenue'),
  ('2026-02-28', 17, 1326.00, 'Nakakaluwag', '5-7 PM', 'excel_revenue'),
  ('2026-03-01', 32, 2217.68, 'Tagapagmana', '6-9 PM', 'mock_revenue'),
  ('2026-03-02', 27, 2176.92, 'Chicken Poppers', '7-9 PM', 'mock_revenue'),
  ('2026-03-03', 31, 2453.46, 'Poorita', '4-6 PM', 'mock_revenue'),
  ('2026-03-04', 27, 2282.94, 'Tagapagmana', '7-9 PM', 'mock_revenue'),
  ('2026-03-05', 32, 2263.45, 'Iced Lemon Tea', '7-9 PM', 'mock_revenue'),
  ('2026-03-06', 26, 3600.18, 'Nakakaluwag', '7-9 PM', 'mock_revenue'),
  ('2026-03-07', 28, 2963.02, 'Iced Lemon Tea', '4-6 PM', 'mock_revenue'),
  ('2026-03-08', 32, 2460.14, 'Rich Kid', '5-7 PM', 'mock_revenue'),
  ('2026-03-09', 26, 2718.44, 'Contractor', '5-7 PM', 'mock_revenue'),
  ('2026-03-10', 25, 2243.36, 'Nakakaluwag', '7-9 PM', 'mock_revenue'),
  ('2026-03-11', 21, 2350.51, 'Nakakaluwag', '7-9 PM', 'mock_revenue'),
  ('2026-03-12', 34, 3659.10, 'Contractor', '5-7 PM', 'mock_revenue'),
  ('2026-03-13', 34, 2898.14, 'Rich Kid', '4-6 PM', 'mock_revenue'),
  ('2026-03-14', 30, 2387.46, 'Rich Kid', '6-8 PM', 'mock_revenue'),
  ('2026-03-15', 25, 2793.99, 'Nakakaluwag', '4-6 PM', 'mock_revenue'),
  ('2026-03-16', 19, 1701.17, 'Contractor', '4-6 PM', 'mock_revenue'),
  ('2026-03-17', 22, 2232.27, 'Poorita', '6-9 PM', 'mock_revenue'),
  ('2026-03-18', 24, 3300.96, 'Poorita', '4-6 PM', 'mock_revenue'),
  ('2026-03-19', 28, 3302.00, 'Nakakaluwag', '5-7 PM', 'mock_revenue'),
  ('2026-03-20', 32, 2431.36, 'Poorita', '6-9 PM', 'mock_revenue'),
  ('2026-03-21', 18, 1790.34, 'Iced Lemon Tea', '7-9 PM', 'mock_revenue'),
  ('2026-03-22', 26, 2246.83, 'Chicken Poppers', '7-9 PM', 'mock_revenue'),
  ('2026-03-23', 25, 2716.18, 'Nakakaluwag', '5-7 PM', 'mock_revenue'),
  ('2026-03-24', 27, 2241.65, 'Contractor', '6-8 PM', 'mock_revenue'),
  ('2026-03-25', 26, 2606.35, 'Rich Kid', '6-8 PM', 'mock_revenue'),
  ('2026-03-26', 37, 2481.24, 'Nakakaluwag', '5-7 PM', 'mock_revenue'),
  ('2026-03-27', 33, 2877.26, 'Iced Lemon Tea', '4-6 PM', 'mock_revenue'),
  ('2026-03-28', 28, 2444.47, 'Poorita', '6-8 PM', 'mock_revenue'),
  ('2026-03-29', 20, 1339.29, 'Poorita', '6-8 PM', 'mock_revenue'),
  ('2026-03-30', 23, 2471.24, 'Contractor', '7-9 PM', 'mock_revenue'),
  ('2026-03-31', 27, 3187.08, 'Contractor', '5-7 PM', 'mock_revenue'),
  ('2026-04-01', 23, 2671.38, 'Tagapagmana', '4-6 PM', 'mock_revenue'),
  ('2026-04-02', 26, 2928.45, 'Poorita', '6-8 PM', 'mock_revenue'),
  ('2026-04-03', 34, 4049.50, 'Rich Kid', '5-7 PM', 'mock_revenue'),
  ('2026-04-04', 24, 2170.68, 'Poorita', '7-9 PM', 'mock_revenue'),
  ('2026-04-05', 26, 1746.92, 'Poorita', '6-8 PM', 'mock_revenue'),
  ('2026-04-06', 33, 2760.98, 'Nakakaluwag', '4-6 PM', 'mock_revenue'),
  ('2026-04-07', 25, 2773.72, 'Chicken Poppers', '7-9 PM', 'mock_revenue'),
  ('2026-04-08', 24, 2431.74, 'Nakakaluwag', '6-8 PM', 'mock_revenue'),
  ('2026-04-09', 22, 3623.81, 'Rich Kid', '4-6 PM', 'mock_revenue'),
  ('2026-04-10', 28, 3319.65, 'Poorita', '4-6 PM', 'mock_revenue'),
  ('2026-04-11', 23, 2596.52, 'Contractor', '4-6 PM', 'mock_revenue'),
  ('2026-04-12', 29, 2151.60, 'Rich Kid', '5-7 PM', 'mock_revenue'),
  ('2026-04-13', 24, 2468.26, 'Nakakaluwag', '5-7 PM', 'mock_revenue');

-- Clear existing seeded range first (transaction_items cascade via FK)
delete from public.transactions
where created_at::date between date '2026-01-01' and date '2026-04-13';

do $$
declare
  d record;
  i integer;
  remaining numeric(10,2);
  tx_total numeric(10,2);
  avg_ticket numeric(10,2);
  pick_name text;
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

  for d in select * from tmp_daily_revenue order by day_date asc loop
    remaining := d.revenue;
    avg_ticket := round((d.revenue / greatest(d.orders, 1))::numeric, 2);

    for i in 1..d.orders loop
      if i = d.orders then
        tx_total := round(greatest(35::numeric, remaining), 2);
      else
        tx_total := round(greatest(35::numeric, avg_ticket + ((random()::numeric - 0.5::numeric) * avg_ticket * 0.40::numeric)), 2);
        if tx_total > remaining - ((d.orders - i) * 35) then
          tx_total := round(greatest(35::numeric, remaining - ((d.orders - i) * 35)), 2);
        end if;
      end if;

      remaining := round(remaining - tx_total, 2);

      -- Weighted product pick (best seller gets preference)
      if random() < 0.55 then
        pick_name := lower(d.best_seller);
      else
        case (1 + floor(random() * 8))::int
          when 1 then pick_name := 'poorita';
          when 2 then pick_name := 'nakakaluwag';
          when 3 then pick_name := 'contractor';
          when 4 then pick_name := 'rich kid';
          when 5 then pick_name := 'tagapagmana';
          when 6 then pick_name := 'iced lemon tea';
          when 7 then pick_name := 'fresh orange juice';
          else pick_name := 'chicken poppers';
        end case;
      end if;

      if pick_name like '%poorita%' then
        v_category := 'fries'; v_size := 'small'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%poorita%' limit 1;
      elsif pick_name like '%nakakaluwag%' then
        v_category := 'fries'; v_size := 'medium'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%nakakaluwag%' limit 1;
      elsif pick_name like '%contractor%' then
        v_category := 'fries'; v_size := 'large'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%contractor%' limit 1;
      elsif pick_name like '%rich kid%' then
        v_category := 'fries'; v_size := 'large'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%rich kid%' limit 1;
      elsif pick_name like '%tagapagmana%' then
        v_category := 'fries'; v_size := 'medium'; v_flavor := 'classic';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%tagapagmana%' limit 1;
      elsif pick_name like '%iced lemon tea%' then
        v_category := 'drinks'; v_size := 'medium'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%iced%lemon%tea%' limit 1;
      elsif pick_name like '%fresh orange juice%' then
        v_category := 'drinks'; v_size := 'medium'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%fresh%orange%juice%' limit 1;
      else
        v_category := 'add-ons'; v_size := 'none'; v_flavor := 'none';
        select id, name, image_url into v_product_id, v_product_name, v_product_image from public.products where lower(name) like '%chicken%pop%' limit 1;
      end if;

      if v_product_name is null then
        select id, name, image_url into v_product_id, v_product_name, v_product_image
        from public.products order by created_at asc limit 1;
      end if;

      if random() < 0.63 then
        v_cashier_id := v_cashier_staff_id;
        v_cashier_name := coalesce(v_cashier_staff_name, 'SurFries Cashier');
      else
        v_cashier_id := v_manager_staff_id;
        v_cashier_name := coalesce(v_manager_staff_name, 'SurFries Manager');
      end if;

      v_payment := case when random() < 0.30 then 'gcash'::public.payment_method_type else 'cash'::public.payment_method_type end;

      -- Peak-hour aligned timestamp window
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
        tx_total,
        0,
        0,
        tx_total,
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
        coalesce(v_product_name, initcap(pick_name)),
        v_category,
        v_size,
        v_flavor,
        v_product_image,
        1,
        tx_total,
        tx_total,
        v_ts
      );
    end loop;
  end loop;
end
$$;

commit;
