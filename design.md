# Direção de Design — ValidaEstoque

## Propósito do produto

O ValidaEstoque é uma ferramenta operacional para equipes de supermercado controlarem validade, lotes, qualidade e perdas sem interromper a rotina do piso de loja. A interface deve reduzir decisões repetitivas: identificar urgências imediatamente, permitir a consulta por código ou produto em poucos toques e preservar todo o histórico de movimentação.

O aplicativo será projetado para uso em **orientação retrato 9:16**, com ações importantes ao alcance do polegar, áreas de toque amplas e textos legíveis. O sistema visual usará a clareza estrutural do Material Design 3 — superfícies, cartões e estados — adaptada a barras de navegação, espaçamentos e transições discretas de um aplicativo mobile nativo.

## Arquitetura de informação e telas

| Tela | Conteúdo principal | Função prioritária |
|---|---|---|
| Login | Identidade do app, funcionário, senha e acesso | Iniciar a rotina de trabalho de modo objetivo |
| Início | Saudação, quatro indicadores, atalhos e lista de atenção necessária | Tornar os riscos do dia visíveis imediatamente |
| Produtos | Pesquisa e catálogo unificado por produto | Encontrar um produto sem criar duplicidade entre lotes |
| Detalhe do produto | Cabeçalho do produto, estoque total e seus lotes | Comparar lote, quantidade, validade e qualidade |
| Scanner / cadastro | Área de captura, reconhecimento futuro e formulário editável | Registrar recebimentos em um único fluxo rápido |
| Detalhes do lote | Dados completos, ações de conferência, edição e baixa, histórico do lote | Manter rastreabilidade operacional |
| Validades | Filtros de prazo, ordenação e lotes por urgência | Priorizar a retirada, venda ou conferência por vencimento |
| Histórico | Linha do tempo de entradas e baixas | Auditar movimentações sem apagar registros |
| Relatórios | Indicadores, barras comparativas e filtros de período | Identificar perdas e pontos de melhoria |
| Mais | Acessos a histórico, relatórios e configurações | Manter a navegação principal enxuta |
| Configurações | Preferências de alertas e notificações | Ajustar o período de avisos à operação |

## Fluxos operacionais

| Fluxo | Passos de uso |
|---|---|
| Conferir urgência | Abrir Início → localizar item em “Atenção necessária” → tocar no lote → conferir ou dar baixa |
| Encontrar produto | Abrir Produtos → pesquisar por nome, marca, código ou lote → abrir produto → escolher lote |
| Registrar recebimento | Tocar Scanner → capturar embalagem ou seguir manualmente → revisar campos sugeridos → informar validade, lote, quantidade e qualidade → salvar |
| Tratar validade crítica | Registrar lote com prazo curto → receber alerta destacado → corrigir data ou confirmar cadastro → lote ganha identificação pesquisável |
| Dar baixa com rastreabilidade | Abrir lote → tocar “Dar baixa” → selecionar motivo e quantidade → revisar novo saldo → confirmar → movimento é acrescentado ao histórico |
| Analisar perdas | Abrir Mais → Relatórios → selecionar período → revisar perdas por tipo, produto e categoria |

## Hierarquia e comportamento

As telas de lista devem sempre mostrar **nome, lote, validade e quantidade** de forma escaneável. Um chip de status complementa a leitura, mas nunca é a única forma de comunicar gravidade. Cartões críticos ficam no topo da ordenação e usam borda ou faixa lateral de status, evitando blocos pesados de cor.

O botão central de Scanner é a ação primária e permanece visualmente destacado na navegação inferior. Operações irreversíveis, como baixa, usam confirmação com o novo saldo calculado antes da execução. O acesso a filtros fica no topo das listas, com opções rápidas em chips, evitando menus profundos.

## Paleta e identidade

| Uso | Cor | Código | Aplicação |
|---|---:|---:|---|
| Marca / ação primária | Verde petróleo | `#0B5D52` | Botões principais, navegação ativa e elementos de confiança |
| Fundo da tela | Névoa clara | `#F6F8F7` | Superfície geral com baixo ruído visual |
| Superfície | Branco | `#FFFFFF` | Cards, campos e painéis de informação |
| Texto principal | Grafite profundo | `#18211F` | Títulos, números e informações essenciais |
| Texto auxiliar | Ardósia | `#60706C` | Metadados e detalhes secundários |
| Normal | Verde | `#16794D` | Estoque em condição normal / boa qualidade |
| Atenção | Âmbar | `#C98A00` | Necessita acompanhamento |
| Crítico | Laranja | `#D96816` | Vencimento próximo ou recebimento crítico |
| Problema | Vermelho | `#C73737` | Vencido, avariado ou estragado |

## Componentes e feedback

Os cards terão cantos de 16 px, bordas suaves e elevação leve. Campos de formulário terão rótulos persistentes; a captura de dados automatizada será apresentada como sugestão claramente revisável. Botões terão altura mínima confortável e feedback visual de pressão sutil. Atualizações de lista usarão indicador de atualização discreto e recarregamento por gesto quando aplicável, evitando uma aparência estática.

## Modelo de dados local

O catálogo será separado dos lotes: um **Produto** identifica nome, marca, categoria, volume e código; um **Lote** registra validade, recebimento, quantidade, qualidade e situação; uma **Movimentação** preserva a trilha de entradas, baixas, motivo, responsável e horário. Para a primeira versão, os dados permanecerão locais no aparelho e serão alimentados com cenários demonstrativos realistas para validar os fluxos.
