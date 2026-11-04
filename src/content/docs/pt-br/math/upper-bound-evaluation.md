---
title: Avaliação do limite superior
description: Os mecanismos estatístico (Monte Carlo) e determinístico exato de limite superior, o cálculo do gap normalizado pelo limite inferior, os estimadores das simulações amostral e censitária e a aproximação interna baseada em vértices (SIDP), reservada.
---

## Objetivo

Este capítulo define os mecanismos de limite superior do Novo Modelo: uma visão geral dos limites de uma iteração do treinamento (training) (seção 1), o limite superior determinístico exato de uma simulação forward enumerada e sua forma aninhada sob um CVaR uniforme (seção 2), o cálculo do gap que compara o limite superior da iteração com o limite inferior obtido dos cortes (seção 3) e os estimadores dos esquemas forward amostrados e da simulação pós-treinamento amostral e censitária, com o que cada um estima (seção 4). O apêndice descreve o projeto, reservado, da aproximação interna baseada em vértices (SIDP). O capítulo complementa a aproximação externa (cortes) descrita em [Algoritmo da PDDE](/pt-br/math/sddp-algorithm), fornecendo a metade do par de limites que constitui o certificado de convergência.

Para as convenções de notação (conjuntos de índices, parâmetros, variáveis de decisão, variáveis duais), veja [Convenções de notação](/pt-br/overview/notation-conventions).

:::note[Convenção de símbolos]
Este capítulo usa $d$ para o fator de desconto. Veja [Formulação da taxa de desconto](/pt-br/math/discount-rate).
:::

## 1 Visão geral

