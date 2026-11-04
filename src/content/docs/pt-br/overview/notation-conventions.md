---
title: "Convenções de notação"
description: Referência completa da notação matemática — conjuntos de índices, parâmetros, variáveis de decisão e variáveis duais usados nos capítulos de metodologia do Novo Modelo.
---

## Objetivo

Este capítulo define a notação matemática completa usada nos capítulos de metodologia do Novo Modelo: conjuntos de índices, parâmetros, variáveis de decisão e variáveis duais. Ele é a referência canônica para o significado dos símbolos, garantindo a consistência entre os capítulos de metodologia.

## 1. Convenções Gerais de Notação

Este documento segue as convenções de notação do SDDP.jl de [Dowson & Kapelevich (2021)](/pt-br/reference/bibliography/#referencias-de-software), para manter a consistência com a literatura mais ampla de PDDE (SDDP):

| Convenção               | Significado                                   |
| ------------------------ | ----------------------------------------- |
| $t \in \{1, \ldots, T\}$ | Índice do estágio; $T$ é o número de estágios do estudo |
| $\omega \in \Omega_t$ | Abertura (uma realização do ruído do estágio) no estágio $t$ |
| $j \in \{1, \ldots, N_t\}$ | Índice da abertura dentro da árvore de aberturas do estágio $t$ |
| $N_t$ | Fator de ramificação: o número de aberturas do estágio $t$ |
| $p(\omega)$ | Probabilidade da abertura $\omega$, uniforme: $p(\omega) = 1/N_t$; em um grafo da política (policy graph), $p_{n'}(\omega)$, uniforme dentro do nó $n'$ |
| $n$ | Nó de um grafo da política |
| $P(n \to n')$ | Probabilidade de transição da aresta do nó $n$ para seu filho $n'$ (os diagramas de grafo da política rotulam as arestas p₁, p₂, …); as probabilidades das arestas de um nó somam $1$ |
| $x_t$ | Vetor de estado ao final do estágio $t$; $x_0$ é o estado inicial |
| $\hat{x}_{t-1}$ | Estado de entrada do estágio $t$ (o estado visitado) |
| $u_t$ | Vetor de controle do estágio $t$ |
| $\mathcal{X}_t(x_{t-1}, \omega_t)$ | Conjunto viável do estado e do controle do estágio $t$, dados o estado de entrada $x_{t-1}$ e a abertura $\omega_t$; escrito $\mathcal{X}_t(\omega_t)$ quando o estado de entrada é fixo |
| $c_t(x_t, u_t)$ | Custo imediato (do estágio) do estágio $t$, sem desconto |
| $x_j$ | Variável da coluna $j$ em um enunciado genérico sobre um PL do estágio |
| $Q_t$ | Valor ótimo do PL do estágio $t$ como função de seu estado de entrada e da abertura, $Q_t(\hat{x}_{t-1}, \omega)$ |
| $V_t(x)$                 | Função de valor (custo futuro) no estágio $t$  |
| $\mathbb{E}_{\omega_t}$ | Esperança sobre a abertura do estágio $t$ |
| $\theta_t$ | Variável de epígrafo (epigraph variable) que aproxima $V_{t+1}(x_t)$ |
| $\pi$                    | Variáveis duais (multiplicadores de Lagrange das restrições) |
| $(\beta_0, \beta)$ | Termo independente e coeficientes do corte: o corte $\theta_t \geq \beta_0 + \beta^\top x_t$ |
| $\hat{x}_j$, $\beta_j$ | Componente $j$ do estado de entrada e do coeficiente angular do corte; $j$ indexa as coordenadas do estado |
| $i$ | Índice do corte ($\beta_{0,i}$, $\beta_i$) |
| $\underline{V}_\tau(x)$ | Aproximação externa (por cortes) da função de valor, $\max_i \{\beta_{0,i} + \beta_i^\top x\}$, por estágio, ou por período sazonal $\tau$ de um grafo da política cíclico |
| $k$                      | Contador de iterações                         |
| $\underline{z}^k$ | Limite inferior na iteração $k$: o valor ajustado ao risco do primeiro estágio sobre suas aberturas com os cortes atuais |
| $\bar{z}^k$ | Estimativa do limite superior na iteração $k$: o custo descontado médio das $M$ trajetórias da simulação forward da iteração, uma estimativa estatística; exata, $\bar{z}_{\text{exact}}$, sob uma simulação forward enumerada |
| $M$, $m$ | Número de trajetórias consideradas na média da estimativa do limite superior e o índice da trajetória $m \in \{1, \ldots, M\}$ |
| $N_{\text{forward\_passes}}$ | Número de trajetórias da simulação forward por iteração |
| $n_{\text{sample}}$ | Número de aberturas que uma simulação backward amostrada sortearia por estágio, em lugar de todas as $N_t$ |
| $\text{gap}^k$ | Gap de otimalidade na iteração $k$: o limite superior menos o limite inferior, $\bar{z}^k - \underline{z}^k$; sua forma percentual o normaliza pelo limite inferior; veja [Critérios de parada](/pt-br/math/stopping-rules#gap-de-otimalidade) |
| $P(\ell)$, $C(\ell)$ | Probabilidade e custo total descontado do caminho até a folha $\ell$ de uma árvore de cenários enumerada |
| $\bar{z}_{\text{exact}}$ | Limite superior exato de uma simulação forward enumerada: $\sum_\ell P(\ell)\, C(\ell)$ sob a esperança, o valor aninhado na raiz sob um CVaR uniforme |
| $w_m$ | Peso censitário do cenário de simulação $m$: a probabilidade do seu caminho até a folha, $\sum_m w_m = 1$ |
| $\Delta_{95}$ | Semiamplitude do intervalo de confiança de 95 % por aproximação normal de uma estimativa amostral de custo |
| $V^\star$ | Valor ótimo do objetivo multiestágio |
| $V'(v)$ | Coeficiente angular da função de valor de um reservatório em um armazenamento visitado $v$: a inclinação do corte tangente nas figuras da função de valor |
| $\text{iterations}$ | Número de iterações do treinamento (training), em ordens de crescimento como $\mathcal{O}(\text{iterations} \times N_{\text{forward\_passes}})$ |
| $\mathcal{O}(\cdot)$ | Ordem assintótica de uma contagem ou custo |
| $\rho^{\lambda, \alpha}$ | Medida de risco por combinação convexa, $\rho^{\lambda, \alpha}[Z] = (1 - \lambda)\, \mathbb{E}[Z] + \lambda\, \text{CVaR}_\alpha[Z]$; por estágio, $\rho_t$, a medida do estágio que detém um corte, que agrega nele as aberturas do estágio seguinte |
| $\lambda$ | Peso de aversão ao risco, $\lambda \in [0, 1]$: $0$ é neutro ao risco, $1$ é CVaR puro |
| $\mu^*$ | Pesos de probabilidade ajustados ao risco de um corte: $\mu^* = (1-\lambda)\, p + \lambda\, q^*$, entre o piso $(1-\lambda)\, p_\omega$ e o teto $(1-\lambda)\, p_\omega + \lambda\, p_\omega / \alpha$ |
| $\alpha$ | Fração da cauda do CVaR, $\alpha \in (0, 1]$; $\alpha = 1$ resulta na esperança |
| $\text{CVaR}_\alpha$ | Valor em risco condicional: o custo esperado sobre a fração $\alpha$ dos piores resultados |
| $\mathrm{VaR}_\alpha$ | Valor em risco: o quantil $(1 - \alpha)$ do custo, o $\eta$ ótimo |
| $\eta$ | Variável de limiar de $\text{CVaR}_\alpha(Z) = \min_{\eta \in \mathbb{R}} \{\eta + \tfrac{1}{\alpha} \mathbb{E}[(Z - \eta)^+]\}$ |
| $Z$, $f(Z)$ | Custo aleatório ao qual uma medida de risco se aplica e sua densidade de probabilidade |
| $\rho_{\text{nested}}$ | Funcional de risco aninhado (consistente no tempo): a medida do estágio aplicada estágio a estágio, $\rho_1[\rho_2[\cdots \rho_{T-1}[\cdot]]]$ |
| $\rho_{\text{end-of-horizon}}$ | Funcional de risco de final de horizonte: uma única medida aplicada ao custo total de todo o caminho |

### Reutilizações de Escopo Declaradas

Um símbolo assume um segundo significado apenas em páginas que nunca usam o primeiro; cada uma dessas reutilizações é declarada aqui:

- $k$ indexa os patamares de um estágio, $k \in \mathcal{K}$, nos capítulos de Modelagem do Sistema e em [Geração de cenários](/pt-br/math/scenario-generation); conta as iterações do treinamento em [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), [Gerenciamento de cortes](/pt-br/math/cut-management), [Aproveitamento de base do PL](/pt-br/math/lp-warm-start), [Critérios de parada](/pt-br/math/stopping-rules), [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), [Modos de horizonte](/pt-br/math/horizon-modes), [Formulação da taxa de desconto](/pt-br/math/discount-rate), [Medidas de risco](/pt-br/math/risk-measures) e nos exemplos resolvidos; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), é a ordem candidata do teste de autocorrelação parcial.
- $k_{max}$ é o número de slots no commitment ring de cada térmica com antecipação de despacho em [Aumento do espaço de estados](/pt-br/math/state-augmentation) e [Checkpoint da política](/pt-br/reference/output/policy); em [Critérios de parada](/pt-br/math/stopping-rules), é o limite de iterações.
- $\ell$ é o índice de defasagem do modelo autorregressivo de afluências; em [Critérios de parada](/pt-br/math/stopping-rules) e [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), indexa os caminhos até as folhas de uma árvore de cenários enumerada.
- $\lambda$ é o peso de aversão ao risco da medida de risco por combinação convexa; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $\lambda_i$ são os autovalores da matriz de correlação, e em [Formulação do PL](/pt-br/math/lp-formulation), [Variantes de formulação dos patamares](/pt-br/math/block-formulations) e [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $\lambda_{h,b}$ é a participação da célula $(h, b)$ na capacidade de turbinamento da usina $h$.
- $L$ é o último estágio de enchimento de uma usina em enchimento de volume morto em [Formulação do PL](/pt-br/math/lp-formulation) e [Sistema de penalidades](/pt-br/math/penalty-system); em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), é o fator de Cholesky triangular inferior da matriz de correlação; em [Aumento do espaço de estados](/pt-br/math/state-augmentation), $L_h$ é a profundidade dos buckets da usina receptora $h$; e em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), $L_t$ é o vetor das constantes de Lipschitz por componente do estado $L_{t,j}$ da função de valor do estágio $t$.
- $\psi_{m,\ell}$ é o coeficiente autorregressivo do modelo de afluências ($\psi^*_{m,\ell}$ padronizado; $\psi^{A*}_m$ e $\psi^A_m$ o coeficiente anual do PAR(p)-A); em [Medidas de risco](/pt-br/math/risk-measures), $\psi(p, \mu)$ é a função de penalidade da representação dual de uma medida de risco convexa.
- Um acento circunflexo sobre uma grandeza de estado indica seu valor de entrada (visitado) ($\hat{x}_{t-1}$, $\hat{v}_h$, $\hat{a}_{h,\ell}$); sobre um parâmetro do modelo, indica sua estimativa amostral a partir do histórico de vazões ($\hat{\mu}_m$, $\hat{s}_m$, $\hat{\rho}_m(\ell)$); os dois nunca decoram o mesmo símbolo base.
- $\tau_k$ é a duração do patamar $k$; em [Critérios de parada](/pt-br/math/stopping-rules), $\tau$ é a janela de estagnação do limite (bound stalling), e em [Modos de horizonte](/pt-br/math/horizon-modes) e [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), indexa os períodos sazonais de um grafo da política cíclico.
- $\phi(v, q, s)$ é a função de produção hidrelétrica exata em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models); em [Formulação do PL](/pt-br/math/lp-formulation) e [Aumento do espaço de estados](/pt-br/math/state-augmentation), $\phi_{h,k}$ é a densidade de chegada que distribui um volume em trânsito que amadurece pelos patamares de seu estágio de chegada; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $\phi$ designa a notação dos coeficientes AR de outras implementações, que esse capítulo escreve $\psi$.
- $A_{ij}$ é um elemento da matriz de restrições $A$ do PL do estágio em [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling); em [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Formulações específicas por equipamento](/pt-br/math/equipment-formulations), $A_{r,k}$ é a geração disponível da fonte não despachável $r$ no patamar $k$; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $A_{h,t-1}$ é o regressor anual do PAR(p)-A; e em [Aumento do espaço de estados](/pt-br/math/state-augmentation), o $A$ isolado é o número de térmicas com antecipação de despacho.
- $D_{b,k}$ é a carga no barramento $b$, patamar $k$, em [Formulação do PL](/pt-br/math/lp-formulation) e [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements), escrita $D$ e $D_b$ nos exemplos resolvidos; em [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling), $D_r$ e $D_c$ são as matrizes diagonais de escalonamento de linhas e de colunas.
- $i$ é o índice do corte de Benders; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $(i, j)$ indexam as linhas e colunas do sistema de Yule-Walker periódico; em [Geração de cenários](/pt-br/math/scenario-generation), $i$ indexa as entidades de um grupo de correlação; em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), indexa os vértices da aproximação interna; em [Aumento do espaço de estados](/pt-br/math/state-augmentation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements), [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), [Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary) e no [Glossário](/pt-br/reference/glossary), indexa as usinas termelétricas com antecipação de despacho; em [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling), é o índice de linha do PL; e em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), indexa os pontos de armazenamento da curva cota-volume, $v^{(i)}$ e $h^{(i)}$, e da grade de ajuste da FPHA, $V_i$.
- $j$ é o índice da usina termelétrica; em [Geração de cenários](/pt-br/math/scenario-generation), [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) e nos exemplos resolvidos, indexa as aberturas de um estágio; em [Gerenciamento de cortes](/pt-br/math/cut-management) e [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), indexa as componentes do vetor de estado; em [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling), é o índice de coluna do PL; e em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), indexa os pontos de vazão turbinada $Q_j$ da grade de ajuste da FPHA.
- $K_i$ é a profundidade do ring da térmica com antecipação de despacho $i$ em [Aumento do espaço de estados](/pt-br/math/state-augmentation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e no [Glossário](/pt-br/reference/glossary); em [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling) e [Gerenciamento de cortes](/pt-br/math/cut-management), o $K$ isolado é o fator de escala de custo.
- $M$ é o número de períodos sazonais no ciclo do modelo de afluências e de um grafo da política cíclico; em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), é o número de hiperplanos da FPHA de uma usina, e em [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), [Formulação da taxa de desconto](/pt-br/math/discount-rate) e [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), o número de trajetórias da simulação forward de uma iteração.
- $m$ indexa os períodos sazonais do modelo de afluências, sendo $m(t)$ o período sazonal do estágio $t$, e, em $\gamma^m$ e $\pi^{fpha}_m$, os planos $m \in \mathcal{M}_h$ de um modelo FPHA; em [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), [Formulação da taxa de desconto](/pt-br/math/discount-rate) e [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), indexa trajetórias, da simulação forward ou simuladas; e em [Aumento do espaço de estados](/pt-br/math/state-augmentation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary), é o estágio de entrega de um compromisso de despacho antecipado.
- $N$ é o número de usinas hidrelétricas; em [Geração de cenários](/pt-br/math/scenario-generation), é o fator de ramificação uniforme da árvore de cenários ($N_t = N$), e em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), o número de cenários de simulação fora da amostra (out-of-sample).
- $n$ é um nó de um grafo da política ou de uma árvore de cenários enumerada; em [Modos de horizonte](/pt-br/math/horizon-modes), conta as repetições do ciclo; em [Formulação do PL](/pt-br/math/lp-formulation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements), [Formulações específicas por equipamento](/pt-br/math/equipment-formulations) e [Sistema de penalidades](/pt-br/math/penalty-system), é o índice da linha de transmissão; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), é a dimensão da matriz de correlação com autovalores $\lambda_1, \ldots, \lambda_n$; e em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), o sobrescrito de $h_{tail}^{(n)}$ indexa os segmentos de uma curva de nível de jusante quártica por partes.
- $p(\omega)$ é a probabilidade da abertura $\omega$; em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $p$ é a fração da energia armazenada máxima correspondente à curva de segurança; e em [Formulação do PL](/pt-br/math/lp-formulation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Formulações específicas por equipamento](/pt-br/math/equipment-formulations), $p_{y,k}$ é a vazão bombeada da usina elevatória $y$.
- $Q_t$ é o valor ótimo do PL do estágio $t$ como função de seu estado de entrada; em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $Q$ é a coordenada de vazão turbinada da grade de ajuste da FPHA.
- $q_{h,k}$ é a vazão turbinada da hidrelétrica $h$; em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), $q_{n \to n'}$ é a probabilidade condicional de alcançar o nó filho $n'$ a partir do nó $n$ de uma árvore de cenários enumerada; em [Medidas de risco](/pt-br/math/risk-measures), $q^*$ é o vetor de pesos da cauda do CVaR.
- $r_h$ é a meta de retirada de água (uso consuntivo) da hidrelétrica $h$ em [Formulação do PL](/pt-br/math/lp-formulation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements), [Variantes de formulação dos patamares](/pt-br/math/block-formulations) e [Sistema de penalidades](/pt-br/math/penalty-system); em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $r_m$ é a escala padronizada do ruído do período sazonal $m$; em [Formulação da taxa de desconto](/pt-br/math/discount-rate), $r_t$ é a taxa de desconto anual que se aplica ao estágio $t$; e em [Aumento do espaço de estados](/pt-br/math/state-augmentation), $r_i(m)$ é a posição no ring da entrega da térmica com antecipação de despacho $i$ no estágio $m$.
- $s$ indexa os segmentos de déficit de um barramento em [Formulação do PL](/pt-br/math/lp-formulation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Sistema de penalidades](/pt-br/math/penalty-system); em [Aumento do espaço de estados](/pt-br/math/state-augmentation), [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) e [Checkpoint da política](/pt-br/reference/output/policy), indexa os slots do commitment ring de uma térmica com antecipação de despacho. O vertimento $s_{h,k}$ e os desvios-padrão $s_m$, $s^{\text{load}}_{b,t}$ e $s^{nc}_r$ são formas distintas.
- $u_{h,k}$ é a vazão desviada da hidrelétrica $h$, e $u$ indexa os grupos de unidades geradoras de uma célula (hidrelétrica, barramento), nos capítulos de Modelagem do Sistema; em [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), [Medidas de risco](/pt-br/math/risk-measures), [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation), [Modos de horizonte](/pt-br/math/horizon-modes), [Grafos da política](/pt-br/math/policy-graphs), [Formulação da taxa de desconto](/pt-br/math/discount-rate), [A PDDE em uma página](/pt-br/overview/sddp-framework-overview) e no [Glossário](/pt-br/reference/glossary), $u_t$ é o vetor de controle do problema do estágio.
- $w_k$ é o peso do patamar $k$ nos capítulos de Modelagem do Sistema; em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation) e no [Glossário](/pt-br/reference/glossary), $w_m$ é o peso censitário do cenário de simulação $m$; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), $w$ indexa as janelas móveis de um agrupamento de períodos sazonais; e em [Estudos com múltiplas resoluções](/pt-br/math/multi-resolution-studies), $w_{t,\mathcal{W}}$ é a fração do período de defasagem $\mathcal{W}$ coberta pelo estágio $t$.
- $y$ indexa as usinas elevatórias nos capítulos de Modelagem do Sistema; em [Geração de cenários](/pt-br/math/scenario-generation), $y \in W$ é um ano da janela de reprodução do histórico.
- $Z$ é o custo aleatório ao qual uma medida de risco se aplica; em [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model), é a série padronizada sobre a qual a autocorrelação parcial condicional do PAR(p)-A é condicionada.
- $z$ é o vetor de sorteios normais padrão independentes que o fator de correlação transforma em ruído correlacionado; em [Formulação do PL](/pt-br/math/lp-formulation), [Aumento do espaço de estados](/pt-br/math/state-augmentation) e [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling), $z_h$ é a coluna da afluência realizada da hidrelétrica $h$.
- $\delta_{b,k,s}$ é o déficit de carga no barramento $b$, patamar $k$, segmento $s$; em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $\delta$ é a diferença quadrática média normalizada de geração entre dois planos da FPHA; e em [Geração de cenários](/pt-br/math/scenario-generation), $\delta_t$ é o deslocamento do ano da janela até o ano de ocorrência do período sazonal do estágio $t$.
- $\varepsilon$ com índice de entidade, estágio ou fonte é um ruído (inovação) ($\varepsilon_t$, $\varepsilon^{\text{load}}_{b,t}$, $\varepsilon^{nc}_r$) e, com subscrito textual, uma tolerância ($\varepsilon_{\text{viol}}$, $\varepsilon_{\text{stall}}$, $\varepsilon_{\text{abs}}$, $\varepsilon_{\text{rel}}$); em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), o $\varepsilon$ isolado é a tolerância de fusão na redução de planos da FPHA.
- $\eta$ com índice de entidade é um rendimento ($\eta_h$ de uma turbina, $\eta_n$ de uma linha de transmissão); em [Medidas de risco](/pt-br/math/risk-measures) e [A PDDE em uma página](/pt-br/overview/sddp-framework-overview), $\eta$ é a variável de limiar da fórmula de minimização do CVaR.
- $\theta_t$ é a variável de epígrafo do custo futuro, que aproxima $V_{t+1}(x_t)$; em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $\theta$ é o ângulo entre as normais de dois planos da FPHA.
- $\kappa_{r,k}$ é o corte de geração (curtailment) da fonte não despachável $r$ em [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Formulações específicas por equipamento](/pt-br/math/equipment-formulations); em [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models), $\kappa$ é o fator de correção, aplicado apenas ao termo independente, dos planos da FPHA pré-calculados; e em [Sistema de penalidades](/pt-br/math/penalty-system), $\kappa = 10^6/3600$ é o número de (m³/s)·h em um hm³.
- $\mu$ com índice de período sazonal, barramento ou fonte é uma média ($\mu_m$, $\mu^A_m$, $\mu^{\text{load}}_{b,t}$, $\mu^{nc}_r$); em [Medidas de risco](/pt-br/math/risk-measures), $\mu$ é um vetor de probabilidades ajustadas ao risco.
- $\epsilon_{b,k}$ é o excesso de geração no barramento $b$, patamar $k$, em [Formulação do PL](/pt-br/math/lp-formulation), [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) e [Sistema de penalidades](/pt-br/math/penalty-system); em [Gerenciamento de cortes](/pt-br/math/cut-management), $\varepsilon_{\text{viol}}$ é a tolerância relativa de violação do método dinâmico.
- $\mathcal{C}$ é o conjunto de contratos, com $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$ e seus subconjuntos por barramento, nos capítulos de Modelagem do Sistema; em [Modos de horizonte](/pt-br/math/horizon-modes), $\mathcal{C}_\tau$ é o conjunto de estágios que ocupam o período sazonal $\tau$ de um grafo da política cíclico.
- $\mathcal{P}$ é o conjunto de usinas elevatórias, com subconjuntos por barramento $\mathcal{P}_b$, nos capítulos de Modelagem do Sistema; em [Medidas de risco](/pt-br/math/risk-measures), é o simplex de probabilidades dos cenários.
- $\mathcal{M}_h$ é o conjunto de hiperplanos da FPHA da hidrelétrica $h$; em [Medidas de risco](/pt-br/math/risk-measures), $\mathcal{M}(p)$, $\mathcal{M}_\alpha(p)$ e $\mathcal{M}^{EAVaR}(p)$ são conjuntos de risco da representação dual de uma medida de risco convexa.
- $\mathcal{X}_t(x_{t-1}, \omega_t)$ é o conjunto viável do estado e do controle do estágio $t$; em [Gerenciamento de cortes](/pt-br/math/cut-management), $\mathcal{X}_t$ é o conjunto de estados viáveis sobre o qual um corte é válido.
- $I_t$ é o número de vértices armazenados no estágio $t$ em [Avaliação do limite superior](/pt-br/math/upper-bound-evaluation); em [Formulação do PL](/pt-br/math/lp-formulation), $I_{h,k}$ é a afluência da hidrelétrica $h$ no patamar $k$ lida por um termo de afluência à hidrelétrica.

