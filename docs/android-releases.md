# Distribuição Android — ValidaEstoque

O projeto possui um fluxo manual na aba **Actions** chamado **Gerar APK Android**. Quando a execução termina, o arquivo APK fica disponível em dois locais: como artefato da execução, por 30 dias, e em **Releases**, para download direto a qualquer momento. A publicação usa um APK de release assinado; é esse tipo de pacote que permite instalar uma versão nova sobre a anterior.

## Requisito essencial para atualizar sem desinstalar

O Android só aceita uma atualização quando três condições são preservadas: o identificador do aplicativo continua `com.app.validadeestoque`, a nova versão possui um `versionCode` maior que a já instalada e o APK usa exatamente a mesma chave de assinatura. O identificador já está fixado no projeto. O workflow calcula uma versão crescente a partir do número da execução, mas a chave de assinatura precisa ser cadastrada uma vez no repositório e nunca regenerada.

> Não instale um APK de depuração se desejar receber as próximas versões por cima. Para a primeira instalação e todas as atualizações, baixe sempre o APK publicado em **Releases** pelo workflow de release.

## Preparação única no GitHub

Abra **Settings → Actions → General** no repositório. Em **Workflow permissions**, selecione **Read and write permissions** e salve; essa permissão permite que o workflow crie a release e anexe o APK. Em seguida, abra **Settings → Secrets and variables → Actions → New repository secret** e cadastre os segredos abaixo:

| Segredo                     | Conteúdo                                                       | Finalidade                               |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Arquivo `.keystore` convertido em Base64, sem quebras de linha | Contém a chave de assinatura persistente |
| `ANDROID_KEYSTORE_PASSWORD` | Senha do keystore                                              | Abre o arquivo da chave durante o build  |
| `ANDROID_KEY_ALIAS`         | Alias usado ao criar a chave, por exemplo `validaestoque`      | Seleciona a chave correta no keystore    |
| `ANDROID_KEY_PASSWORD`      | Senha da chave                                                 | Assina a variante de release             |
| `FIREBASE_GOOGLE_SERVICES_JSON_BASE64` | Arquivo `google-services.json` codificado em Base64 | Disponibiliza a configuração Firebase no projeto Android durante a build |
| `SUPABASE_URL` | Endpoint do projeto Supabase | Referência da integração de inventário e alertas |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública rotacionável do Supabase | Inicializa as chamadas autenticadas do aplicativo |

Nunca envie o arquivo `.keystore`, suas senhas ou o `google-services.json` diretamente para o repositório. O workflow recupera essas configurações dos segredos criptografados apenas durante a build.

## Criar a chave uma única vez

Em um computador seguro com Java instalado, execute o comando abaixo e guarde o arquivo e as senhas em local seguro. Não repita essa geração para futuras releases.

```bash
keytool -genkeypair -v \
  -keystore validaestoque-release.keystore \
  -alias validaestoque \
  -keyalg RSA -keysize 2048 -validity 10000

base64 -w 0 validaestoque-release.keystore > validaestoque-release.base64
```

Copie o conteúdo de `validaestoque-release.base64` para o segredo `ANDROID_KEYSTORE_BASE64`. Use a senha escolhida nas duas variáveis de senha; use o alias definido no comando em `ANDROID_KEY_ALIAS`.

## Gerar e instalar uma versão

Na aba **Actions**, selecione **Gerar APK Android** e clique em **Run workflow**. Você pode deixar os dois campos de versão vazios: o workflow usará `1.0.<número da execução>` e um `versionCode` crescente. Se preferir controlar a versão, informe por exemplo `1.0.2` e `2`.

Após a conclusão, abra a release criada, baixe o APK e instale-o no Android. Para atualizar, repita o processo com um `versionCode` maior; o Android oferecerá a atualização sem apagar os dados locais do aplicativo.

## Diagnóstico rápido

| Mensagem ou comportamento                | Causa provável                                                 | Correção                                                         |
| ---------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| O workflow informa segredo ausente       | Uma configuração obrigatória não foi cadastrada                | Revise os nomes e valores em **Secrets and variables → Actions** |
| A release não é criada                   | Permissões de workflow somente leitura                         | Ative **Read and write permissions** em **Actions → General**    |
| Android pede desinstalação               | Chave diferente, pacote diferente ou versionCode não crescente | Use a mesma chave, mantenha o pacote e aumente o versionCode     |
| Erro ao instalar por bloqueio do sistema | Instalação de fontes desconhecidas não permitida               | Autorize o navegador/gerenciador de arquivos que abriu o APK     |

## Referências

[1] [GitHub Docs — Armazenar e compartilhar dados com artefatos](https://docs.github.com/en/actions/tutorials/store-and-share-data)

[2] [GitHub Docs — Sintaxe de workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

[3] [GitHub Docs — Gerenciar releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
