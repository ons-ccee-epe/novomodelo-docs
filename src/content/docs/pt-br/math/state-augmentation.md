---
title: "Aumento do espaço de estados"
description: O estado que o PL do estágio transporta entre estágios — o vetor de estado e sua fixação por limites de coluna, o estado de saída e a linha de corte, as famílias de estado de tendência hidrológica, do anel de despacho antecipado e de água em trânsito, e a projeção dos cortes sobre o estado.
---

## Objetivo

Este capítulo define o estado que o PL do estágio transporta de um estágio para o seguinte: o vetor de estado e suas quatro famílias, a fixação do estado de entrada por limites de coluna, o estado de saída e a linha de corte escrita sobre ele, a mecânica das famílias além do armazenamento — as defasagens de afluência, os compromissos de despacho das termelétricas com antecipação de despacho e a água em trânsito nos trechos com tempo de viagem — e a projeção dos cortes de cada estágio sobre as componentes de estado que ele seleciona.

**Ordem de leitura**: [Formulação do PL](/math/lp-formulation) → **este capítulo** → [Variantes de formulação dos patamares](/math/block-formulations)

Para a visão por entidade deste capítulo, veja [Usinas hidrelétricas](/entities/generation/hydro-plants/) e [Usinas termelétricas](/entities/generation/thermal-plants/).

## 1. Vetor de estado

O estado do estágio $t$ é o vetor que o estágio $t$ passa ao estágio $t + 1$ e sobre o qual os cortes do estágio $t$ são escritos. Ele tem quatro famílias:

- armazenamento: o volume armazenado ao final do estágio em cada usina hidrelétrica (§2);
- defasagens de afluência: $P^{\max}$ afluências defasadas por usina hidrelétrica (§4);
- parcelas de água em trânsito (in-transit buckets): a água ainda em deslocamento nos trechos com tempo de viagem que chegam a cada usina receptora, uma parcela de água em trânsito por defasagem de maturação (§6);
- posições do anel de despacho antecipado (commitment ring slots): os compromissos de despacho já decididos e ainda não entregues de cada termelétrica com antecipação de despacho, $k_{max}$ posições por usina (§5).

Com $N = \lvert\mathcal{H}\rvert$ usinas hidrelétricas, $B$ parcelas de água em trânsito e $A$ termelétricas com antecipação, a dimensão do estado é

$$
n_{\text{state}} = N(1 + P^{\max}) + B + A \, k_{max}
$$

O estado é ordenado canonicamente: armazenamento, defasagens de afluência, parcelas de água em trânsito, posições do anel de despacho antecipado e, dentro de cada família, as usinas hidrelétricas, usinas receptoras ou termelétricas com antecipação na ordem canônica de entidades de [Convenções de notação](/overview/notation-conventions) (defasagem como índice externo para as defasagens, posição como índice externo para as posições do anel de despacho antecipado). Cada estágio fixa seu armazenamento, suas parcelas de água em trânsito e suas posições do anel de entrada por limites de coluna (§2) e toma suas defasagens de afluência de entrada como números da resolução (§4), e cada corte de um estágio é uma linha sobre o estado de saída do estágio (§3).

## 2. Fixação por limites de coluna