A PDDE (SDDP) padrão produz apenas um **limite inferior** $\underline{z}$ do custo ótimo, por meio da aproximação externa (por cortes). Um certificado de convergência exige, adicionalmente, um **limite superior** $\bar{z}$ que feche o [gap de otimalidade](/pt-br/math/stopping-rules#gap-de-otimalidade) entre os dois limites.

O Novo Modelo calcula esse limite superior por iteração por meio de um de dois mecanismos da simulação forward, selecionado pelo modo de amostragem da simulação forward:

- **Limite superior estatístico (Monte Carlo).** Com uma simulação forward amostrada, a média amostral dos custos dos cenários obtidos na iteração, juntamente com a semiamplitude do intervalo de confiança de 95%, estima o custo esperado sob a política. Trata-se de uma estimativa **estatística**: carrega um erro amostral genuíno, que só diminui à medida que mais cenários são sorteados. A seção 4 indica o que ela estima sob cada esquema forward.
- **Limite superior determinístico exato.** Com uma simulação forward enumerada, a esperança ponderada pelas probabilidades sobre todos os caminhos até as folhas enumerados é o custo esperado _exato_ sob a política, sem nenhum erro amostral. Veja a seção 2.

A seção 3 calcula, a cada iteração, o gap entre esse limite superior e o limite inferior obtido dos cortes.

:::note[Objetivos avessos ao risco]
O estimador **estatístico** de Monte Carlo é definido apenas para o objetivo de **valor esperado**: seu intervalo de confiança pressupõe uma média amostral não viesada do custo esperado neutro ao risco, e ele não é um limite superior válido para uma medida avessa ao risco. O limite **exato** enumerado se estende a uma medida avessa ao risco quando essa medida é um CVaR aplicado **uniformemente em todos os estágios**: como a enumeração percorre todos os nós, o limite passa a ser avaliado como uma recursão de risco aninhada e consistente no tempo sobre a árvore de cenários (seção 2.1), e não como uma soma ponderada sobre as folhas, e permanece exato. Para uma medida **variável por estágio**, veja a seção 2 e [Medidas de risco](/pt-br/math/risk-measures). A aproximação interna reservada do apêndice foi projetada para o objetivo de valor esperado sob qualquer modo de amostragem forward: os valores de seus vértices são esperanças sobre os cenários.
:::

Após o treinamento, a **simulação** pós-treinamento executa novamente a política treinada sobre cenários sorteados segundo o esquema de simulação de cada classe, em uma variante **amostral** e uma variante **censitária** (seção 4.5). Esse estimador é um diagnóstico da política final — não faz parte do laço de treinamento por iteração que os mecanismos acima alimentam, e não é consumido por nenhum critério de parada.

O apêndice descreve um projeto reservado que o Novo Modelo não calcula: uma aproximação interna da função de custo futuro baseada em vértices (SIDP).

## 2 Limite superior determinístico exato

Com uma simulação forward **enumerada** — que [percorre deterministicamente todos os nós do grafo da política (policy graph)](/pt-br/math/policy-graphs) em vez de amostrá-lo —, a simulação forward avalia cada caminho até a folha $\ell$ da árvore de cenários exatamente uma vez. Sejam $P(\ell)$ a probabilidade desse caminho e

$$
C(\ell) = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t(\ell)
$$

seu custo total descontado realizado (veja [Formulação da taxa de desconto](/pt-br/math/discount-rate)). O limite superior exato é a esperança ponderada pelas probabilidades sobre a enumeração completa:

$$
\bar{z}_{\text{exact}} = \sum_{\ell} P(\ell)\, C(\ell)
$$

Como a enumeração é exaustiva, e não amostrada, $\bar{z}_{\text{exact}}$ é a esperança exata do custo total sob a política atual — e não uma estimativa dela. Consequentemente, seu desvio-padrão e a semiamplitude do intervalo de confiança de 95% são **identicamente nulos**: uma enumeração sem duplicatas não carrega nenhuma distribuição amostral sobre a qual estimar dispersão.

Com uma fronteira terminal importada ([Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary)), o custo do último estágio $c_T(\ell)$ inclui o valor de fronteira descontado do estado de saída desse estágio, de modo que o limite superior contém a mesma função terminal que o limite inferior.

O limite $\bar{z}_{\text{exact}} = \sum_{\ell} P(\ell)\, C(\ell)$ acima é o limite superior exato sob um objetivo de **valor esperado**. Sob uma medida CVaR mantida uniforme em todos os estágios, a mesma enumeração exaustiva produz um limite exato de forma diferente — uma recursão de risco aninhada —, desenvolvido na seção 2.1; veja [Medidas de risco](/pt-br/math/risk-measures) para os fundamentos sobre medidas de risco.

Sob uma medida **variável por estágio** — aquela cujo peso de aversão ao risco ou fração da cauda difere entre estágios, sendo um estágio com peso de aversão ao risco nulo contado como valor esperado —, o Novo Modelo não calcula nenhum limite para o objetivo avesso ao risco: a simulação enumerada reporta a soma ponderada pelas probabilidades dos caminhos $\sum_{\ell} P(\ell)\, C(\ell)$ acima, que é o custo esperado da política, e um critério baseado no gap não é admitido (é rejeitado na preparação do estudo).

Compare com o mecanismo estatístico (seção 1): uma simulação forward amostrada calcula a mesma _forma_ de soma ponderada — peso amostral $1/M$ por cenário —, mas essa soma é um estimador de Monte Carlo da esperança, com erro amostral genuíno. Somente os pesos da simulação forward enumerada (as verdadeiras probabilidades dos caminhos até as folhas) tornam a soma exata, e não uma estimativa.

Este é o mecanismo por iteração da **fase de treinamento**: é avaliado uma vez a cada iteração do treinamento e alimenta o cálculo do gap (seção 3). É distinto da variante censitária da simulação pós-treinamento (seção 4.5.4), que calcula a mesma forma de soma ponderada pelas probabilidades sob a política final, avaliada uma única vez após a conclusão do treinamento.

### 2.1 Limite exato aninhado ajustado ao risco (CVaR uniforme)

Quando todos os estágios aplicam a **mesma** medida CVaR $\rho = (1-\lambda)\,\mathbb{E} + \lambda\,\mathrm{CVaR}_\alpha$, a soma ponderada dos caminhos da seção 2 deixa de ser a grandeza que a política otimiza. A PDDE minimiza um funcional de risco **aninhado** e consistente no tempo,

$$
\rho\big[\,c_1 + \rho[\,c_2 + \cdots + \rho[\,c_T\,]\,]\,\big],
$$

no qual a medida é aplicada estágio a estágio, e não uma única vez sobre os totais dos caminhos completos. O limite superior exato deve ser avaliado nessa mesma forma aninhada. Sobre a árvore de cenários enumerada, seja $c(n)$ o custo imediato do nó $n$ no estágio $\mathrm{stage}(n)$, com filhos $\mathrm{ch}(n)$ alcançados com probabilidades condicionais $q_{n \to n'}$. Define-se, das folhas para a raiz,

$$
\tilde{V}(n) = d_{1 \to \mathrm{stage}(n)}\, c(n) \;+\; \rho_{\,n' \in \mathrm{ch}(n)}\!\big[\,\tilde{V}(n')\,\big],
\qquad
\tilde{V}(\ell) = d_{1 \to T}\, c(\ell)\ \ \text{at a leaf},
$$

em que $\rho_{\,n' \in \mathrm{ch}(n)}[\cdot]$ aplica a medida do estágio aos valores dos filhos ponderados por $q_{n \to n'}$ — a mesma agregação de risco que a [construção dos cortes](/pt-br/math/cut-management) aplica na simulação backward. O limite superior exato é o valor na raiz:

$$
\bar{z}_{\text{exact}} = \tilde{V}(\text{root}).
$$

Ele é exato pela mesma razão que a forma de valor esperado — a recursão percorre cada nó da enumeração sem duplicatas exatamente uma vez, de modo que não carrega nenhuma distribuição amostral, e seu desvio-padrão e a semiamplitude do intervalo de confiança são identicamente nulos.

**Por que a forma aninhada, e não a forma sobre o total dos caminhos.** Aplicar $\rho$ uma única vez à distribuição dos totais dos caminhos completos $C(\ell)$ fornece o valor de fim de horizonte $\rho_{\text{end-of-horizon}}$ dos totais dos caminhos, um funcional diferente do objetivo aninhado $\rho_{\text{nested}}$: não é um limite superior do objetivo aninhado e pode ficar abaixo do limite inferior $\underline{z}$ do [objetivo avesso ao risco](/pt-br/math/risk-measures). Fornecido ao [critério do gap](/pt-br/math/stopping-rules), produziria então um gap negativo, que o critério interpretaria como cruzamento entre os limites inferior e superior, interrompendo o treinamento antes da convergência da política. Já o $\tilde{V}(\text{root})$ aninhado satisfaz $\tilde{V}(\text{root}) \ge V^\star$, o valor ótimo aninhado, e $V^\star \ge \underline{z}$ em toda iteração em que o limite inferior é válido ([Camada 1](/pt-br/math/cut-management#camada-1-limite-inferior-valido)), de modo que o gap permanece não negativo e só se fecha na convergência verdadeira.

Sob valor esperado — ou um CVaR com $\lambda = 0$, equivalente ao valor esperado —, a medida é linear, o aninhamento se telescopa e $\tilde{V}(\text{root})$ se reduz exatamente à soma ponderada dos caminhos $\sum_{\ell} P(\ell)\, C(\ell)$ da seção 2; as duas formas coincidem.

## 3 Gap

A cada iteração $k$ do treinamento, o gap compara o limite inferior obtido dos cortes com o limite superior do mecanismo de simulação forward ativo; ambos se referem ao estudo iniciado em seu estado inicial $x_0$, com os estágios numerados pela [convenção matemática a partir de 1](/pt-br/overview/notation-conventions#indexacao-dos-estagios).

### Limite inferior

O limite inferior na iteração $k$ aplica a medida de risco do primeiro estágio aos valores ótimos do primeiro estágio sobre suas aberturas:

$$
\underline{z}^k = \rho_1\Big[\, Q_1^k(x_0, \omega) \;\Big|\; \omega \in \Omega_1 \Big]
$$

em que $Q_1^k(x_0, \omega)$ é o valor ótimo do problema do primeiro estágio no estado inicial $x_0$ sob a abertura $\omega$ — seu custo imediato mais o custo futuro descontado que os cortes da iteração $k$ limitam inferiormente —, com a realização completa da abertura aplicada: afluência, carga e disponibilidade das fontes não despacháveis. $\Omega_1$ é o conjunto de aberturas do primeiro estágio — suas aberturas geradas ou uma única realização fornecida —, e suas aberturas têm pesos uniformes. $\rho_1$ é a medida de risco do primeiro estágio, o valor esperado quando neutro ao risco; ela agrega tanto as aberturas do próprio primeiro estágio quanto as do estágio seguinte ([Medidas de risco §6](/pt-br/math/risk-measures#6-equacao-de-bellman-avessa-ao-risco)). O limite é expresso nas unidades de custo originais, com o [escalonamento de custos](/pt-br/math/lp-layout-and-scaling#21-escalonamento-de-custos) dos problemas de estágio desfeito. Ele não decresce em $k$, pois o problema em que é avaliado mantém todos os cortes já adicionados ([Gerenciamento de cortes §5](/pt-br/math/cut-management#5-crescimento-dos-cortes-e-motivacao-para-a-selecao)), e é um limite inferior válido sob as hipóteses da [Camada 1](/pt-br/math/cut-management#camada-1-limite-inferior-valido).

### Limite superior

O limite superior é o do mecanismo de simulação forward que estiver ativo (seção 1): com uma simulação forward amostrada, $\bar{z}^k$ é a média amostral do estimador estatístico; com uma simulação forward enumerada, $\bar{z}^k = \bar{z}_{\text{exact}}$ (seção 2).

:::note[Mecanismo reservado]
Com a aproximação interna reservada baseada em vértices ([Apêndice: Aproximação interna (reservada)](#apendice-aproximacao-interna-reservada)), o limite superior do estágio 1 seria, em vez disso, o valor ajustado ao risco do primeiro estágio sobre suas aberturas no estado inicial $x_0$, com a aproximação interna $\bar{V}_2$ no lugar dos cortes. O gap independe de qual mecanismo fornece $\bar{z}^k$.
:::

### Gap

O [gap de otimalidade](/pt-br/math/stopping-rules#gap-de-otimalidade) $\text{gap}^k$ é a distância entre esses dois limites, também expressa em percentual do limite inferior.

Com o mecanismo exato, o limite comparado é $\bar{z}^k = \bar{z}_{\text{exact}}$. A desigualdade $\bar{z}^k \ge \underline{z}^k$ vale para o limite superior exato sobre a mesma árvore e sob a mesma medida quando a [Camada 1](/pt-br/math/cut-management#camada-1-limite-inferior-valido) é satisfeita ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)), ao passo que uma estimativa dentro da amostra (in-sample), fora da amostra (out-of-sample), histórica ou externa pode ficar abaixo de $\underline{z}^k$.

Para os critérios de parada que usam o gap, veja [Critérios de parada](/pt-br/math/stopping-rules), seção 5.

### Convergência

Quando $k \to \infty$, $\text{gap}^k \to 0$ para problemas convexos com número finito de cenários, desde que o limite superior seja exato. Com uma simulação forward amostrada, $\bar{z}^k$ carrega erro amostral, de modo que um gap reportado pequeno reflete esse ruído além da convergência genuína.

## 4 Estimadores por esquema

Uma simulação forward amostrada sorteia cada classe estocástica (afluência, carga e fontes não despacháveis) segundo o esquema forward dessa classe, e a simulação pós-treinamento da seção 4.5 sorteia segundo um esquema próprio para cada classe; [Geração de cenários §3.2](/pt-br/math/scenario-generation#32-esquemas-de-amostragem-forward) define como cada esquema amostra. A média amostral dos custos descontados dos caminhos estima o custo esperado da política sob a lei de probabilidade da qual o esquema amostra, indicada abaixo para cada esquema. Sob uma medida avessa ao risco, ela estima o custo esperado, e não o valor ajustado ao risco (seção 1).

### 4.1 Dentro da amostra

O esquema dentro da amostra (in-sample) sorteia, em cada estágio, uma abertura da árvore de aberturas fixa que a simulação backward também utiliza. Sua média amostral estima o custo esperado da política sob a lei da árvore de aberturas, a lei do modelo sobre o qual os cortes são construídos. É uma estimativa estatística que nada certifica ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)): seu erro amostral permite que fique abaixo de $\underline{z}^k$. Uma simulação enumerada sobre a mesma árvore é o limite exato da seção 2, e não uma estimativa.

### 4.2 Fora da amostra

O esquema fora da amostra (out-of-sample) sorteia ruídos novos do modelo estocástico aplicado à classe, a partir de uma semente independente da semente da árvore de aberturas. Sua média amostral estima o custo esperado da política sob a lei do modelo de ruído, com sorteios independentes da árvore, e não sob a árvore que discretiza essa lei para a simulação backward. É uma estimativa estatística que nada certifica ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)): avalia uma lei diferente da lei da árvore de aberturas e pode ficar abaixo de $\underline{z}^k$.

### 4.3 Externo

O esquema externo reproduz um cenário de um conjunto de cenários fornecido ao longo de todos os estágios de uma trajetória. Sua média amostral estima o custo esperado da política sob a lei dos cenários fornecidos, a lei empírica desse conjunto. É uma estimativa estatística que nada certifica ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)): avalia uma lei diferente da lei da árvore de aberturas e pode ficar abaixo de $\underline{z}^k$.

### 4.4 Histórico

O esquema histórico reproduz uma janela do conjunto de janelas históricas ao longo de todos os estágios de uma trajetória. Sua média amostral estima o custo esperado da política sob o histórico reproduzido, a lei empírica das janelas do conjunto. É uma estimativa estatística que nada certifica ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)): avalia uma lei diferente da lei da árvore de aberturas e pode ficar abaixo de $\underline{z}^k$.

### 4.5 Simulação após o treinamento

O Novo Modelo também pode estimar um limite superior do custo total esperado executando a política treinada sobre cenários sorteados independentemente das simulações forward do treinamento — um procedimento separado, pós-treinamento, distinto dos mecanismos por iteração da fase de treinamento das seções 1–2. Ele admite duas variantes: um estimador **amostral** (Monte Carlo; seções 4.5.2–4.5.3) sobre uma amostra de cenários sorteada de forma independente, e um estimador **censitário** (seção 4.5.4) sobre uma população de cenários enumerada exaustivamente.

#### 4.5.1 Independência em relação ao treinamento

A garantia metodológica central é que o ruído usado na simulação forward da simulação final é sorteado independentemente do ruído usado durante o treinamento. As simulações forward do treinamento amostram segundo o esquema forward de cada classe (veja [Geração de cenários](/pt-br/math/scenario-generation)) para gerar os estados visitados nos quais os cortes são construídos; qualquer custo calculado reexecutando a política sobre esses mesmos cenários do treinamento produziria um estimador **viesado** — os cortes foram moldados para serem justos nesses estados. A simulação evita isso sorteando seus $N$ cenários segundo o esquema de simulação de cada classe (§4.1–§4.4; o esquema do treinamento, a menos que a simulação declare um próprio), com uma derivação de semente que nenhuma iteração do treinamento utiliza. Como os cortes não dependem desses sorteios independentes, a amostra de custos resultante é um estimador não viesado do custo esperado da política sob a lei de seu esquema.

:::note[Ressalva sobre aversão ao risco]
A garantia de ausência de viés se aplica ao estimador do custo esperado sob avaliação neutra ao risco. Para objetivos avessos ao risco, essa distribuição de custos simulada não certifica, por si só, um limite para a medida de risco; o limite exato aninhado da seção 2.1 o faz, sob um CVaR uniforme. Veja [Medidas de risco](/pt-br/math/risk-measures).
:::

#### 4.5.2 Estimador amostral (Monte Carlo)

A variante amostral executa uma simulação forward completa para cada um dos $N$ cenários sorteados de forma independente, registrando o custo total descontado $C_m$ do cenário $m$:

$$
C_m = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(m)}
$$

em que $c_t^{(m)}$ é o custo imediato no estágio $t$ do cenário $m$ e $d_{1 \to t}$ é o fator de desconto acumulado do estágio 1 ao estágio $t$ (veja [Formulação da taxa de desconto](/pt-br/math/discount-rate)).

A **média amostral** é o estimador de Monte Carlo do custo total esperado:

$$
\bar{C} = \frac{1}{N} \sum_{m=1}^{N} C_m
$$

Esse estimador é **não viesado** sob sorteios independentes: $\mathbb{E}[\bar{C}] = \mathbb{E}[C]$. O **desvio-padrão amostral** é:

$$
\sigma_C = \sqrt{\frac{1}{N-1} \sum_{m=1}^{N} (C_m - \bar{C})^2}
$$

o estimador com correção de Bessel, adequado a uma amostra sorteada. Para a contrapartida populacional da variante censitária, veja a seção 4.5.4.

#### 4.5.3 Intervalo de confiança

Sob a aproximação normal, o intervalo de confiança de 95% para $\mathbb{E}[C]$ tem semiamplitude:

$$
\Delta_{95} = 1.96 \cdot \frac{\sigma_C}{\sqrt{N}}
$$

A aproximação é confiável quando $N$ é grande o suficiente para que valha o regime do teorema central do limite. O intervalo reportado é $[\bar{C} - \Delta_{95},\; \bar{C} + \Delta_{95}]$.

**Compromisso**: cada duplicação de $N$ estreita o intervalo de confiança por um fator $\sqrt{2}$, mas exige proporcionalmente mais resoluções de PL — o custo por verificação cresce com $N$ vezes o comprimento do horizonte. Como a semiamplitude diminui segundo $\sigma_C / \sqrt{N}$, um número suficientemente grande de cenários estreita o intervalo o bastante para distinguir uma política convergida de uma que ainda está melhorando.

Esse intervalo de confiança se aplica apenas à variante **amostral**. A variante censitária (seção 4.5.4) reporta a média exata e a variância populacional de uma população enumerada exaustivamente — não resta erro amostral a limitar, de modo que ela não tem intervalo de confiança.

#### 4.5.4 Estimador censitário

Quando os cenários da simulação provêm de uma enumeração exaustiva dos caminhos até as folhas do grafo da política, e não de uma amostra — um **censo declarado** —, o peso $w_m$ de cada cenário é a probabilidade do respectivo caminho, e não um peso amostral uniforme, e os pesos somam um: $\sum_m w_m = 1$.

A **média ponderada** censitária substitui a média amostral:

$$
\bar{C} = \sum_m w_m\, C_m
$$

e o **desvio-padrão ponderado** censitário é a **verdadeira variância populacional ponderada** — sem correção de Bessel:

$$
\sigma_C = \sqrt{\sum_m w_m\,(C_m - \bar{C})^2}
$$

A forma populacional omite a correção $N/(N-1)$ da variante amostral porque um censo é exaustivo, e não amostrado: $C_m$ percorre toda a população de cenários, e não uma amostra dela, de modo que não há viés para baixo na variância ingênua a corrigir.

Como a população é totalmente enumerada, e não estimada a partir de uma amostra, o estimador censitário **não tem intervalo de confiança** — $\bar{C}$ e $\sigma_C$ são estatísticas exatas da população enumerada, e não estimativas de uma esperança desconhecida.

:::note[Fronteira com o limite exato da fase de treinamento]
Essa média ponderada censitária compartilha a forma $\sum_m w_m C_m$ com o limite superior exato da fase de treinamento (seção 2, $\sum_\ell P(\ell)\, C(\ell)$) — ambos são somas ponderadas pelas probabilidades sobre uma enumeração exaustiva. Ainda assim, são distintos: o limite exato da seção 2 é avaliado uma vez a cada iteração do treinamento, sobre a árvore do treinamento, para alimentar o gap (seção 3); este estimador censitário é avaliado uma única vez, após o treinamento, sobre os caminhos até as folhas enumerados sob a política final, para reportar a distribuição de custos simulada da política. Nenhum alimenta o outro.
:::

#### 4.5.5 Número de cenários da simulação

O único parâmetro que governa o procedimento de simulação — amostral ou censitário — é o número de cenários da simulação $N$. Ele controla simultaneamente a resolução estatística do estimador amostral e o custo computacional do procedimento.

Aumentar $N$ estreita o intervalo de confiança amostral segundo $1/\sqrt{N}$, enquanto o custo computacional — proporcional a $N$ vezes o comprimento do horizonte, em resoluções de PL — cresce linearmente com $N$; assim, o número de cenários troca diretamente resolução estatística por custo computacional. Na variante censitária, $N$ é fixado pelo tamanho da enumeração declarada, e não escolhido em função da resolução estatística, já que não há intervalo de confiança a estreitar.

#### 4.5.6 Relação com os limites da fase de treinamento

Este estimador da simulação é independente do laço de treinamento: não é consumido por nenhum critério de parada e não condiciona o término do treinamento. O término do treinamento é governado pelo critério de parada baseado no gap (veja [Critérios de parada](/pt-br/math/stopping-rules), seção 5), que compara, a cada iteração, o limite superior da fase de treinamento — o estimador estatístico ou exato da simulação forward, seções 1–2 — com o limite inferior, usando a simulação forward do treinamento, e não a simulação pós-treinamento.

O estimador desta seção, por sua vez, reporta a distribuição de custos simulada da política treinada após a conclusão do treinamento: a média, o desvio-padrão e o intervalo de confiança amostrais (seções 4.5.2–4.5.3), ou a média ponderada e a variância populacional censitárias (seção 4.5.4). Veja [Convergência e diagnóstico](/pt-br/running/interpreting-results/) para saber como essa saída é usada na prática.

:::note[Escopo]
Este capítulo é responsável pela metodologia tanto do limite da simulação forward da fase de treinamento (seções 1–2) quanto do estimador da simulação pós-treinamento (esta seção); a derivação das sementes dos cenários e a distribuição dos cenários entre os recursos computacionais são detalhes de implementação fora do escopo deste capítulo.
:::

## Apêndice: Aproximação interna (reservada)

Este apêndice descreve um projeto reservado que o Novo Modelo não calcula: uma aproximação interna da função de custo futuro baseada em vértices (SIDP), que avaliaria o limite superior independentemente do modo de amostragem da simulação forward.

### Aproximação interna baseada em vértices

A aproximação interna $\bar{V}_t(x)$ seria construída a partir de **vértices** (pares estado visitado–valor):

$$
\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), (x^{(2)}, \bar{v}^{(2)}), \ldots, (x^{(I_t)}, \bar{v}^{(I_t)})\}
$$

