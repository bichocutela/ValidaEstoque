# Auditoria Profunda — ValidaEstoque

**Data:** 18 de agosto de 2026  
**Escopo:** experiência operacional, controles interativos, navegação, integridade de dados, armazenamento local, autenticação, integrações, segurança de dependências e distribuição Android.

## Síntese executiva

O ValidaEstoque possui uma base funcional de controle de lotes, validades, baixas, histórico e relatórios, com testes unitários, TypeScript e lint aprovados. A auditoria identificou riscos importantes de produção: a autenticação `admin/admin` é apenas provisória, os dados ainda não sincronizam com o Supabase e as notificações remotas não estão conectadas ao aplicativo. Os reforços de maior impacto imediato foram implementados nesta revisão.

> O aplicativo está adequado para validação operacional local. Antes de uso em produção por múltiplos funcionários ou dispositivos, é necessário substituir o login temporário e concluir a sincronização remota.

## Validações executadas

| Verificação | Resultado | Evidência |
|---|---:|---|
| Testes unitários | Aprovado | 8 testes aprovados; 1 teste de infraestrutura permanece ignorado |
| TypeScript | Aprovado | `tsc --noEmit` sem erros |
| Lint | Aprovado | `expo lint` sem avisos após ajuste do arquivo de configuração |
| Configuração Expo | Aprovado | Pacote Android, ícones e configuração de release resolvidos |
| Dependências | Atenção | `pnpm audit` reportou 141 vulnerabilidades transitivas, incluindo 3 críticas |
| Persistência local | Atenção | Estado persiste em `AsyncStorage`; não há sincronização entre dispositivos |
| Notificações | Atenção | Schema e funções Supabase existem, mas o cliente mobile ainda não registra tokens nem sincroniza preferências |

## Correções aplicadas nesta auditoria

| Área | Correção | Benefício operacional |
|---|---|---|
| Navegação | Proteção no navegador raiz redireciona rotas internas abertas sem sessão para a tela inicial | Evita acesso direto a detalhes, histórico, relatórios e configurações sem login temporário |
| Carregamento | A tela inicial aguarda a restauração do estado local e exibe indicador de preparação | Evita exibir dados parciais durante a abertura do aplicativo |
| Cadastro | Scanner valida quantidades inteiras positivas e datas reais no padrão `AAAA-MM-DD` | Reduz registros inválidos e falhas de cálculo de validade |
| Edição de lote | Data de validade é validada antes da gravação | Impede datas inexistentes no fluxo de correção manual |
| Estoque | Atualizações programáticas de saldo são limitadas a zero ou mais | Evita saldo negativo por chamadas futuras fora do modal de baixa |
| Histórico e painel | Cartões de resumo, filtro do histórico e itens de movimentação passaram a ter ações e feedback claros | Elimina controles que pareciam interativos sem comportamento operacional |
| Relatórios | Movimentos futuros são excluídos do período selecionado | Mantém indicadores históricos coerentes com a data da consulta |
| Estado local | Dados serializados inválidos são ignorados sem impedir a abertura; identificadores recebem sufixo aleatório | Maior resiliência diante de armazenamento corrompido e menor risco de colisão de IDs |
| Ferramentas | `eslint.config.js` foi migrado para `eslint.config.mjs` | Remove aviso de interpretação de módulos no lint |

## Achados prioritários pendentes

| Prioridade | Achado | Impacto | Próxima ação recomendada |
|---|---|---|---|
| P0 | Credencial temporária `admin/admin` | Qualquer pessoa com o APK pode acessar a rotina local | Implementar contas de funcionários no Supabase Auth, papéis e recuperação de acesso |
| P0 | Inventário permanece exclusivamente em `AsyncStorage` | Perdas de dados ao trocar aparelho e ausência de colaboração em loja | Conectar produtos, lotes, movimentos e preferências ao Supabase com estratégia offline-first e resolução de conflitos |
| P0 | Notificações não chegam ao aparelho | Alertas de validade não têm efeito proativo | Registrar token Expo após login, configurar webhook de `notifications` e agendar `queue-expiry-alerts` diariamente |
| P1 | Vulnerabilidades transitivas de dependências | Risco concentrado sobretudo em ferramentas de desenvolvimento e cadeia Expo | Atualizar de forma controlada as versões compatíveis com Expo SDK 54; validar build Android após cada lote de atualização |
| P1 | Ícones de launcher maiores que 1 MB | O checkpoint do ambiente fica bloqueado até os assets serem tratados pela área de armazenamento | Reenviar a logo pela área **File Storage** e gerar assets otimizados antes da próxima release |
| P1 | Sem validação em aparelho físico nesta rodada | Câmera, permissões, teclado e ícone adaptativo dependem do Android real | Instalar APK em aparelho, executar roteiro de scanner, baixa, edição, logout e reinstalação/atualização |
| P2 | Ausência de exportação e recuperação do inventário | Recuperação operacional depende do dispositivo atual | Criar exportação CSV/PDF, backup sob demanda e histórico auditável por funcionário |
| P2 | Métricas ainda são operacionais, não gerenciais | Não permite acompanhar tendência de perdas e resultado por setor | Ampliar relatórios com custo, categoria, fornecedor, taxa de perda e períodos comparativos |

## Plano de evolução recomendado

### Ciclo 1 — Segurança e operação compartilhada

Substituir o login provisório por contas de funcionários, implementar sincronização Supabase e registrar o autor de cada movimento. Esse ciclo elimina o principal risco de acesso e permite o uso do aplicativo por mais de um aparelho.

### Ciclo 2 — Alertas confiáveis

Conectar o token de push no login, habilitar o webhook de entrega e configurar a rotina diária de validação de vencimentos. O aplicativo deve manter uma central de notificações e oferecer confirmação de leitura.

### Ciclo 3 — Gestão e continuidade

Adicionar exportação de relatórios, backup, filtros por setor/categoria e indicadores de perdas. A partir desse ponto, o ValidaEstoque deixa de ser somente operacional e passa a apoiar decisões de compra, giro e qualidade.

## Limitações desta auditoria

Esta revisão validou código, testes e configuração de desenvolvimento. Não substitui testes em aparelhos Android físicos, uma simulação de rede instável ou uma revisão de segurança do ambiente Supabase com usuários reais. A atualização de dependências também não foi aplicada automaticamente, para evitar incompatibilidade com o SDK Expo e o pipeline de APK.