### Indexação dos Estágios

As fórmulas matemáticas de todo este material indexam os estágios a partir de $1$: $t \in \{1, \ldots, T\}$ (a convenção já fixada acima). Os arquivos de configuração e as saídas Parquet do Novo Modelo, por sua vez, identificam um estágio pelo seu `stage_id` **declarado** — o `id` inteiro que o estágio tem em `stages.json`. Os ids declarados não precisam começar em $0$ nem ser contíguos (um estágio pré-estudo pode ter id negativo); os estágios são ordenados por id crescente, e $t$ é a posição de um estágio do estudo nessa ordem.

| Contexto                                         | Convenção                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Matemática (este material)                              | $t \in \{1, \ldots, T\}$ — posição na ordem crescente de id          |
| `stage_id` da configuração e campos baseados nele        | O `id` declarado do estágio em `stages.json`                          |
| Coluna `stage_id` das saídas (simulação, treinamento) | O mesmo `id` declarado do estágio, inalterado                             |
| Correspondência, quando os ids são declarados de forma contígua a partir de $0$ | $\text{stage\_id} = t - 1$                                          |

Todo capítulo da camada matemática usa $t$ com base 1. Todo campo de configuração JSON, coluna de saída Parquet e referência da CLI chamado `stage_id`, bem como todo campo de janela de estágios baseado nele, contém o id declarado, e não uma posição, e uma janela de estágios é comparada com ids declarados. O deslocamento $\text{stage\_id} = t - 1$ vale apenas para um caso cujos estágios do estudo são declarados $0, 1, \ldots, T-1$. Nenhum outro capítulo repete essa correspondência; todos remetem a esta seção.

