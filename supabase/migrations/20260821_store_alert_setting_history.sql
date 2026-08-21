create table if not exists public.store_alert_setting_history (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  previous_warning_days integer not null check (previous_warning_days in (3, 5, 7, 10, 15, 30)),
  next_warning_days integer not null check (next_warning_days in (3, 5, 7, 10, 15, 30)),
  changed_at timestamptz not null default now()
);

create index if not exists store_alert_setting_history_store_changed_at_idx
on public.store_alert_setting_history (store_id, changed_at desc);

alter table public.store_alert_setting_history enable row level security;

create policy "store admins read alert setting history"
on public.store_alert_setting_history for select
using (store_id = public.current_employee_store_id() and public.is_store_admin());

create or replace function public.audit_store_alert_setting_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.expiry_warning_days is distinct from new.expiry_warning_days then
    insert into public.store_alert_setting_history (
      store_id,
      changed_by,
      previous_warning_days,
      next_warning_days
    ) values (
      new.store_id,
      coalesce(auth.uid(), new.updated_by),
      old.expiry_warning_days,
      new.expiry_warning_days
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_store_alert_setting_changed on public.store_alert_settings;
create trigger on_store_alert_setting_changed
after update of expiry_warning_days on public.store_alert_settings
for each row execute function public.audit_store_alert_setting_change();

revoke all on function public.audit_store_alert_setting_change() from public;
revoke execute on function public.audit_store_alert_setting_change() from anon, authenticated;
