---
title: Formulação do PL
description: O PL completo do subproblema do estágio — taxonomia da função objetivo, todas as famílias de restrições, variáveis de folga/penalidade e a interface dos cortes de Benders com a função de custo futuro.
---

## Objetivo

Este capítulo apresenta o PL completo do subproblema do estágio do solver de PDDE (SDDP) do Novo Modelo: a função objetivo com sua taxonomia de custos, todas as famílias de restrições, as variáveis de folga/penalidade e a interface dos cortes de Benders com a função de custo futuro. Por padrão, usa-se a formulação de **patamares paralelos**.

**Ordem de leitura**: [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) → [Formulações específicas por equipamento](/pt-br/math/equipment-formulations) → **este capítulo** → [Aumento do espaço de estados](/pt-br/math/state-augmentation)

Para o que cada elemento físico representa e suas variáveis de decisão, veja [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements). Para as convenções de nomenclatura das variáveis e os conjuntos de índices, veja [Convenções de notação](/pt-br/overview/notation-conventions).

## O PL do Estágio em Resumo

Dado o seu estado de entrada, o PL do estágio minimiza a função objetivo abaixo sujeito às linhas de todas as famílias que contém, cada uma escrita na sua forma de estágio paralelo com os símbolos da seção responsável, em que $\cdots$ representa termos que essa seção escreve por extenso; as famílias do in-transit bucket e do commitment ring são citadas em uma única linha.

$$
\begin{aligned}
& \min\; C^{resource} + C^{recourse} + C^{violation} + C^{regularization} + d_{t \to t+1}\,\theta \\
& z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \, a_{h,\ell} + \sigma_{m(t)} \, \varepsilon_t \quad (1) \\
& v_h - v^{in}_h - \zeta \, z_h + \sum_{k \in \mathcal{K}} \zeta_k \big( q_{h,k} + s_{h,k} + u_{h,k} \big) + \cdots = -\zeta \, r_h \quad (2) \\
& \sum_{h \in \mathcal{H}_b} g_{h,b,k} + \sum_{j \in \mathcal{T}_b} g_{j,k} + \cdots + \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k} \quad (4) \\
& g_{h,b,k} \leq \lambda_{h,b} \big( \gamma^m_0 + \gamma^m_v \, v^{avg}_h + \gamma^m_s \, s_{h,k} \big) + \gamma^m_q \, q_{h,b,k} \quad (5) \\
& e_h - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v^{in}_h + v_h \big) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h} \quad (6) \\
& q_{h,k} + s_{h,k} + \sigma^{o-}_{h,k} \geq \underline{O}_h \quad (7) \\
& q_{h,k} + s_{h,k} - \sigma^{o+}_{h,k} \leq \bar{O}_h \quad (8) \\
& q_{h,b,k} + \sigma^{q-}_{h,b,k} \geq \underline{Q}_{h,b} \quad (9) \\
& g_{h,b,k} + \sigma^{g-}_{h,b,k} \geq \underline{G}_{h,b} \quad (10) \\
& v_h + \sigma^{fill}_h \geq V^{\text{target}}_t \quad (11) \\
& v_h + \sigma^{v-}_h \geq \underline{V}_h \quad (12) \\
& \text{in-transit bucket definition; commitment fish, deposit and carry} \quad (3),\ (13),\ (14),\ (15) \\
& \underline{b}_g \leq \sum_{e} \gamma_{g,e} \, x_e \leq \bar{b}_g \quad (16) \\
& \theta \geq \beta_{0,i} + \sum_{h \in \mathcal{H}} \beta^v_{i,h} \, v_h + \cdots \quad (17)
\end{aligned}
$$

A tabela lista as famílias na ordem das linhas do PL do estágio, com $N = \lvert\mathcal{H}\rvert$ usinas hidrelétricas e $\lvert\mathcal{K}\rvert$ patamares no estágio.