em que cada vértice armazenaria:

- $x^{(i)}$: vetor de estado na entrada do estágio $t$, visitado durante as simulações forward
- $\bar{v}^{(i)}$: limite superior do custo futuro esperado a partir desse estado (calculado recursivamente)

### Interpolação de Lipschitz

Em um estado $x$, o limite superior seria a combinação convexa de menor custo dos valores dos vértices, acrescida de uma penalidade de Lipschitz sobre o desvio de $x$ em relação à mesma combinação convexa dos estados dos vértices:

$$
\begin{aligned}
\bar{V}_t(x) = \min_{\varphi,\, u^+,\, u^-} \quad & \sum_{i \in \mathcal{V}_t} \varphi_i\, \bar{v}^{(i)} + L_t^\top (u^+ + u^-) \\
\text{s.t.} \quad & \sum_{i \in \mathcal{V}_t} \varphi_i\, x^{(i)} + u^+ - u^- = x \\
& \sum_{i \in \mathcal{V}_t} \varphi_i = 1, \qquad \varphi,\, u^+,\, u^- \geq 0
\end{aligned}
$$

em que $\varphi_i$ é o peso do vértice $i$ na combinação convexa, $u^+$ e $u^-$ são os desvios positivo e negativo, componente a componente, de $x$ em relação ao estado combinado dos vértices $\sum_i \varphi_i\, x^{(i)}$, e $L_t$ é o vetor das constantes de Lipschitz $L_{t,j}$ por componente do estado (veja abaixo), de modo que o desvio de cada componente $j$ do estado é ponderado por sua própria $L_{t,j}$.

