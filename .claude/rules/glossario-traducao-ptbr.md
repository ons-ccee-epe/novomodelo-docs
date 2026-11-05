---
paths:
  - "src/content/docs/pt-br/**"
---

# Guia de tradução — Documentação do Novo Modelo (EN → PT-BR)

Público: engenheiros e analistas do setor elétrico brasileiro (ONS, CCEE, EPE, agentes), familiarizados com NEWAVE/DECOMP/DESSEM.
Objetivo: texto técnico natural em português do Brasil, com a terminologia do setor (CEPEL, ONS, CCEE, CPAMP) — NÃO tradução literal. Reestruture frases quando necessário para soar natural; preserve rigorosamente o sentido técnico.

## Regras de forma (obrigatórias)

1. NÃO alterar: fórmulas LaTeX (`$...$`, `$$...$$`) — copie exatamente; blocos de código, comandos, chaves JSON/TOML/YAML, nomes de campos/colunas, flags de CLI, nomes de arquivos e caminhos (ex.: `hydros.json`, `training/convergence.parquet`), identificadores em `código`, nomes de tipos/enums, URLs, sintaxe MDX/JSX (`<Tabs>`, `<TabItem label="...">` → traduza apenas o valor de `label`), `import`s (copie como estão), atributos `id`, mensagens literais emitidas pelo programa (texto que o software imprime) e títulos de obras na bibliografia.
2. Traduzir: texto corrido, títulos/cabeçalhos, tabelas (exceto células que são identificadores/código), `title` e `description` do frontmatter (mantenha as demais chaves do frontmatter, e não traduza valores de `slug`, `template` etc.), textos de admonitions (`:::note[Título]` → traduza o título), textos alternativos, comentários dentro de blocos de código (`# ...`, `// ...`) e rótulos de diagramas D2 (apenas os textos exibidos; mantenha sintaxe, setas, `shape`, `style`, classes e chaves de nó — se a chave do nó for o próprio texto exibido, adicione um rótulo: `forward: "simulação forward"` e mantenha todas as referências ao nó coerentes no bloco).
3. Links: traduza apenas o texto do link. O destino aponta para a página em português, com o prefixo `/pt-br/` (ex.: `(/math/cut-management)` → `(/pt-br/math/cut-management)`), e a âncora é o id do título traduzido, escrito **sem acentos, til ou cedilha**: o site gera os ids assim (`scripts/rehype-ascii-heading-ids.mjs`). Ex.: o título "Recusas da biblioteca histórica" tem a âncora `#recusas-da-biblioteca-historica`. O `npm run check:links` acusa uma âncora que não existe. Links externos e `/schemas/` ficam como no original.
4. Unidades: use vírgula decimal apenas no texto corrido em português quando não for código nem fórmula (ex.: "0,5 hm³"); não altere números dentro de código/fórmulas/tabelas de configuração. Mantenha MW, MWh, hm³, m³/s, R$.
5. Formato: preserve a estrutura Markdown (níveis de cabeçalho, listas, tabelas, negrito/itálico, notas de rodapé). Não adicione nem remova seções. Não adicione notas do tradutor.
6. Voz: presente, impessoal, técnico ("o modelo calcula", "define-se"). Use "você" com parcimônia apenas onde o original instrui o usuário (guias práticos), preferindo imperativo ("execute", "configure").
7. Nome do produto: "Novomodelo" (nome do produto, em texto exibido ao leitor) → **Novo Modelo** (PT e EN: "o Novo Modelo", "do Novo Modelo", "Novo Modelo's"). Minúsculas `novomodelo` (comando, pacotes `novomodelo-cli`/`novomodelo-python`/…, caminhos, URLs, slugs, chaves) permanecem inalteradas, assim como qualquer ocorrência dentro de código, código inline, fórmulas e destinos de link.

## Decisões terminológicas (aprovadas pela cliente)

- SDDP → **PDDE** (Programação Dinâmica Dual Estocástica). Na primeira ocorrência de cada página: "PDDE (SDDP)". Nomes próprios do software/código mantêm SDDP (ex.: `SDDP.jl`).
- Forward pass → **simulação forward**; Backward pass → **simulação backward** (forward/backward sem itálico).
- Trial point / visited state → **estados visitados** (singular: "estado visitado").
- Termos sem equivalente consagrado: **termo em português + inglês entre parênteses na primeira ocorrência de cada página**, depois só o português:
  - policy graph → grafo da política (policy graph)
  - training → treinamento (training) [fase de construção da política]
  - in-sample / out-of-sample → dentro da amostra (in-sample) / fora da amostra (out-of-sample)
  - Level-1 cut selection → seleção de cortes Nível 1 (Level-1)
  - optimality gap → gap de otimalidade
  - epigraph variable → variável de epígrafo (epigraph variable)
  - bound stalling → estagnação do limite (bound stalling)
  - census simulation → simulação censitária (census simulation)

## Glossário de referência

