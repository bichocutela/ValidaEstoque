# Notificações em múltiplos aparelhos

O ValidaEstoque agora cria o canal **Alertas de validade** no Android, solicita consentimento pelo controle de Configurações e permite testar imediatamente uma notificação local no aparelho. Cada instalação mantém seu estado de permissão e, quando disponível, seu token Expo de forma local.

## Preparação para expansão

Quando a operação passar a usar contas institucionais no Supabase Auth, cada aparelho autenticado deverá enviar seu token Expo à tabela `public.device_tokens`. A coluna `expo_push_token` é única e a função `deliver-notification` já entrega o mesmo alerta a todos os tokens vinculados ao mesmo usuário. Esse modelo permite que um gestor receba os alertas no celular e no coletor Android ao mesmo tempo, sem duplicar registros manualmente.

> O login temporário `admin/admin` não possui identidade do Supabase. Por segurança, ele não envia tokens nem abre políticas de banco para gravação anônima. A sincronização remota deve ser ativada junto com as contas de funcionários.

## Roteiro de ativação futura

1. Criar contas de funcionários no Supabase Auth e migrar o login temporário.
2. Sincronizar o token armazenado em cada aparelho com `device_tokens` após a autenticação.
3. Persistir as preferências de aviso em `notification_preferences`.
4. Criar o webhook de `notifications` para `deliver-notification` e o agendamento diário de `queue-expiry-alerts`.
5. Validar recebimento em pelo menos dois aparelhos vinculados ao mesmo usuário.