**Interpretação**: $\bar{V}_t$ é convexa e linear por partes em $x$, e $\bar{V}_t(x^{(i)}) \leq \bar{v}^{(i)}$ em todos os vértices. Ela é um limite superior da função de custo futuro convexa $V_t$ quando o valor de cada vértice limita superiormente o custo futuro em seu estado, $\bar{v}^{(i)} \geq V_t(x^{(i)})$, e $V_t$ varia no máximo $L_{t,j}$ por unidade de variação de cada componente $j$ do estado: é a contrapartida interna (superior) da aproximação externa (inferior) por cortes, ambas convexas.

### Cálculo das constantes de Lipschitz

As constantes de Lipschitz limitariam a taxa de variação da função de valor em relação a cada componente do estado. Os componentes do estado têm unidades diferentes — hm³ para um componente de armazenamento e as unidades da própria defasagem para um componente de tendência hidrológica —, de modo que $L_t$ é o vetor de constantes $L_{t,j}$ por componente do estado, cada uma em \$ por unidade de seu componente $j$. Para a PDDE com viabilidade garantida por penalidades (recurso relativamente completo):

- **Componente de armazenamento.** Um hm³ de água armazenada é precificado no estágio pela energia que desloca (o limite de penalidade em R\$/MWh vezes a energia que esse hm³ produz pelas produtibilidades das usinas que alcança, em MWh/hm³), pelas penalidades cobradas por hm³ de armazenamento (os custos de violação do armazenamento mínimo e da meta de enchimento do [Sistema de penalidades](/pt-br/math/penalty-system)) e pelo custo de verter a água que não pode ser armazenada (convertido de R\$/(m³/s·h) para R\$/hm³). Sua constante $L_{t,j}$, em R\$/hm³, limita superiormente esse preço.
- **Componente de tendência hidrológica.** Sua constante tem as unidades da própria defasagem: limita, em R\$ por unidade dessa defasagem, a variação do custo por meio das afluências em que a defasagem entra.