### Terminologia

Duas escolhas de termos são fixadas em todo o material:

- **Abertura** é o termo canônico para uma única realização sorteada do conjunto de vetores de ruído pré-gerados de um estágio (p. ex., "toda abertura $\omega \in \Omega_t$"). "Ramo"/"ramificação" fica reservado para a _estrutura_ abstrata da árvore de cenários em si — o fator de ramificação $N_t$ (quantos filhos um nó tem) —, usado apenas quando um capítulo discute a topologia da árvore, como em [Geração de cenários](/pt-br/math/scenario-generation), nunca para uma realização sorteada específica.
- **Custo futuro** (cost-to-go) é o termo canônico para a função de valor $V_t(x)$ (§1 acima) no texto da camada matemática. "FCF" (_Função de Custo Futuro_) fica reservado para o [Glossário](/pt-br/reference/glossary) bilíngue, que faz a correspondência com os termos de outras ferramentas de planejamento.

## 2. Conjuntos de Índices

| Símbolo                                      | Descrição                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| $t \in \{1, \ldots, T\}$                    | Estágios                                                                                            |
| $k \in \mathcal{K}$                         | Patamares do estágio                                                                               |
| $\mathcal{B}$ | Barramentos, indexados por $b$ |
| $\mathcal{H}$ | Usinas hidrelétricas, indexadas por $h$ |
| $\mathcal{H}^{op} \subseteq \mathcal{H}$    | Hidrelétricas em operação (Operating), que podem gerar                                                                   |
| $\mathcal{H}^{fill} \subseteq \mathcal{H}$  | Hidrelétricas em enchimento de volume morto (Filling), sem geração                                                                    |
| $\mathcal{H}^{fpha} \subseteq \mathcal{H}$  | Hidrelétricas que usam o modelo de produção FPHA                                                                |
| $\mathcal{H}^{const} \subseteq \mathcal{H}$ | Hidrelétricas que usam produtibilidade constante (complemento de $\mathcal{H}^{fpha}$ em $\mathcal{H}^{op}$) |
| $\mathcal{T}$ | Usinas termelétricas, indexadas por $j$ |
| $\mathcal{R}$ | Fontes de geração não despacháveis, indexadas por $r$ |
| $\mathcal{L}$ | Linhas de transmissão, indexadas por $n$ |
| $\mathcal{C}$ | Todos os contratos ($\mathcal{C}^{imp} \cup \mathcal{C}^{exp}$), indexados por $c$ |
| $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$    | Contratos de importação/exportação                                                                           |
| $\mathcal{P}$ | Usinas elevatórias, indexadas por $y$ |
| $\mathcal{G}$ | Restrições genéricas, indexadas por $g$ |
| $\mathcal{S}_b$ | Segmentos de déficit do barramento $b$, indexados por $s$ |
| $\mathcal{B}_h \subseteq \mathcal{B}$       | Barramentos que abrigam uma das células (hidrelétrica, barramento) da hidrelétrica $h$                                               |
| $(h, b)$ | Célula (hidrelétrica, barramento): os grupos de unidades geradoras da usina $h$ que compartilham o barramento $b \in \mathcal{B}_h$, indexados por $u$; a vazão turbinada e a geração são acompanhadas por célula |
| $\mathcal{H}_b$, $\mathcal{T}_b$, $\mathcal{R}_b$, $\mathcal{P}_b$ | Hidrelétricas com uma célula no barramento $b$; termelétricas, fontes não despacháveis e usinas elevatórias conectadas ao barramento $b$ |
| $\mathcal{C}^{imp}_b$, $\mathcal{C}^{exp}_b$ | Contratos de importação e de exportação conectados ao barramento $b$ |
| $\mathcal{M}_h$ | Planos da FPHA da hidrelétrica $h$, indexados por $m$ |
| $\mathcal{U}_h$ | Hidrelétricas a montante de $h$, indexadas por $h'$ |
| $\Omega_t$ | Aberturas do estágio $t$ |

