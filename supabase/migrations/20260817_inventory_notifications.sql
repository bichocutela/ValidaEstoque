create extension if not exists pgcrypto;

create type public.inventory_quality as enum ('bom_estado', 'deteriorado', 'estragado', 'vencido');
create type public.inventory_arrival_status as enum ('normal', 'validade_critica', 'avariado');
create type public.inventory_movement_type as enum ('recebido', 'vendido', 'avariado', 'vencido', 'estragado', 'ajuste');
create type public.notification_kind as enum ('expiry', 'stock', 'quality', 'system');
create type public.notification_delivery_status as enum ('queued', 'sent', 'failed', 'read');

create table public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 180),
  brand text,
  category text,
  volume text,
  barcode text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, barcode)
);

create table public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  code text not null,
  expiry_date date not null,
  received_at date not null default current_date,
  initial_quantity integer not null check (initial_quantity >= 0),
  current_quantity integer not null check (current_quantity >= 0),
  quality public.inventory_quality not null default 'bom_estado',
  arrival_status public.inventory_arrival_status not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, code)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.inventory_lots(id) on delete restrict,
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity integer not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  warning_days integer not null default 5 check (warning_days between 1 and 60),
  alert_on_expiry_day boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lot_id uuid references public.inventory_lots(id) on delete set null,
  title text not null,
  body text not null,
  kind public.notification_kind not null,
  delivery_status public.notification_delivery_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index inventory_products_owner_id_idx on public.inventory_products(owner_id);
create index inventory_lots_expiry_date_idx on public.inventory_lots(expiry_date);
create index inventory_lots_product_id_idx on public.inventory_lots(product_id);
create index inventory_movements_lot_id_created_at_idx on public.inventory_movements(lot_id, created_at desc);
create index notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
create index notifications_delivery_status_idx on public.notifications(delivery_status, created_at);

alter table public.inventory_products enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.device_tokens enable row level security;
alter table public.notifications enable row level security;

create policy "owners manage own products" on public.inventory_products for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage own lots" on public.inventory_lots for all using (exists (select 1 from public.inventory_products p where p.id = product_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.inventory_products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "owners manage own movements" on public.inventory_movements for all using (exists (select 1 from public.inventory_products p where p.id = product_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.inventory_products p where p.id = product_id and p.owner_id = auth.uid()));
create policy "users manage own notification preferences" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own device tokens" on public.device_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read and update own notifications" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
    p.owner_id,
    l.id,
    'Validade em atenção',
    p.name || ' · Lote ' || l.code || ' vence em ' || (l.expiry_date - current_date)::text || ' dia(s).',
    'expiry',
    jsonb_build_object('product_id', p.id, 'product_name', p.name, 'lot_code', l.code, 'expiry_date', l.expiry_date)
  from public.inventory_lots l
  join public.inventory_products p on p.id = l.product_id
  left join public.notification_preferences pref on pref.user_id = p.owner_id
  where l.current_quantity > 0
    and l.expiry_date between current_date and current_date + coalesce(pref.warning_days, p_default_warning_days)
    and coalesce(pref.enabled, true)
    and not exists (
      select 1 from public.notifications n
      where n.lot_id = l.id and n.kind = 'expiry' and n.created_at::date = current_date
    );
  get diagnostics queued_count = row_count;
  return queued_count;
end;
$$;

revoke all on function public.queue_expiry_alerts(integer) from public;
revoke execute on function public.queue_expiry_alerts(integer) from anon, authenticated;
grant execute on function public.queue_expiry_alerts(integer) to service_role;