**Acumulação backward**, por componente de armazenamento $j$: no estágio terminal, $L_{T,j}$ é o limite próprio do estágio, cujo termo de energia é construído a partir do maior coeficiente de penalidade $c_{max}^{penalty}$ desse estágio; em cada estágio anterior $t$, $L_{t,j}$ soma o limite próprio do estágio, cujo termo de energia é construído a partir do maior coeficiente de penalidade do estágio $t$, $c_{max}^{penalty,t}$ (em R\$/MWh), à constante descontada do estágio seguinte $d_{t \to t+1} \cdot L_{t+1,j}$, em que $d_{t \to t+1}$ é o fator de desconto da transição $t \to t+1$ (veja [Formulação da taxa de desconto](/pt-br/math/discount-rate)).

:::note[Nota]
O fator de desconto $d$ aparece na acumulação de Lipschitz porque o custo futuro seria descontado. Sem desconto ($d = 1$), $L_t$ cresceria com o horizonte remanescente.
:::

### Cálculo dos valores dos vértices

Durante a passagem de avaliação do limite superior (uma variante da simulação backward), os valores dos vértices seriam calculados como segue.

**No estágio terminal $T$**:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_T}\left[c_T(x^{(i)}, \omega_T)\right] \quad \text{(expected immediate cost only)}
$$