:::note[Indexação das Entidades]
Todo conjunto de índices de entidades operacionais acima ($\mathcal{B}$, $\mathcal{H}$, $\mathcal{T}$, $\mathcal{R}$, $\mathcal{L}$, $\mathcal{C}$, $\mathcal{P}$) é enumerado na ordem canônica $(\text{operational\_start\_date}, \text{id})$: primeiro pela data de entrada em operação de cada entidade e depois — entre entidades com a mesma data — pelo seu id único. Essa é a ordem seguida por todos os blocos de estado, pelo leiaute denso de colunas do PL e pela ordem das colunas de saída. Veja [Determinismo e rastreabilidade](/pt-br/math/determinism-guarantees) e [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling).
:::

## 3. Parâmetros

### 3.1 Tempo e Conversão

| Símbolo                         | Unidade      | Descrição                            |
| ------------------------------ | ---------- | -------------------------------------- |
| $\tau_k$                       | horas      | Duração do patamar $k$                  |
| $H_t = \sum_{k \in \mathcal{K}} \tau_k$ | horas | Duração total do estágio $t$ |
| $w_k = \tau_k / H_t$ | - | Peso do patamar (fração do estágio) |
| $\zeta$                        | hm³/(m³/s) | Conversão temporal: m³/s ao longo do estágio → hm³ |
| $\zeta_k = 0.0036 \times \tau_k$ | hm³/(m³/s) | Conversão do patamar: m³/s ao longo do patamar $k$ → hm³; $\zeta_k = w_k\,\zeta$ e $\sum_{k \in \mathcal{K}} \zeta_k = \zeta$ |
| $d_{t \to t+1}$ | - | Fator de desconto da transição do estágio $t$ para $t+1$, aplicado a $\theta_t$ no objetivo do estágio $t$ |
| $d_{1 \to t}$ | - | Fator de desconto acumulado do estágio $t$: o produto dos fatores de um passo dos estágios $1$ a $t - 1$, com $d_{1 \to 1} = 1$ |
| $d_{t_1 \to t_2}$ | - | Desconto do estágio $t_2$ de volta ao estágio $t_1 \le t_2$, $d_{1 \to t_2} / d_{1 \to t_1}$ |
| $d_{\text{cycle}}$ | - | Desconto acumulado ao longo de um ciclo de um grafo da política cíclico, $d_{\text{cycle}} = \prod_{t \in \text{cycle}} d_{t \to t+1} < 1$ |

#### Dedução do Fator de Conversão Temporal

O fator $\zeta$ converte uma vazão em m³/s em um volume em hm³ acumulado ao longo da duração do estágio.

$$
\zeta = 0.0036 \times \sum_{k \in \mathcal{K}} \tau_k \quad [\mathrm{hm}^3/(\mathrm{m}^3/\mathrm{s})]
$$

**Análise Dimensional**:

