-- Alertas de validade centralizados por loja.
-- Cada lote elegível gera uma notificação para todos os colaboradores ativos
-- da mesma loja; a função de entrega encaminha a notificação a todos os
-- dispositivos registrados de cada colaborador.

create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'validaestoque_alert_project_url') then
    perform vault.create_secret('https://kkayksyzksexoarpfxyj.supabase.co', 'validaestoque_alert_project_url');
  end if;

  if not exists (select 1 from vault.decrypted_secrets where name = 'validaestoque_alert_anon_key') then
    perform vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYXlrc3l6a3NleG9hcnBmeHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNTUzNTQsImV4cCI6MjEwMTczMTM1NH0.LQr5D-2BRg_BZYJg4ImCwIZguVcb0P0U6CwLwsJUV-w', 'validaestoque_alert_anon_key');
  end if;
end;
$$;

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
    'Validade em atenção',
    product.name || ' · Lote ' || lot.code || ' vence em ' || (lot.expiry_date - current_date)::text || ' dia(s).',
    'expiry',
    jsonb_build_object(
      'store_id', product.store_id,
      'product_id', product.id,
      'product_name', product.name,
      'lot_code', lot.code,
      'expiry_date', lot.expiry_date,
      'days_to_expiry', lot.expiry_date - current_date
    )
  from public.inventory_lots lot
  join public.inventory_products product on product.id = lot.product_id
  join public.employee_profiles recipient
    on recipient.store_id = product.store_id
    and recipient.status = 'active'
  where lot.current_quantity > 0
    and product.is_archived = false
    and lot.expiry_date between current_date and current_date + p_default_warning_days
    and not exists (
      select 1
      from public.notifications notification
      where notification.user_id = recipient.id
        and notification.lot_id = lot.id
        and notification.kind = 'expiry'
        and notification.created_at::date = current_date
    );

  get diagnostics queued_count = row_count;
  return queued_count;
end;
$$;

revoke all on function public.queue_expiry_alerts(integer) from public;
revoke execute on function public.queue_expiry_alerts(integer) from anon, authenticated;
grant execute on function public.queue_expiry_alerts(integer) to service_role;

create or replace function public.deliver_queued_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text;
  anon_key text;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'validaestoque_alert_project_url'
  limit 1;

  select decrypted_secret into anon_key
  from vault.decrypted_secrets
  where name = 'validaestoque_alert_anon_key'
  limit 1;

  if project_url is null or anon_key is null then
    raise warning 'Entrega de alerta ignorada: credenciais internas ausentes.';
    return new;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/deliver-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 10000
  );

  return new;
end;
$$;

revoke all on function public.deliver_queued_notification() from public;
revoke execute on function public.deliver_queued_notification() from anon, authenticated;
grant execute on function public.deliver_queued_notification() to service_role;

drop trigger if exists deliver_queued_notification on public.notifications;
create trigger deliver_queued_notification
after insert on public.notifications
for each row
when (new.delivery_status = 'queued')
execute function public.deliver_queued_notification();

select cron.schedule(
  'validaestoque-expiry-alerts-hourly',
  '5 * * * *',
  'select public.queue_expiry_alerts(5);'
);