**No estágio $t < T$**:

Para cada vértice $(x^{(i)}, \cdot) \in \mathcal{V}_t$:

1. Para cada cenário $\omega_t$, o subproblema do estágio seria resolvido com estado de entrada $x^{(i)}$ e realização $\omega_t$
2. O estado de saída ótimo $x_t^*(\omega_t)$ seria obtido
3. A aproximação interna do estágio seguinte seria avaliada nesse estado de saída: $\bar{\theta}(\omega_t) = \bar{V}_{t+1}(x_t^*(\omega_t))$
4. O valor do vértice seria definido como o custo futuro descontado esperado:

$$
\bar{v}^{(i)} = \mathbb{E}_{\omega_t}\left[c_t(x^{(i)}, \omega_t) + d_{t \to t+1} \cdot \bar{\theta}(\omega_t)\right]
$$

:::note[Valor esperado]
O valor do vértice seria uma esperança sobre os cenários, e não o valor de um único cenário — em paralelo com a simulação backward para os cortes, que também calcula o custo futuro esperado.
:::

### PL de avaliação do limite superior

Para avaliar a política com a aproximação interna, o PL do estágio substituiria a aproximação externa (restrições de corte sobre $\theta$) pela aproximação interna (restrições de combinação convexa sobre $\bar{\theta}$).

