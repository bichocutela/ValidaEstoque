create table if not exists public.store_alert_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  expiry_warning_days integer not null default 5 check (expiry_warning_days in (3, 5, 7, 10, 15, 30)),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.store_alert_settings (store_id, expiry_warning_days)
select id, 5 from public.stores
on conflict (store_id) do nothing;

alter table public.store_alert_settings enable row level security;

create policy "active employees read store alert settings"
on public.store_alert_settings for select
using (store_id = public.current_employee_store_id());

create policy "store admins manage alert settings"
on public.store_alert_settings for all
using (store_id = public.current_employee_store_id() and public.is_store_admin())
with check (store_id = public.current_employee_store_id() and public.is_store_admin());

create or replace function public.queue_expiry_alerts(p_default_warning_days integer default 5)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  queued_count integer;
begin
  insert into public.notifications (user_id, lot_id, title, body, kind, payload)
  select
    recipient.id,
    lot.id,
    case
      when lot.arrival_status = 'validade_critica' or (lot.expiry_date - current_date) <= least(3, settings.expiry_warning_days) then 'Alerta crítico de validade'
      else 'Validade em atenção'
    end,
    product.name || ' · Lote ' || lot.code || ' vence em ' || (lot.expiry_date - current_date)::text || ' dia(s).',
    'expiry',
    jsonb_build_object(
      'store_id', product.store_id,
      'product_id', product.id,
      'product_name', product.name,
      'lot_code', lot.code,
      'expiry_date', lot.expiry_date,
      'days_to_expiry', lot.expiry_date - current_date,
      'severity', case when lot.arrival_status = 'validade_critica' or (lot.expiry_date - current_date) <= least(3, settings.expiry_warning_days) then 'critical' else 'warning' end,
      'alert_lead_days', settings.expiry_warning_days
    )
  from public.inventory_lots lot
  join public.inventory_products product on product.id = lot.product_id
  join public.store_alert_settings settings on settings.store_id = product.store_id
  join public.employee_profiles recipient on recipient.store_id = product.store_id and recipient.status = 'active'
  where lot.current_quantity > 0
    and product.is_archived = false
    and lot.expiry_date between current_date and current_date + coalesce(settings.expiry_warning_days, p_default_warning_days)
    and not exists (
      select 1 from public.notifications notification
      where notification.user_id = recipient.id
        and notification.lot_id = lot.id
        and notification.kind = 'expiry'
        and notification.created_at::date = current_date
    );

  get diagnostics queued_count = row_count;
  return queued_count;
end;
$$;

select cron.schedule(
  'validaestoque-expiry-alerts-hourly',
  '5 * * * *',
  'select public.queue_expiry_alerts();'
);
