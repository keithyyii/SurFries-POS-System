-- Patch: add gcash payment mode and normalize peso text
-- Run this after your existing schema and prior patches.

-- Step 1: add enum value in its own transaction.
begin;
alter type public.payment_method_type
add value if not exists 'gcash';
commit;

-- Step 2: use the new enum value in a separate transaction.
begin;
update public.transactions
set payment_method = 'gcash'
where payment_method = 'e-wallet';

update public.promotions
set description = '₱2 off on Fridays'
where code = 'FRIESDAY';
commit;