| Nº | Família de linhas | Linhas por estágio | Seção |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1 | Definição da afluência realizada | $N$, uma por usina hidrelétrica | [§5](#5-linhas-de-definicao-da-afluencia-realizada) |
| 2 | Balanço hídrico | $N$ em um estágio paralelo, $N \lvert\mathcal{K}\rvert$ em um estágio cronológico | [§4](#4-balanco-hidrico-das-usinas-hidreletricas) |
| 3 | Definição dos in-transit buckets | uma por usina receptora e defasagem de maturação alcançada no estágio | [Aumento do espaço de estados — Linhas de definição dos buckets](/pt-br/math/state-augmentation#linhas-de-definicao-dos-buckets) |
| 4 | Atendimento à carga | $\lvert\mathcal{B}\rvert \, \lvert\mathcal{K}\rvert$, uma por barramento e patamar | [§3](#3-restricao-de-atendimento-a-carga) |
| 5 | Planos da FPHA | uma por plano, célula (usina, barramento) e patamar de cada usina com FPHA; nenhuma enquanto a usina está em pré-enchimento (PreFilling) ou na sua janela de enchimento | [§6](#6-restricoes-de-geracao-hidreletrica) |
| 6 | Evaporação | uma por usina com evaporação em um estágio paralelo, uma por usina com evaporação e patamar em um estágio cronológico; nenhuma enquanto a usina está em pré-enchimento | [§4 Linha de Evaporação](#linha-de-evaporacao) |
| 7 | Vazão defluente mínima | $N \lvert\mathcal{K}\rvert$, uma por usina hidrelétrica e patamar | [§7](#7-restricoes-de-vazao-defluente) |
| 8 | Vazão defluente máxima | $N \lvert\mathcal{K}\rvert$, uma por usina hidrelétrica e patamar | [§7](#7-restricoes-de-vazao-defluente) |
| 9 | Vazão turbinada mínima | uma por célula (usina, barramento) e patamar | [§8](#8-limites-das-variaveis-e-restricoes-de-minimo) |
| 10 | Geração mínima | uma por célula (usina, barramento) e patamar | [§6](#6-restricoes-de-geracao-hidreletrica) |
| 11 | Mínimo e máximo da usina | para uma usina com várias células, por patamar: uma linha de mínimo de vazão turbinada e uma de mínimo de geração quando o mínimo da usina é ativo sobre o total das suas células em algum patamar do estágio, e depois uma linha de máximo de vazão turbinada e uma de máximo de geração quando o máximo da usina o é | [§8 Mínimo e Máximo da Usina](#minimo-e-maximo-da-usina) |
| 12 | Piso de enchimento | uma por usina em enchimento em cada estágio da sua janela de enchimento | [§8](#8-limites-das-variaveis-e-restricoes-de-minimo) |
| 13 | Piso flexível de volume morto | uma por usina em enchimento em cada estágio a partir do seu estágio de entrada | [§8](#8-limites-das-variaveis-e-restricoes-de-minimo) |
| 14 | Saída do commitment ring | uma por termelétrica com antecipação cuja entrega no estágio foi decidida em um estágio anterior ou antes do estudo | [Aumento do espaço de estados — Linhas do Ring](/pt-br/math/state-augmentation#linhas-do-ring) |
| 15 | Depósito no commitment ring | uma por termelétrica com antecipação que decide no estágio um compromisso para uma entrega dentro do estudo ou do calendário pós-estudo declarado em que a usina está em operação | [Aumento do espaço de estados — Linhas do Ring](/pt-br/math/state-augmentation#linhas-do-ring) |
| 16 | Transporte no commitment ring | uma por ring slot que contém uma entrega posterior, decidida em um estágio anterior ou antes do estudo, dentro do estudo ou do calendário pós-estudo declarado | [Aumento do espaço de estados — Linhas do Ring](/pt-br/math/state-augmentation#linhas-do-ring) |
| 17 | Restrições genéricas | uma por limite ativo e patamar que ele abrange, ou uma linha no nível do estágio para um limite independente do patamar | [§10](#10-restricoes-genericas) |
| 18 | Cortes de Benders | um por corte ativo; um por corte residente no método dinâmico | [§11](#11-cortes-de-benders) |

A fixação do estado de entrada e as fixações do ciclo de vida são limites de coluna, e não linhas: cada coluna de estado de entrada é fixada no seu valor visitado por limites iguais ([Aumento do espaço de estados §2](/pt-br/math/state-augmentation#2-fixacao-por-limites-de-coluna)), e cada coluna que uma fase do ciclo de vida congela é fixada por seus limites ([§8](#8-limites-das-variaveis-e-restricoes-de-minimo)).

## 1. Taxonomia de Custos e Penalidades

O [Sistema de penalidades](/pt-br/math/penalty-system) é responsável pelas categorias de custo, suas unidades, sua [ordem de prioridade](/pt-br/math/penalty-system#ordem-de-prioridade-das-penalidades), as verificações de ordenação e a resolução em cascata; a tabela lista os símbolos de custo de cada categoria tal como esta página os escreve.

| Categoria | Símbolos de custo |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Custos térmicos e de contratos | $c^{th}_j$, $c^{ctr}_c$ |
| [Folgas de recurso](/pt-br/math/penalty-system#categoria-1-folgas-de-recurso-viabilidade-do-pl) | $c^{def}_{b,s}$, $c^{exc}_b$, $c^{inf}_h$ |
| [Penalidades por violação de restrições](/pt-br/math/penalty-system#categoria-2-penalidades-por-violacao-de-restricoes-conformacao-da-politica) | $c^{sv-}_h$, $c^{fill}_h$, $c^{tv-}_h$, $c^{ov-}_h$, $c^{ov+}_h$, $c^{gv-}_h$, $c^{ev+}_h$, $c^{ev-}_h$, $c^{wv+}_h$, $c^{wv-}_h$ |
| [Custos de regularização](/pt-br/math/penalty-system#categoria-3-custos-de-regularizacao-orientacao-da-solucao) | $c^{spill}_h$, $c^{tc}_h$, $c^{div}_h$, $c^{curt}_r$, $c^{exch}_n$ |

O bombeamento não tem termo de custo; a potência consumida por uma usina elevatória entra no atendimento à carga do seu barramento (§3, [Formulações específicas por equipamento §4](/pt-br/math/equipment-formulations#4-usinas-elevatorias)).

### 1.1 Estrutura da Função Objetivo

A função objetivo completa do estágio é:

$$
\min \; \underbrace{C^{resource}}_{\text{thermal, contracts}} + \underbrace{C^{recourse}}_{\text{deficit, excess, inflow non-negativity}} + \underbrace{C^{violation}}_{\text{constraint slacks}} + \underbrace{C^{regularization}}_{\text{spillage, exchange, ...}} + d_{t \to t+1} \, \theta
$$

em que os termos por patamar são ponderados pela duração do patamar $\tau_k$, exceto as folgas na base de quantidade de uma restrição genérica por patamar (§10), e os termos no nível do estágio — a saber, as folgas de violação de armazenamento sobre o armazenamento ao fim do estágio, as folgas de não negatividade da afluência e de retirada, as folgas de evaporação de um estágio paralelo, as folgas de uma restrição genérica no nível do estágio (§10) e o custo de compromisso de uma termelétrica com antecipação de despacho — aplicam-se uma única vez por estágio (§2); a parte por patamar de cada componente é:

$$
C^{component} = \sum_{k \in \mathcal{K}} \tau_k \cdot (\text{cost terms for component})
$$

O coeficiente de $\theta$ é o fator de desconto de um passo $d_{t \to t+1}$ de [Formulação da taxa de desconto](/pt-br/math/discount-rate), igual a 1 quando a taxa é nula.

## 2. Função Objetivo

$$
\min \sum_{k \in \mathcal{K}} \tau_k \Bigg[
  \underbrace{\sum_{j \in \mathcal{T}} c^{th}_j g_{j,k}}_{\text{Thermal cost}}
  + \underbrace{\sum_{c \in \mathcal{C}} c^{ctr}_c \chi_{c,k}}_{\text{Contract cost}}
$$

$$
  + \underbrace{\sum_{b \in \mathcal{B}} \sum_{s \in \mathcal{S}_b} c^{def}_{b,s} \delta_{b,k,s}}_{\text{Deficit (piecewise)}}
  + \underbrace{\sum_{b \in \mathcal{B}} c^{exc}_b \epsilon_{b,k}}_{\text{Excess}}
$$

$$
  + \underbrace{\sum_{h \in \mathcal{H}} c^{spill}_h s_{h,k}
  + \sum_{h \in \mathcal{H}} c^{tc}_h q_{h,k}
  + \sum_{h \in \mathcal{H}} c^{div}_h u_{h,k}}_{\text{Hydro regularization}}
$$

$$
  - \underbrace{\sum_{r \in \mathcal{R}} c^{curt}_r \, g^{nc}_{r,k}}_{\text{Curtailment (regularization)}}
  + \underbrace{\sum_{n \in \mathcal{L}} c^{exch}_n (f^+_{n,k} + f^-_{n,k})}_{\text{Exchange (regularization)}}
$$

$$
  + \underbrace{\text{Constraint violation penalties}}_{\text{See }\S 9}
\Bigg]
$$

$$
+ \underbrace{\sum_{h \in \mathcal{H}} \Big[ c^{sv-}_h \sigma^{v-}_h + c^{fill}_h \sigma^{fill}_h \Big]}_{\text{Storage violations (not per-block)}}
+ \underbrace{\sum_{h \in \mathcal{H}} c^{inf}_h H_t \, \sigma^{inf}_h}_{\text{Inflow non-negativity (not per-block)}}
+ \; d_{t \to t+1} \, \theta
$$

:::note[Observação sobre as penalidades por violação de armazenamento]
As penalidades por violação de armazenamento ($\sigma^{v-}_h$, $\sigma^{fill}_h$) **não** são multiplicadas por $\tau_k$, pois se aplicam ao armazenamento ao fim do estágio (hm³), e não a vazões por patamar. Todos os demais termos de penalidade são por patamar e levam a ponderação $\tau_k$, exceto as folgas de retirada e de não negatividade da afluência, no nível do estágio, e, em um estágio paralelo, as folgas de evaporação, que são valoradas sobre $H_t$ (§9 e a expressão acima). Os preços dos contratos seguem a convenção de sinais de [Formulações específicas por equipamento §3](/pt-br/math/equipment-formulations#3-contratos-de-importacaoexportacao). $\sigma^{v-}_h$ existe apenas para uma usina em enchimento a partir do seu estágio de entrada, e $\sigma^{fill}_h$ apenas durante a sua janela de enchimento; para todas as demais usinas, ambas estão ausentes. A folga de não negatividade da afluência $\sigma^{inf}_h$ está presente em todos os métodos de afluência exceto `none`, e seu termo na função objetivo em `penalty` e `truncation_with_penalty`; em `truncation`, a folga é fixada no montante de truncamento e não tem custo ([Métodos de tratamento de afluências negativas](/pt-br/math/inflow-nonnegativity)).
:::

Em `penalty`, cuja folga não tem limite superior, onde quer que a folga de não negatividade da afluência entre no balanço hídrico de $h$ (§4), ela fornece água a esse balanço a $c^{inf}_h H_t$ por $\zeta$ hm³, de modo que, em um estágio paralelo, o valor de um hm³ adicional de água em $h$ é no máximo $c^{inf}_h H_t / \zeta$. Em um estágio cronológico, a folga entra em cada linha de patamar com o seu $\zeta_k$, e o limite vale para a média ponderada pela duração, com pesos $w_k$, dos valores dos patamares, e não para cada patamar. O limite é unilateral: limita o valor da água, e não um valor negativo da água excedente. Em um estágio paralelo, o coeficiente de armazenamento do corte $\beta^v_h$ lido no estágio herda o limite, $-\beta^v_h \le c^{inf}_h H_t / \zeta$, quando $v^{in}_h$ entra apenas no balanço hídrico; um plano da FPHA, a linha de evaporação ou uma restrição genérica que leia $v^{in}_h$ acrescenta seus próprios termos. Os métodos de truncamento limitam a folga ao montante de truncamento $a^-_h$ ([Métodos de tratamento de afluências negativas §1](/pt-br/math/inflow-nonnegativity#1-formulacao-do-problema)). Em `truncation_with_penalty`, o limite vale em uma resolução cuja realização é negativa e cuja folga fica estritamente abaixo do seu teto; em uma realização não negativa, o teto é $a^-_h = 0$ e a folga fixa nada limita, e $\beta^v_h$ herda o limite quando ele vale em todas as aberturas que o corte combina. Em `truncation`, cuja folga fixa não limita valor da água algum, não existe tal limite. Nos dois métodos valorados, o [Sistema de penalidades — Ordem de Prioridade das Penalidades](/pt-br/math/penalty-system#ordem-de-prioridade-das-penalidades) converte o custo de afluência para R\$/MWh e o ordena abaixo do déficit, de modo que o PL recorre à água da folga antes de cortar carga.

As termelétricas com antecipação de despacho ([Aumento do espaço de estados §5](/pt-br/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)) acrescentam um termo de custo de compromisso no nível do estágio por usina que decide um compromisso no estágio — e não um termo por patamar: a coluna de compromisso valorada ao custo unitário da usina e às horas do estágio de entrega, e descontada a partir dele ([Aumento do espaço de estados — Contribuições à função objetivo](/pt-br/math/state-augmentation#contribuicoes-a-funcao-objetivo)). Sua geração por patamar não tem custo térmico em um estágio em que a usina possui uma linha de saída do ring ([Aumento do espaço de estados — Linhas do Ring](/pt-br/math/state-augmentation#linhas-do-ring)), o que a vincula ao montante comprometido; em qualquer outro estágio, é valorada como qualquer termelétrica.

:::note[Observação sobre o corte de geração]
O corte de geração (curtailment) é valorado como uma recompensa sobre a geração não despachável efetivamente despachada ([Formulações específicas por equipamento §6](/pt-br/math/equipment-formulations#6-fontes-de-geracao-nao-despachaveis)), de modo que a função objetivo do estágio pode ser negativa.
:::

## 3. Restrição de Atendimento à Carga

Cada usina hidrelétrica $h$ é particionada em uma ou mais **células (usina, barramento)** — uma célula por barramento distinto entre os grupos de unidades geradoras declarados da usina (veja [Visão geral da modelagem dos elementos do sistema §5](/pt-br/math/system-elements)). $\mathcal{B}_h$ denota o conjunto de barramentos que abrigam uma das células de $h$; $\mathcal{H}_b$ denota as usinas com uma célula no barramento $b$ (isto é, $b \in \mathcal{B}_h$). $g_{h,b,k}$ é a geração da célula da usina $h$ no barramento $b$, no patamar $k$ — a grandeza efetivamente injetada em $b$. Uma usina cujos grupos compartilham um único barramento tem $|\mathcal{B}_h| = 1$, e $g_{h,b,k}$ reduz-se ao $g_{h,k}$ de célula única usado em todo o restante deste capítulo.

Para cada barramento $b \in \mathcal{B}$ e patamar $k \in \mathcal{K}$:

$$
\sum_{h \in \mathcal{H}_b} g_{h,b,k} + \sum_{j \in \mathcal{T}_b} g_{j,k}
+ \sum_{r \in \mathcal{R}_b} g^{nc}_{r,k}
+ \sum_{c \in \mathcal{C}^{imp}_b} \chi_{c,k}
$$

$$
+ \sum_{n: \text{target}=b} f^+_{n,k} + \sum_{n: \text{source}=b} f^-_{n,k}
$$

$$
- \sum_{n: \text{source}=b} f^+_{n,k} - \sum_{n: \text{target}=b} f^-_{n,k}
- \sum_{c \in \mathcal{C}^{exp}_b} \chi_{c,k}
- \sum_{y \in \mathcal{P}_b} \rho^{pump}_y p_{y,k}
+ \sum_{s \in \mathcal{S}_b} \delta_{b,k,s} - \epsilon_{b,k} = D_{b,k}
$$

**Variável dual**: $\pi^{lb}_{b,k}$ (custo marginal da energia no barramento $b$, patamar $k$, em R\$/MW; divida por $\tau_k$ para obter R\$/MWh — veja [Convenção de Unidades das Variáveis](/pt-br/math/system-elements#convencao-de-unidades-das-variaveis))

Para o significado físico de cada elemento do balanço, veja [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements).

## 4. Balanço Hídrico das Usinas Hidrelétricas

Toda usina hidrelétrica $h \in \mathcal{H}$ tem uma linha de balanço hídrico em um estágio paralelo e uma por patamar em um estágio cronológico ([Variantes de formulação dos patamares](/pt-br/math/block-formulations)); toda variável do PL fica no lado esquerdo.

### Linha do Estágio Paralelo

$$
\begin{aligned}
& v_h - v^{in}_h - b^{\mathrm{in}}_{h,1}
  - \zeta \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_h \big) \\
& \quad + \sum_{k \in \mathcal{K}} \zeta_k \Big( q_{h,k} + s_{h,k} + u_{h,k}
  - \sum_{h' \in \mathcal{U}_h} \nu_{h',t,0} \, (q_{h',k} + s_{h',k})
  - \sum_{h':\,\text{div}=h} u_{h',k} \\
& \qquad + \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta \, r_h
\end{aligned}
$$

### Linhas do Estágio Cronológico

Para cada patamar $k \in \mathcal{K}$, com $v_{h,0} = v^{in}_h$ e $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
\begin{aligned}
& v_{h,k} - v_{h,k-1} - \phi_{h,k} \, b^{\mathrm{in}}_{h,1}
  - \zeta_k \big( z_h + \sigma^{inf}_h + \sigma^{w-}_h - \sigma^{w+}_h - e_{h,k} \big)
  + \zeta_k \big( q_{h,k} + s_{h,k} + u_{h,k} \big) \\
& \quad - \sum_{h' \in \mathcal{U}_h} \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \zeta_{k'} \, (q_{h',k'} + s_{h',k'})
  - \zeta_k \sum_{h':\,\text{div}=h} u_{h',k}
  + \zeta_k \Big( \sum_{y:\,\text{src}=h} p_{y,k} - \sum_{y:\,\text{dest}=h} p_{y,k} \Big) = -\zeta_k \, r_h
\end{aligned}
$$

### Termos das Linhas

- $v_h$ e $v^{in}_h$ = armazenamento de saída e de entrada; $v^{in}_h$ é fixado no valor visitado por seus limites de coluna ([Aumento do espaço de estados §2](/pt-br/math/state-augmentation#2-fixacao-por-limites-de-coluna)). Em um estágio cronológico, $v_{h,k}$ é o armazenamento ao fim do patamar $k$
- $b^{\mathrm{in}}_{h,1}$ = volume em trânsito que chega a maturação neste estágio nos arcos com tempo de viagem que chegam a $h$, em hm³ e, portanto, fora da conversão ([Aumento do espaço de estados §6](/pt-br/math/state-augmentation#6-tempo-de-viagem-da-agua)); um estágio cronológico o distribui entre seus patamares pela densidade de chegada $\phi_{h,k}$, $\sum_k \phi_{h,k} = 1$. Ausente quando nenhum arco com tempo de viagem chega a $h$
- $z_h = a_h$ = vazão incremental realizada (§5), de modo que o patamar $k$ de um estágio cronológico recebe a parcela $w_k\,\zeta\,\sigma_{m(t)}\,\varepsilon_t$ do ruído
- $\sigma^{inf}_h$ = folga de não negatividade da afluência, presente em todos os métodos de afluência exceto `none`, que acrescenta água: ilimitada em `penalty`; limitada ao montante de truncamento $a^-_h$ — uma constante da resolução, calculada a partir da realização com as defasagens fixadas — em `truncation_with_penalty`; e fixada nesse montante em `truncation` (veja [Métodos de tratamento de afluências negativas](/pt-br/math/inflow-nonnegativity))
- $r_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ = meta de retirada com sinal, no nível do estágio ($r_h < 0$ acrescenta água), e suas folgas de entrega a menor e a maior, no nível do estágio; a retirada realizada é $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$, com os tetos das folgas na §9
- $e_h$ / $e_{h,k}$ = evaporação líquida com sinal de uma usina com modelo de evaporação (um valor negativo é precipitação líquida sobre o lago e acrescenta água): uma coluna no nível do estágio em um estágio paralelo com qualquer número de patamares, uma por patamar em um estágio cronológico, cada uma delas uma coluna limitada, vinculada ao armazenamento pela sua linha de evaporação (veja [Linha de Evaporação](#linha-de-evaporacao))
- $q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}$, $s_{h,k}$, $u_{h,k}$ = vazões turbinada, vertida e desviada da própria usina no patamar $k$; a coluna de turbinamento de cada célula (usina, barramento) tem o mesmo coeficiente, e o vertimento e o desvio são colunas únicas por usina
- Defluência de montante: apenas as vazões turbinada e vertida de cada $h' \in \mathcal{U}_h$ chegam a $h$; a vazão desviada de uma usina chega apenas ao destino do seu desvio (a soma em $\text{div}$)
- $\nu_{h',t,0} = (H_t - \Delta^{tt}_{h'})^+ / H_t$ = parcela, no mesmo estágio, da defluência de $h'$ em um estágio paralelo, com $H_t$ a duração do estágio $t$ e $\Delta^{tt}_{h'}$ o tempo de viagem do arco principal da cascata de $h'$ ($0$ quando nenhum é declarado, de modo que a parcela é $1$); o restante, $1 - \nu_{h',t,0}$, é depositado nos in-transit buckets ([Aumento do espaço de estados §6](/pt-br/math/state-augmentation#6-tempo-de-viagem-da-agua))
- $\nu^{k' \to k}_{h',t}$ = parcela de propagação dentro do estágio em um estágio cronológico: a fração da defluência de $h'$ no patamar $k'$ que chega à linha do patamar $k$ de $h$ no mesmo estágio, $k \ge k'$. Sem tempo de viagem, $\nu^{k \to k}_{h',t} = 1$ e $\nu^{k' \to k}_{h',t} = 0$ para $k' < k$; o restante da defluência é depositado nos buckets ([Aumento do espaço de estados §6](/pt-br/math/state-augmentation#6-tempo-de-viagem-da-agua))
- $p_{y,k}$ = vazão bombeada pela usina elevatória $y$, retirada da linha da sua usina de origem e acrescentada à linha da sua usina de destino (veja [Formulações específicas por equipamento](/pt-br/math/equipment-formulations)); em um estágio paralelo, a vazão bombeada de todos os patamares entra na linha única do estágio
- $\zeta = 0.0036 \sum_{k \in \mathcal{K}} \tau_k$ e $\zeta_k = 0.0036\,\tau_k = w_k\,\zeta$ = conversões de vazão em volume do estágio e do patamar, com $\tau_k$ a duração do patamar $k$ em horas e $w_k = \tau_k / \sum_{k' \in \mathcal{K}} \tau_{k'}$ o seu peso, de modo que $\sum_k \zeta_k = \zeta$

### Repasse em pré-enchimento

Uma usina em pré-enchimento (veja [Fases do Ciclo de Vida](#fases-do-ciclo-de-vida) para a fase) tem a linha de identidade congelada $v_h - v^{in}_h = 0$ e, em um estágio cronológico, $v_{h,k} - v_{h,k-1} = 0$ por patamar, com lado direito $0$. Sua afluência local $z_h$, com sua folga de não negatividade da afluência $\sigma^{inf}_h$, as defluências das suas usinas de montante e as vazões desviadas para ela entram na linha da primeira usina a jusante que não esteja em pré-enchimento com os coeficientes que teriam na linha da própria usina em pré-enchimento ($-\zeta$ sobre $z_h$ e $\sigma^{inf}_h$ em um estágio paralelo e $-\zeta_k$ em cada linha de patamar de um estágio cronológico, $-\zeta_k$ sobre toda vazão do patamar $k$) e sem parcela de tempo de viagem, e sua meta de retirada passa para o lado direito dessa usina. Seu volume em trânsito que chega a maturação, $b^{\mathrm{in}}_{h,1}$, entra na mesma linha, com coeficiente $-1$ em um estágio paralelo e $-\phi_{h,k}$ na linha do patamar $k$ de um estágio cronológico, sendo $\phi_{h,k}$ a densidade de chegada da própria usina em pré-enchimento. Se não houver tal usina a jusante, a água deixa o sistema.

### Soma das Linhas dos Patamares

Somar as linhas dos patamares de um estágio cronológico sobre $k \in \mathcal{K}$ faz os termos de armazenamento se reduzirem telescopicamente a $v_h - v^{in}_h$, recupera $b^{\mathrm{in}}_{h,1}$ ($\sum_k \phi_{h,k} = 1$) e recupera os coeficientes paralelos de $z_h$, $\sigma^{inf}_h$, $\sigma^{w-}_h$, $\sigma^{w+}_h$ e do lado direito ($\sum_k \zeta_k = \zeta$); as vazões por patamar mantêm seus $\zeta_k$. A soma tem a forma da linha paralela, com duas diferenças de modo: $\sum_k \zeta_k\,e_{h,k}$ no lugar de $\zeta\,e_h$, e cada defluência de montante do patamar $k'$ com sua própria parcela no mesmo estágio, $\sum_{k \ge k'} \nu^{k' \to k}_{h',t}$, no lugar de $\nu_{h',t,0}$, cuja média ponderada pela duração sobre $k'$ é $\nu_{h',t,0}$: $\sum_{k' \in \mathcal{K}} w_{k'} \sum_{k \ge k'} \nu^{k' \to k}_{h',t} = \nu_{h',t,0}$. Com um único patamar, ou sem tempo de viagem no arco, as parcelas coincidem.

:::note[Consistência Dimensional]
(veja [Convenção de Unidades das Variáveis](/pt-br/math/system-elements#convencao-de-unidades-das-variaveis)):

- O armazenamento ($v_h$, $v^{in}_h$, $v_{h,k}$) e $b^{\mathrm{in}}_{h,1}$ estão em hm³
- $\zeta$ e $\zeta_k$ estão em hm³/(m³/s)
- Toda vazão, toda folga e $r_h$ estão em m³/s
- A conversão em volume ocorre apenas por meio de $\zeta$ e $\zeta_k$
:::

**Variável dual**: $\pi^{wb}_h$ para a linha paralela; em um estágio cronológico, cada linha de patamar tem seu próprio dual $\pi^{wb}_{h,k}$ (valor da água — captura o valor marginal do armazenamento de entrada visto pelo balanço da usina, mas **não** é usado diretamente como coeficiente do corte; o coeficiente do corte vem do custo reduzido da coluna fixada de armazenamento de entrada, veja [Aumento do espaço de estados §2](/pt-br/math/state-augmentation#2-fixacao-por-limites-de-coluna) e [Gerenciamento de cortes](/pt-br/math/cut-management))

### Linha de Evaporação

Toda usina hidrelétrica com modelo de evaporação tem uma linha de evaporação que vincula sua evaporação líquida ao armazenamento. Um estágio paralelo, com qualquer número de patamares, tem uma linha por usina desse tipo, sobre os armazenamentos de entrada e de saída do estágio:

$$
e_h - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v^{in}_h + v_h \big) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h}
$$

Um estágio cronológico tem uma linha por patamar $k \in \mathcal{K}$, sobre os armazenamentos do próprio patamar, com $v_{h,0} = v^{in}_h$ e $v_{h,\lvert\mathcal{K}\rvert} = v_h$:

$$
e_{h,k} - \tfrac{\gamma^{ev}_{v,h}}{2} \, \big( v_{h,k-1} + v_{h,k} \big) - \sigma^{e+}_{h,k} + \sigma^{e-}_{h,k} = \gamma^{ev}_{0,h}
$$

- $\gamma^{ev}_{v,h}$ e $\gamma^{ev}_{0,h}$ = inclinação e intercepto, em um volume de referência, da tangente do fluxo de evaporação de $h$: o coeficiente de evaporação do mês civil do estágio multiplicado pela área da superfície do reservatório obtida da sua curva área–volume, convertido em uma taxa média mensal em m³/s. Ambos são recalculados em cada estágio; a meta da linha é a tangente avaliada na média dos dois armazenamentos que a linha lê. O fluxo, e portanto $e_h$ ou $e_{h,k}$, pode ser negativo (precipitação líquida sobre o lago)
- $e_h$ / $e_{h,k}$ = evaporação líquida (Termos das Linhas, acima), limitada simetricamente em torno de zero por uma margem de segurança fixa vezes $\lvert \gamma^{ev}_{0,h} + \gamma^{ev}_{v,h} \bar{V}_h \rvert$, a magnitude da meta no armazenamento máximo $\bar{V}_h$, recalculada em cada estágio; não é uma coluna livre. Ela entra na linha de balanço hídrico paralela como $\zeta \, e_h$ e na linha do patamar $k$ de um estágio cronológico como $\zeta_k \, e_{h,k}$
- $\sigma^{e+}_h$ / $\sigma^{e+}_{h,k}$ e $\sigma^{e-}_h$ / $\sigma^{e-}_{h,k}$ = evaporação acima e abaixo da meta, valoradas a $c^{ev+}_h$ e $c^{ev-}_h$: a linha define a evaporação como a meta mais $\sigma^{e+}$ menos $\sigma^{e-}$. Em um estágio paralelo, o único par é valorado sobre as horas do estágio $H_t$; em um estágio cronológico, o par de cada patamar é valorado sobre a sua duração $\tau_k$ (§9)

Com um único patamar, as formas paralela e cronológica coincidem, tanto nas linhas quanto na valoração. Uma usina em pré-enchimento não tem linha de evaporação.

## 5. Linhas de Definição da Afluência Realizada

Para cada usina hidrelétrica $h \in \mathcal{H}$, o PL inclui uma variável auxiliar $z_h$ que representa a afluência total realizada (m³/s) no estágio corrente. Essas variáveis são definidas por restrições de igualdade que combinam a base determinística, as contribuições das defasagens e o ruído estocástico:

$$
z_h = b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell} + \sigma_{m(t)} \cdot \varepsilon_t
$$

em que:

- $z_h$ = variável do PL que representa a afluência realizada da usina $h$ (coluna livre, custo nulo)
- $b_{h,m(t)}$ = base determinística (pré-calculada a partir das médias sazonais e dos coeficientes AR — veja [Modelo de afluências PAR(p) §2.4](/pt-br/math/par-inflow-model#24-base-deterministica))
- $\psi_{m(t),\ell}$ = coeficientes AR nas unidades originais (elementos da matriz de restrições, definidos uma única vez na construção do PL); para uma usina com componente anual, a soma percorre todas as posições de defasagem ($\ell \le P^{\max}$) e cada um desses coeficientes incorpora também o termo anual ([Modelo de afluências PAR(p) §7.4](/pt-br/math/par-inflow-model#74-conversao-de-unidades-em-execucao))
- $a_{h,\ell}$ = variáveis do PL das afluências defasadas (variáveis de estado, fixadas conforme [Aumento do espaço de estados §4](/pt-br/math/state-augmentation#4-defasagens-de-afluencia))
- $\sigma_{m(t)} \cdot \varepsilon_t$ = ruído (inovação) (inserido no lado direito da restrição a cada cenário)

A variável de afluência z, $z_h$, entra então na restrição de balanço hídrico (§4) no lugar do termo de afluência bruta $a_h$, e seu valor primal após a resolução fornece a afluência realizada para os relatórios e a extração da simulação.

As colunas de afluência z ficam entre as colunas de estado iniciais e as colunas de armazenamento de entrada, e suas linhas de restrição formam o **primeiro** bloco de igualdades ([Estrutura e escalonamento do PL §1](/pt-br/math/lp-layout-and-scaling#1-estrutura-de-colunas-e-linhas)). O lado direito é atualizado a cada cenário com $b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t$, em que $\varepsilon_t$ é o ruído do cenário, que nenhum método de não negatividade da afluência altera: a linha mantém a realização bruta, que pode ser negativa, e os métodos acrescentam sua água ao balanço hídrico por meio de $\sigma^{inf}_h$ (§4; [Métodos de tratamento de afluências negativas](/pt-br/math/inflow-nonnegativity)). Elas não são colunas de estado fixadas e não têm coeficiente de corte próprio; a linha do corte multiplica o coeficiente da defasagem 1 por $z_h$.

**Número de restrições**: $N$ restrições no total, em que $N = |\mathcal{H}|$ é o número de usinas hidrelétricas, qualquer que seja a fase do seu ciclo de vida.

## 6. Restrições de Geração Hidrelétrica

O Novo Modelo admite dois modelos de produção, em ordem crescente de complexidade. O modelo pode variar por estágio ou por período sazonal para cada usina.

Ambos os modelos são avaliados **por célula** $(h, b)$ (§3), e não por usina; para uma usina de célula única, a restrição por célula é a restrição da usina.

**Modelo de Produtibilidade Constante** (para cada célula $(h, b)$ da usina $h \in \mathcal{H}^{const}$, patamar $k$):

$$
g_{h,b,k} = \rho_h \cdot q_{h,b,k}
$$

As usinas de produtibilidade constante não têm coluna de geração separada: $g_{h,b,k}$ é esse múltiplo direto da coluna de vazão turbinada da própria célula, de modo que o limite de geração de uma célula é imposto incorporando-o ao limite dessa coluna (§8), e não por um limite sobre o próprio $g_{h,b,k}$.

**Modelo FPHA** (para cada plano $m \in \mathcal{M}_h$, célula $(h, b)$ da usina $h \in \mathcal{H}^{fpha}$, patamar $k$):

$$
g_{h,b,k} \leq \lambda_{h,b} \big( \gamma^m_0 + \gamma^m_v \cdot v^{avg}_h + \gamma^m_s \cdot s_{h,k} \big) + \gamma^m_q \cdot q_{h,b,k}
$$

em que $v^{avg}_h = (v^{in}_h + v_h)/2$ é o armazenamento médio durante o estágio, sendo $v^{in}_h$ a variável do PL de armazenamento de entrada ([Aumento do espaço de estados §2](/pt-br/math/state-augmentation#2-fixacao-por-limites-de-coluna)) e $v_h$ o armazenamento ao fim do estágio em um estágio paralelo; em um estágio cronológico, a linha do patamar $k$ lê a média do próprio patamar, $(v_{h,k-1} + v_{h,k})/2$ ([Variantes de formulação dos patamares §2.4](/pt-br/math/block-formulations#24-producao-e-evaporacao-por-patamar)) — uma única grandeza da usina compartilhada por todas as células, pois o armazenamento não é particionado. $\lambda_{h,b}$ é a **parcela de rateio** da célula $(h,b)$ na capacidade de turbinamento declarada da usina $h$,

$$
\lambda_{h,b} = \frac{\sum_{u \,\in\, (h,b)} \bar{Q}_u}{\sum_{u \,\in\, h} \bar{Q}_u}
$$

(a razão entre a vazão turbinada máxima declarada dos grupos de unidades geradoras da própria célula e o total da usina, $0$ quando o total da usina é $0$), de modo que $\sum_{b \in \mathcal{B}_h} \lambda_{h,b} = 1$ para toda usina com capacidade de turbinamento declarada positiva. Apenas a parte do plano independente da vazão — o intercepto $\gamma^m_0$, o termo de armazenamento e o termo de vertimento — é rateada por $\lambda_{h,b}$; o coeficiente de vazão $\gamma^m_q$ permanece sobre o $q_{h,b,k}$ da própria célula, sem escala, porque só ele é homogêneo na partição em células (somar as linhas por célula com $v^{avg}_h$, $s_{h,k}$ e $\sum_b q_{h,b,k}$ fixos recupera o limite da usina que isto substitui). Uma usina de célula única com capacidade de turbinamento declarada positiva tem $\lambda_{h,b} = 1$ exatamente, de modo que sua linha é a linha da usina.

Para uma usina com capacidade de turbinamento declarada positiva, as parcelas somam $1$, de modo que as linhas por célula de cada plano somam a linha da usina desse plano (acima). Uma soma de mínimos é no máximo o mínimo das somas, de modo que, com os mesmos $v^{avg}_h$, $s_{h,k}$ e vazão turbinada total, o teto que as linhas por célula impõem à geração da usina $\sum_{b \in \mathcal{B}_h} g_{h,b,k}$, à esquerda, é no máximo a envoltória da usina, o mínimo sobre os planos das linhas da usina, à direita:

$$
\sum_{b \in \mathcal{B}_h} \min_{m} \Big( \lambda_{h,b}\big(\gamma^m_0 + \gamma^m_v v^{avg}_h + \gamma^m_s s_{h,k}\big) + \gamma^m_q q_{h,b,k} \Big)
\;\le\; \min_{m} \Big( \gamma^m_0 + \gamma^m_v v^{avg}_h + \gamma^m_s s_{h,k} + \gamma^m_q \sum_{b} q_{h,b,k} \Big)
$$

A igualdade vale quando o mesmo plano atinge o mínimo em todas as células, em particular quando as células turbinam em proporção às suas parcelas $\lambda_{h,b}$. Para $\lambda_{h,b} > 0$, o mínimo da célula $(h,b)$ é $\lambda_{h,b}$ vezes a envoltória da usina na vazão $q_{h,b,k}/\lambda_{h,b}$, de modo que, quando todas as parcelas são positivas, a expressão é a desigualdade de Jensen para a envoltória côncava com os pesos $\lambda_{h,b}$. Uma célula com $\lambda_{h,b} = 0$ mantém apenas o seu termo $\gamma^m_q \, q_{h,b,k}$, e a expressão continua valendo pelo argumento da soma de mínimos.

**Limites de Geração** (por célula $(h, b)$, patamar $k$ — o limite da própria coluna de geração da FPHA; uma célula de produtibilidade constante não tem essa coluna, de modo que seu teto de geração é incorporado, em vez disso, ao limite de vazão turbinada abaixo):

$$
\underline{G}_{h,b} - \sigma^{g-}_{h,b,k} \leq g_{h,b,k} \leq \bar{G}_{h,b}
$$

$$
\underline{G}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{G}_u, \qquad \bar{G}_{h,b} = \min\!\Big( \sum_{u \,\in\, (h,b)} \bar{G}_u,\ \ \bar{G}_h \Big)
$$

Os limites de geração são definidos pelo usuário (declarados por grupo de unidades geradoras, e não derivados da vazão turbinada). O limite inferior é flexível, com uma folga $\sigma^{g-}_{h,b,k}$ **por célula** — valorada pela penalidade da própria usina, $c^{gv-}_h$, com magnitude integral em cada célula de uma usina dividida, nunca dividida pelo número de células; o piso de uma célula de produtibilidade constante acopla essa mesma folga a $\rho_h \cdot q_{h,b,k}$, e não a uma coluna de geração. A soma simples do limite superior sobre os grupos de unidades da própria célula é limitada pelo máximo resolvido da própria usina, $\bar{G}_h$ — uma substituição de limites nunca pode elevar uma célula acima dele. O mínimo da própria usina, $\underline{G}_h$, e, em uma usina com várias células, seu máximo $\bar{G}_h$ também se aplicam ao total das suas células ([§8 Mínimo e Máximo da Usina](#minimo-e-maximo-da-usina)). Veja [Visão geral da modelagem dos elementos do sistema §5](/pt-br/math/system-elements). Corresponde ao $\sigma^{g-}_{h,b,k}$ por célula definido em [Convenções de notação §4.3](/pt-br/overview/notation-conventions#43-variaveis-de-folga).

Para detalhes sobre a construção da FPHA e as variantes de modelo de função de produção, veja [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models).

## 7. Restrições de Vazão Defluente

**Definição da Vazão Defluente** (por usina $h$, patamar $k$):

$$
o_{h,k} = q_{h,k} + s_{h,k}
$$

:::note[Esclarecimento]
A vazão defluente $o$ representa a água liberada para o canal de jusante (que afeta o nível de jusante). Ela NÃO inclui:

- **Retirada** $r_h$: um parâmetro de uso consuntivo com sinal (positivo = retirada do sistema para irrigação/abastecimento; negativo = retorno/acréscimo entre bacias). É um parâmetro fixo (não uma variável de decisão) — veja a §4 para a semântica da meta com sinal e a §9 para os limites das folgas
- **Desvio** $u_{h,k}$: água desviada para um canal separado (que não afeta o canal de fuga principal)

O balanço hídrico (§4) contabiliza todas as vazões: afluência $-$ $(q + s + u)$ $-$ evaporação $-$ retirada = variação do armazenamento. A retirada $r_h$ entra como parâmetro fixo com sinal no lado direito; folgas de violação bidirecionais ($\sigma^{w-}_h$, $\sigma^{w+}_h$) permitem ao PL relaxar o compromisso de retirada quando necessário (veja a §9).
:::

**Limites da Vazão Defluente** (com folgas para imposição flexível):

$$
\underline{O}_h - \sigma^{o-}_{h,k} \leq o_{h,k} \leq \bar{O}_h + \sigma^{o+}_{h,k}
$$

## 8. Limites das Variáveis e Restrições de Mínimo

### Limites de Armazenamento (por usina $h$)

$$
\underline{V}_h \leq v_h \leq \bar{V}_h
$$

O volume morto $\underline{V}_h$ é um limite inferior rígido para toda usina, com duas exceções: uma usina com configuração de enchimento tem piso $0$ em todas as fases, sendo substituído pelo piso de enchimento por estágio, abaixo, enquanto ela enche, e, a partir do seu estágio de entrada, o volume morto retorna como o piso flexível $v_h + \sigma^{v-}_h \geq \underline{V}_h$, a única folga de armazenamento abaixo do mínimo do PL, valorada acima do déficit; uma usina sem configuração de enchimento tem piso $0$ enquanto está em pré-enchimento, quando sua identidade congelada (§4) mantém o armazenamento no valor de entrada. O limite superior é rígido; a água excedente sai por vertimento. Enquanto uma usina está em pré-enchimento, seu limite superior é o maior entre o $\bar{V}_h$ do estágio e o armazenamento máximo da própria usina, de modo que um máximo do estágio inferior ao máximo da própria usina nunca exclui um armazenamento mantido dentro da faixa de armazenamento da própria usina. Em um estágio cronológico, os armazenamentos ao fim de cada patamar $v_{h,k}$ têm os mesmos limites de coluna, e o piso flexível aplica-se apenas ao armazenamento ao fim do estágio $v_h$.

**Pisos de enchimento** (para usinas em enchimento, em todo estágio de enchimento $t$, do estágio de início do enchimento até o estágio de entrada, exclusive):

$$
v_h + \sigma^{fill}_h \geq V^{\text{target}}_t,
\qquad
V^{\text{target}}_t = \min\!\Big( \underline{V}_{h,L} - \sum_{t'=t+1}^{L} \zeta_{t'} \, \text{rate}_{t'},\ \underline{V}_{h,t} \Big)
$$

$\underline{V}_{h,t}$ é o volume morto vigente no estágio $t$ (um estágio pode substituí-lo), $L$ é o último estágio de enchimento, o estágio anterior ao estágio de entrada, e $\text{rate}_{t'}$ é a taxa mínima de acumulação do estágio $t'$, que $\zeta_{t'}$ converte em hm³. O piso no estágio $t$ é o volume morto do estágio $L$ menos a acumulação que o cronograma ainda deve após $t$, nunca acima do volume morto do próprio estágio $t$; ele atinge $\underline{V}_{h,L}$ em $L$. Todo estágio de enchimento tem o seu piso. A folga $\sigma^{fill}_h$ é valorada a $c^{fill}_h$, que o Novo Modelo espera **abaixo do déficit** ([Sistema de penalidades — Validação da Ordem das Penalidades](/pt-br/math/penalty-system#validacao-da-ordem-das-penalidades) verifica-o como informado). Veja [Sistema de penalidades §6](/pt-br/math/penalty-system#particularidades-do-enchimento-de-volume-morto).

### Limites de Vazão Turbinada (por célula $(h, b)$, patamar $k$)

$$
\underline{Q}_{h,b} - \sigma^{q-}_{h,b,k} \leq q_{h,b,k} \leq \bar{Q}_{h,b}
$$

O limite inferior é flexível, com uma folga $\sigma^{q-}_{h,b,k}$ por célula, valorada pela penalidade da própria usina, $c^{tv-}_h$, com magnitude integral em cada célula — nunca dividida pelo número de células; é a soma simples das vazões turbinadas mínimas resolvidas dos grupos de unidades da própria célula, $\underline{Q}_{h,b} = \sum_{u \,\in\, (h,b)} \underline{Q}_u$, exceto em uma usina de célula única cujo mínimo próprio é mais restritivo ([Mínimo e Máximo da Usina](#minimo-e-maximo-da-usina)). O limite superior é rígido e limitado pelo máximo resolvido da própria usina, nunca elevado acima dele:

$$
\bar{Q}_{h,b} = \min\!\left( \sum_{u \,\in\, (h,b)} \mathrm{fold}(u),\ \ \bar{Q}_h \right)
$$

em que $\mathrm{fold}(u) = \bar{Q}_u$ para uma usina com FPHA (ali, vazão turbinada e geração são colunas independentes) e $\mathrm{fold}(u) = \min(\bar{Q}_u,\ \bar{G}_u / \rho_h)$ para uma usina de produtibilidade constante — o teto de vazão de cada grupo e o teto de vazão implícito em MW devem ser combinados **antes** da soma sobre a célula, pois o $\min$ não se distribui sobre uma soma de grupos que são limitados por lados diferentes. Esse é o mecanismo que impõe o teto de geração de uma célula de produtibilidade constante (§6): não há coluna de geração separada a limitar diretamente. Corresponde ao $\sigma^{q-}_{h,b,k}$ por célula definido em [Convenções de notação §4.3](/pt-br/overview/notation-conventions#43-variaveis-de-folga).

### Mínimo e Máximo da Usina

A vazão turbinada mínima resolvida da própria usina, $\underline{Q}_h$, e sua geração mínima, $\underline{G}_h$, aplicam-se ao total das suas células quando são mais restritivas que os pisos das células. Tome a tolerância relativa $\epsilon(x) = 10^{-9} \max(\lvert x \rvert, 1)$. Em um patamar em que $\underline{Q}_h \le \sum_{b \in \mathcal{B}_h} \underline{Q}_{h,b} + \epsilon(\underline{Q}_h)$, os pisos das células já impõem o mínimo da usina. Nos demais, uma usina de célula única adota $\underline{Q}_h$ como piso da sua célula, e uma usina com várias células recebe uma linha residual além das linhas das suas células:

$$
\sum_{b \in \mathcal{B}_h} \big( q_{h,b,k} + \sigma^{q-}_{h,b,k} \big) + \sigma^{Q-}_{h,k} \;\geq\; \underline{Q}_h,
\qquad
\sum_{b \in \mathcal{B}_h} \big( \pi_{h,b,k} + \sigma^{g-}_{h,b,k} \big) + \sigma^{G-}_{h,k} \;\geq\; \underline{G}_h
$$

$\pi_{h,b,k}$ é a geração da célula: $g_{h,b,k}$ para uma célula com FPHA, $\rho_h \, q_{h,b,k}$ para uma célula de produtibilidade constante, e nada para uma usina com FPHA sem coluna de geração, isto é, em pré-enchimento ou na sua janela de enchimento. As folgas residuais são valoradas pelas penalidades da própria usina, $c^{tv-}_h$ sobre $\sigma^{Q-}_{h,k}$ e $c^{gv-}_h$ sobre $\sigma^{G-}_{h,k}$, com magnitude integral. Como cada linha residual também contém as folgas das células, as folgas mais baratas cobram $c^{tv-}_h \max\big(\underline{Q}_h - \sum_{b} q_{h,b,k},\ \sum_{b} (\underline{Q}_{h,b} - q_{h,b,k})^+\big)$ pela vazão turbinada e a mesma forma pela geração, de modo que um déficit é cobrado uma única vez. Uma usina com linha residual em algum patamar do estágio tem a linha em todos os patamares do estágio; em um patamar em que suas células cobrem o mínimo da usina, a linha é livre e a folga residual é fixada em $[0, 0]$. Os mínimos aplicam-se em todas as fases do ciclo de vida.

Um mínimo da usina abaixo dos pisos das suas células não os afrouxa: os pisos das células continuam ativos. Uma usina com várias células também recebe, por patamar, uma linha rígida para a sua vazão turbinada máxima e uma para a sua geração máxima, sem folga:

$$
\sum_{b \in \mathcal{B}_h} q_{h,b,k} \;\leq\; \bar{Q}_h,
\qquad
\sum_{b \in \mathcal{B}_h} \pi_{h,b,k} \;\leq\; \bar{G}_h
$$

Cada uma é ativa em um patamar em que o máximo da usina fica abaixo da soma dos tetos das suas células por mais de $\epsilon$ dele, sendo os tetos das células $\bar{Q}_{h,b}$ para a vazão turbinada e $\rho_h \bar{Q}_{h,b}$ (produtibilidade constante) ou $\bar{G}_{h,b}$ (FPHA) para a geração; em qualquer outro patamar do estágio, a linha é livre. Uma usina de célula única não tem essa linha, pois o limite da sua célula já é limitado por $\bar{Q}_h$ e $\bar{G}_h$, nem a tem uma usina em pré-enchimento ou na sua janela de enchimento, cuja vazão turbinada é fixada em $0$.

### Limites da Vazão Desviada (por usina $h$, patamar $k$)

$$
0 \leq u_{h,k} \leq \bar{U}_h
$$

$\bar{U}_h$ é a capacidade do canal, ou uma vazão desviada máxima definida para o estágio ou para o patamar, que a substitui. Um canal declarado sem capacidade tem $\bar{U}_h = +\infty$, e uma usina sem canal de desvio tem $\bar{U}_h = 0$. O limite inferior é $0$, a menos que uma vazão desviada mínima seja definida para o estágio ou para o patamar, que o substitui. Ambos os limites são rígidos. O custo de desvio é um termo de regularização (veja a §1), e não uma penalidade por violação. Nem este limite nem o limite de vertimento abaixo dependem do armazenamento: o Novo Modelo não modela soleira abaixo da qual o canal de desvio ou o vertedouro se fecha.

### Limites de Vertimento (por usina $h$, patamar $k$)

O vertimento $s_{h,k}$ é limitado inferiormente por $0$ e superiormente por $+\infty$, a menos que um vertimento mínimo ou máximo seja definido para o estágio ou para o patamar, que substitui o limite. Ambos os limites são rígidos. Enquanto a usina está em pré-enchimento, o vertimento é fixado em $[0, 0]$ ([Fases do Ciclo de Vida](#fases-do-ciclo-de-vida)).

### Limites da Vazão Bombeada (por usina elevatória $y$, patamar $k$)

$$
\underline{P}_y \leq p_{y,k} \leq \bar{P}_y
$$

Ambos os limites são rígidos.

### Fases do Ciclo de Vida

Em cada estágio, uma usina hidrelétrica está em exatamente uma fase do ciclo de vida, definida pela sua [janela de operação](/pt-br/math/system-elements#janelas-de-operacao-das-entidades) e, para uma usina em enchimento (uma usina com configuração de enchimento), pelo início do seu enchimento; toda outra entidade está em operação (dentro da sua janela de operação) ou fora de operação.

| Fase | Aplica-se a | Linha de armazenamento e piso | Vazão turbinada e geração | Vertimento | Desvio | Afluência, defluências de montante e retirada | Pisos operativos |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pré-enchimento | Uma usina sem configuração de enchimento: todo estágio fora da sua janela de operação, antes do seu estágio de entrada ou a partir do seu estágio de saída. Uma usina em enchimento: todo estágio antes do início do seu enchimento | Identidade congelada $v_h - v^{in}_h = 0$, por patamar em um estágio cronológico, com lado direito $0$ (§4); piso $0$ e um teto nunca abaixo do armazenamento máximo da própria usina (§8); sem linha de evaporação | $q_{h,b,k}$ fixado em $[0, 0]$ em todas as células; sem linhas da FPHA e sem coluna de geração | $s_{h,k}$ fixado em $[0, 0]$, quaisquer que sejam seus limites | $u_{h,k}$ fixado em $[0, 0]$ | A afluência local com sua folga de não negatividade da afluência, as defluências das usinas de montante, as vazões desviadas para a usina e o volume em trânsito que chega à usina entram na linha da primeira usina a jusante que não esteja em pré-enchimento, e a meta de retirada passa para o lado direito dessa usina; se não houver tal usina, a água deixa o sistema | As linhas de vazão defluente mínima, vazão turbinada mínima e geração mínima estão presentes; com vazão turbinada, vertimento e geração em $0$, um mínimo positivo recai integralmente sobre a sua folga, à sua penalidade (§9) |
| Enchimento de volume morto (Filling) | Uma usina em enchimento: todo estágio desde o início do seu enchimento até o seu estágio de entrada, exclusive | Balanço hídrico da §4, com a linha de evaporação de uma usina com evaporação; piso $0$ e o piso de enchimento por estágio $v_h + \sigma^{fill}_h \geq V^{\text{target}}_t$ de [§8 Limites de Armazenamento](#8-limites-das-variaveis-e-restricoes-de-minimo) | $q_{h,b,k}$ fixado em $[0, 0]$ em todas as células; sem linhas da FPHA e sem coluna de geração | Dentro dos seus limites | $u_{h,k}$ fixado em $[0, 0]$ | Na linha da própria usina (§4) | As mesmas linhas estão presentes; uma vazão turbinada mínima ou geração mínima positiva recai integralmente sobre a sua folga, e o vertimento pode atender uma vazão defluente mínima positiva |
| Em operação (Operating) | Uma usina sem configuração de enchimento: todo estágio dentro da sua janela de operação, portanto todos os estágios quando ela não declara nenhuma. Uma usina em enchimento: todo estágio a partir do seu estágio de entrada; ela não tem estágio de saída | Balanço hídrico da §4, com a linha de evaporação de uma usina com evaporação; o piso rígido de volume morto $\underline{V}_h$ para uma usina sem configuração de enchimento e, para uma usina em enchimento, piso $0$ com o piso flexível de volume morto $v_h + \sigma^{v-}_h \geq \underline{V}_h$ | Vazão turbinada dentro dos Limites de Vazão Turbinada acima; geração pelo modelo de produção da §6 | Dentro dos seus limites | Dentro dos Limites da Vazão Desviada acima para uma usina sem configuração de enchimento; fixado em $[0, 0]$ para uma usina em enchimento | Na linha da própria usina (§4) | As mesmas linhas estão presentes; a vazão turbinada mínima é atendida pela vazão turbinada da célula, a geração mínima pela sua geração e a vazão defluente mínima pela vazão turbinada mais o vertimento, com a folga cobrindo qualquer déficit à sua penalidade (§9) |

Fora da sua janela de operação, a geração de uma termelétrica, o fluxo de uma linha em cada sentido, a geração de uma fonte não despachável, a vazão bombeada de uma usina elevatória e a potência de um contrato são fixados em $[0, 0]$ em todos os patamares; o compromisso de uma termelétrica com antecipação de despacho é, além disso, condicionado ao seu estágio de entrega, e só é liberado quando a usina está em operação nesse estágio de entrega, qualquer que seja sua situação no estágio de decisão ([Aumento do espaço de estados §5](/pt-br/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)).

## 9. Termos de Penalidade por Violação de Restrições

As penalidades por violação de restrições por patamar na função objetivo (referenciadas na §2) são:

$$
\sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \Big[
  c^{tv-}_h \Big( \sum_{b \in \mathcal{B}_h} \sigma^{q-}_{h,b,k} + \sigma^{Q-}_{h,k} \Big) + c^{ov-}_h \sigma^{o-}_{h,k} + c^{ov+}_h \sigma^{o+}_{h,k} + c^{gv-}_h \Big( \sum_{b \in \mathcal{B}_h} \sigma^{g-}_{h,b,k} + \sigma^{G-}_{h,k} \Big)
\Big]
$$

As folgas de mínimo de turbinamento e de geração são **por célula** — cada célula de uma usina dividida tem sua própria coluna de folga e sua própria linha, valoradas pela penalidade da usina com magnitude integral, nunca divididas entre as células. As folgas residuais $\sigma^{Q-}_{h,k}$ e $\sigma^{G-}_{h,k}$ existem apenas para uma usina com linha residual ([§8 Mínimo e Máximo da Usina](#minimo-e-maximo-da-usina)) e são $0$ para todas as demais usinas. As folgas de vazão defluente permanecem por usina: a vazão defluente não tem coluna por célula à qual atribuir um piso. As folgas de evaporação também são por usina, no nível do estágio em um estágio paralelo e por patamar em um estágio cronológico ([Linha de Evaporação](#linha-de-evaporacao)).

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{wv-}_h \sigma^{w-}_h + c^{wv+}_h \sigma^{w+}_h\bigr)
$$

$$
+ \sum_{h \in \mathcal{H}} H_t \cdot \bigl(c^{ev+}_h \sigma^{e+}_h + c^{ev-}_h \sigma^{e-}_h\bigr) \;\; \text{(parallel stage)}, \qquad + \sum_{k \in \mathcal{K}} \tau_k \sum_{h \in \mathcal{H}} \bigl(c^{ev+}_h \sigma^{e+}_{h,k} + c^{ev-}_h \sigma^{e-}_{h,k}\bigr) \;\; \text{(chronological stage)}
$$

em que $H_t = \sum_k \tau_k$ é a duração total do estágio em horas, e as somas de evaporação percorrem as usinas que modelam evaporação. As folgas de violação da retirada ($\sigma^{w-}_h$, $\sigma^{w+}_h$) são no nível do estágio (não por patamar) e bidirecionais: $\sigma^{w-}_h$ penaliza a entrega a menor (a retirada realizada $R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h$ fica aquém da meta) e $\sigma^{w+}_h$ penaliza a entrega a maior. A **meta de retirada $r_h$ tem sinal** (§4), e os limites das folgas garantem que a retirada realizada não possa inverter o sinal em relação à meta:

- $r_h > 0$ (retirada programada): $\sigma^{w-}_h \leq r_h$ (folga de entrega a menor limitada à magnitude da meta; garante $R_h \geq 0$), $\sigma^{w+}_h$ ilimitada.
- $r_h < 0$ (retorno/acréscimo programado entre bacias): $\sigma^{w+}_h \leq |r_h|$ (folga de entrega a maior limitada a $|r_h|$; garante $R_h \leq 0$), $\sigma^{w-}_h$ ilimitada.
- $r_h = 0$: ambas as folgas são fixadas em zero.

Esse teto evita um caso degenerado: uma folga de entrega a menor ilimitada permitiria que uma usina a fio d'água "desfizesse a retirada" além da sua meta e injetasse água fictícia no reservatório.

## 10. Restrições Genéricas

As restrições lineares definidas pelo usuário (por restrição $g \in \mathcal{G}$) têm a forma de um intervalo bilateral:

$$
\underline{b}_g \;\leq\; \sum_{e} \gamma_{g,e} \cdot x_e \;\leq\; \bar{b}_g
$$

em que $x_e$ é uma grandeza do PL do estágio exposta pelo catálogo de variáveis das restrições genéricas — uma coluna, como armazenamento, vazão, geração ou déficit, ou uma combinação fixa de colunas, como a afluência de uma usina hidrelétrica (abaixo).

Um termo sobre a vazão turbinada ou a geração de uma usina dividida entre barramentos pode se referir a uma célula (usina, barramento) ou a todas as células da usina de uma só vez (§3).

Um termo também pode se referir ao **volume útil** de uma usina, $v_h - V^{min}_h$ — seu armazenamento acima do mínimo físico $V^{min}_h$. Ele é implementado sobre a própria variável de armazenamento, deslocando ambos os extremos pela mesma quantidade,

$$
\underline{b}_g \le \gamma_{g,e}\,(v_h - V^{min}_h) + \dots \le \bar{b}_g
\iff
\underline{b}_g + \gamma_{g,e}V^{min}_h \le \gamma_{g,e}\,v_h + \dots \le \bar{b}_g + \gamma_{g,e}V^{min}_h,
$$

de modo que não acrescenta variável alguma ao PL; um extremo ausente permanece ausente, e um $\gamma_{g,e}$ negativo reduz ambos os extremos.

Qualquer um dos extremos, $\underline{b}_g$ ou $\bar{b}_g$, pode estar ausente — nunca ambos —, sendo um lado ausente lido como o infinito correspondente. Esse único intervalo abrange todas as formas que uma restrição pode assumir: apenas $\underline{b}_g$ presente é um piso, apenas $\bar{b}_g$ presente é um teto, $\underline{b}_g = \bar{b}_g$ é uma igualdade, e ambos presentes delimitam uma faixa bilateral. A forma de uma restrição — piso, teto, igualdade ou faixa — decorre de quais extremos estão presentes e, quando ambos estão, de se coincidem.

### Coeficientes e Extremos

Cada coeficiente $\gamma_{g,e}$ é uma expressão aritmética sobre números literais e **parâmetros escalares nomeados** — somas, produtos, quocientes e agrupamentos deles —, e a restrição tal como escrita deve ser linear nas variáveis: um produto de duas variáveis, ou uma divisão por uma expressão que contenha uma variável, é recusado. Termos sobre a mesma variável são combinados em um único coeficiente, e um termo cujo coeficiente se reduz exatamente a zero não contribui para a linha.

Cada extremo é composto independentemente por até duas parcelas, somadas: uma base numérica que pode ela própria variar por estágio (e, para o tipo de parâmetro de granularidade mais fina abaixo, por patamar dentro do estágio), mais um resto afim opcional sobreposto a ela — uma constante mais uma soma ponderada de parâmetros escalares nomeados. Um extremo sem nenhuma das parcelas está simplesmente ausente; apenas a base, apenas o resto ou a soma de ambos são válidos, de modo que um único extremo pode combinar um piso ou teto programado que já varia por estágio com um ajuste adicional, determinado por parâmetros, sobreposto a ele.

Um parâmetro escalar nomeado é de um entre seis tipos: um valor para todos os estágios; um por estágio; um por período sazonal; uma grandeza calculada a partir da geometria e da conversão de energia de uma usina, §4 de [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models#4-grandezas-de-conversao-de-energia); um por estágio e patamar; ou uma fórmula sobre outros parâmetros, que varia onde quer que variem os parâmetros que ela lê.

A resolução ocorre uma única vez, na construção do PL, e todo coeficiente e extremo resolvido deve ser finito, de modo que os coeficientes e extremos do PL continuam numéricos no momento da resolução — o mecanismo de parâmetros não introduz acoplamento entre restrições por meio de variáveis do PL. Relevância metodológica: ele permite expressar limites de rampa, tetos de capacidade e cotas impostas pelo operador que variam por estágio, período sazonal ou patamar sem escrever uma restrição separada por estágio. Os valores dos coeficientes e dos extremos podem, portanto, ser **constantes que variam por estágio e por patamar**, e não apenas números literais.

### Folga Bilateral

Uma restrição pode, opcionalmente, ter uma folga, penalizada por unidade de violação, de modo que a linha seja relaxada a um custo em vez de forçar a inviabilidade. A penalidade $c_g$ é declarada em uma de duas bases. Para uma linha cuja grandeza é uma taxa (MW, m³/s), $c_g$ é um preço por unidade e por hora, e uma folga $\sigma$ em uma linha que cobre um período de $\tau$ horas custa $c_g \tau \sigma$: $\tau = \tau_k$ em uma linha por patamar e $\tau = H_t$ em uma linha no nível do estágio. Para uma linha cuja grandeza é uma quantidade (MWh, hm³), $c_g$ é um preço por unidade, e a folga custa $c_g \sigma$ em qualquer linha, independentemente da duração do estágio ou do patamar, de modo que, em uma linha por patamar, ela não leva o peso de duração do patamar $\tau_k$ (§1.1). Uma linha unilateral — apenas $\underline{b}_g$ ou apenas $\bar{b}_g$ presente — tem uma única coluna de folga, que relaxa esse extremo. Uma linha bilateral — $\underline{b}_g$ e $\bar{b}_g$ presentes — tem **duas** colunas de folga independentes, $\sigma^{gc+}_g$, que relaxa o piso para cima, e $\sigma^{gc-}_g$, que relaxa o teto para baixo: uma única coluna não consegue representar ao mesmo tempo "quanto abaixo do piso" e "quanto acima do teto" sem confundir os dois sentidos.

A violação informada é o **valor líquido com sinal** $\sigma^{gc+}_g - \sigma^{gc-}_g$: positivo quando a linha fica abaixo do seu piso, negativo quando fica acima do seu teto, acompanhando o sinal do desvio subjacente em vez de ser lido como magnitude sem sinal. A função objetivo cobra ambas as colunas, $\sigma^{gc+}_g + \sigma^{gc-}_g$, o que coincide com a magnitude do valor líquido sempre que apenas um sentido está ativo — o caso em qualquer ótimo, pois pagar pelos dois sentidos na mesma linha ao mesmo tempo é estritamente dominado por não pagar o excesso.

**Materialização das linhas**: um limite de restrição declarado para todos os patamares do estágio sobre uma expressão **independente do patamar** — aquela em que todos os termos se referem a uma variável de estoque (armazenamento de entrada $v^{in}_h$, armazenamento de saída $v_h$, evaporação (o $e_h$ no nível do estágio em um estágio paralelo, o $e_{h,k}$ de um patamar especificado em um estágio cronológico) ou um compromisso de termelétrica com antecipação de despacho) — é materializado como uma **única linha no nível do estágio**, pois as linhas por patamar seriam idênticas, **desde que seus coeficientes e extremos também sejam independentes do patamar**: um coeficiente ou extremo obtido do tipo de parâmetro por (estágio, patamar) acima, ou de uma fórmula que o leia, varia dentro do estágio, o que força o conjunto de linhas por patamar mesmo quando a expressão, por si só, se qualificaria para a consolidação. Um termo cujo coeficiente se reduz a zero é descartado antes desse teste, de modo que não impede nem provoca a consolidação. A folga de uma linha no nível do estágio é valorada sobre o estágio, $c_g H_t \sigma$ na base de taxa e $c_g \sigma$ na base de quantidade. Um limite declarado para todos os patamares sobre uma expressão por patamar, ou um limite declarado para um único patamar, continua produzindo uma linha por patamar pertinente. Trata-se de uma otimização do número de linhas do PL, neutra em custo e em paridade.

Veja [Restrições genéricas](/pt-br/reference/generic-constraints) para a gramática de autoria, a grade de ativação e as tabelas de campos por arquivo que esta formulação implementa.

### Afluência das Usinas Hidrelétricas

Um termo de afluência hidrelétrica lê a afluência $I_{h,k}$ da usina $h$ no patamar $k$, uma taxa em m³/s construída a partir de colunas do PL:

$$
I_{h,k} = z_h + \mathbb{1}^{tr} \sigma^{inf}_h + \sum_{h':\,\text{div}=h} u_{h',k} + \sum_{h' \in \mathcal{U}_h} o^{arr}_{h' \to h,k} + \frac{\phi_{h,k}}{\zeta_k} \, b^{\mathrm{in}}_{h,1} + \sum_{h' \in \mathcal{U}^{pre}_h(t)} \Big( z_{h'} + \mathbb{1}^{tr} \sigma^{inf}_{h'} + \sum_{h'':\,\text{div}=h'} u_{h'',k} + \sum_{h'' \in \mathcal{U}_{h'}} o_{h'',k} + \frac{\phi_{h',k}}{\zeta_k} \, b^{\mathrm{in}}_{h',1} \Big)
$$

Cada defluência de montante é creditada ao patamar $k$ conforme o tempo de viagem do seu arco:

$$
o^{arr}_{h' \to h,k} = \begin{cases} o_{h',k} & \text{arc without a travel time} \\ \nu_{h',t,0} \, o_{h',k} & \text{travel-time arc, parallel stage} \\ \sum_{k' \le k} \nu^{k' \to k}_{h',t} \, \dfrac{\zeta_{k'}}{\zeta_k} \, o_{h',k'} & \text{travel-time arc, chronological stage} \end{cases}
$$

- $\sigma^{inf}_h$ = a folga de não negatividade da afluência de $h$ (§4), que carrega a correção de truncamento da afluência local nos métodos de truncamento ([Métodos de tratamento de afluências negativas §2](/pt-br/math/inflow-nonnegativity#2-a-folga-de-nao-negatividade-da-afluencia)); $\mathbb{1}^{tr} = 1$ em `truncation` e `truncation_with_penalty` e $0$ em `penalty`, e em `none` a coluna não existe
- $o_{h',k} = q_{h',k} + s_{h',k}$ = vazão defluente turbinada mais vertida de $h'$ (§7), creditada com a parcela no mesmo estágio $\nu_{h',t,0}$ ou com as parcelas dentro do estágio $\nu^{k' \to k}_{h',t}$ da §4
- $\phi_{h,k}$ = densidade de chegada de [Aumento do espaço de estados §6](/pt-br/math/state-augmentation#6-tempo-de-viagem-da-agua) em um estágio cronológico e $\tau_k / H_t$ em um estágio paralelo: a parcela do volume em trânsito que chega a maturação, $b^{\mathrm{in}}_{h,1}$, que chega no patamar $k$, convertida em taxa pela divisão por $\zeta_k$; o termo de maturação está ausente quando nenhum arco com tempo de viagem chega a $h$
- $\mathcal{U}^{pre}_h(t)$ = usinas em pré-enchimento no estágio $t$ cuja primeira usina a jusante que não está em pré-enchimento é $h$ (veja [Repasse em pré-enchimento](#repasse-em-pre-enchimento)); a afluência local de cada uma, com sua folga nos métodos de truncamento, as vazões desviadas para ela e as defluências das suas usinas de montante entram integralmente, sem parcela de tempo de viagem, e seu volume em trânsito que chega a maturação entra como a taxa $\frac{\phi_{h',k}}{\zeta_k} b^{\mathrm{in}}_{h',1}$, segundo sua própria densidade de chegada

O termo exclui o bombeamento, a folga de não negatividade da afluência em `penalty`, as defluências da própria usina, a evaporação e a retirada.

Para uma usina que não está em pré-enchimento no estágio $t$, o termo reproduz os termos de afluência do seu balanço hídrico (§4) listados abaixo. Em um estágio cronológico, $\zeta_k I_{h,k}$ é igual aos termos de afluência da linha de balanço hídrico do patamar $k$: a afluência local com sua folga nos métodos de truncamento, as vazões desviadas para a usina, as defluências creditadas, o volume em trânsito que chega a maturação e o repasse em pré-enchimento; em `penalty`, a folga da linha fica de fora. Em um estágio paralelo, $\sum_{k} \zeta_k I_{h,k}$ é igual aos mesmos termos da linha do estágio, e apenas o total do estágio ponderado pela duração coincide com o balanço; a repartição entre patamares é uma convenção.

Para uma usina em pré-enchimento, o termo lê as mesmas colunas, com $\mathcal{U}^{pre}_h(t)$ vazio, e elas não correspondem a nenhuma linha de $h$, cuja linha é a identidade congelada ([Repasse em pré-enchimento](#repasse-em-pre-enchimento)): sua afluência local com sua folga nos métodos de truncamento, as vazões desviadas para ela, as defluências das suas usinas de montante e seu volume em trânsito que chega a maturação entram na linha da primeira usina a jusante que não está em pré-enchimento, ou deixam o sistema quando não há nenhuma ([Entrada da chegada com atraso no balanço hídrico](/pt-br/math/state-augmentation#entrada-de-chegada-defasada-no-balanco-hidrico)).

$I_{h,k}$ lê colunas por patamar, de modo que um limite sem patamar se expande em uma linha por patamar (veja a materialização das linhas na [§10](#10-restricoes-genericas)).

## 11. Cortes de Benders

Para cada corte $i$ no PL do estágio, isto é, cada corte ativo ou, no método dinâmico, cada corte residente na resolução ([Gerenciamento de cortes §8](/pt-br/math/cut-management#8-o-metodo-dinamico)):

$$
\theta \geq \beta_{0,i} + \sum_{h \in \mathcal{H}} \beta^v_{i,h} \cdot v_h + \sum_{h \in \mathcal{H}} \Big( \beta^{lag}_{i,h,1} \cdot z_h + \sum_{\ell=2}^{P^{\max}} \beta^{lag}_{i,h,\ell} \cdot a_{h,\ell-1} \Big)
$$

em que:

- $\beta_{0,i}$ = termo independente (intercepto) do corte (lado direito)
- $\beta^v_{i,h}$ = coeficiente da variável de estado de armazenamento, presente quando o corte mantém as dimensões de armazenamento
- $\beta^{lag}_{i,h,\ell}$ = coeficiente da defasagem de afluência $\ell$ do estado de entrada do estágio seguinte, multiplicado pela afluência realizada $z_h$ para $\ell = 1$ e pela defasagem de entrada $a_{h,\ell-1}$ para $\ell \ge 2$; presente quando o corte mantém as dimensões de defasagem de afluência

Quando há termelétricas com antecipação de despacho, o corte possui um coeficiente por slot do commitment ring ([Aumento do espaço de estados §5](/pt-br/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)), lido pelo mesmo mecanismo de custo reduzido; quando há arcos com tempo de viagem, ele possui, da mesma forma, um coeficiente por dimensão de in-transit bucket ([Aumento do espaço de estados §6](/pt-br/math/state-augmentation#6-tempo-de-viagem-da-agua)). Ao contrário dos coeficientes de armazenamento e de defasagem, os coeficientes dos ring slots e dos buckets sempre fazem parte da projeção do corte ([Aumento do espaço de estados §7](/pt-br/math/state-augmentation#7-projecao-de-estado-do-corte)).

A variável de custo futuro $\theta$ tem limite inferior $0$ em todos os estágios, o que pressupõe $V_{t+1} \ge 0$. As funções objetivo dos estágios podem ser negativas: contratos de exportação geram receita (§2), e o termo de corte de geração da §2 é uma recompensa: nunca é positivo, e é constante para uma fonte com geração compulsória (must-run). Onde $V_{t+1}$ é negativa, o limite fica acima dela, de modo que a aproximação por cortes não precisa ficar abaixo de $V_{t+1}$ e o limite inferior não é garantido. No último estágio do horizonte finito, sem fronteira terminal carregada, $\theta$ é $0$ ($V_{T+1} = 0$); com uma [fronteira terminal](/pt-br/math/post-study-boundary#1-a-fronteira-direita) carregada, $\theta$ mantém o piso e os cortes importados o limitam inferiormente, de modo que a função terminal é o maior entre $0$ e os cortes importados.

Os cortes residem em um **conjunto de cortes de acréscimo apenas (append-only)**, em índices de posição estáveis: todo corte já gerado é mantido durante toda a execução, e apenas o subconjunto ativo é incorporado ao modelo (template) de estágio de cada iteração. A desativação **exclui** um corte da reconstrução do modelo de estágio de cada iteração, em vez de modificar alguma linha; o PL persistente do limite inferior é de acréscimo apenas (suas linhas nunca são removidas, de modo que o limite inferior permanece monótono). Os índices de posição permanecem estáveis, de modo que a reativação — a reincorporação do corte ao modelo na mesma posição — é exata. O método dinâmico não desativa corte algum por si só: cada resolução carrega um subconjunto residente dos cortes ativos e o amplia com os cortes candidatos omitidos que a sua solução viola. Um limite por estágio para o número de cortes ativos gerados pela execução, quando definido, desativa o excedente entre os cortes de iterações anteriores, com ou sem seleção de cortes Nível 1 (Level-1); ele não é admitido com o método dinâmico ([Gerenciamento de cortes §5](/pt-br/math/cut-management#5-crescimento-dos-cortes-e-motivacao-para-a-selecao)).

Para a dedução dos coeficientes dos cortes, a agregação e as estratégias de seleção, veja [Gerenciamento de cortes](/pt-br/math/cut-management).

## Referências Cruzadas

- [Convenções de notação](/pt-br/overview/notation-conventions) — conjuntos de índices, parâmetros, nomenclatura das variáveis de decisão
- [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) — significado físico de cada elemento, variáveis de decisão, Convenção de Unidades das Variáveis
- [Sistema de penalidades](/pt-br/math/penalty-system) — taxonomia em três categorias, nomes das penalidades, ordem de prioridade, resolução em cascata
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — estrutura iterativa que resolve este PL em cada estágio
- [Aumento do espaço de estados](/pt-br/math/state-augmentation) — o vetor de estado, sua fixação por limites de coluna, o estado de saída e a linha do corte, e as famílias de estado de defasagens de afluência, do commitment ring e de água em trânsito
- [Estrutura e escalonamento do PL](/pt-br/math/lp-layout-and-scaling) — o leiaute de colunas e linhas deste PL, seu escalonamento de custos e pré-escalonamento, e o desescalonamento dos seus duais e custos reduzidos
- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — especificação completa do modelo AR de afluências
- [Modelos de função de produção hidrelétrica](/pt-br/math/hydro-production-models) — detalhes dos modelos de produtibilidade constante e FPHA
- [Gerenciamento de cortes](/pt-br/math/cut-management) — extração dos duais, coeficientes dos cortes, agregação e seleção
- [Formulações específicas por equipamento](/pt-br/math/equipment-formulations) — deduções das restrições por equipamento, detalhes do bombeamento
