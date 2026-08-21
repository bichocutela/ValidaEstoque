-- Arquivamento lógico: preserva lotes, movimentações e histórico do produto.
alter table public.inventory_products
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id);

create index if not exists inventory_products_store_archived_idx
  on public.inventory_products (store_id, is_archived);
