---
title: "Métodos de tratamento de afluências negativas"
description: Quatro métodos para tratar realizações negativas de afluência do modelo PAR(p) — none, penalty, truncation e truncation_with_penalty — com suas formulações de PL, a água que cada um acrescenta ao balanço hídrico e seu efeito sobre o limite inferior.
---

## Objetivo

Este capítulo define os quatro métodos disponíveis para tratar as realizações negativas de afluência produzidas pelo modelo PAR(p): suas formulações de PL, seus termos na função objetivo, seu efeito sobre a validade do limite inferior e seus compromissos.

## 1. Formulação do Problema

A equação de afluência do modelo PAR(p) — que usa o coeficiente AR [$\psi_{m,\ell}$](/pt-br/overview/notation-conventions#35-parametros-do-modelo-de-afluencias) — pode produzir uma realização negativa:

$$
a_h = \underbrace{b_{h,m}}_{\text{deterministic base}} + \underbrace{\sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell}}_{\text{lag contribution}} + \underbrace{\sigma_m \cdot \varepsilon}_{\text{noise term}}
$$

Quando o [ruído (inovação)](/pt-br/overview/notation-conventions#35-parametros-do-modelo-de-afluencias) $\varepsilon$ é suficientemente negativo, $\sigma_m \varepsilon < -\big(b_{h,m} + \sum_{\ell} \psi_{m,\ell}\, \hat{a}_{h,\ell}\big)$, o total é negativo; com $\sigma_m = 0$, ele é negativo sempre que sua parte determinística o for. Isso, por si só, não é uma impossibilidade física: $a_h$ é a vazão _incremental_ — a vazão natural de uma usina menos a das usinas a montante —, de modo que um valor genuinamente negativo é hidrologia real (um trecho que perde água no período), e o mesmo caso $a_h < 0$ ocorre quer a realização venha do ruído do modelo PAR(p), quer da reprodução direta de uma janela negativa de dados históricos ou observados (veja [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model)). O que os métodos abaixo resolvem é a consequência de $a_h < 0$ para o balanço hídrico do PL: absorvê-la sem que as demais variáveis do balanço hídrico (armazenamento, defluência, vertimento — todas limitadas a $\geq 0$) sejam levadas à inviabilidade.

Nenhum método altera a realização em si. Em todos os métodos, $a_h$ permanece na linha de afluência realizada ([Formulação do PL §5](/pt-br/math/lp-formulation#5-linhas-de-definicao-da-afluencia-realizada)) e as defasagens de afluência dos estágios seguintes são construídas a partir dela, agregadas no período da defasagem quando esse período abrange vários estágios ([Estudos com múltiplas resoluções §2](/pt-br/math/multi-resolution-studies#2-acumulacao-das-defasagens)); assim, o processo de afluências é o definido pelo modelo PAR(p), incluídos os valores negativos. Os métodos diferem na água que acrescentam ao balanço hídrico ao lado de $a_h$. Os dois métodos de truncamento limitam essa água pelo **montante de truncamento**, a parte negativa da realização:

$$
a^-_h = \max(0, -a_h)
$$

a água que eleva a realização a zero, $a_h + a^-_h = \max(a_h, 0)$. Ele é avaliado em cada resolução a partir do ruído dessa resolução e das defasagens de entrada $\hat{a}_{h,\ell}$ fixadas para ela, de modo que depende do estado visitado; com $\sigma_m = 0$, é a parte negativa do valor determinístico $b_{h,m} + \sum_{\ell} \psi_{m,\ell}\, \hat{a}_{h,\ell}$.

A seguir, PAR(p > 0) denota um modelo PAR com termos de defasagem (ordem acima de zero ou componente anual). A componente anual ([Modelo de afluências PAR(p) §7](/pt-br/math/par-inflow-model#7-extensao-com-componente-anual-parp-a)) faz a regressão sobre a média das doze afluências anteriores, de modo que atribui um coeficiente a cada uma dessas defasagens, qualquer que seja a ordem.

## 2. A Folga de Não Negatividade da Afluência

Todo método, exceto `none`, acrescenta uma coluna de folga $\sigma^{inf}_h \geq 0$ por usina hidrelétrica, em m³/s. Ela entra no balanço hídrico da usina ao lado da afluência realizada $z_h = a_h$, com os coeficientes de $z_h$, sendo cada termo do lado esquerdo ([Formulação do PL §4](/pt-br/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)):

$$
-\zeta \,\big( z_h + \sigma^{inf}_h \big) \;\; \text{(parallel stage)}, \qquad -\zeta_k \,\big( z_h + \sigma^{inf}_h \big) \;\; \text{(block } k \text{ of a chronological stage)}
$$

de modo que a folga acrescenta $\zeta\,\sigma^{inf}_h$ hm³ de água no estágio, $\zeta_k\,\sigma^{inf}_h$ no patamar $k$, e a água que chega ao balanço é $a_h + \sigma^{inf}_h$. A linha de afluência realizada não se altera. Para uma usina em pré-enchimento (PreFilling), a folga acompanha sua afluência local até as linhas da primeira usina a jusante que não esteja em pré-enchimento ([Formulação do PL — Repasse em pré-enchimento](/pt-br/math/lp-formulation#repasse-em-pre-enchimento)), de modo que a água que ela acrescenta chega ao balanço dessa usina; se não houver tal usina, ela não entra em linha alguma, e nunca entra na linha de identidade congelada da própria usina.

O método define os limites e o preço da folga:

| Método                    | Limites de $\sigma^{inf}_h$ | Custo por (m³/s)·h |
| ------------------------- | --------------------------- | ------------------ |
| `none`                    | sem folga                   | —                  |
| `penalty`                 | $[0, +\infty)$              | $c^{inf}_h$        |
| `truncation`              | $[a^-_h, a^-_h]$            | $0$                |
| `truncation_with_penalty` | $[0, a^-_h]$                | $c^{inf}_h$        |

Nos dois métodos de truncamento, os limites são definidos em cada resolução do problema do estágio, tanto no treinamento (training) quanto na simulação, a partir da realização dessa resolução, que depende das defasagens de entrada fixadas e do ruído; portanto, eles diferem entre estados visitados, aberturas e cenários (§7).

Em `penalty` e `truncation_with_penalty`, a folga é uma **folga de recurso de Categoria 1** ([Sistema de penalidades — Categoria 1](/pt-br/math/penalty-system#categoria-1-folgas-de-recurso-viabilidade-do-pl)): a água que ela acrescenta mantém o balanço viável quando uma realização negativa de afluência o deixaria sem solução. Seu custo é ordenado junto às penalidades por violação de restrições: convertido em um custo equivalente de energia em R\$/MWh, fica acima dos custos térmicos e de contratos e abaixo do déficit ([Sistema de penalidades — Ordem de Prioridade das Penalidades](/pt-br/math/penalty-system#ordem-de-prioridade-das-penalidades)). Como a afluência $a_h$ é definida por estágio (e não por patamar), a penalidade aparece **fora** do somatório sobre os patamares na função objetivo, junto às penalidades por violação de armazenamento:

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

em que $H_t = \sum_k \tau_k$ é a duração total do estágio em horas. O produto $\sigma^{inf}_h \cdot H_t$ é o volume de água que a folga acrescenta, em (m³/s)·h, de modo que $c^{inf}_h$ é um custo por (m³/s)·h de água acrescentada. Em `truncation`, a folga é uma correção fixa, e não uma decisão: o PL não pode escolher seu valor, e ela não tem custo.

## 3. Método: `none`

**Formulação do PL**: apenas a linha de afluência realizada, sem folga:

$$
a_h = b_{h,m} + \sum_{\ell=1}^{p} \psi_{m,\ell} \cdot \hat{a}_{h,\ell} + \sigma_m \cdot \varepsilon
$$

**Implicações**:

- O PL pode se tornar **inviável** quando $a_h < 0$ provoca violação do balanço hídrico
- Útil apenas para depuração ou quando o modelo AR garante saídas positivas

## 4. Método: `penalty`

**Variáveis Adicionais**:

| Variável         | Domínio  | Unidade | Descrição                                   |
| ---------------- | -------- | ------- | ------------------------------------------- |
| $\sigma^{inf}_h$ | $\geq 0$ | m³/s    | Folga de não negatividade da afluência      |

**Termo no balanço hídrico e na função objetivo**: os da §2, com $\sigma^{inf}_h$ ilimitada superiormente e valorada a $c^{inf}_h H_t$.

**Interpretação**: a água que chega ao reservatório é $a_h + \sigma^{inf}_h$. O PL usa a folga sempre que o balanço hídrico não pode ser atendido de outra forma, ou sempre que a água acrescentada vale mais do que seu custo; nada a vincula ao sinal da realização, de modo que o custo limita o valor da água na usina ([Formulação do PL §2](/pt-br/math/lp-formulation#2-funcao-objetivo)).

**Vantagens**:

- PL sempre viável
- Sinal de custo claro para eventos de afluência negativa
- Limites da folga que não dependem do estado de entrada, de modo que o método preserva a validade do limite inferior (§7)

**Desvantagens**:

- Acrescenta uma coluna de folga por usina hidrelétrica
- Uma fonte de água valorada em toda realização, inclusive nas não negativas, o que limita o valor marginal da água

## 5. Método: `truncation`

**Formulação do PL**: a linha de afluência realizada mantém a realização bruta $a_h$, e a folga da §2 é fixada no montante de truncamento, sem custo:

$$
\sigma^{inf}_h = a^-_h = \max(0, -a_h)
$$

de modo que a água que chega ao reservatório é $a_h + a^-_h = \max(a_h, 0)$: uma realização negativa entra no balanço hídrico como zero, e uma não negativa entra inalterada, pois seu montante de truncamento é zero. As defasagens de afluência dos estágios seguintes são construídas a partir de $a_h$, e não do valor truncado.

**Vantagens**:

- Uma realização negativa não pode, por si só, deixar o balanço hídrico sem solução: o balanço recebe $\max(a_h, 0)$, como receberia uma afluência nula
- Nenhuma penalidade a calibrar: a elevação não tem custo
- O processo de afluências continua sendo o processo PAR(p), pois as defasagens carregam a realização bruta
- Definido para qualquer desvio-padrão residual, inclusive $\sigma_m = 0$ (§1)

**Desvantagens**:

- **Introduz viés para cima no balanço hídrico**: a água que nele entra, $\max(a_h, 0)$, tem média maior que $a_h$, e a água acrescentada não aparece em custo algum
- **Limite inferior não garantido sob PAR(p > 0)**: o montante de truncamento depende das defasagens de entrada (§7)

## 6. Método: `truncation_with_penalty`

**Formulação do PL**: a linha de afluência realizada mantém a realização bruta $a_h$, e a folga da §2 fica entre zero e o montante de truncamento, valorada como em `penalty`:

$$
0 \le \sigma^{inf}_h \le a^-_h
$$

**Parcela Adicional na Função Objetivo** (fora do somatório sobre os patamares):

$$
+ \sum_{h \in \mathcal{H}} c^{inf}_h \cdot \sigma^{inf}_h \cdot H_t
$$

A água que chega ao reservatório fica entre $a_h$ e $\max(a_h, 0)$. Uma realização não negativa tem montante de truncamento nulo, o que fixa a folga em zero, de modo que o método não lhe acrescenta água.

### 6.1 Relação com os demais métodos

O método combina os dois mecanismos anteriores em uma única coluna:

- **De `truncation`, o teto.** A folga eleva a realização no máximo até zero, de modo que nunca fornece água além do déficit hídrico, e nenhuma quando a realização é não negativa. Em `penalty`, a mesma coluna é uma fonte valorada e ilimitada em toda realização.
- **De `penalty`, o preço.** O PL eleva a realização apenas até onde a água acrescentada vale seu custo; o armazenamento e as defluências do balanço hídrico cobrem o restante do déficit. Em `truncation`, todo o déficit é coberto, sem custo.

Ele compartilha com `truncation` a dependência do teto em relação às defasagens de entrada (§7).

### 6.2 Relação com Larroyd et al. (2022)

[Larroyd et al. (2022)](/pt-br/reference/bibliography/#modelagem-de-afluencias) enunciam as estratégias sobre um estado PAR $x$ cuja realização é decomposta nas vazões incrementais das usinas que ele abrange, $y_h = c_h x + d_h$. Em todas as estratégias, o estado PAR mantém a realização bruta, e a correção $l$ é somada à água que o balanço recebe, nunca a $x$: como folga no balanço hídrico na estratégia de penalidade, e por meio da decomposição, $y_h - c_h (x + l) = d_h$, nas estratégias de truncamento. O artigo recomenda um modelo por reservatório ($c_h = 1$). Para o modelo PAR(p) por usina deste capítulo, ajustado sobre a própria vazão incremental ($c_h = 1$, $d_h = 0$), $x$ é a realização $a_h$, $l$ é $\sigma^{inf}_h$, e a água que chega ao balanço é $a_h + \sigma^{inf}_h$:

| Estratégia do artigo                                                          | Método deste capítulo     |
| ----------------------------------------------------------------------------- | ------------------------- |
| Penalidade (§2.2): $l \geq 0$, valorada                                       | `penalty`                 |
| Truncamento (§2.3): $l = \max(-x^*, 0)$, sem valoração                        | `truncation`              |
| Truncamento combinado com penalidade (§2.4): $0 \le l \le \max(-x^*, 0)$, valorada | `truncation_with_penalty` |

em que $x^*$ é a realização com as defasagens de entrada da resolução, de modo que $\max(-x^*, 0)$ é o montante de truncamento $a^-_h$. As defasagens de afluência dos estágios seguintes são construídas a partir da realização bruta em todas as estratégias. A estratégia do valor ótimo do artigo (§2.1) resolve um problema separado de alocação de água para a folga quando o problema do estágio não tem solução; sua função de custo é não convexa, de modo que o artigo a aplica apenas na simulação forward, e ela não tem correspondente entre estes métodos.

## 7. Truncamento e o Limite Inferior

Sob um modelo PAR(p > 0), a realização $a_h$ é afim nas defasagens de entrada $\hat{a}_{h,\ell}$ (§1), de modo que o montante de truncamento $a^-_h$ — e com ele os limites de $\sigma^{inf}_h$ nos dois métodos de truncamento — é uma função linear por partes do estado de entrada. A resolução de um estágio fixa esses limites no valor do seu próprio estado visitado. O corte que a resolução produz ([Gerenciamento de cortes](/pt-br/math/cut-management)) é justo no estado visitado e fica abaixo do problema do estágio com os limites mantidos no montante de truncamento desse ponto, mas não possui termo para a variação de $a^-_h$ com as defasagens: seus coeficientes são os custos reduzidos das colunas fixadas do estado de entrada, e os limites da folga são constantes do PL resolvido. Em um estado de entrada com montante de truncamento diferente, o corte pode ficar acima do verdadeiro valor sucessor:

- **Onde o truncamento é mais profundo**, nos dois métodos: os limites mantidos admitem menos água do que os do próprio estado.
- **Onde o truncamento é mais raso**, apenas em `truncation`: sua folga fixa força mais água do que a do próprio estado, o que eleva o custo quando a água adicional não pode deixar o reservatório sem custo, por exemplo diante de um custo de vertimento ou de um limite de vertimento. Em `truncation_with_penalty`, os limites mantidos no estado visitado contêm o próprio intervalo $[0, a^-_h]$ do estado, uma relaxação do seu problema de estágio, de modo que o corte permanece abaixo ali.

Os métodos de truncamento, portanto, violam as hipóteses de [Gerenciamento de cortes — Camada 1](/pt-br/math/cut-management#camada-1-limite-inferior-valido) nas componentes de defasagem das afluências: não há garantia de que o limite inferior $\underline{z}^k$ permaneça abaixo do valor ótimo, e ele pode superar um limite superior avaliado sobre os problemas dos estágios ([Larroyd et al., 2022](/pt-br/reference/bibliography/#modelagem-de-afluencias), §2.5, que constata valores dos problemas dos estágios abaixo dos problemas mestres construídos a partir dos cortes e, em vez disso, estima ambos os limites sobre esses problemas mestres). O critério de parada por gap, admissível apenas com simulação forward enumerada, compara o gap limitado inferiormente a zero ([Critérios de parada §5](/pt-br/math/stopping-rules#5-parada-por-gap-recomendada)), de modo que pode parar sem certificado de otimalidade. Cada corte permanece abaixo do problema do estágio com os limites mantidos no seu próprio estado visitado.

Os limites dependem do estado de entrada apenas por meio das suas defasagens de afluência e, em um estágio, apenas por meio dos coeficientes de defasagem $\psi_{m(t),\ell}$ do período sazonal desse estágio. Quando todos eles são nulos, em um período sazonal de ordem zero sem componente anual, o montante de truncamento nesse estágio depende apenas do ruído. Os limites de `penalty` não dependem do estado.

## 8. Resumo Comparativo

| Método                    | Tamanho do PL              | Água acrescentada ao balanço         | Custo da água acrescentada | Viabilidade    | Limite inferior sob PAR(p > 0) |
| ------------------------- | -------------------------- | ------------------------------------ | -------------------------- | -------------- | ------------------------------ |
| `none`                    | Base                       | Nenhuma                              | —                          | Pode falhar    | Não afetado                    |
| `penalty`                 | +1 coluna por usina hidrelétrica | Qualquer quantidade, em qualquer realização | $c^{inf}_h$       | Garantida      | Não afetado                    |
| `truncation`              | +1 coluna por usina hidrelétrica | Exatamente $a^-_h$             | Nenhum                     | Garantida      | Não garantido (§7)             |
| `truncation_with_penalty` | +1 coluna por usina hidrelétrica | Até $a^-_h$                    | $c^{inf}_h$                | Garantida      | Não garantido (§7)             |

Todos os métodos mantêm a realização bruta no estado de defasagens (§1).

## 9. Referência

- [Larroyd et al. (2022)](/pt-br/reference/bibliography/#modelagem-de-afluencias)

## Referências Cruzadas

- [Formulação do PL](/pt-br/math/lp-formulation) — Estrutura da função objetivo e taxonomia das penalidades, em que $c^{inf}_h$ valora uma folga de recurso de Categoria 1
- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — Define o modelo PAR(p) que produz as realizações de afluência tratadas aqui
- [Sistema de penalidades](/pt-br/math/penalty-system) — Hierarquia de penalidades e resolução em cascata
- [Geração de cenários](/pt-br/math/scenario-generation) — De onde vem o termo de ruído $\varepsilon$ da equação de afluência: a árvore de aberturas fixa (vetores de ruído previamente gerados) que a simulação backward resolve e os esquemas de amostragem da simulação forward
- [Gerenciamento de cortes](/pt-br/math/cut-management) — As hipóteses da Camada 1 que os métodos de truncamento violam nas componentes de defasagem das afluências
- [Critérios de parada](/pt-br/math/stopping-rules) — O critério de gap cuja comparação com limitação a zero é anulada por um limite inferior acima do limite superior
- [Configuração da não negatividade das afluências](/pt-br/running/configuration#modelinginflow_non_negativity) — a configuração, na camada de software, que seleciona qual destes quatro métodos um estudo usa e onde se informa o custo de penalidade $c^{inf}_h$