$$
[\zeta] = \frac{\text{s}}{\text{h}} \times \frac{\mathrm{hm}^3}{\mathrm{m}^3} \times \text{h} = \frac{\mathrm{hm}^3}{\mathrm{m}^3/\mathrm{s}}
$$

### 3.2 Carga e Custos

Os coeficientes de custo usam $c$ com um sobrescrito que identifica o tipo de custo.

| Símbolo          | Unidade       | Descrição                                              |
| --------------- | ----------- | -------------------------------------------------------- |
| $D_{b,k}$       | MW          | Carga no barramento $b$, patamar $k$                               |
| $c^{def}_{b,s}$ | R\$/MWh      | Custo de déficit no barramento $b$, segmento $s$                     |
| $\bar{d}_{b,s}$ | MW          | Profundidade do segmento de déficit                                    |
| $c^{exc}_b$     | R\$/MWh      | Custo do excesso de geração                                   |
| $c^{th}_j$ | R\$/MWh | Custo marginal da usina termelétrica $j$ |
| $c^{spill}_h$   | R\$/(m³/s·h) | Custo de vertimento                                            |
| $c^{div}_h$     | R\$/(m³/s·h) | Custo de desvio                                           |
| $c^{tc}_h$ | R\$/(m³/s·h) | Custo de regularização da vazão turbinada da hidrelétrica $h$, cobrado sobre a vazão turbinada de cada célula |
| $c^{sv-}_h$ | R\$/hm³ | Penalidade por armazenamento abaixo do mínimo, que precifica o piso flexível de volume morto de uma hidrelétrica em enchimento depois que ela entra em operação |
| $c^{fill}_h$ | R\$/hm³ | Penalidade pelo não atendimento da meta de enchimento |
| $c^{tv-}_h$ | R\$/(m³/s·h) | Penalidade por violação da vazão turbinada mínima, cobrada sobre cada célula da hidrelétrica $h$ |
| $c^{ov-}_h$, $c^{ov+}_h$ | R\$/(m³/s·h) | Penalidades por violação da vazão defluente abaixo do mínimo e acima do máximo |
| $c^{gv-}_h$ | R\$/MWh | Penalidade por violação da geração mínima, cobrada sobre cada célula da hidrelétrica $h$ |
| $c^{ev+}_h$, $c^{ev-}_h$ | R\$/(m³/s·h) | Penalidades por violação da evaporação acima e abaixo da meta |
| $c^{wv+}_h$, $c^{wv-}_h$ | R\$/(m³/s·h) | Penalidades por retirada de água acima e abaixo da meta |
| $c^{inf}_h$ | R\$/(m³/s·h) | Penalidade de não negatividade da afluência (métodos de afluência `penalty` e `truncation_with_penalty`) |
| $c^{exch}_n$ | R\$/MWh | Custo de intercâmbio (transmissão) |
| $c^{curt}_r$ | R\$/MWh | Custo de regularização do corte de geração da fonte não despachável $r$ |
| $c^{ctr}_c$     | R\$/MWh      | Preço do contrato (com sinal: + custo de importação, − receita de exportação) |
| $c_i(t)$ | R\$/MWh | Custo unitário da térmica com antecipação de despacho $i$ no estágio $t$; um compromisso de despacho para o estágio de entrega $m$ é precificado a $c_i(m)$ na sua coluna de decisão |
| $K$ | - | Fator de escala de custo: todo coeficiente do objetivo, exceto o de $\theta$, é dividido por $K$, de modo que os cortes são mantidos em unidades de custo escalonadas ([Estrutura e escalonamento do PL §2.1](/pt-br/math/lp-layout-and-scaling#21-escalonamento-de-custos)) |

### 3.3 Parâmetros das Hidrelétricas

| Símbolo                                           | Unidade     | Descrição                                                                                                                                                                                                             |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| $\hat{v}_h$                                      | hm³       | Armazenamento de entrada (estado vindo do estágio anterior)                                                                                                                                                                            |
| $\bar{V}_h$, $\underline{V}_h$                   | hm³       | Limites de armazenamento                                                                                                                                                                                                          |
| $\bar{Q}_h$, $\underline{Q}_h$ | m³/s | Limites de vazão turbinada da usina; o máximo da usina limita cada célula |
| $\bar{Q}_{h,b}$, $\underline{Q}_{h,b}$ | m³/s | Limites de vazão turbinada da célula: o máximo é a soma dos máximos dos grupos de unidades geradoras da célula (sob produtibilidade constante, cada um também limitado pelo seu máximo de geração) e é limitado pelo máximo da usina; o mínimo é a soma dos mínimos deles e é um piso flexível |
| $\bar{Q}_u$ | m³/s | Vazão turbinada máxima do grupo de unidades geradoras $u$ |
| $\bar{G}_h$, $\underline{G}_h$ | MW | Limites de geração da usina; o máximo da usina limita cada célula |
| $\bar{G}_{h,b}$, $\underline{G}_{h,b}$ | MW | Limites de geração da célula: o máximo é a soma dos máximos dos grupos de unidades geradoras da célula e é limitado pelo máximo da usina; o mínimo é a soma dos mínimos deles e é um piso flexível |
| $\lambda_{h,b}$ | - | Participação da célula $(h, b)$ na capacidade de turbinamento declarada da usina $h$; reparte entre as células a parcela de cada plano da FPHA que independe da vazão |
| $\bar{O}_h$, $\underline{O}_h$                   | m³/s      | Limites de vazão defluente                                                                                                                                                                                                          |
| $\bar{U}_h$ | m³/s | Vazão desviada máxima |
| $r_h$                                            | m³/s      | Meta de retirada de água — parâmetro fixo do lado direito, com sinal, em nível de estágio (não é uma variável de decisão do PL por patamar); negativo = retorno/acréscimo entre bacias. Veja [Formulação do PL](/pt-br/math/lp-formulation).                           |
| $\rho_h$                                         | MW/(m³/s) | Produtibilidade (modelo constante)                                                                                                                                                                                           |
| $V^{min}_h$, $V^{max}_h$ | hm³ | Faixa física de armazenamento — propriedade da usina invariante no estágio (piso de volume morto, teto de reservatório cheio); distinta dos limites operativos da variável de armazenamento $\underline{V}_h$, $\bar{V}_h$. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $\rho_{eq,h,t}$ | MW/(m³/s) | Produtibilidade equivalente no ponto de operação de referência. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $\rho_{acum,h,t}$ | MW/(m³/s) | Produtibilidade acumulada da cascata (usina mais as de jusante), avaliada no ponto de referência. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $\bar\rho_{eq,h,t}$ | MW/(m³/s) | Produtibilidade equivalente média na faixa útil — nível de montante promediado sobre $[V^{min}_h, V^{max}_h]$. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $\bar\rho_{acum,h,t}$ | MW/(m³/s) | Produtibilidade acumulada da cascata média na faixa útil. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $E^{max}_{h,t}$ | MW/(m³/s)·hm³ | Energia armazenada máxima $\bar\rho_{acum,h,t}\,(V^{max}_h - V^{min}_h)$ (unidade bruta, não MWh). Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $\gamma_0^m, \gamma_v^m, \gamma_q^m, \gamma_s^m$ | -         | Coeficientes do plano $m$ da FPHA — termo independente ($\gamma_0^m$), armazenamento/volume ($\gamma_v^m$), vazão turbinada ($\gamma_q^m$), vertimento ($\gamma_s^m$); já escalonados por $k_{FPHA}$. Minúsculos por convenção — nunca $\Gamma$. |
| $k_{FPHA}$                                  | -         | Fator de correção do ajuste por mínimos quadrados da FPHA; escala o conjunto de planos ajustado. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models).                         |
| $\phi(v, q, s)$ | MW | Função de produção hidrelétrica exata: geração com armazenamento $v$, vazão turbinada $q$ e vertimento $s$, proporcional a $q$ e à queda líquida $h_{net}$. Veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models). |
| $h_{net}(v, q, s) = h_{fore}(v) - h_{tail}(q + s) - h_{loss}$ | m | Queda líquida, limitada inferiormente a zero: o nível de montante $h_{fore}$, função do armazenamento, menos o nível de jusante $h_{tail}$, função da vazão defluente total, menos as perdas hidráulicas $h_{loss}$ |
| $V_i$, $Q_j$ | hm³, m³/s | Ponto de armazenamento $i$ e ponto de vazão turbinada $j$ da grade de ajuste da FPHA, nas coordenadas de armazenamento e de vazão turbinada $V$ e $Q$ |
| $L$ | - | Último estágio de enchimento de uma hidrelétrica em enchimento de volume morto, o estágio anterior ao seu estágio de entrada |
| $\text{rate}_t$ | m³/s | Taxa mínima de acumulação de uma hidrelétrica em enchimento no estágio $t$ |
| $V^{\text{target}}_t$ | hm³ | Armazenamento mínimo ao final do estágio de uma hidrelétrica em enchimento no estágio $t$ (o piso de enchimento), que atinge $\underline{V}_h$ no estágio $L$ |
| $L_h$ | estágios | Profundidade dos buckets da usina receptora $h$: a maior defasagem de maturação que qualquer arco com tempo de viagem chegando a $h$ alcança no calendário de estágios |
| $\phi_{h,k}$ | - | Densidade de chegada do volume em trânsito que amadurece da usina $h$ pelos patamares $k$ de um estágio cronológico, $\phi_{h,k} \geq 0$, $\sum_k \phi_{h,k} = 1$; em um estágio paralelo, $\phi_{h,k} = w_k = \tau_k / H_t$ em um termo de afluência à hidrelétrica ([Formulação do PL §10](/pt-br/math/lp-formulation#afluencia-das-usinas-hidreletricas)) |
| $\Delta^{tt}_{h'}$ | horas | Tempo de viagem do arco principal da cascata da hidrelétrica de montante $h'$, $0$ quando nenhum é declarado |
| $\nu_{h',t,0}$ | - | Fração, no mesmo estágio, da defluência de $h'$ no balanço hídrico de jusante no estágio $t$, $(H_t - \Delta^{tt}_{h'})^+ / H_t$ |
| $\nu^{k' \to k}_{h',t}$ | - | Fração de propagação dentro do estágio em um estágio cronológico, do patamar $k'$ de $h'$ para o patamar de jusante $k \ge k'$ |
| $\gamma^{ev}_{0,h}$, $\gamma^{ev}_{v,h}$ | m³/s, (m³/s)/hm³ | Termo independente e coeficiente angular em relação ao armazenamento da evaporação líquida linearizada da hidrelétrica $h$ no estágio corrente |

### 3.4 Parâmetros de Termelétricas, Rede e Equipamentos

| Símbolo                              | Unidade | Descrição                                                              |
| ----------------------------------- | ----- | ------------------------------------------------------------------------ |
| $\bar{G}_j$, $\underline{G}_j$ | MW | Limites de geração térmica: capacidade e geração mínima (inflexibilidade) |
| $K_i$ | - | Profundidade do ring da térmica com antecipação de despacho $i$; a antecedência, no caso de antecedência em número de estágios |
| $k_{max} = \max_i K_i$ | - | Número de slots no commitment ring de cada térmica com antecipação de despacho |
| $t_i(m)$ | - | Estágio de decisão da entrega da térmica com antecipação de despacho $i$ no estágio $m$: $m - K_i$ no caso de antecedência em número de estágios e, no caso de antecedência física, o estágio que contém o instante situado uma antecedência antes do final do estágio $m$ (um instante sobre a fronteira entre estágios pertence ao estágio anterior); uma entrega decidida antes do estudo não tem estágio de decisão |
| $r_i(m)$ | - | Posição no ring da entrega da térmica com antecipação de despacho $i$ no estágio $m$; a entrega ocupa o slot $r_i(m) \bmod k_{max}$ |
| $\bar{F}^+_n$, $\bar{F}^-_n$  | MW    | Capacidade da linha (sentido direto/reverso)                                           |
| $\eta_n = 1 - \text{losses}/100$ | -     | Rendimento informado da linha: escala as perdas de transmissão informadas após a solução, $(1-\eta_n)(f^+ + f^-)$; não entra no PL de despacho, cujos fluxos nas linhas têm coeficiente ±1. Distinto do ruído PAR $\varepsilon_t$ (§3.5). |
| $\text{loss}_{n,k}$ | MW | Perda de transmissão informada da linha $n$ no patamar $k$, $(1-\eta_n)(f^+_{n,k} + f^-_{n,k})$ |
| $\bar{C}_c$, $\underline{C}_c$      | MW    | Limites de capacidade do contrato                                                 |
| $\rho^{pump}_y$ | MW/(m³/s) | Taxa de consumo de potência da usina elevatória $y$ |
| $\bar{P}_y$, $\underline{P}_y$ | m³/s | Limites de vazão bombeada da usina elevatória $y$ |
| $\bar{G}_r$ | MW | Capacidade instalada da fonte não despachável $r$ |
| $A_{r,k}$ | MW | Geração disponível da fonte não despachável $r$ no patamar $k$ para o estágio e o cenário correntes, $\bar{G}_r \, \xi_r \, f_{r,k}$ |
| $\xi_r$ | - | Fator de disponibilidade da fonte não despachável $r$ para o estágio e o cenário correntes, em $[0, 1]$ |
| $\mu^{nc}_r$, $s^{nc}_r$ | - | Média e desvio-padrão do fator de disponibilidade, antes da limitação, da fonte não despachável $r$ no estágio corrente |
| $\varepsilon^{nc}_r$ | - | Ruído normal padrão da fonte não despachável $r$: $\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \, \varepsilon^{nc}_r, 0, 1)$ |
| $f_{r,k}$ | - | Fator de patamar da fonte não despachável $r$ no patamar $k$ |

### 3.5 Parâmetros do Modelo de Afluências

:::note[Nota sobre a Periodicidade]
O modelo PAR(p) usa parâmetros periódicos que se repetem com um comprimento de ciclo $M$. Configurações comuns:

- **Estágios mensais**: $M=12$ (períodos sazonais = meses)
- **Estágios semanais**: $M=52$ (períodos sazonais = semanas)
- **Resolução personalizada**: $M$ = número de períodos distintos no ciclo

Usamos **"período sazonal $m$"** como termo genérico para a posição dentro do ciclo, evitando o termo "mês", que é específico de uma resolução. Os períodos sazonais são numerados $m \in \{1, \ldots, M\}$. O período sazonal $m(t)$ do estágio $t$ é o período sazonal resolvido do estágio: o período sazonal que o estágio declara ou, quando não declara nenhum, o período sazonal em que cai sua data de início no calendário. O período sazonal $\ell$ defasagens antes do período sazonal $m$ é seu $\ell$-ésimo predecessor no calendário, de modo que a aritmética de períodos sazonais, como $m - \ell$, é tomada módulo $M$ em $\{1, \ldots, M\}$.
:::

| Símbolo             | Unidade | Descrição                                                                                                                                                                                                                                      |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| $\mu_m$            | m³/s  | Afluência média sazonal do período sazonal $m$                                                                                                                                                                                                              |
| $s_m$ | m³/s | Desvio-padrão amostral sazonal do período sazonal $m$ (divisor populacional) |
| $\psi_{m,\ell}$ | - | Coeficiente AR do período sazonal $m$, defasagem $\ell$ (unidades originais) |
| $\psi^*_{m,\ell}$ | - | Coeficiente AR padronizado, $\psi^*_{m,\ell} = \psi_{m,\ell}\, s_{m-\ell} / s_m$ |
| $P_h$ | - | Ordem do modelo AR da hidrelétrica $h$; suas defasagens são $\ell \in \{1, \ldots, P_h\}$ |
| $P^{\max}$ | - | Profundidade de defasagens do estado de tendência hidrológica, a mesma para todas as hidrelétricas: a maior ordem AR, $\max_h P_h$, elevada a pelo menos doze quando alguma hidrelétrica tem a componente anual, e à defasagem mais profunda referenciada por uma fronteira terminal ([Aumento do espaço de estados §4](/pt-br/math/state-augmentation#4-defasagens-de-afluencia)) |
| $r_m$ | - | Escala padronizada do ruído, $r_m = \sigma_m / s_m \in (0, 1]$ |
| $\sigma_m$ | m³/s | Desvio-padrão do ruído (resíduo) do período sazonal $m$, $\sigma_m = s_m\, r_m$ |
| $b_{h,m(t)}$ | m³/s | Base determinística da equação de afluência PAR(p) no período sazonal $m = m(t)$: $\mu_m - \sum_{\ell=1}^{P_h} \psi_{m,\ell}\, \mu_{m-\ell}$ |
| $\mu^A_m$, $\sigma^A_m$ | m³/s | Média e desvio-padrão sazonais (divisor populacional) do regressor anual do período sazonal $m$ no PAR(p)-A |
| $\rho_m(\ell)$ | - | Autocorrelação periódica na defasagem $\ell$ para o período sazonal $m$ |
| $N_m$ | - | Número de observações históricas do período sazonal $m$ |
| $z_{0.975}$ | - | Quantil 0,975 da normal padrão: o valor crítico do teste de significância da PACF ao nível de 95 % |
| $\varepsilon_t$    | -     | Ruído PAR: termo de ruído padronizado, $\varepsilon_t \sim \mathcal{N}(0,1)$ (distinto do rendimento da linha $\eta_n$, §3.4, e da variável de excesso de geração $\epsilon_{b,k}$, §4.1). Veja [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model). |
| $z$ | - | Vetor de sorteios normais padrão independentes, $z \sim \mathcal{N}(0, I)$, transformado em ruído correlacionado |
| $C$ | - | Matriz de correlação espacial de um grupo de correlação |
| $U$, $\Lambda$ | - | Autodecomposição $C = U \Lambda U^\top$: autovetores ortogonais $U$ e a matriz diagonal $\Lambda = \mathrm{diag}(\lambda_1, \ldots, \lambda_n)$ dos autovalores $\lambda_i$ |
| $\tilde{\Lambda}^{1/2}$ | - | Raízes quadradas dos autovalores truncados em zero, $\mathrm{diag}(\sqrt{\max(\lambda_1, 0)}, \ldots, \sqrt{\max(\lambda_n, 0)})$ |
| $C^{1/2}$ | - | Fator espectral de correlação $U \Lambda^{1/2} U^\top$, com autovalores negativos truncados em zero; o ruído correlacionado é $C^{1/2} z$ |
| $a_h$ | m³/s | Vazão incremental da hidrelétrica $h$ no estágio corrente |
| $a^-_h$ | m³/s | Montante truncado, a parte negativa da realização: $a^-_h = \max(0, -a_h)$ ([Métodos de tratamento de afluências negativas](/pt-br/math/inflow-nonnegativity)) |
| $\hat{a}_{h,\ell}$ | m³/s  | Defasagem AR $\ell$ de entrada (estado)                                                                                                                                                                                                                   |

## 4. Variáveis de Decisão

:::note[Convenção de Notação]

- **Variáveis de geração** usam $g$ com subscrito da entidade: $g_{h,b,k}$ (hidrelétrica, por célula (hidrelétrica, barramento)), $g_{j,k}$ (usina termelétrica $j$), $g^{nc}_{r,k}$ (fonte não despachável $r$)
- **Variáveis de vazão** usam letras únicas intuitivas: $q$ (turbinada), $s$ (vertimento), $u$ (desvio/by-pass)
- **Vazão defluente total** é definida explicitamente: $o_h = q_h + s_h$ (vazão no canal de jusante)
- **Variáveis de contrato** usam um único $\chi_c$ (chi) por contrato; o sentido é dado pela pertinência ao conjunto ($c \in \mathcal{C}^{imp}$ ou $c \in \mathcal{C}^{exp}$), e não por um sobrescrito — cada contrato é unidirecional
- **Variáveis de folga** usam $\sigma$ com sobrescrito do tipo de restrição
  :::

### 4.1 Variáveis por Patamar

As variáveis por patamar são indexadas por $k \in \mathcal{K}$:

| Variável         | Domínio                         | Unidade | Descrição                                                                                                                                   |
| ---------------- | ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| $\delta_{b,k,s}$ | $[0, \bar{d}_{b,s}]$           | MW    | Déficit no barramento $b$, segmento $s$                                                                                                               |
| $\epsilon_{b,k}$ | $\geq 0$                       | MW    | Excesso de geração no barramento $b$                                                                                                                  |
| $f^+_{n,k}$   | $[0, \bar{F}^+_n]$          | MW    | Fluxo no sentido direto na linha $n$                                                                                                                    |
| $f^-_{n,k}$   | $[0, \bar{F}^-_n]$          | MW    | Fluxo no sentido reverso na linha $n$                                                                                                                   |
| $g_{j,k}$ | $[\underline{G}_j, \bar{G}_j]$ | MW | Geração da usina termelétrica $j$ |
| $q_{h,b,k}$ | $[0, \bar{Q}_{h,b}]$ | m³/s | Vazão turbinada da célula $(h, b)$; seu mínimo $\underline{Q}_{h,b}$ é um piso flexível (folga $\sigma^{q-}_{h,b,k}$) |
| $q_{h,k}$ | - | m³/s | Vazão turbinada da usina, $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$ |
| $s_{h,k}$        | $\geq 0$                       | m³/s  | Vertimento na hidrelétrica $h$                                                                                                                         |
| $g_{h,b,k}$ | $[0, \bar{G}_{h,b}]$ | MW | Geração hidrelétrica da célula $(h, b)$, injetada no barramento $b$; seu mínimo $\underline{G}_{h,b}$ é um piso flexível (folga $\sigma^{g-}_{h,b,k}$) |
| $g_{h,k}$ | - | MW | Geração hidrelétrica da usina, $g_{h,k} = \sum_{b \in \mathcal{B}_h} g_{h,b,k}$ |
| $v_{h,k}$ | $[\underline{V}_h, \bar{V}_h]$ | hm³ | Armazenamento ao final do patamar $k$ em um estágio cronológico, $v_{h,0} = \hat{v}_h$; apenas $v_{h,\lvert\mathcal{K}\rvert}$ é estado; o limite inferior da coluna é $0$, e não $\underline{V}_h$, para uma hidrelétrica em enchimento e para uma hidrelétrica fora de serviço (veja [Formulação do PL §8](/pt-br/math/lp-formulation#8-limites-das-variaveis-e-restricoes-de-minimo)) |
| $u_{h,k}$        | $[0, \bar{U}_h]$               | m³/s  | Vazão desviada/by-pass (para um canal separado)                                                                                                   |
| $o_{h,k}$        | -                              | m³/s  | Vazão defluente total para jusante: $o_{h,k} = q_{h,k} + s_{h,k}$                                                                                       |
| $e_{h,k}$ | limitada | m³/s | Vazão de evaporação líquida (negativa quando há aporte líquido de chuva): um único valor $e_h$ em nível de estágio em um estágio paralelo, um por patamar $k$ em um estágio cronológico; sua magnitude tem um limite por estágio |
| $\text{net\_flows}_{h,k}$ | - | m³/s | Termos líquidos de vazão por patamar no balanço hídrico da hidrelétrica $h$ no patamar $k$: a defluência turbinada e vertida recebida de montante e as vazões desviadas e bombeadas que entram, menos a vazão turbinada, vertida e desviada da própria usina e a vazão bombeada que sai |
| $p_{y,k}$        | $[\underline{P}_y, \bar{P}_y]$ | m³/s  | Vazão bombeada na usina elevatória $y$                                                                                                                    |
| $\chi_{c,k}$     | $[\underline{C}_c, \bar{C}_c]$ | MW    | Despacho do contrato (importação se $c \in \mathcal{C}^{imp}$, exportação se $c \in \mathcal{C}^{exp}$); $\underline{C}_c > 0$ é um piso do tipo take-or-pay    |
| $g^{nc}_{r,k}$ | $[0, A_{r,k}]$ | MW | Geração da fonte não despachável $r$ |
| $\kappa_{r,k}$ | - | MW | Corte de geração da fonte não despachável $r$, $\kappa_{r,k} = A_{r,k} - g^{nc}_{r,k}$ (derivado) |

### 4.2 Variáveis de Estado em Nível de Estágio

| Variável                 | Domínio                         | Unidade | Descrição                                                                                                                        |
| ------------------------ | ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| $v_h$                    | $[\underline{V}_h, \bar{V}_h]$ | hm³   | Armazenamento ao final do estágio; o limite inferior da coluna é $0$, e não $\underline{V}_h$, para uma hidrelétrica em enchimento e para uma hidrelétrica fora de serviço (veja [Formulação do PL §8](/pt-br/math/lp-formulation#8-limites-das-variaveis-e-restricoes-de-minimo)) |
| $v^{in}_h$ | fixa | hm³ | Variável de armazenamento de entrada do PL do estágio, fixada no armazenamento de entrada $\hat{v}_h$ |
| $v^{avg}_h$              | -                              | hm³   | Armazenamento médio durante o estágio: $(\hat{v}_h + v_h)/2$                                                                                |
| $a_{h,\ell}$             | fixa                          | m³/s  | Defasagem AR $\ell$ (fixada pela transição de estado)                                                                                          |
| $x^{\mathrm{a}}_{s,i}$ | livre; $0$ quando nenhuma linha a contém | MW | Slot de saída $s$ do commitment ring da térmica com antecipação de despacho $i$, $s \in \{0, \ldots, k_{max} - 1\}$ |
| $x^{\mathrm{a,in}}_{s,i}$ | fixa | MW | Slot de entrada $s$, fixado no seu valor visitado $\hat{x}^{\mathrm{a}}_{s,i}$ |
| $b^{\mathrm{out}}_{h,d}$ | $\geq 0$ | hm³ | Água em trânsito destinada à usina de jusante $h$ com defasagem de maturação $d$, levada ao estágio seguinte; entra no balanço hídrico de $h$ $d$ estágios após o estágio corrente |
| $g^{\mathrm{a}}_{i,t}$ | $[\underline{G}_i(m), \bar{G}_i(m)]$ | MW | Compromisso de despacho da térmica com antecipação de despacho decidido no estágio $t$ para seu estágio de entrega $m$, $t_i(m) = t$ ($m = t + K_i$ no caso de antecedência em número de estágios) |
| $x^{in}$ | fixa | - | Variável de estado de entrada do PL do estágio, fixada no estado visitado: $x^{in} = \hat{x}_{t-1}$ |
| $\theta$ | $\geq 0$ | R\$ | Variável de epígrafo do custo futuro $\theta_t$ do PL do estágio $t$, que aproxima $V_{t+1}(x_t)$ |

A dimensão do estado é $n_{\text{state}} = N(1 + P^{\max}) + B + A \, k_{max}$, com $N = \lvert\mathcal{H}\rvert$ hidrelétricas, $B = \sum_h L_h$ in-transit buckets e $A$ térmicas com antecipação de despacho.

### 4.3 Variáveis de Folga

Variáveis de folga das restrições flexíveis:

| Variável                                 | Domínio   | Unidade | Restrição                                                                                                                                        |
| ---------------------------------------- | -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| $\sigma^{v-}_h$                          | $\geq 0$ | hm³   | Armazenamento abaixo do volume morto de uma hidrelétrica em enchimento, a partir do seu estágio de entrada (o volume morto de todas as demais hidrelétricas em operação é um limite rígido)             |
| $\sigma^{fill}_h$                        | $\geq 0$ | hm³   | Déficit em relação ao piso de enchimento do estágio                                                                                                                 |
| $\sigma^{q-}_{h,b,k}$                    | $\geq 0$ | m³/s  | Vazão turbinada abaixo do mínimo — uma por célula (hidrelétrica, barramento) $b \in \mathcal{B}_h$ de uma usina dividida                                                    |
| $\sigma^{Q-}_{h,k}$                      | $\geq 0$ | m³/s  | Vazão turbinada da usina abaixo do mínimo da usina, além do que as folgas das células cobrem (uma usina com várias células cujo mínimo está ativo) |
| $\sigma^{o-}_{h,k}$                      | $\geq 0$ | m³/s  | Vazão defluente abaixo do mínimo (por usina — não há coluna de vazão defluente por célula à qual atribuir um piso)                                                            |
| $\sigma^{o+}_{h,k}$                      | $\geq 0$ | m³/s  | Vazão defluente acima do máximo (por usina)                                                                                                                 |
| $\sigma^{g-}_{h,b,k}$                    | $\geq 0$ | MW    | Geração abaixo do mínimo — uma por célula (hidrelétrica, barramento) $b \in \mathcal{B}_h$ de uma usina dividida                                                       |
| $\sigma^{G-}_{h,k}$                      | $\geq 0$ | MW    | Geração da usina abaixo do mínimo da usina, além do que as folgas das células cobrem (uma usina com várias células cujo mínimo está ativo) |
| $\sigma^{e+}_{h,k}$, $\sigma^{e-}_{h,k}$ | $\geq 0$ | m³/s | Violação da evaporação acima e abaixo da meta (por usina): um único par $\sigma^{e\pm}_h$ em nível de estágio em um estágio paralelo, precificado sobre as horas do estágio $H_t$; um par por patamar em um estágio cronológico, precificado sobre $\tau_k$ |
| $\sigma^{w-}_h$, $\sigma^{w+}_h$         | $\geq 0$ | m³/s  | Retirada de água abaixo/acima da meta $r_h$ (em nível de estágio, não por patamar); precificadas por $c^{wv-}_h$ / $c^{wv+}_h$, respectivamente |
| $\sigma^{inf}_h$                         | $\geq 0$ | m³/s  | Não negatividade da afluência, em todos os métodos de afluência exceto `none`; seus limites seguem o método                                                            |

## 5. Duais e Coeficientes dos Cortes

O dual de uma restrição $\pi$ é o multiplicador de Lagrange de uma linha do PL: a taxa de variação do custo ótimo do estágio por unidade de aumento do lado direito da restrição.
O coeficiente do corte $\beta$ é um subgradiente da função de valor $V_t$ em relação ao estado de entrada no estado visitado $\hat{x}_{t-1}$; cada componente é igual ao dual do limite que fixa a respectiva coordenada do estado no valor visitado.
Suas componentes incluem o coeficiente de armazenamento $\beta^v_h$, o coeficiente das defasagens AR $\beta^{lag}_{h,\ell}$ e os coeficientes dos in-transit buckets e dos ring slots de antecipação; com o termo independente armazenado $\beta_0$, eles formam o corte $(\beta_0, \beta)$ da §1.
Convenção de sinais: mais armazenamento de entrada reduz o custo futuro sempre que a água adicional desloca geração térmica ou déficit, de modo que o coeficiente de armazenamento $\beta^v_h$ é não positivo nesses casos, e pode tornar-se positivo quando a água adicional só pode deixar o reservatório a um custo; veja [Gerenciamento de cortes](/pt-br/math/cut-management) para os coeficientes dos cortes, [Formulação do PL](/pt-br/math/lp-formulation) para as restrições e [Aumento do espaço de estados](/pt-br/math/state-augmentation) para a fixação do estado.

| Símbolo           | Restrição                              | Significado                                                 |
| ---------------- | -------------------------------- | ------------------------------------------------------- |
| $\pi^{lb}_{b,k}$ | Atendimento à carga, barramento $b$, patamar $k$ | Custo marginal da energia                                 |
| $\pi^{wb}_h$     | Balanço hídrico, hidrelétrica $h$ (patamar $k$ em um estágio cronológico, $\pi^{wb}_{h,k}$) | Valor da água                                             |
| $\pi_m^{fpha}$   | Hiperplano $m$ da FPHA              | Valor marginal do limite de geração imposto pelo plano $m$ |

## Referências Cruzadas

- [Formulação do PL](/pt-br/math/lp-formulation) — Subproblema de PL completo usando esta notação
- [Aumento do espaço de estados](/pt-br/math/state-augmentation) — o vetor de estado, sua fixação, o estado de saída e a mecânica das famílias de estado
- [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling) — leiaute de colunas e linhas, pré-escalonamento e escala de custo
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — Visão geral do algoritmo e processo de geração de cortes
- [Gerenciamento de cortes](/pt-br/math/cut-management) — Cálculo dos coeficientes dos cortes e detalhes de agregação
- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — Modelo PAR(p) detalhado, usando os parâmetros de afluência definidos aqui
- [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models) — Coeficientes dos planos da FPHA ($\gamma$) e produtibilidade ($\rho$)
- [Formulações específicas por equipamento](/pt-br/math/equipment-formulations) — Notação das variáveis de termelétricas, contratos e bombeamento
- [O que o Novo Modelo resolve](/pt-br/overview/what-novomodelo-solves) — os princípios metodológicos: reprodutibilidade, determinismo, invariância à ordem de declaração e legibilidade por agentes
