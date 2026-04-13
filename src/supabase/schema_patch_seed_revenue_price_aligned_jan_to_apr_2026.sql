-- Revenue-based seed (Jan 1 to Apr 13, 2026)
-- Price/tax aligned with POS rules:
-- subtotal = sum(product price * qty)
-- tax = 10% of subtotal
-- total = subtotal + tax
-- Re-runnable: replaces transactions in seeded date range.

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
  ('2026-01-01', 33, 1980.00, 'Tagapagmana', '6–8 PM', 'excel_revenue'),
  ('2026-01-02', 41, 3444.00, 'Nakakaluwag', '4–6 PM', 'excel_revenue'),
  ('2026-01-03', 37, 4033.00, 'Rich Kid', '5–7 PM', 'excel_revenue'),
  ('2026-01-04', 24, 2160.00, 'Contractor', '5–7 PM', 'excel_revenue'),
  ('2026-01-05', 18, 2124.00, 'Nakakaluwag', '6–8 PM', 'excel_revenue'),
  ('2026-01-06', 43, 5074.00, 'Nakakaluwag', '6–9 PM', 'excel_revenue'),
  ('2026-01-07', 29, 3335.00, 'Rich Kid', '7–9 PM', 'excel_revenue'),
  ('2026-01-08', 33, 3564.00, 'Contractor', '7–9 PM', 'excel_revenue'),
  ('2026-01-09', 43, 3569.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-01-10', 29, 1856.00, 'Nakakaluwag', '6–8 PM', 'excel_revenue'),
  ('2026-01-11', 32, 3008.00, 'Nakakaluwag', '5–7 PM', 'excel_revenue'),
  ('2026-01-12', 17, 1326.00, 'Rich Kid', '6–9 PM', 'excel_revenue'),
  ('2026-01-13', 19, 2052.00, 'Rich Kid', '5–7 PM', 'excel_revenue'),
  ('2026-01-14', 15, 1650.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-01-15', 15, 1050.00, 'Tagapagmana', '4–6 PM', 'excel_revenue'),
  ('2026-01-16', 33, 3960.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-01-17', 23, 1863.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-01-18', 30, 3300.00, 'Nakakaluwag', '4–6 PM', 'excel_revenue'),
  ('2026-01-19', 45, 4860.00, 'Poorita', '7–9 PM', 'excel_revenue'),
  ('2026-01-20', 20, 1580.00, 'Rich Kid', '7–9 PM', 'excel_revenue'),
  ('2026-01-21', 30, 3030.00, 'Contractor', '4–6 PM', 'excel_revenue'),
  ('2026-01-22', 25, 3000.00, 'Tagapagmana', '5–7 PM', 'excel_revenue'),
  ('2026-01-23', 44, 4356.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-01-24', 27, 1647.00, 'Tagapagmana', '4–6 PM', 'excel_revenue'),
  ('2026-01-25', 22, 2464.00, 'Rich Kid', '4–6 PM', 'excel_revenue'),
  ('2026-01-26', 17, 1462.00, 'Tagapagmana', '7–9 PM', 'excel_revenue'),
  ('2026-01-27', 28, 3136.00, 'Contractor', '5–7 PM', 'excel_revenue'),
  ('2026-01-28', 29, 2407.00, 'Tagapagmana', '4–6 PM', 'excel_revenue'),
  ('2026-01-29', 21, 1953.00, 'Nakakaluwag', '5–7 PM', 'excel_revenue'),
  ('2026-01-30', 25, 2275.00, 'Rich Kid', '6–8 PM', 'excel_revenue'),
  ('2026-01-31', 31, 3689.00, 'Tagapagmana', '5–7 PM', 'excel_revenue'),
  ('2026-02-01', 30, 2970.00, 'Nakakaluwag', '4–6 PM', 'excel_revenue'),
  ('2026-02-02', 15, 1755.00, 'Poorita', '4–6 PM', 'excel_revenue'),
  ('2026-02-03', 25, 2725.00, 'Nakakaluwag', '6–8 PM', 'excel_revenue'),
  ('2026-02-04', 22, 2618.00, 'Rich Kid', '4–6 PM', 'excel_revenue'),
  ('2026-02-05', 45, 4770.00, 'Poorita', '5–7 PM', 'excel_revenue'),
  ('2026-02-06', 24, 2040.00, 'Rich Kid', '6–9 PM', 'excel_revenue'),
  ('2026-02-07', 37, 2627.00, 'Poorita', '4–6 PM', 'excel_revenue'),
  ('2026-02-08', 19, 1311.00, 'Tagapagmana', '5–7 PM', 'excel_revenue'),
  ('2026-02-09', 24, 1608.00, 'Tagapagmana', '6–9 PM', 'excel_revenue'),
  ('2026-02-10', 37, 3330.00, 'Tagapagmana', '6–8 PM', 'excel_revenue'),
  ('2026-02-11', 25, 2325.00, 'Tagapagmana', '6–8 PM', 'excel_revenue'),
  ('2026-02-12', 34, 3332.00, 'Nakakaluwag', '5–7 PM', 'excel_revenue'),
  ('2026-02-13', 28, 1848.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-02-14', 27, 1701.00, 'Poorita', '6–8 PM', 'excel_revenue'),
  ('2026-02-15', 17, 1513.00, 'Tagapagmana', '7–9 PM', 'excel_revenue'),
  ('2026-02-16', 33, 2442.00, 'Tagapagmana', '5–7 PM', 'excel_revenue'),
  ('2026-02-17', 20, 1440.00, 'Nakakaluwag', '7–9 PM', 'excel_revenue'),
  ('2026-02-18', 37, 3922.00, 'Poorita', '7–9 PM', 'excel_revenue'),
  ('2026-02-19', 33, 3597.00, 'Nakakaluwag', '5–7 PM', 'excel_revenue'),
  ('2026-02-20', 16, 1520.00, 'Rich Kid', '5–7 PM', 'excel_revenue'),
  ('2026-02-21', 19, 1425.00, 'Rich Kid', '7–9 PM', 'excel_revenue'),
  ('2026-02-22', 34, 2346.00, 'Contractor', '6–8 PM', 'excel_revenue'),
  ('2026-02-23', 28, 2268.00, 'Poorita', '5–7 PM', 'excel_revenue'),
  ('2026-02-24', 17, 2023.00, 'Rich Kid', '5–7 PM', 'excel_revenue'),
  ('2026-02-25', 20, 2100.00, 'Contractor', '6–9 PM', 'excel_revenue'),
  ('2026-02-26', 19, 1957.00, 'Rich Kid', '6–9 PM', 'excel_revenue'),
  ('2026-02-27', 22, 1320.00, 'Tagapagmana', '4–6 PM', 'excel_revenue'),
  ('2026-02-28', 17, 1326.00, 'Nakakaluwag', '5–7 PM', 'excel_revenue'),
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

-- clear existing seeded period
delete from public.transactions
where created_at::date between date '2026-01-01' and date '2026-04-13';

do $$
declare
  d record;
  i integer;
  remaining_target_subtotal numeric(12,2);
  target_subtotal_per_order numeric(10,2);
  p1_id uuid;
  p1_name text;
  p1_price numeric(10,2);
  p1_category public.category_type;
  p1_size public.size_type;
  p1_flavor public.flavor_type;
  p1_image text;
  p2_id uuid;
  p2_name text;
  p2_price numeric(10,2);
  p2_category public.category_type;
  p2_size public.size_type;
  p2_flavor public.flavor_type;
  p2_image text;
  qty1 integer;
  qty2 integer;
  subtotal numeric(10,2);
  tax numeric(10,2);
  total numeric(10,2);
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
  from public.staff_users where role='cashier' order by created_at asc limit 1;

  select id, name into v_manager_staff_id, v_manager_staff_name
  from public.staff_users where role='manager' order by created_at asc limit 1;

  if v_cashier_staff_id is null and v_manager_staff_id is null then
    raise exception 'No staff users found. Seed users first.';
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
    -- Revenue is treated as gross (includes tax); convert to target subtotal
    remaining_target_subtotal := round((d.revenue / 1.10)::numeric, 2);

    for i in 1..d.orders loop
      target_subtotal_per_order := round((remaining_target_subtotal / greatest((d.orders - i + 1), 1))::numeric, 2);

      -- product 1 (biased to best seller)
      if random() < 0.60 then
        select id, name, price, category, size, flavor, image_url
        into p1_id, p1_name, p1_price, p1_category, p1_size, p1_flavor, p1_image
        from public.products
        where lower(name) like '%' || lower(d.best_seller) || '%'
        order by created_at asc
        limit 1;
      end if;

      if p1_id is null then
        select id, name, price, category, size, flavor, image_url
        into p1_id, p1_name, p1_price, p1_category, p1_size, p1_flavor, p1_image
        from public.products
        where available = true
        order by random()
        limit 1;
      end if;

      if p1_id is null then
        raise exception 'No products found. Seed products first.';
      end if;

      qty1 := greatest(1, least(5, round((target_subtotal_per_order / greatest(p1_price, 1))::numeric)::int));

      -- optional second item for realism
      p2_id := null;
      qty2 := 0;
      if random() < 0.35 then
        select id, name, price, category, size, flavor, image_url
        into p2_id, p2_name, p2_price, p2_category, p2_size, p2_flavor, p2_image
        from public.products
        where available = true and id <> p1_id
        order by random()
        limit 1;

        if p2_id is not null then
          qty2 := greatest(1, least(3, floor(random() * 2 + 1)::int));
        end if;
      end if;

      subtotal := round((p1_price * qty1 + coalesce(p2_price,0) * qty2)::numeric, 2);

      -- last order absorbs remaining target (still constrained to real menu prices)
      if i = d.orders then
        if remaining_target_subtotal > subtotal then
          qty1 := greatest(1, least(8, ceil((remaining_target_subtotal / greatest(p1_price,1))::numeric)::int));
          subtotal := round((p1_price * qty1 + coalesce(p2_price,0) * qty2)::numeric, 2);
        end if;
      end if;

      tax := round((subtotal * 0.10)::numeric, 2);
      total := round((subtotal + tax)::numeric, 2);
      remaining_target_subtotal := round((remaining_target_subtotal - subtotal)::numeric, 2);

      if random() < 0.62 then
        v_cashier_id := v_cashier_staff_id;
        v_cashier_name := coalesce(v_cashier_staff_name, 'SurFries Cashier');
      else
        v_cashier_id := v_manager_staff_id;
        v_cashier_name := coalesce(v_manager_staff_name, 'SurFries Manager');
      end if;

      v_payment := case when random() < 0.30 then 'gcash'::public.payment_method_type else 'cash'::public.payment_method_type end;

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
        v_tx_id, subtotal, 0, tax, total, null, v_payment, 'completed', v_cashier_id, v_cashier_name, v_ts
      );

      insert into public.transaction_items (
        transaction_id, product_id, product_name, category, size, flavor, image_url,
        quantity, unit_price, line_total, created_at
      ) values (
        v_tx_id, p1_id, p1_name, p1_category, p1_size, p1_flavor, p1_image,
        qty1, p1_price, round((p1_price * qty1)::numeric, 2), v_ts
      );

      if p2_id is not null and qty2 > 0 then
        insert into public.transaction_items (
          transaction_id, product_id, product_name, category, size, flavor, image_url,
          quantity, unit_price, line_total, created_at
        ) values (
          v_tx_id, p2_id, p2_name, p2_category, p2_size, p2_flavor, p2_image,
          qty2, p2_price, round((p2_price * qty2)::numeric, 2), v_ts
        );
      end if;
    end loop;
  end loop;
end
$$;

commit;
