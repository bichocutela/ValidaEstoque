# Notas de arquitetura — atualização interna Android

## Capacidades confirmadas

O módulo de arquivos do Expo permite baixar arquivos de rede para o armazenamento temporário do aplicativo. A API legada também disponibiliza uma tarefa de download com callback de progresso, adequada para mostrar o avanço do APK na interface.

O módulo de intents do Expo pode abrir uma atividade Android a partir de um URI e retorna ao aplicativo quando o usuário volta da atividade externa. Portanto, o aplicativo pode conduzir o usuário até a tela de instalação do sistema após terminar o download.

## Limite Android

O Android não permite que um aplicativo comum instale ou atualize outro APK silenciosamente. Depois do download, o aplicativo abre o instalador nativo do Android; o usuário ainda precisa confirmar a instalação e, se necessário, autorizar instalações provenientes do ValidaEstoque. O fluxo evita navegador e gerenciador de arquivos, mas a confirmação final pertence ao sistema operacional.

## Fontes verificadas

- [FileSystem — Expo](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [IntentLauncher — Expo](https://docs.expo.dev/versions/latest/sdk/intent-launcher/)