| EN | PT-BR |
|---|---|
| stochastic dual dynamic programming | programação dinâmica dual estocástica |
| hydrothermal dispatch | despacho hidrotérmico |
| cut / Benders cut | corte / corte de Benders |
| cut pool | conjunto de cortes |
| cut selection / cut removal | seleção de cortes / eliminação de cortes |
| dominated cut | corte dominado |
| cut intercept / cut coefficient (slope) | termo independente (intercepto) do corte / coeficiente do corte |
| single-cut / multi-cut | corte único (single-cut) / multicorte (multi-cut) |
| cost-to-go function / future cost function (FCF) | função de custo futuro (FCF) |
| immediate cost | custo imediato |
| lower bound / upper bound | limite inferior (ZINF) / limite superior (ZSUP) — use "limite inferior/superior"; cite ZINF/ZSUP apenas se ajudar |
| convergence / stopping rule | convergência / critério de parada |
| simulation (final) | simulação final |
| opening / opening tree | abertura / árvore de aberturas (árvore de cenários) |
| sampling scheme | esquema de amostragem |
| sample average approximation (SAA) | aproximação por média amostral (SAA) |
| synthetic series / scenario | séries sintéticas / cenário |
| inflow | afluência / vazão afluente |
| natural inflow / incremental inflow | vazão natural afluente / vazão incremental |
| PAR(p) | modelo PAR(p) (autorregressivo periódico) |
| AR order / AR lag | ordem do modelo AR / defasagem (lag) |
| innovation / noise | ruído (inovação) |
| inflow-lag seed | tendência hidrológica |
| historical record | histórico de vazões / série histórica |
| stage / block | estágio / patamar (de carga) |
| horizon / post-study stage | horizonte de estudo / estágio pós-estudo |
| terminal boundary cuts | cortes de fronteira terminal (cortes de final de horizonte) |
| right boundary | fronteira direita |
| chained study | estudo encadeado |
| warm-start (policy) | partida a quente (warm-start) |
| warm-start basis (LP) | aproveitamento de base (warm-start da base) |
| discount rate / discount factor | taxa de desconto / fator de desconto |
| risk measure / coherent risk measure | medida de risco / medida de risco coerente |
| risk-neutral / risk-averse | neutro ao risco / avesso ao risco |
| CVaR | CVaR |
| water value | valor da água |
| marginal cost (CMO) | custo marginal de operação (CMO) |
| deficit / deficit cost | déficit / custo de déficit |
| penalty / slack variable | penalidade / variável de folga |
| generic constraint | restrição genérica |
| penalty basis | base de penalização |
| hydro plant / thermal plant | usina hidrelétrica (UHE) / usina termelétrica (UTE) |
| hydro unit group | grupo de unidades geradoras |
| hydro production function (FPHA) | função de produção hidrelétrica aproximada (FPHA) |
| productivity | produtibilidade |
| head (net head) | queda (queda líquida) |
| forebay level / tailrace level | nível de montante / nível de jusante (canal de fuga) |
| head loss | perda hidráulica |
| spillage / turbined flow / outflow | vertimento / vazão turbinada / vazão defluente |
| minimum outflow | vazão defluente mínima |
| reservoir / storage | reservatório / armazenamento (volume armazenado) |
| useful volume / dead volume | volume útil / volume morto |
| reference volume | volume de referência |
| flood-control volume | volume de espera |
| filling | enchimento de volume morto |
| security curve | curva de segurança |
| stored energy (EARM) | energia armazenada (EARM) |
| equivalent reservoir (REE) | reservatório equivalente de energia (REE) |
| cascade / upstream / downstream | cascata / montante / jusante |
| diversion | desvio |
| pumping station | usina elevatória (estação de bombeamento) |
| evaporation | evaporação |
| travel time / in-transit water | tempo de viagem / água em trânsito |
| run-of-river | fio d'água |
| subsystem / submarket | subsistema / submercado |
| bus / line | barramento / linha (circuito) |
| exchange / interchange | intercâmbio |
| load / demand | carga / demanda |
| load factor | fator de carga |
| energy contract | contrato de energia |
| non-controllable source (NCS) | fonte não despachável (NCS) |
| curtailment | corte de geração (curtailment) |
| must-run | geração compulsória (must-run) |
| minimum generation (thermal) | geração mínima (inflexibilidade) |
| operating cost (thermal) | custo variável unitário (CVU) |
| anticipated dispatch / lead | antecipação de despacho / antecedência |
| commitment | compromisso de despacho |
| commissioning / decommissioning | entrada em operação / desativação |
| state variable / state augmentation | variável de estado / aumento do espaço de estados |
| node / transition (edge) | nó / transição (aresta) |
| stage subproblem / stage LP | subproblema do estágio / PL do estágio |
| LP | problema de programação linear (PL) |
| dual variable / shadow price | variável dual (multiplicador) / preço-sombra |
| reduced cost | custo reduzido |
| basis | base |
| simplex method | método simplex |
| scaling (LP) | escalonamento (scaling) |
| solver | solver |
| relatively complete recourse | recurso relativamente completo |
| outer approximation | aproximação externa |
| trajectory | trajetória |
| policy | política de operação (política) |
| case / case directory | caso / diretório do caso |
| input files / output files | arquivos de entrada / arquivos de saída |
| run / study | execução / estudo |
| configuration (software) | configuração |
| HPC / cluster / rank / thread | HPC / cluster / processo (rank MPI) / thread |
| seed (RNG) | semente |
| determinism | determinismo |
| worked example | exemplo resolvido |
| quickstart | guia rápido |
| troubleshooting | solução de problemas |
| glossary / bibliography | glossário / bibliografia |
| overview | visão geral |

Mantenha siglas consagradas: ONS, CCEE, EPE, CEPEL, SIN, ANEEL, CMO, PLD, CVU, UHE, UTE, REE, EARM, ENA, FPHA, CVaR, MPI, HPC.

Página de glossário (`reference/glossary.md`): as tabelas têm colunas "English | Portuguese | Definition". Na versão PT renomeie para "Inglês | Português | Definição", mantenha a coluna em inglês (é útil), atualize a coluna "Português" conforme este guia quando houver conflito (ex.: forward pass → simulação forward; trial point → estados visitados), preencha "-" com o termo deste guia quando houver, e traduza as definições. Os termos do índice alfabético devem continuar em inglês (são as entradas da coluna English).
