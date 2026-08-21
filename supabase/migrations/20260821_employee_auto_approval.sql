create or replace function public.handle_new_employee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_bootstrap_admin boolean := coalesce((new.raw_user_meta_data ->> 'is_administrator')::boolean, false);
begin
  insert into public.employee_profiles (
    id, store_id, email, full_name, registration_number, role, status, approved_at
  ) values (
    new.id,
    (select id from public.stores where code = 'nordestao-principal'),
    coalesce(new.email, 'sem-email-' || new.id::text),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Colaborador'),
    nullif(trim(new.raw_user_meta_data ->> 'registration_number'), ''),
    case when is_bootstrap_admin or lower(coalesce(new.email, '')) = 'haydendanex@gmail.com' then 'admin'::public.employee_role else 'employee'::public.employee_role end,
    'active'::public.employee_status,
    now()
  );
  return new;
end;
$$;