**PL padrão (aproximação externa, limite inferior)**:

$$
\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \theta
$$

$$
\text{s.t. } \theta \geq \beta_0 + \beta^\top x_t \quad \text{for every cut } (\beta_0, \beta)
$$

**PL da aproximação interna (limite superior)**:

$$
\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \bar{\theta}
$$

$$
\begin{aligned}
\text{s.t. } \; & \bar{\theta} \geq \sum_{i \in \mathcal{V}_{t+1}} \varphi_i\, \bar{v}^{(i)} + L_{t+1}^\top (u^+ + u^-) \\
& \sum_{i \in \mathcal{V}_{t+1}} \varphi_i\, x^{(i)} + u^+ - u^- = x_t \\
& \sum_{i \in \mathcal{V}_{t+1}} \varphi_i = 1, \qquad \varphi,\, u^+,\, u^- \geq 0
\end{aligned}
$$

A variável de custo futuro $\bar{\theta}$ do estágio $t$ representa a aproximação interna do estágio seguinte; assim, os pesos percorrem os vértices de $\mathcal{V}_{t+1}$, os desvios são precificados por $L_{t+1}$ e as duas restrições sobre o estado de saída $x_t$ são as da definição de $\bar{V}_{t+1}$: no ótimo, $\bar{\theta} = \bar{V}_{t+1}(x_t)$, com $\bar{V}_{T+1} = 0$ no último estágio.

