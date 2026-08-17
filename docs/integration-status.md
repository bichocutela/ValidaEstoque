# Estado das integrações — 17 de agosto de 2026

## Supabase

O projeto Supabase ativo selecionado para o ValidaEstoque é `kkayksyzksexoarpfxyj`, na região `sa-east-1`. A migração de inventário, lotes, movimentações, preferências, dispositivos e notificações foi aplicada. Todas as tabelas estão com Row Level Security habilitado. As Edge Functions `queue-expiry-alerts` e `deliver-notification` também foram implantadas e exigem JWT.

O modelo definido usa o Supabase como centro de dados e alertas. A tabela `notifications` recebe os eventos, `device_tokens` registra o token Expo concedido pelo usuário e `deliver-notification` encaminha os alertas ao Expo Push. A documentação oficial do Supabase descreve esse padrão de Edge Function com Expo Push: https://supabase.com/docs/guides/functions/examples/push-notifications

## Firebase

O acesso a https://console.firebase.google.com/u/0/ está autenticado na conta Google do usuário. A sessão exibe os projetos Firebase existentes e permite criar o projeto do ValidaEstoque e registrar o aplicativo Android. A sessão será preservada enquanto o Google a mantiver válida.

O Firebase ficará preparado como suporte técnico futuro do aplicativo Android. O Supabase continua sendo a fonte de dados e o orquestrador de notificações.

## Criação do projeto Firebase

O projeto Firebase dedicado ao aplicativo foi criado com o nome **ValidaEstoque** e identificador permanente `validaestoque-hd-2026`. Os recursos opcionais **Gemini no Firebase** e **Google Analytics** foram desativados durante a criação para manter a configuração inicial mínima e focada no suporte técnico Android. O aplicativo Android foi registrado com o pacote `com.app.validadeestoque` e o apelido **ValidaEstoque**. A configuração `google-services.json` foi baixada e guardada localmente apenas em `.private/google-services.json`.

## Segredos do GitHub Actions

As configurações de distribuição e integração foram registradas no repositório https://github.com/bichocutela/ValidaEstoque em **Settings → Secrets and variables → Actions**. Os segredos presentes são `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. O workflow deve consumir essas entradas sem registrar valores em logs.
