---
title: Estrutura e escalonamento do PL
description: A estrutura de colunas e linhas do PL do estágio e seu tratamento numérico — escalonamento de custos, pré-escalonamento de colunas e linhas pela média geométrica e o desescalonamento das variáveis duais das linhas e dos custos reduzidos que fornecem os coeficientes dos cortes.
---

## Objetivo

Este capítulo descreve a estrutura de colunas e linhas do PL do estágio e seu condicionamento numérico: a ordem de suas regiões de colunas e famílias de linhas, o escalonamento (scaling) de custos, o pré-escalonamento de colunas e linhas pela média geométrica e o desescalonamento das variáveis duais das linhas e dos custos reduzidos que fornecem os coeficientes dos cortes.

**Ordem de leitura**: [Gerenciamento de cortes](/math/cut-management) → **este capítulo** → [Aproveitamento de base do PL](/math/lp-warm-start)

## 1. Estrutura de colunas e linhas

A figura lista, à esquerda, as regiões de colunas do PL do estágio em sua ordem e, à direita, suas famílias de linhas em sua ordem. As colunas começam com o armazenamento de saída, as parcelas de água em trânsito (in-transit buckets) de saída e as posições do anel de despacho antecipado (commitment ring slots) de saída; seguem-se o armazenamento de entrada fixado, as parcelas de água em trânsito e as posições do anel de despacho antecipado de entrada fixadas e $\theta$, e as colunas de equipamentos e de folga encerram a estrutura. As defasagens de afluência e a afluência realizada não têm coluna: a afluência realizada é calculada antes da resolução e entra nas linhas que a leem pelos seus lados direitos ([Formulação do PL §5](/math/lp-formulation#5-afluencia-realizada), [Folding do PAR(p)](/math/par-folding)). As linhas começam com o balanço hídrico e terminam com os cortes de Benders, acrescentados após as linhas próprias do estágio. A aresta indica a origem dos coeficientes de corte de armazenamento, das parcelas de água em trânsito e das posições do anel: o custo reduzido de uma coluna de entrada fixada. Os coeficientes das defasagens de afluência vêm dos duais pela regra da cadeia ([Folding do PAR(p) §4](/math/par-folding#4-os-coeficientes-das-defasagens-pela-regra-da-cadeia)).

```d2
grid-columns: 2
horizontal-gap: 150

columns: "Colunas, em ordem" {
  grid-columns: 1
  horizontal-gap: 20
  vertical-gap: 46
  st_out: "Armazenamento de saída"
  bk_out: "Parcelas de água\nem trânsito de saída"
  rs_out: "Posições do anel de despacho\nantecipado de saída"
  pin_in: "Armazenamento, parcelas de água em trânsito\ne posições do anel de entrada fixados"
  th_col: "θ"
  eq_col: "Equipamentos e folgas"
}

rows: "Famílias de linhas, em ordem" {
  grid-columns: 1
  horizontal-gap: 20
  vertical-gap: 7
  wb: "Balanço hídrico"
  bd: "Definição das parcelas de água em trânsito"
  lb: "Atendimento à demanda"
  fp: "Planos da FPHA"
  ev: "Evaporação"
  op: "Pisos e teto operativos"
  fl: "Enchimento e pisos de volume morto"
  cm: "Compromisso: retirada · depósito · transporte"
  gc: "Restrições genéricas"
  bc: "Cortes de Benders" {style.stroke-dash: 4}
}

columns.pin_in -> rows.bc: "custo reduzido →\ncoeficiente do corte"
```

O PL do estágio usa uma estrutura fixa de colunas e linhas que posiciona as variáveis de estado primeiro, seguidas das colunas auxiliares e de equipamentos. O armazenamento, as parcelas de água em trânsito e as posições do anel de despacho antecipado são fixados por **limites das colunas** de estado de entrada ([Aumento do espaço de estados §2](/math/state-augmentation#2-fixacao-por-limites-de-coluna), [§5](/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao), [§6](/math/state-augmentation#6-tempo-de-viagem-da-agua)), e os seus coeficientes de corte são lidos como os **custos reduzidos** dessas colunas — portanto, é a ordem fixa das colunas, e não uma ordem fixa das linhas, que permite a extração contígua dos coeficientes. Com $N = |\mathcal{H}|$ usinas hidrelétricas e $B$ = o número total de parcelas de água em trânsito (a soma, sobre as usinas receptoras, da profundidade de defasagens de chegada de cada usina — [Aumento do espaço de estados §6](/math/state-augmentation#6-tempo-de-viagem-da-agua)):

**Estrutura das colunas**:

| Região                | Quantidade | Descrição                                                                    |
| --------------------- | ----- | --------------------------------------------------------------------------------- |
| `storage`             | $N$   | Volumes armazenados de saída (estado) — primeiro                                  |
| `transit_buckets_out` | $B$   | Volumes das parcelas de água em trânsito de saída (estado, usina como índice externo, defasagem como índice interno) — após o armazenamento |
| `commit_out`          | uma por posição do anel de despacho antecipado ([Aumento do espaço de estados §1](/math/state-augmentation#1-vetor-de-estado)) | Posições do anel de despacho antecipado de saída (estado, posição como índice externo, usina como índice interno) — após as parcelas de água em trânsito de saída |
| `storage_in`          | $N$   | Volumes armazenados de entrada (fixados, [Aumento do espaço de estados §2](/math/state-augmentation#2-fixacao-por-limites-de-coluna)) — após as posições do anel de saída |
| `transit_buckets_in`  | $B$   | Volumes das parcelas de água em trânsito de entrada (fixados, [Aumento do espaço de estados §6](/math/state-augmentation#6-tempo-de-viagem-da-agua)) — após storage_in |
| `commit_in`           | uma por posição do anel de despacho antecipado ([Aumento do espaço de estados §1](/math/state-augmentation#1-vetor-de-estado)) | Posições do anel de despacho antecipado de entrada (fixadas, [Aumento do espaço de estados §5](/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)) — após as parcelas de água em trânsito de entrada |
| `theta`               | $1$   | Variável de custo futuro — a última do prefixo de estado                          |

As colunas de equipamentos e de folga seguem imediatamente após $\theta$, nesta ordem: em um estágio cronológico, o armazenamento ao final de cada patamar, exceto o último; vazão turbinada, vertimento e desvio; geração térmica; as decisões de antecipação de despacho térmico; fluxos nas linhas em cada sentido; déficit e excesso; as folgas de não negatividade da vazão afluente, em todos os métodos de tratamento da vazão exceto `none`; geração da FPHA; evaporação e suas folgas; as folgas de retirada; as folgas de violação operativa; geração não despachável; vazão bombeada; contratos de importação e exportação; as folgas das restrições genéricas; e as folgas do piso de enchimento e do piso flexível de volume morto. A família de colunas de vazão turbinada e a família de colunas de geração da FPHA são indexadas por **célula (usina hidrelétrica, barramento)**, e não por usina — uma coluna por célula ([Formulação do PL §3](/math/lp-formulation#3-restricao-de-atendimento-a-carga), [§6](/math/lp-formulation#6-restricoes-de-geracao-hidreletrica)) —, enquanto as demais colunas de equipamentos hidráulicos (vertimento, desvio) permanecem indexadas por usina. Assim como o armazenamento de saída e as posições do anel de despacho antecipado, o bloco de parcelas de água em trânsito de saída ocupa as colunas de seus próprios índices de estado: ele contém o volume ainda em trânsito em cada trecho da cascata, definido por linhas de definição das parcelas de água em trânsito no próprio PL ([Aumento do espaço de estados §6](/math/state-augmentation#linhas-de-definicao-das-parcelas-de-agua-em-transito)), e não fixado, e o bloco de parcelas de água em trânsito de entrada é a cópia de entrada fixada correspondente, lida para o termo de chegada defasada do balanço hídrico e para o coeficiente do corte ([Aumento do espaço de estados §6](/math/state-augmentation#6-tempo-de-viagem-da-agua)). Um bloco de equipamentos atende às térmicas com antecipação de despacho: uma coluna de decisão por térmica com antecipação, que representa o compromisso decidido neste estágio para o seu estágio de entrega ([Aumento do espaço de estados §5](/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)).

O estado de defasagens de afluência não tem coluna: as defasagens de entrada e o ruído da abertura dão a afluência realizada $\hat{z}_h$ antes da resolução, e ela entra nas linhas que a leem como constante do lado direito ([Formulação do PL §5](/math/lp-formulation#5-afluencia-realizada)).

**Estrutura das linhas**:

Como o estado é fixado por limites das colunas ([Aumento do espaço de estados §2](/math/state-augmentation#2-fixacao-por-limites-de-coluna), [§5](/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao), [§6](/math/state-augmentation#6-tempo-de-viagem-da-agua)), e não por linhas de igualdade, o PL não tem linhas de fixação de estado, e o modelo de afluências não tem linhas de definição ([Folding do PAR(p) §1](/math/par-folding#1-duas-formulacoes-do-mesmo-pl)). As famílias de linhas vêm nesta ordem: balanço hídrico, definição das parcelas de água em trânsito ([Aumento do espaço de estados §6](/math/state-augmentation#linhas-de-definicao-das-parcelas-de-agua-em-transito)), atendimento à demanda, planos da FPHA, evaporação, as linhas operativas (vazão defluente mínima, vazão defluente máxima, vazão turbinada mínima, geração mínima e, em seguida, as linhas de vazão turbinada e geração mínimas da usina e as linhas de vazão turbinada e geração máximas da usina, para uma usina hidrelétrica com várias células, [Formulação do PL — Mínimo e máximo da usina](/math/lp-formulation#minimo-e-maximo-da-usina)), o piso de enchimento e o piso flexível de volume morto, as linhas de retirada, de depósito e de transporte do compromisso ([Aumento do espaço de estados §5](/math/state-augmentation#linhas-do-ring)) e as restrições genéricas; [Visão geral do PL do estágio](/math/lp-formulation#o-pl-do-estagio-em-resumo) contabiliza cada família. As linhas dos cortes de Benders são acrescentadas após elas ([Formulação do PL §11](/math/lp-formulation#11-cortes-de-benders)).

Cada coordenada de armazenamento, de parcela de água em trânsito e de posição do anel de despacho antecipado do estado de entrada é fixada em sua própria coluna do PL — a coluna de armazenamento de entrada, a coluna de entrada da parcela de água em trânsito, a coluna de entrada da posição do anel —, e seu coeficiente de corte é o **custo reduzido** dessa coluna ([Aumento do espaço de estados §2](/math/state-augmentation#2-fixacao-por-limites-de-coluna), [Gerenciamento de cortes](/math/cut-management)). O mapeamento de uma coordenada de estado para sua coluna fixada é fixo, e cada uma dessas regiões de colunas de estado de entrada é contígua, de modo que os coeficientes de armazenamento, das parcelas de água em trânsito e das posições do anel de despacho antecipado são obtidos pela leitura de algumas fatias contíguas do vetor de custos reduzidos. As defasagens de afluência de entrada não são colunas do PL: seus valores visitados entram na afluência realizada e nos lados direitos dos cortes, e seus coeficientes de corte vêm dos duais das linhas e dos cortes pela regra da cadeia ([Folding do PAR(p) §4](/math/par-folding#4-os-coeficientes-das-defasagens-pela-regra-da-cadeia)).

**Exemplo resolvido** ($N = 3$, uma profundidade de defasagens de afluência $P^{\max} = 2$, sem térmica com antecipação de despacho e sem trecho com tempo de viagem): a região de armazenamento contém 3 colunas e a região de armazenamento de entrada contém 3, de modo que $\theta$ é a 7ª coluna. O número de variáveis de estado (armazenamento + defasagens de afluência) é $N(1 + P^{\max}) = 9$, das quais apenas as 3 coordenadas de armazenamento têm colunas no PL.

## 2. Escalonamento do PL

O PL do estágio é condicionado numericamente por um procedimento de escalonamento em três etapas, aplicado uma única vez na construção do modelo-base (template). O escalonamento estreita a dispersão das magnitudes dos coeficientes da matriz de restrições, o que costuma melhorar o comportamento numérico do método simplex, sem alterar o argmin da otimização; ele não dá nenhuma garantia sobre o número de condição da matriz.

### 2.1 Escalonamento de custos

Todos os coeficientes da função objetivo (exceto a variável de custo futuro $\theta$) são divididos por uma constante positiva fixa $K$, escolhida uma vez por estudo. $K$ escala uniformemente o domínio dos custos e não altera a matriz de restrições nem a região viável, de modo que o argmin do PL é invariante em relação a ele e quaisquer duas escolhas de $K$ concordam em aritmética exata:

$$
\tilde{c}_j = \frac{c_j}{K} \quad \text{for all } j \neq \theta
$$

A variável $\theta$ mantém um coeficiente não escalonado, o fator de desconto de um passo $d_{t \to t+1}$: cada linha de corte é $\theta \geq R^{scaled} + \sum_j \beta_j^{scaled} x_j$ sobre as colunas $j$ de estado de saída, sendo seu lado direito ([Formulação do PL §11](/math/lp-formulation#11-cortes-de-benders)) e cada coeficiente o valor na unidade original dividido por $K$, de modo que $\theta$ já está no espaço de custos escalonado. A função objetivo do PL é $\sum_j \tilde{c}_j x_j + d_{t \to t+1} \, \theta$, e a função objetivo escalonada total é igual a $(C_{stage} + d_{t \to t+1} \, C_{future}) / K$. O fator de cada estágio leva o custo de cada estágio posterior ao estágio 1 exatamente uma vez ([Formulação da taxa de desconto](/math/discount-rate#consistencia-com-a-recursao-de-bellman)). Todas as saídas no domínio de custos (valores da função objetivo, variáveis duais, decomposições de custo) são multiplicadas por $K$ no momento do relatório para recuperar as unidades originais.

### 2.2 Escalonamento de colunas (média geométrica)

Após o escalonamento de custos, cada coluna $j$ recebe um fator de escala por uma passagem de escalonamento pela média geométrica ([Tomlin, 1975](/reference/bibliography/#metodos-numericos); [Elble & Sahinidis, 2012](/reference/bibliography/#metodos-numericos)), que torna a maior e a menor magnitude não nula da coluna recíprocas uma da outra:

$$
d_j^{col} = \frac{1}{\sqrt{\max_i |A_{ij}| \cdot \min_i |A_{ij}|}}
$$

em que o máximo e o mínimo são tomados sobre os elementos não nulos da coluna $j$. As colunas sem elementos não nulos e as colunas das posições do anel de despacho antecipado recebem $d_j^{col} = 1$. A transformação substitui:

- Elementos da matriz: $\tilde{A}_{ij} = A_{ij} \cdot d_j^{col}$
- Coeficientes da função objetivo: $\tilde{c}_j = c_j \cdot d_j^{col}$
- Limites das colunas: $\tilde{l}_j = l_j / d_j^{col}$, $\tilde{u}_j = u_j / d_j^{col}$

### 2.3 Escalonamento de linhas (média geométrica)

Após o escalonamento de colunas, cada linha $i$ recebe um fator de escala pela mesma fórmula da média geométrica, aplicada à matriz já escalonada por colunas:

$$
d_i^{row} = \frac{1}{\sqrt{\max_j |\tilde{A}_{ij}| \cdot \min_j |\tilde{A}_{ij}|}}
$$

A transformação substitui:

- Elementos da matriz: $\check{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}$
- Limites das linhas: $\check{l}_i^{row} = l_i^{row} \cdot d_i^{row}$, $\check{u}_i^{row} = u_i^{row} \cdot d_i^{row}$

Os limites das colunas e os coeficientes da função objetivo não são modificados pelo escalonamento de linhas.

O escalonamento combinado produz a forma padrão $D_r \cdot A \cdot D_c$, em que $D_r$ e $D_c$ são matrizes diagonais de escala.

:::note[Desescalonamento das variáveis duais]
As variáveis duais das linhas do PL estão no espaço do problema escalonado. Para recuperar as variáveis duais nas unidades originais: $\pi_i^{original} = \pi_i^{scaled} \cdot d_i^{row} \cdot K$. Os fatores de escala por coluna e por linha são armazenados no modelo-base do PL do estágio para uso na extração das variáveis duais e no cálculo dos coeficientes dos cortes. Essa recuperação é exata quando a resolução não aplica nenhum escalonamento além do pré-escalonamento próprio do Novo Modelo — o que ocorre por padrão; se o backend aplicar um escalonamento adicional próprio sobre a matriz pré-escalonada, entra um segundo fator de escala que essa identidade não considera.
:::

:::note[Desescalonamento dos custos reduzidos para os coeficientes dos cortes]
Os coeficientes de corte de armazenamento, das parcelas de água em trânsito e das posições do anel são lidos como os **custos reduzidos** das colunas de estado de entrada fixadas ([Aumento do espaço de estados §2](/math/state-augmentation#2-fixacao-por-limites-de-coluna)), e não como variáveis duais de linhas. Um custo reduzido é informado no espaço do problema escalonado; a sensibilidade na unidade original é $\beta_j^{original} = (\bar{c}_j^{scaled} / d_j^{col}) \cdot K$ — divide-se pelo fator da coluna e, em seguida, multiplica-se por $K$. A **divisão** por $d_j^{col}$ (e não a multiplicação) decorre da transformação de colunas $\tilde{x}_j = x_j / d_j^{col}$ da [§2.2](#22-escalonamento-de-colunas-media-geometrica): o solver/backend do PL deriva a função objetivo escalonada em relação a $\tilde{x}_j$, de modo que recuperar $\partial Q / \partial x_j$ exige dividir novamente pelo fator da coluna. Quando a resolução não aplica nenhum escalonamento além do pré-escalonamento próprio do Novo Modelo — o que ocorre por padrão —, esse desescalonamento único é exato; se o backend aplicar um escalonamento adicional próprio sobre a matriz pré-escalonada, entra um segundo fator de escala que essa identidade não considera, e o desescalonamento único não recupera exatamente as unidades originais. (Os coeficientes dos cortes são armazenados no espaço de custos escalonado — o valor $\bar{c}_j^{scaled}/d_j^{col}$ —, com $K$ aplicado apenas no momento do relatório, como para todas as grandezas do domínio de custos.)
:::

## Referências cruzadas

- [Formulação do PL](/math/lp-formulation) — o PL do estágio cujas colunas e linhas este capítulo ordena
- [Aumento do espaço de estados](/math/state-augmentation) — o vetor de estado, sua fixação por limites das colunas e a linha do corte sobre o estado de saída
- [Gerenciamento de cortes](/math/cut-management) — coeficientes, agregação e seleção de cortes
- [Formulação da taxa de desconto](/math/discount-rate) — o fator de desconto de um passo, que é o coeficiente de $\theta$
- [Aproveitamento de base do PL](/math/lp-warm-start) — aproveitamento de base entre as resoluções do PL do estágio
- [Convenções de notação](/overview/notation-conventions) — símbolos e a ordem canônica das entidades