:::note[Sentido]
As duas aproximações limitam inferiormente sua variável de custo futuro no PL: os cortes impõem $\theta \geq \ldots$, a combinação convexa impõe $\bar{\theta} \geq \ldots$, e a minimização leva cada variável até sua aproximação. As aproximações ficam em lados opostos da função de custo futuro: $\bar{V}_t$ fica acima dela, enquanto os cortes ficam abaixo, e ambas são convexas e lineares por partes.
:::

**Variáveis adicionais** (um peso por vértice, um par de desvios por componente do estado):

| Variável | Domínio | Descrição |
| --- | --- | --- |
| $\varphi_i$ | $\geq 0$ | Peso do vértice $i$ na combinação convexa |
| $u^+$ | $\geq 0$ | Desvio positivo, componente a componente, de $x_t$ em relação ao estado combinado dos vértices |
| $u^-$ | $\geq 0$ | Desvio negativo, componente a componente, de $x_t$ em relação ao estado combinado dos vértices |
| $\bar{\theta}$ | livre | Limite superior do custo futuro, limitado inferiormente pelo valor da combinação convexa |

### Considerações computacionais

| Aspecto | Impacto |
| --- | --- |
| **Vértices por estágio** | Tipicamente $\mathcal{O}(\text{iterations} \times N_{\text{forward\_passes}})$ |
| **Aumento do tamanho do PL** | $n_{vertices} + 2 \times n_{state}$ variáveis adicionais |
| **Frequência de avaliação** | Compromisso entre precisão do gap e tempo de execução |
| **Memória** | Vértices armazenados separadamente dos cortes |

### Modo cíclico

:::caution[Forma de grafo da política reservada]
A forma cíclica do grafo da política descrita nesta subseção é **reservada**
independentemente da aproximação interna: o grafo da política do Novo Modelo
admite apenas horizonte finito, e informar `cyclic` como tipo do grafo da
política é rejeitado na carga com um erro nomeado. Veja
[Modos de horizonte](/pt-br/math/horizon-modes) para o projeto-alvo cíclico reservado.
:::

Para o projeto reservado de grafos da política cíclicos (veja [Modos de horizonte](/pt-br/math/horizon-modes)), a aproximação interna operaria sobre a mesma estrutura sazonal do conjunto de cortes: vértices organizados por período sazonal $\tau$, e não pelo ID absoluto do estágio. A constante de Lipschitz precisaria levar em conta o desconto acumulado ao longo do ciclo, que limita a série geométrica das contribuições futuras.

A garantia de convergência continuaria válida: com $d_{\text{cycle}} < 1$, tanto a aproximação externa (cortes) quanto a interna (vértices) convergiriam para a verdadeira função de valor no ponto fixo.

## Referências

- [Costa & Leclère (2023)](/pt-br/reference/bibliography/#avaliacao-do-limite-superior)
- [Philpott, de Matos & Finardi (2013)](/pt-br/reference/bibliography/#medidas-de-risco)

## Referências cruzadas

- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — Algoritmo central que fornece a aproximação externa (limite inferior) complementada por este capítulo
- [Convenções de notação](/pt-br/overview/notation-conventions) — Símbolos padronizados para variáveis de estado, funções de valor e custo futuro
- [Formulação da taxa de desconto](/pt-br/math/discount-rate) — Fator de desconto $d$ usado no custo descontado do limite exato (seção 2) e no cálculo reservado dos valores dos vértices e na acumulação de Lipschitz (apêndice)
- [Grafos da política](/pt-br/math/policy-graphs) — A distinção entre simulação forward enumerada e amostrada que seleciona entre os mecanismos estatístico e exato de limite superior (seções 1–2)
- [Modos de horizonte](/pt-br/math/horizon-modes) — O projeto-alvo reservado de grafo da política cíclico e a estrutura de conjuntos indexada por período sazonal que a aproximação interna reservada do apêndice espelharia
- [Gerenciamento de cortes](/pt-br/math/cut-management) — Cortes da aproximação externa que fornecem a contrapartida do limite inferior
- [Critérios de parada](/pt-br/math/stopping-rules) — O critério de parada baseado no gap, que compara o limite superior da fase de treinamento deste capítulo (seções 1–2) com o limite inferior (seção 3)
- [Medidas de risco](/pt-br/math/risk-measures) — O limite inferior aninhado ajustado ao risco e por que apenas o limite exato aninhado certifica uma política avessa ao risco
- [Geração de cenários](/pt-br/math/scenario-generation) — A árvore de aberturas e os esquemas de amostragem forward cujas estimativas a seção 4 interpreta, no treinamento e na simulação pós-treinamento (seção 4.5)
- **Executando o Novo Modelo:** [Convergência e diagnóstico](/pt-br/running/interpreting-results/) — o guia do software para ler e avaliar a saída deste estimador.
