# Supabase — ValidaEstoque

O projeto `kkayksyzksexoarpfxyj` concentra o inventário sincronizado, as preferências de alerta, os dispositivos e o histórico de notificações. A migração em `migrations/20260817_inventory_notifications.sql` cria tabelas com RLS habilitado para que cada usuário autenticado só acesse seus próprios dados.

## Entrega de alertas

O fluxo usa o Supabase como centro de decisão e registro. A função `queue-expiry-alerts` executa `queue_expiry_alerts()` e insere alertas de validade na tabela `notifications`. A função `deliver-notification` recebe uma nova notificação, consulta os tokens Expo registrados em `device_tokens` e aciona o serviço Expo Push. Dessa forma, Firebase não é a fonte de dados nem o orquestrador dos alertas.

No painel Supabase, crie um **Database Webhook** com o evento `INSERT` em `public.notifications`, escolhendo a Edge Function `deliver-notification`. Adicione um cabeçalho de autenticação com a chave de serviço do Supabase. Para a varredura diária, invoque a função `queue-expiry-alerts` com um token de serviço a partir de um agendador confiável.

> O aplicativo só receberá push após registrar, com consentimento do usuário, seu token Expo em `device_tokens`.
