-- Manager-only user management patch
-- Adds RPCs for editing staff details and resetting staff passwords directly.

create or replace function public.update_staff_account(
  p_staff_id uuid,
  p_name text,
  p_role public.role_type,
  p_avatar_url text default null
)
returns public.staff_users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.staff_users;
  v_target public.staff_users;
  v_name text := trim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to edit staff accounts';
  end if;

  select * into v_actor
  from public.staff_users
  where auth_user_id = auth.uid();

  if not found or v_actor.role <> 'manager' then
    raise exception 'Only managers can edit staff accounts';
  end if;

  if v_name = '' then
    raise exception 'Name is required';
  end if;

  select * into v_target
  from public.staff_users
  where id = p_staff_id
  for update;

  if not found then
    raise exception 'Staff user not found';
  end if;

  update public.staff_users
  set
    name = v_name,
    role = p_role,
    avatar_url = nullif(trim(coalesce(p_avatar_url, '')), '')
  where id = p_staff_id
  returning * into v_target;

  perform public.append_activity_log(
    'User Edit',
    format('Updated staff account: %s (%s)', v_target.name, v_target.role)
  );

  return v_target;
end;
$$;

create or replace function public.reset_staff_password(
  p_staff_id uuid,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor public.staff_users;
  v_target public.staff_users;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to reset passwords';
  end if;

  select * into v_actor
  from public.staff_users
  where auth_user_id = auth.uid();

  if not found or v_actor.role <> 'manager' then
    raise exception 'Only managers can reset staff passwords';
  end if;

  if p_new_password is null or length(trim(p_new_password)) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  select * into v_target
  from public.staff_users
  where id = p_staff_id;

  if not found then
    raise exception 'Staff user not found';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(trim(p_new_password), extensions.gen_salt('bf')),
    updated_at = timezone('utc', now()),
    recovery_token = ''
  where id = v_target.auth_user_id;

  perform public.append_activity_log(
    'Password Reset',
    format('Password reset by manager for %s', v_target.name)
  );

  return true;
end;
$$;

grant execute on function public.update_staff_account(uuid, text, public.role_type, text) to authenticated;
grant execute on function public.reset_staff_password(uuid, text) to authenticated;