O balanço hídrico ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)), os hiperplanos da FPHA ([Formulação do PL §6](/math/lp-formulation#6-restricoes-de-geracao-hidreletrica)), a linha de evaporação ([Formulação do PL — Linha de evaporação](/math/lp-formulation#linha-de-evaporacao)) e as restrições genéricas ([Formulação do PL §10](/math/lp-formulation#10-restricoes-genericas)) envolvem o valor de armazenamento de entrada $\hat{v}_h$. Em vez de incorporar $\hat{v}_h$ como constante no lado direito de cada uma dessas restrições (o que exigiria coletar as variáveis duais de todas elas para calcular os coeficientes do corte), o Novo Modelo introduz uma **variável de PL explícita de armazenamento de entrada** $v^{in}_h$, referenciada por todas essas restrições, e a **fixa** no valor do estado visitado.

Para cada usina hidrelétrica $h \in \mathcal{H}$, a coluna de armazenamento de entrada ([Estrutura e escalonamento do PL §1](/math/lp-layout-and-scaling#1-estrutura-de-colunas-e-linhas)) é fixada atribuindo-se **limites de coluna** inferior e superior iguais:

$$
\underline{v}^{in}_h = \bar{v}^{in}_h = \hat{v}_h
$$

onde:

- $v^{in}_h$ = variável do PL que representa o armazenamento de entrada da usina $h$
- $\hat{v}_h$ = valor do estado de entrada (armazenamento ao final do estágio anterior)

:::note[Fixação por limites, e não por linha]
O estado de entrada é fixado por **limites de coluna**, e não por uma _linha de restrição_ explícita de igualdade $v^{in}_h = \hat{v}_h$ cuja variável dual seria lida: o PL não tem essa linha ([Estrutura e escalonamento do PL §1](/math/lp-layout-and-scaling#1-estrutura-de-colunas-e-linhas)). A fixação por limites mantém fora do modelo $N$ linhas de igualdade redundantes por estágio (mais uma por parcela de água em trânsito e por posição do anel de despacho antecipado, §6, §5); as duas formulações são equivalentes pelas condições KKT — ver abaixo.
:::

**Coeficiente do corte**: o coeficiente de armazenamento do corte $\beta^v_h$ é o **custo reduzido** da coluna fixada de armazenamento de entrada (desescalonado pelo fator de coluna do pré-escalonador — ver [Estrutura e escalonamento do PL §2](/math/lp-layout-and-scaling#2-escalonamento-do-pl) e [Gerenciamento de cortes](/math/cut-management)). Nenhuma variável dual de restrição de fixação está envolvida.

**Por que este projeto**: Pela dualidade em PL, quando uma coluna é fixada em $\underline{x} = \bar{x}$, seu custo reduzido é um subgradiente do valor ótimo em relação ao limite fixado — a sensibilidade $\partial Q_t / \partial \hat{v}_h$ onde essa derivada existe ([Gerenciamento de cortes §2](/math/cut-management#2-extracao-pelos-custos-reduzidos)) — e exatamente o multiplicador que a linha de igualdade equivalente $v^{in}_h = \hat{v}_h$ teria (paridade KKT). Essa sensibilidade incorpora automaticamente todos os efeitos a jusante via balanço hídrico, FPHA, evaporação e restrições genéricas, de modo que um único valor de custo reduzido basta — não é necessário combinar variáveis duais de vários tipos de restrição. As parcelas de água em trânsito (§6) e as posições do anel de despacho antecipado (§5) são fixadas da mesma forma. As defasagens de afluência seguem o outro caminho: entram na afluência realizada, uma constante do lado direito, e seus coeficientes de corte são formados a partir dos duais das linhas que a leem (§4).

**Número de colunas**: $N$ colunas fixadas de armazenamento de entrada, onde $N = |\mathcal{H}|$ é o número de usinas hidrelétricas, qualquer que seja a fase do ciclo de vida. Não há linhas de fixação de estado: toda coluna de estado de entrada é fixada por seus limites.

## 3. Estado de saída e a linha de corte

Em um estágio que completa um período de defasagem próprio — como ocorre com todo estágio de um estudo uniforme de resolução única com [mapa de períodos sazonais](/math/multi-resolution-studies#1-mapa-de-periodos-sazonais), exceto as 52ª e 53ª semanas de um ano de 53 semanas sob ciclo semanal —, o estado de saída do estágio $t$ é o vetor que o estágio $t+1$ fixa como seu estado de entrada. Um estágio que compartilha um período de defasagem repassa suas defasagens inalteradas até que o período se complete ([Estudos com múltiplas resoluções §2](/math/multi-resolution-studies#2-acumulacao-das-defasagens)) e, em uma mudança de resolução, o estado de defasagens é reconstruído a partir dos períodos grossos completados ([Estudos com múltiplas resoluções §3](/math/multi-resolution-studies#3-mudanca-de-resolucao)).

O estado de saída é composto pelo armazenamento de saída $v_h$; pelas defasagens de afluência de saída $(\hat{z}_h, \hat{a}_{h,1}, \ldots, \hat{a}_{h,P^{\max}-1})$, números conhecidos antes da resolução ([Formulação do PL §5](/math/lp-formulation#5-afluencia-realizada)), nas quais a afluência realizada torna-se a defasagem 1, cada defasagem de entrada $\hat{a}_{h,\ell}$ com $\ell < P^{\max}$ torna-se a defasagem $\ell + 1$, e $\hat{a}_{h,P^{\max}}$ sai do estado; pelas parcelas de água em trânsito de saída $b^{\mathrm{out}}_{h,d}$; e pelas posições do anel de despacho antecipado de saída $x^{\mathrm{a}}_{s,i}$. O estágio $t+1$ fixa cada coluna de entrada no valor da coluna de saída correspondente na solução do estágio $t$, canonizado sobre seus limites ([Algoritmo da PDDE §3.1](/math/sddp-algorithm#31-simulacao-forward)), e toma as defasagens de afluência de saída como suas defasagens de entrada.

| Família de estado  | Coluna de saída                                      | Coluna de entrada fixada no estágio seguinte |
| ------------------ | ---------------------------------------------------- | ---------------------------------------- |
| Armazenamento      | $v_h$                                                | $v^{in}_h$                               |
| Defasagens de afluência | nenhuma: $\hat{z}_h$ (defasagem 1) e $\hat{a}_{h,\ell-1}$ (defasagem $\ell \ge 2$) | nenhuma: $\hat{a}_{h,\ell}$ |
| Parcelas de água em trânsito | $b^{\mathrm{out}}_{h,d}$                             | $b^{\mathrm{in}}_{h,d}$                  |
| Posições do anel de despacho antecipado | $x^{\mathrm{a}}_{s,i}$                               | $x^{\mathrm{a,in}}_{s,i}$                |

Cada corte do estágio $t$ é uma linha sobre as colunas de saída, com seus termos de defasagem de afluência avaliados nas defasagens de saída, no lado direito:

$$
\theta - \sum_{h \in \mathcal{H}} \beta^v_h \, v_h - \cdots \ge \beta_0 + \sum_{h \in \mathcal{H}} \Big( \beta^{lag}_{h,1} \, \hat{z}_h + \sum_{\ell=2}^{P^{\max}} \beta^{lag}_{h,\ell} \, \hat{a}_{h,\ell-1} \Big)
$$

onde $\cdots$ representa os termos das parcelas de água em trânsito e das posições do anel de despacho antecipado, cada coeficiente sobre sua coluna de saída por identidade. Cada coeficiente de armazenamento, de parcela de água em trânsito e de posição do anel é o custo reduzido da coluna de entrada fixada correspondente do estágio $t+1$, desescalonado ([Estrutura e escalonamento do PL §2](/math/lp-layout-and-scaling#2-escalonamento-do-pl)). O coeficiente de defasagem $\beta^{lag}_{h,\ell}$ precifica a defasagem $\ell$ do estado de entrada do estágio seguinte, de modo que, em relação às defasagens de entrada do estágio $t$, os termos de defasagem são reindexados em um estágio; ele vem dos duais do estágio $t+1$ pela regra da cadeia (§4). Uma componente de armazenamento ou de defasagem descartada pela projeção de estado do corte não tem termo ([§7](#7-projecao-de-estado-do-corte)).

A linha acima é a forma em um estágio que completa um período de defasagem que começa nele. Onde um período de defasagem abrange vários estágios, os termos de defasagem avaliam as defasagens de saída de [Estudos com múltiplas resoluções §2.1](/math/multi-resolution-studies#21-as-defasagens-que-os-cortes-leem): em um estágio que deixa seu período aberto, os termos são $\sum_{\ell=1}^{P^{\max}} \beta^{lag}_{h,\ell} \, \hat{a}_{h,\ell}$, sem reindexação, e, em um estágio que completa um período iniciado antes, a defasagem 1 é a média do período ponderada pela duração, no lugar de $\hat{z}_h$.

## 4. Defasagens de afluência

O modelo PAR(p) ([Formulação do PL §5](/math/lp-formulation#5-afluencia-realizada)) lê as afluências defasadas de cada usina. Para manter a propriedade de Markov na decomposição da PDDE, as defasagens fazem parte do estado: as defasagens de entrada de um estágio são seus valores visitados, conhecidos antes da resolução. Ao contrário das demais famílias, elas não têm coluna no PL. A afluência realizada calculada a partir delas entra nas linhas que a leem como constante do lado direito, e os termos de defasagem de cada linha de corte são avaliados nelas, no lado direito ([Formulação do PL §11](/math/lp-formulation#11-cortes-de-benders)). Se as dimensões de defasagem entram ou não no corte é definido pela projeção de estado do corte, configurada pelo estágio sucessor: quando ele projeta fora as defasagens de afluência, as defasagens continuam a dar a afluência realizada, mas o corte não tem coeficiente de defasagem, resultando em um corte somente de armazenamento mesmo com um ajuste PAR($p$) — ver [§7](#7-projecao-de-estado-do-corte).

O estado de entrada de cada usina hidrelétrica $h \in \mathcal{H}$ contém uma defasagem $\hat{a}_{h,\ell}$ para cada $\ell \in \{1, \ldots, P^{\max}\}$, onde:

- $\hat{a}_{h,\ell}$ = valor do estado de entrada: a afluência do $\ell$-ésimo período de defasagem completado mais recentemente ([Estudos com múltiplas resoluções §2](/math/multi-resolution-studies#2-acumulacao-das-defasagens)); um período de defasagem só se completa sob um [mapa de períodos sazonais](/math/multi-resolution-studies#1-mapa-de-periodos-sazonais), de modo que, sem ele, nenhum período se completa e as defasagens mantêm seus valores iniciais
- $P^{\max}$ = a profundidade de defasagens do estado, a mesma para todas as usinas: a maior ordem do modelo AR, no mínimo doze quando alguma usina tem a componente anual, e ampliada conforme descrito abaixo quando uma fronteira terminal é carregada

**Número de componentes de estado**: $N \times P^{\max}$ componentes de defasagem, onde $N = |\mathcal{H}|$ é o número de usinas hidrelétricas, qualquer que seja a fase do ciclo de vida, e $P^{\max}$ é a profundidade de defasagens do estado definida acima. Todas as usinas armazenam $P^{\max}$ defasagens, independentemente de sua ordem AR individual $P_h$; uma usina cujo modelo de afluências não tem componente anual lê apenas suas primeiras $P_h$ defasagens, de modo que seus coeficientes $\psi_{m(t),\ell}$ são $0$ para $\ell > P_h$, enquanto uma usina com a componente anual ([Modelo de afluências PAR(p) §7](/math/par-inflow-model#7-extensao-com-componente-anual-parp-a)) lê todos os slots.

Os slots de defasagem que uma usina não lê são estruturalmente nulos, como uma posição do anel de despacho antecipado que nenhum estágio ocupa; com uma fronteira terminal carregada, o corte mantém os slots de cada usina até a profundidade da fronteira, a defasagem mais profunda referenciada por algum corte de fronteira, até a qual o estado de defasagens é ampliado ([Fronteira pós-estudo e estudos encadeados — Condições de compatibilidade](/math/post-study-boundary#52-condicoes-de-compatibilidade)).

**Coeficiente do corte**: $\beta^{lag}_{h,\ell}$ (valor marginal do histórico de afluências na defasagem $\ell$ da usina $h$) é calculado após a resolução pela regra da cadeia, a partir dos duais desescalonados das linhas que leem a afluência realizada e das linhas de corte ([Folding do PAR(p) §4](/math/par-folding#4-os-coeficientes-das-defasagens-pela-regra-da-cadeia)); em aritmética exata, é igual ao custo reduzido da coluna de defasagem fixada da formulação que escreve o modelo PAR(p) como linhas do PL ([Folding do PAR(p) §5](/math/par-folding#5-exatidao-e-limites)) — ver [Gerenciamento de cortes](/math/cut-management).

## 5. Compromissos de despacho das termelétricas com antecipação

Uma usina termelétrica com antecipação de despacho decide o compromisso de cada entrega antes de seu estágio de entrega e mantém todo compromisso decidido e ainda não entregue como estado em um anel de despacho antecipado por usina (ver [Visão geral da modelagem dos elementos do sistema §4](/math/system-elements#usinas-termeletricas-com-antecipacao-de-despacho)). Sua antecedência é um número de estágios ou um tempo físico de antecedência. O estágio de decisão da entrega no estágio $m$ é $t_i(m) = m - K_i$ para antecedência em número de estágios; para antecedência física, é o estágio que contém o instante situado uma antecedência antes do fim do estágio $m$, onde um instante sobre a fronteira entre estágios pertence ao estágio anterior. Uma entrega cuja decisão cai antes do estudo ($m \leq K_i$ com antecedência em número de estágios; um instante igual ou anterior ao início do estudo com antecedência física) é decidida antes do estudo e não tem estágio de decisão. Uma entrega com $t_i(m) = m$ não é antecipada: nesse estágio, a usina é despachada como uma termelétrica comum. Todo compromisso é limitado, custeado e condicionado à entrada em operação no seu estágio de entrega, e não no seu estágio de decisão. Representar como estado dos subproblemas dos estágios o despacho decidido estágios antes de sua entrega segue a decomposição de Benders com múltiplas defasagens (multi-lag) de [Diniz & Maceira (2013)](/reference/bibliography/#aumento-do-espaco-de-estados).

### Hold ring

A profundidade do ring $K_i$ da usina $i$ é a antecedência, quando esta é dada em número de estágios; para antecedência física, é o maior número de compromissos que o ring da usina retém no início de qualquer estágio, incluído o primeiro estágio após o estudo, contando as entregas nesse estágio ou depois dele cujo compromisso foi decidido em um estágio anterior, sendo as entregas decididas antes do estudo retidas a partir do primeiro estágio. Todo ring tem $k_{max} = \max_i K_i$ posições, rotuladas pelos resíduos $s \in \{0, \ldots, k_{max} - 1\}$.

A posição no ring $r_i(m)$ da entrega no estágio $m$ é $m$ nos estágios do estudo. Além do horizonte, as entregas da usina decididas antes do estudo vêm primeiro e não ocupam posição no ring (são compromissos fixos, ver [Fronteira pós-estudo e estudos encadeados](/math/post-study-boundary)), e $r_i$ continua a partir de $T + 1$ sobre as entregas posteriores. A entrega no estágio $m$ ocupa a posição $s_i(m) = r_i(m) \bmod k_{max}$, de modo que a posição que vence no estágio do estudo $t$ é $t \bmod k_{max}$.

Cada posição corresponde a duas colunas do PL: a posição de saída $x^{\mathrm{a}}_{s,i}$, o estado transportado ao estágio seguinte, e a posição de entrada $x^{\mathrm{a,in}}_{s,i}$, fixada por limites de coluna iguais em seu valor do estado visitado, como todo estado de entrada (§2):

$$
\underline{x}^{\mathrm{a,in}}_{s,i} = \bar{x}^{\mathrm{a,in}}_{s,i} = \hat{x}^{\mathrm{a}}_{s,i}
$$

O valor do estado visitado é a posição de saída do estágio anterior. No primeiro estágio, é a potência comprometida da entrega, decidida antes do estudo, que a posição contém (ver [Visão geral da modelagem dos elementos do sistema §4](/math/system-elements#usinas-termeletricas-com-antecipacao-de-despacho)), e $0$ em uma posição que não contém nenhuma.

### Linhas do ring

No estágio $t$, três famílias de linhas de igualdade acoplam o ring da usina $i$ à sua decisão e à sua geração. A linha de **depósito** grava o compromisso decidido no estágio $t$ na posição de sua entrega:

$$
x^{\mathrm{a}}_{s_i(m),i} - g^{\mathrm{a}}_{i,t} = 0
$$

para a entrega $m > t$ com $t_i(m) = t$, quando $m$ está dentro do estudo ou do calendário pós-estudo declarado e a usina está em operação no estágio $m$. A linha de **transporte** mantém um compromisso decidido em sua posição:

$$
x^{\mathrm{a}}_{s_i(m),i} - x^{\mathrm{a,in}}_{s_i(m),i} = 0
$$

para toda entrega $m > t$ no ring, decidida em um estágio anterior ou antes do estudo, que esteja dentro desse calendário. A linha de **retirada** (entrega) vincula a geração do estágio ao compromisso que vence nele:

$$
\sum_{k \in \mathcal{K}} \tau_k \, g_{i,k} - H_t \, x^{\mathrm{a,in}}_{s_i(t),i} = 0
$$

em todo estágio do estudo $t$ cuja entrega foi decidida em um estágio anterior ou antes do estudo, esteja ou não a usina em operação nele; $\tau_k$ é a duração do patamar $k$ e $H_t = \sum_{k \in \mathcal{K}} \tau_k$.

Um compromisso ocupa uma única posição desde sua linha de depósito até sua entrega. Uma posição de saída que nenhuma linha de depósito ou de transporte ocupa no estágio é congelada em $0$ por seus limites, e toda posição ocupada é livre em sinal. A coluna de decisão $g^{\mathrm{a}}_{i,t}$ da entrega $m$ com $t_i(m) = t$ está em $[\underline{G}_i(m), \bar{G}_i(m)]$, os limites de geração da usina no estágio de entrega dentro do estudo ou sua capacidade pós-estudo declarada além dele ($0$ onde nada é declarado), e é fixada em $0$ quando a linha de depósito está ausente; uma entrega para um estágio em que a usina não está em operação, portanto, vence como $0$ e, dentro do estudo, sua linha de retirada fixa em $0$ a geração desse estágio. Uma entrega além do horizonte decidida pelo estudo é transportada, nunca retirada, para o estado de saída do estágio terminal, onde a fronteira terminal a precifica (ver [Fronteira pós-estudo e estudos encadeados](/math/post-study-boundary)). Uma usina tem no máximo uma linha de depósito por estágio, e a coluna de decisão entra no ring somente por meio dela.

### Contribuições à função objetivo

A coluna de decisão de uma usina com antecipação entra na função objetivo do estágio $t$ com o termo

$$
c_i(m) \, H_m \, d_{t \to m} \, g^{\mathrm{a}}_{i,t}, \qquad d_{t \to m} = d_{1 \to m} / d_{1 \to t}
$$

para o compromisso que a usina decide no estágio $t$ para seu estágio de entrega $m$, $t_i(m) = t$. Aqui, $c_i(m)$ é o custo unitário da usina no estágio de entrega (o custo do estágio de entrega dentro do estudo, o custo pós-estudo declarado além dele), $H_m$ é o número de horas do estágio de entrega (a duração declarada de um estágio pós-estudo além do horizonte) e $d_{t \to m}$ é o desconto do estágio de entrega de volta ao estágio de decisão ([Formulação da taxa de desconto §5](/math/discount-rate#5-desconto-acumulado)). Como todo coeficiente da função objetivo exceto o de $\theta$, o termo é escalonado conforme [Estrutura e escalonamento do PL §2.1](/math/lp-layout-and-scaling#21-escalonamento-de-custos). O fator de um passo sobre $\theta$ em cada estágio leva um custo lançado no estágio $t$ ao estágio 1 multiplicado por $d_{1 \to t}$, de modo que o custo do compromisso chega ao estágio 1 como $c_i(m) H_m d_{1 \to m}$, descontado exatamente uma vez ([Formulação da taxa de desconto](/math/discount-rate#consistencia-com-a-recursao-de-bellman)).

A geração por patamar da usina não tem custo em um estágio em que sua entrega é retirada, de modo que a energia de um compromisso é precificada uma única vez, em sua coluna de decisão; em um estágio em que a usina é despachada como termelétrica comum, sua geração é precificada por patamar como a de qualquer termelétrica. As colunas do ring não têm custo.

### Coeficiente de corte das posições do anel de despacho antecipado

O coeficiente da posição $(s, i)$ em um corte do estágio $t$ é o custo reduzido da posição de entrada fixada $x^{\mathrm{a,in}}_{s,i}$ do estágio $t + 1$, desescalonado como todo coeficiente de estado ([Estrutura e escalonamento do PL §2.3](/math/lp-layout-and-scaling#23-escalonamento-de-linhas-media-geometrica)). A linha de corte o multiplica pela posição de saída $x^{\mathrm{a}}_{s,i}$ do estágio $t$, com o mesmo resíduo e a mesma usina: a coluna que a linha de depósito vincula à decisão $g^{\mathrm{a}}_{i,t}$, ou que a linha de transporte vincula à posição de entrada $x^{\mathrm{a,in}}_{s,i}$. Um compromisso ocupa uma única posição desde sua linha de depósito até sua entrega, de modo que o corte precifica essa posição por identidade em cada estágio da retenção, e o valor marginal de um compromisso decidido pelo estudo chega à sua coluna de decisão por meio da linha de depósito de seu estágio de decisão. As posições do anel de despacho antecipado sempre fazem parte da projeção de estado do corte; quais delas têm coeficientes estruturalmente nulos é indicado em [§7](#7-projecao-de-estado-do-corte).

## 6. Tempo de viagem da água

Quando uma defluência a montante leva um tempo apreciável para percorrer a cascata, apenas a parcela $\nu_{h',t,0}$ de uma defluência ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)) chega à usina vizinha a jusante no estágio da defluência, e o restante chega em estágios posteriores. O Novo Modelo modela isso como um **estado aumentado de água em trânsito**: o volume ainda em trânsito em um trecho da cascata é transportado pela recursão de Bellman como coordenadas adicionais de estado, exatamente como o armazenamento (§2) e as defasagens AR (§4).

**Escopo.** Uma usina hidrelétrica $h$ declara um trecho com tempo de viagem quando tem uma usina a jusante e o trecho até ela tem tempo de viagem estritamente positivo; os trechos de desvio e de bombeamento não têm tempo de viagem (somente o trecho principal da cascata). Um tempo de viagem ausente ou nulo corresponde a uma transferência instantânea — a defluência a montante entra no balanço hídrico de jusante no mesmo estágio ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)) e nenhum estado é acrescentado.

### Estado das parcelas de água em trânsito

Para cada usina receptora (de jusante) $h$ que tem pelo menos um trecho de chegada com tempo de viagem, a água em trânsito destinada a $h$ é discretizada em **defasagens de maturação** $d \in \{1, \ldots, L_h\}$. Cada defasagem contém o volume agregado, somado sobre todos os trechos de montante que alimentam $h$, em duas parcelas de água em trânsito (hm³): a parcela de entrada $b^{\mathrm{in}}_{h,d}$ contém o volume que chega ao reservatório da usina $h$ $d - 1$ estágios após o atual, de modo que a defasagem $1$ vence no estágio atual, e a parcela de saída $b^{\mathrm{out}}_{h,d}$ contém o volume que vence $d$ estágios depois dele. A profundidade por usina $L_h$ é a defasagem de maturação mais profunda que algum trecho que chega a $h$ pode atingir no calendário de estágios. A confluência de vários trechos em uma mesma usina reduz-se a esse único bloco agregado de parcelas de água em trânsito.

As parcelas de água em trânsito estendem o vetor de estado (§1), sendo $B = \sum_h L_h$ o número total de parcelas. O bloco de parcelas de água em trânsito fica **após** as defasagens de afluência AR e **antes** das posições do anel de despacho antecipado na ordem canônica do estado (§1). As parcelas são ordenadas canonicamente por $(\text{plant}, \text{lag})$ — a usina receptora na ordem canônica de entidades usada por todos os blocos de estado e, em seguida, a defasagem de maturação crescente. Quando nenhum trecho é declarado, $B = 0$ e o estado não tem bloco de parcelas de água em trânsito.

### Fixação do estado (limites de coluna)

Como o armazenamento de entrada (§2), cada parcela de água em trânsito de entrada é representada por sua própria coluna do PL ([Estrutura e escalonamento do PL §1](/math/lp-layout-and-scaling#1-estrutura-de-colunas-e-linhas)) e fixada em seu valor do estado visitado por **limites de coluna** inferior e superior iguais:

$$
\underline{b}^{\,\mathrm{in}}_{h,d} = \bar{b}^{\,\mathrm{in}}_{h,d} = \hat{b}_{h,d}
$$

onde $\hat{b}_{h,d}$ é o volume de água em trânsito de entrada, a parcela de saída do estágio anterior (ou, no primeiro estágio, o valor inicial derivado das defluências em trânsito declaradas antes do estudo — ver [Visão geral da modelagem dos elementos do sistema — Tempo de viagem na cascata](/math/system-elements#tempo-de-viagem-na-cascata) e [Modelos de função de produção hidrelétrica — Implementação no Novo Modelo](/math/hydro-production-models#implementacao-no-novo-modelo)). O **custo reduzido** da coluna fixada da parcela é o coeficiente do corte para essa dimensão de água em trânsito (ver abaixo) — o mesmo regime usado para o armazenamento (§2) e as posições do anel de despacho antecipado (§5).

### Entrada de chegada defasada no balanço hídrico

A parcela de água em trânsito que vence no estágio atual, $b^{\mathrm{in}}_{h,1}$, entrega seu volume no balanço hídrico da usina receptora $h$ ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)). Como a parcela já é um volume acumulado (hm³), ela entra diretamente no balanço — fora da conversão de vazão em volume $\zeta$ — com coeficiente $-1.0$ na forma com todas as variáveis no lado esquerdo:

$$
v_h - v^{\mathrm{in}}_h - b^{\mathrm{in}}_{h,1} - \zeta\big[\,\cdots\,\big] = 0
$$

De forma equivalente, $b^{\mathrm{in}}_{h,1}$ é uma afluência no nível do estágio acrescentada ao reservatório. Como a confluência de vários trechos de montante já está somada na única coordenada de estado, aparece exatamente uma entrada de chegada defasada por usina receptora.

Na formulação de patamares paralelos, a parcela de água em trânsito que vence é uma única entrada no nível do estágio. Na [formulação de patamares cronológicos](/math/block-formulations), o mesmo volume é entregue ao longo dos próprios patamares do estágio de chegada, ponderado por uma **densidade de chegada** fixa $\phi_{h,k} \ge 0$ com $\sum_k \phi_{h,k} = 1$, resolvida em relação à partição em patamares do estágio de chegada. A densidade de chegada é uma única divisão fixa por parcela que vence — não depende do patamar de origem em que a água foi liberada, uma limitação de modelagem aceita quando os estágios de defluência e de chegada particionam suas horas de forma diferente. Um estágio cronológico que nenhuma defluência dentro do estudo alcança — o primeiro dentre eles — distribui o volume que vence pelos pesos dos patamares, $\phi_{h,k} = w_k$.

Em um trecho com tempo de viagem declarado, a parcela $\nu_{h',t,0}$ de cada defluência ($\nu^{k' \to k}_{h',t}$ em um estágio cronológico) chega à linha de jusante no estágio da defluência ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)); a parcela restante é depositada nas parcelas de água em trânsito no momento da defluência e chega à usina de jusante como este termo de chegada defasada no vencimento.

A entrada pertence ao balanço hídrico da usina receptora em todo estágio em que esse balanço é formado. Em um estágio em que a usina está em pré-enchimento (PreFilling), sua linha é a identidade congelada ([Formulação do PL — Repasse em pré-enchimento](/math/lp-formulation#repasse-em-pre-enchimento)), e a parcela de água em trânsito que vence entra na linha da primeira usina a jusante que não esteja em pré-enchimento: com coeficiente $-1$ em um estágio paralelo, e $-\phi_{h,k}$ em cada linha de patamar de um estágio cronológico, sendo $\phi_{h,k}$ a própria densidade de chegada da usina em pré-enchimento. O volume só deixa o sistema modelado quando não existe tal usina.

### Linhas de definição das parcelas de água em trânsito

Dentro de um estágio, cada defasagem de saída ativa $d$ de uma usina receptora $h$ tem uma linha de definição:

$$
b^{\mathrm{out}}_{h,d} = b^{\mathrm{in}}_{h,d+1} + \text{(deposits into lag } d\text{)}
$$

com $b^{\mathrm{in}}_{h,L_h+1} = 0$: a defasagem mais profunda contém apenas depósitos. A água avança uma defasagem por estágio: a linha move a parcela de entrada da defasagem $d + 1$ para a parcela de saída da defasagem $d$, e a identidade entre estágios transporta a parcela de saída para a parcela de entrada da mesma defasagem no estágio seguinte. Uma defasagem de saída mais profunda que a mais profunda alcançada no estágio, pelas defluências do próprio estágio ou pela água liberada antes do estudo, não tem linha, e sua parcela de saída é fixada em $0$. As parcelas de água em trânsito de saída são colunas do PL e fazem parte de $n_{\text{state}}$.

Cada defluência de montante é registrada nas defasagens de saída que alcança, ponderada pela fração dela que vence em cada defasagem: em um estágio paralelo, essas frações somam $1 - \nu_{h',t,0}$ ([Formulação do PL §4](/math/lp-formulation#4-balanco-hidrico-das-usinas-hidreletricas)); em um estágio cronológico, a soma vale após as parcelas por patamar serem ponderadas pela duração do patamar; uma defasagem que venceria além do horizonte não tem linha quando nenhuma fronteira é carregada, e sua parcela é descartada (Limitação de horizonte, abaixo).

### Coeficiente do corte

Como a coluna de entrada de uma parcela de água em trânsito é fixada com limites iguais, seu custo reduzido é um subgradiente do custo ótimo do estágio em relação ao volume de água em trânsito, a sensibilidade $\partial Q_t / \partial \hat{b}_{h,d}$ onde essa derivada existe, desescalonado pelo pré-escalonador de coluna ([Estrutura e escalonamento do PL §2](/math/lp-layout-and-scaling#2-escalonamento-do-pl)):

$$
\beta^{b}_{h,d} = \bar{c}^{\,b}_{h,d} / d^{col}_{h,d}
$$

As parcelas de água em trânsito estão sempre na projeção do corte, qualquer que seja a seleção do estágio para as dimensões de armazenamento e de defasagem de afluência ([§7](#7-projecao-de-estado-do-corte)). Cada corte, portanto, tem um coeficiente por dimensão de parcela de água em trânsito, contíguo aos coeficientes de armazenamento, de defasagem e de antecipação, e lido, como os coeficientes de armazenamento, dos custos reduzidos das colunas de entrada fixadas ([Formulação do PL §11](/math/lp-formulation#11-cortes-de-benders)).

### Limitação de horizonte

O volume em trânsito que venceria **após o último estágio do estudo** é descartado e não é creditado ao armazenamento terminal — mas somente **quando nenhuma função de custo futuro de fronteira terminal é carregada**. Na ausência de fronteira, uma defluência no final do horizonte cujo tempo de viagem a leva além do estágio final $T$ deixa o sistema modelado sem chegar: a defasagem de maturação mais profunda ativa no estágio $t$ é limitada a $T - t$, de modo que nenhuma parcela de água em trânsito aponta além do horizonte e a parcela é descartada, em vez de ser desviada para uma defasagem anterior. Quando, em vez disso, uma [fronteira terminal](/math/post-study-boundary) é carregada, esse limite é suprimido: as parcelas de água em trânsito terminais de defasagem profunda são mantidas ativas em vez de eliminadas, transportadas no estado de saída do estágio terminal, e alcançam a projeção de estado do corte precificada pela fronteira. A água ainda em trânsito é valorada na fronteira em vez de descartada, precificada pelo mesmo mecanismo de corte por custos reduzidos que as parcelas de água em trânsito já usam (ver Coeficiente do corte, acima).

## 7. Projeção de estado do corte

Um estágio não precisa projetar os cortes que gera sobre o estado completo da §1. Cada estágio seleciona se os cortes que gera contêm as componentes de armazenamento e se contêm as componentes de defasagem de afluência; a seleção define a dimensão desses cortes, e não o estado que o estágio fixa e repassa (§2, §3). Uma componente deixada de fora é **projetada fora** do subgradiente: seu custo reduzido não é lido no corte, e o corte não tem coeficiente para ela. O termo independente $\beta_0$ é o valor ótimo no estado visitado menos os produtos dos coeficientes mantidos pelos respectivos valores no estado visitado, de modo que o termo linear de uma componente projetada fora, em seu valor no estado visitado, é absorvido em $\beta_0$: o corte é um hiperplano suporte de dimensão reduzida da fatia da função de custo futuro que passa pelo estado visitado, e não um corte completo com as coordenadas omitidas preenchidas com zero.

- Com as defasagens de afluência projetadas fora, os $N \times P^{\max}$ coeficientes de defasagem são omitidos, e não zerados, mesmo com um modelo de afluências PAR(p); as defasagens de entrada continuam a dar a afluência realizada (§4). Com as defasagens de afluência mantidas, seus coeficientes pela regra da cadeia entram no corte conforme a §4.
- Com o armazenamento projetado fora, os $N$ coeficientes de armazenamento são omitidos da mesma forma, e o corte abrange as componentes que mantém: as defasagens de afluência, quando mantidas, e as parcelas de água em trânsito e as posições do anel de despacho antecipado, quando o estudo as possui.
- As parcelas de água em trânsito (§6) e as posições do anel de despacho antecipado (§5) são **sempre** projetadas, qualquer que seja a seleção, que alterna apenas as componentes de armazenamento e de defasagem de afluência. Toda posição do anel de despacho antecipado de toda usina com antecipação tem um coeficiente; uma posição que nenhum estágio ocupa tem coeficiente estruturalmente nulo, de modo que a linha de corte só contém entradas para as posições ocupadas por algum estágio.

A dimensão do conjunto de cortes de um estágio é definida pela seleção de seu estágio **sucessor**, já que o conjunto contém os cortes gerados pelo sucessor; o conjunto final, que não tem sucessor, contém o estado completo, qualquer que seja a seleção.

Como uma fronteira é carregada no conjunto final, a seleção de um estudo não altera o que sua fronteira deve conter: uma contrapartida para cada componente de armazenamento e de defasagem de afluência do estado terminal do estudo ([Fronteira pós-estudo e estudos encadeados §5.2](/math/post-study-boundary#52-condicoes-de-compatibilidade), condição (c)), em que o estado de defasagens do estudo se estende até a defasagem mais profunda referenciada por algum conjunto da política de fronteira (condição (d)). Um conjunto cujos cortes projetam fora as defasagens de afluência, como em uma projeção somente de armazenamento, não precifica nenhuma componente de defasagem de afluência e, portanto, só é admitido como fonte de fronteira por um estudo cujo estado terminal não contenha defasagem de afluência. O conjunto final de uma política produzida pelo treinamento (training) contém todas as defasagens de afluência do estado da política, o que estende o estado de defasagens do estudo que a carrega pela condição (d); os conjuntos dessa política que projetam fora as defasagens de afluência são, portanto, recusados como fontes de fronteira sempre que seu estado contém defasagens de afluência.

Um corte que projeta fora uma componente da qual a função de custo futuro depende só tem garantia de ficar abaixo da função de custo futuro na fatia que passa por seu estado visitado; a consequência para o limite inferior está em [Gerenciamento de cortes — condição 4](/math/cut-management#4-validade-dos-cortes), e o caso das defasagens de afluência com um modelo PAR(p) está na nota sobre [projeção de corte somente de armazenamento](/math/cut-management#projecao-dos-cortes-apenas-no-armazenamento). A seleção de cada estágio é definida na [aba Configurar de Gerenciamento de cortes](/math/cut-management#stagesstate_variables--projecao-dos-cortes).

## Referências cruzadas

- [Formulação do PL](/math/lp-formulation) — o PL do estágio que fixa o estado de entrada e cuja linha de corte lê o estado de saída
- [Variantes de formulação dos patamares](/math/block-formulations) — estágios cronológicos e a distribuição de uma parcela de água em trânsito que vence pelos seus patamares
- [Modelo de afluências PAR(p)](/math/par-inflow-model) — o modelo de afluências cujas defasagens o estado transporta
- [Folding do PAR(p)](/math/par-folding) — as defasagens de afluência fora do PL e seus coeficientes de corte pela regra da cadeia
- [Estudos com múltiplas resoluções](/math/multi-resolution-studies) — períodos de defasagem e o estado de defasagens em uma mudança de resolução
- [Visão geral da modelagem dos elementos do sistema](/math/system-elements) — termelétricas com antecipação de despacho e trechos com tempo de viagem como elementos físicos
- [Fronteira pós-estudo e estudos encadeados](/math/post-study-boundary) — a fronteira terminal que precifica o estado de saída do último estágio
- [Formulação da taxa de desconto](/math/discount-rate) — o desconto de entrega do custo do compromisso
- [Estrutura e escalonamento do PL](/math/lp-layout-and-scaling) — o layout de colunas do estado e o desescalonamento de seus custos reduzidos
- [Gerenciamento de cortes](/math/cut-management) — coeficientes, agregação e seleção de cortes
- [Convenções de notação](/overview/notation-conventions) — símbolos e a ordem canônica de entidades
