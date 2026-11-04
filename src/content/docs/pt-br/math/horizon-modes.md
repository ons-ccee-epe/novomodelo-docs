---
title: "Modos de horizonte"
description: Topologias finita (acíclica) e cíclica (periódica infinita) do grafo da política — a função de período sazonal, a desigualdade de convergência do ciclo, o conjunto de cortes indexado por período sazonal, o operador de Bellman de ponto fixo e as regras de término da simulação forward.
---

## Objetivo

O **modo de horizonte** é a topologia global do grafo da política (policy graph) de uma
execução do Novo Modelo. Ele determina se o grafo de estágios é uma cadeia acíclica com uma
condição terminal conhecida ou um ciclo cujas funções de valor precisam se estabilizar ao longo de
percursos repetidos. Como a topologia se aplica uniformemente a todos os estágios, um
único modo rege toda a execução; a escolha é declarada na configuração do
caso por meio do campo de tipo do grafo da política.

O Novo Modelo suporta apenas o modo finito (acíclico) da seção 1; um modo **cíclico**
(periódico infinito), que fecha o grafo de estágios em um ciclo cujas
funções de valor se estabilizam ao longo de percursos repetidos, em vez de terminar
em um estágio fixo, é um projeto **reservado**.

A seção 2 apresenta o modo cíclico reservado no nível de ideia / garantia / parâmetro
/ compromisso; a seção 3 apresenta sua estrutura matemática formal (a
função de período sazonal, a desigualdade de convergência do ciclo, o conjunto de cortes indexado
por período sazonal e o operador de Bellman de ponto fixo); a seção 4 descreve a
lógica de término da simulação forward prevista pelo projeto reservado; a seção 5
compara os modos suportado e reservado, como referência. O fator de desconto
por transição é definido em [Formulação da taxa de desconto](/pt-br/math/discount-rate);
seu papel na convergência do ciclo é exposto na seção 3.

## 1. Modo Finito (Acíclico)

**Ideia.** O grafo de estágios é uma cadeia linear: o estágio 1 leva ao estágio 2, que
leva ao estágio 3, e assim por diante até o estágio T. A cadeia tem um fim definido. A
função de valor terminal é nula, a menos que uma função terminal fixa seja importada
de uma política de montante (ver
[Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary)); com
valor terminal nulo, nenhuma água remanescente nos reservatórios no estágio T+1 tem valor
no modelo.

**Garantia.** Como a cadeia é acíclica, cada estágio é visitado exatamente
uma vez por simulação forward ou backward. O algoritmo termina naturalmente ao
atingir o estágio terminal. Não há ciclo a percorrer nem critério de convergência
ligado à estabilidade do ciclo. Cada estágio acumula seu próprio conjunto de cortes
independente; um corte gerado no estágio t é válido apenas para o estágio t, de modo que há T
conjuntos independentes em um estudo de T estágios.

**Parâmetro.** A configuração do caso declara o tipo do grafo da política como finito. O
número de estágios T é o comprimento da cadeia.

**Compromisso.** O modo finito é adequado quando o estudo tem horizonte limitado
e o modelador pode aceitar a condição terminal. Para horizontes de planejamento
de curto e médio prazo, o efeito de fim da cadeia é uma hipótese de modelagem
administrável, e a simplicidade do percurso acíclico torna o algoritmo
fácil de interpretar e depurar. A limitação é que o armazenamento dos reservatórios
próximo ao estágio terminal é sistematicamente subvalorizado: a condição terminal
nula incentiva o otimizador a esvaziar os reservatórios antes do
estágio T, produzindo um artefato conhecido como efeito de fim de mundo. Quando esse
artefato distorceria a política, uma função terminal importada é o
remédio suportado, e o projeto cíclico reservado (seção 2), o outro.

## 2. Modo Cíclico (Periódico Infinito)

:::caution[Situação: Projeto Reservado]
O Novo Modelo suporta apenas o modo finito da seção 1. Um grafo da política cíclico é um
projeto reservado que o carregador de casos rejeita. As seções 2 a 4 documentam esse
projeto; sua matemática é válida em seus próprios termos.
:::

**Ideia.** O grafo de estágios contém uma aresta de retorno que vai do último estágio
de um ciclo ao primeiro estágio da repetição seguinte, formando um laço fechado.
Não há estágio terminal; em vez disso, exige-se que a política seja autoconsistente
entre as repetições do ciclo. Os conjuntos de cortes são organizados por período sazonal — a posição de um
estágio dentro de um ciclo — e não pela identidade absoluta do estágio. Os conjuntos
de cortes sazonais de um único ciclo representam todo o horizonte infinito.

**Garantia.** A convergência do modo cíclico depende de o fator de desconto
acumulado ao longo de um ciclo completo ser estritamente menor que um. Quando essa condição
é satisfeita, as contribuições de ciclos futuros distantes tornam-se desprezíveis, e as funções
de valor de cada período sazonal se estabilizam ao longo das iterações. O enunciado formal
dessa garantia — a desigualdade de convergência, a função de período sazonal, a
equação de compartilhamento de cortes e o operador de Bellman de ponto fixo — é apresentado na
seção 3.

**Parâmetro.** No projeto reservado, a configuração do caso declararia o
tipo do grafo da política como cíclico e forneceria uma taxa de desconto anual; a taxa
de desconto, junto com a duração de cada transição, determina o
fator por transição, e o produto dos fatores ao longo de um ciclo deve ser
estritamente menor que um (ver [Formulação da taxa de desconto](/pt-br/math/discount-rate) para
a mecânica de conversão).

**Compromisso.** O modo cíclico elimina o efeito de fim de mundo ao representar
o problema de planejamento como uma operação contínua, que se repete perpetuamente. É a
escolha natural para estudos de planejamento de longo prazo em que uma condição terminal finita
produziria políticas enganosas próximo ao final do horizonte. O custo é complexidade
adicional: o modelador precisa fornecer uma taxa de desconto, o algoritmo precisa verificar a
convergência do ciclo, e a simulação forward exige uma lógica de término explícita,
em vez de um ponto final natural da cadeia. A seção 3 formaliza o requisito de
convergência; a seção 4 descreve as regras de término da simulação forward previstas pelo
projeto reservado.

## 3. Modo Cíclico — Detalhamento Matemático

Esta seção apresenta a estrutura formal que a seção 2 resumiu em texto:
a função de período sazonal, a hipótese de estacionariedade, a desigualdade de convergência
do ciclo, o conjunto de cortes indexado por período sazonal com sua equação de compartilhamento de cortes, a
interpretação de Bellman como ponto fixo e o critério de convergência que o
algoritmo verifica entre iterações consecutivas.

### Função de Período Sazonal

Para um ciclo de $M$ estágios (por exemplo, doze estágios mensais formando
um ano civil), o **período sazonal** do estágio $t$ é sua posição dentro de um
ciclo:

$$
\tau(t) \;=\; (t - 1) \bmod M + 1 \;\in\; \{1, 2, \ldots, M\}.
$$

O ciclo é a unidade que se repete; o período sazonal é a posição dentro dele.

### Hipótese de Estacionariedade

Seja $\mathcal{C}_\tau = \{\,t : \tau(t) = \tau\,\}$ o conjunto de todos os
estágios que ocupam o período sazonal $\tau$. O projeto cíclico se apoia em uma hipótese:
todo estágio do período sazonal $\tau$ tem os mesmos dados em todos os ciclos — os mesmos
custos, restrições, estrutura de patamares, processo estocástico e fator de desconto
de um passo $d_{t \to t+1}$. O problema que começa em qualquer estágio de
$\mathcal{C}_\tau$, composto pelo próprio estágio e pela cauda infinita que o segue,
é então o mesmo para todo estágio de $\mathcal{C}_\tau$. É isso que torna um
corte gerado em um estágio de $\mathcal{C}_\tau$ válido em todo estágio de
$\mathcal{C}_\tau$, e o que permite que $M$ conjuntos representem o horizonte infinito.

### Desigualdade de Convergência do Ciclo

Para que a função de valor permaneça finita ao longo de infinitas repetições, o
desconto acumulado ao longo de um ciclo completo deve ser estritamente menor que um:

$$
d_{\text{cycle}} \;=\; \prod_{t \in \text{cycle}} d_{t \to t+1} \;<\; 1.
$$

Isso garante que a série geométrica das contribuições dos ciclos converge,

$$
\lim_{n \to \infty} d_{\text{cycle}}^{\,n} \cdot V_t(x) \;=\; 0,
$$

de modo que as contribuições de ciclos de um futuro distante se tornam desprezíveis. O projeto reservado
exige essa desigualdade de todo grafo cíclico. Ver
[Formulação da taxa de desconto](/pt-br/math/discount-rate) para a conversão da
taxa anual nos fatores por transição.

### Conjunto de Cortes Indexado por Período Sazonal

Pela hipótese de estacionariedade, um corte gerado em qualquer estágio de
$\mathcal{C}_\tau$ é válido para todo estágio de $\mathcal{C}_\tau$, de modo que o
conjunto de cortes é indexado por período sazonal, e não por estágio absoluto:

$$
\underline{V}_\tau(x) \;=\; \max_{i \in \mathcal{I}_\tau}
\bigl\{\, \beta_{0,i} + \beta_i^{\top} x \,\bigr\}.
$$

Um único ciclo de $M$ conjuntos representa, portanto, todo o horizonte
infinito. A diferença de organização dos conjuntos entre os modos finito e cíclico
reduz-se a: $T$ conjuntos indexados por estágio absoluto contra $M$ conjuntos indexados por
período sazonal.

### Operador de Bellman de Ponto Fixo

As funções de valor cíclicas satisfazem a recursão de Bellman sazonal

$$
V_\tau \;=\; \mathbb{T}_\tau\, V_{\tau \bmod M + 1},
\qquad \tau \in \{1, \ldots, M\},
$$

onde $\tau \bmod M + 1$ é o período sazonal que sucede $\tau$ (o período sazonal $M$ é
sucedido pelo período sazonal $1$) e $\mathbb{T}_\tau$ é o operador de Bellman de um
estágio no período sazonal $\tau$:

$$
(\mathbb{T}_\tau V)(x) \;=\; \mathbb{E}_{\omega_\tau}\!\left[\,
\min_{(x', u) \in \mathcal{X}_\tau(x, \omega_\tau)}\,
\bigl\{ c_\tau(x', u) + d_{t \to t+1}\, V(x') \bigr\}
\,\right].
$$

Aqui, $x$ é o estado de entrada, $x'$ o estado de saída e $u$ o controle;
$\mathcal{X}_\tau(x, \omega_\tau)$ é o conjunto viável desses sob a
realização $\omega_\tau$, e $t$ é qualquer estágio do período sazonal $\tau$: pela
estacionariedade, o custo do estágio $c_\tau$, o conjunto viável e o fator de um
passo $d_{t \to t+1}$ são os mesmos em todos esses estágios. Encadear a
recursão uma vez ao redor do ciclo fornece a equação de ponto fixo do primeiro
período sazonal,

$$
V_1 \;=\; \bigl(\mathbb{T}_1 \circ \mathbb{T}_2 \circ \cdots \circ
\mathbb{T}_M\bigr)\, V_1 .
$$

Com custos de estágio limitados e conjunto viável não vazio para todo estado de entrada
do espaço de estados e toda realização, cada $\mathbb{T}_\tau$ é monótono e, na norma
do supremo, lipschitziano com constante igual ao fator de seu período sazonal $d_{t \to t+1}$. O fator
de um período sazonal pode ser igual a um, de modo que um $\mathbb{T}_\tau$ isolado não precisa ser uma
contração; a composição é lipschitziana com constante igual ao produto dos
$M$ fatores, que é $d_{\text{cycle}} < 1$ pela desigualdade de convergência
do ciclo. O encadeamento é, portanto, uma contração de módulo
$d_{\text{cycle}}$ e, pelo teorema do ponto fixo de Banach no espaço das funções
limitadas do estado, as funções de valor cíclicas existem e são únicas: $V_1$
é o único ponto fixo do encadeamento, e a recursão determina a partir dela as
funções de valor dos demais períodos sazonais. A PDDE (SDDP) cíclica calcula esse ponto
fixo; a política está convergida quando a função de valor de cada período sazonal é
estável entre iterações consecutivas.

### Critério de Convergência do Ciclo

A aproximação externa convergiu no modo cíclico quando os limites inferiores
de todos os períodos sazonais se estabilizam entre iterações consecutivas:

$$
\max_{\tau \in \{1, \ldots, M\}}
\bigl|\, \underline{z}^{\,k,\tau} - \underline{z}^{\,k-1,\tau} \,\bigr|
\;<\; \delta_{\text{cycle}},
$$

onde $\underline{z}^{\,k,\tau}$ é o limite inferior no período sazonal $\tau$ após a
iteração $k$, e a tolerância $\delta_{\text{cycle}}$ é um parâmetro de
parada do projeto reservado.

## 4. Término da Simulação Forward no Modo Cíclico

No modo finito, a simulação forward termina ao atingir o estágio terminal; nenhum
critério de parada explícito é necessário. O projeto cíclico reservado (seções 2–3)
não tem estágio terminal, de modo que sua simulação forward aplicaria duas condições
de parada.

**Condição 1 — Tolerância do desconto acumulado.** À medida que a simulação forward percorre
estágios sucessivos, um produto corrente acumula os fatores de desconto
por transição. Quando esse produto acumulado fica abaixo de uma tolerância
configurável de desconto acumulado, os estágios restantes contribuem tão pouco para o
custo total da trajetória que prosseguir não afetaria significativamente a política.
A simulação terminaria nesse ponto.

**Condição 2 — Limite de segurança de número máximo de estágios.** Um limite de segurança
configurável de número máximo de estágios evitaria um percurso ilimitado em casos patológicos em que o
desconto acumulado diminui lentamente — por exemplo, quando o desconto do ciclo é
válido, mas próximo de um. Se a condição de desconto acumulado não tiver
sido acionada quando o limite de segurança for atingido, a simulação terminaria
incondicionalmente.

A simulação forward terminaria quando qualquer das condições fosse satisfeita, a que ocorrer
primeiro. A mecânica de desconto subjacente à condição de desconto acumulado —
a fórmula que relaciona a taxa anual ao fator por transição e o
produto corrente — é descrita em [Formulação da taxa de desconto](/pt-br/math/discount-rate).

## 5. Escolha entre os Modos

A comparação abaixo é uma referência para a decisão de modelagem entre o modo
finito suportado (seção 1) e o projeto cíclico reservado (seções 2–4).

**Escolha o modo finito quando:**

- O estudo tem uma data final bem definida e o modelador pode aceitar uma condição
  terminal nula (ou complementá-la com cortes de fronteira importados — ver
  [Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary)).
- O horizonte de planejamento é curto o suficiente para que o efeito de fim de mundo seja
  desprezível ou aceitável.
- Interpretabilidade e simplicidade são prioridades: o percurso acíclico não exige
  taxa de desconto, verificação de convergência do ciclo nem lógica de término da simulação
  forward além de atingir o último estágio.

**O projeto cíclico reservado seria preferível quando:**

- O estudo representa uma operação contínua — planejamento de reservatórios de longo prazo,
  despacho plurianual, operação perpétua do sistema — em que impor uma condição
  terminal produziria políticas sistematicamente distorcidas próximo ao final do horizonte.
- O modelador dispõe de uma taxa de desconto anual significativa, que reflita o valor
  do dinheiro no tempo para os custos futuros.
- A compressão do conjunto de cortes oferecida pelos conjuntos indexados por período sazonal é desejável:
  em vez de acumular T conjuntos independentes, apenas M conjuntos (um por período sazonal)
  seriam mantidos, independentemente de quantas repetições do ciclo a simulação
  forward percorra.

**Resumo dos compromissos:**

| Propriedade                 | Finito (suportado)              | Cíclico (reservado)                 |
| --------------------------- | ------------------------------- | ----------------------------------- |
| Condição terminal           | V em T+1 = 0 (ou cortes importados) | Nenhuma; autoconsistente entre ciclos |
| Efeito de fim de mundo      | Presente próximo ao estágio terminal | Ausente                        |
| Conjuntos de cortes         | T conjuntos, um por estágio     | M conjuntos, um por período sazonal         |
| Exigência de taxa de desconto | Nenhuma                       | Obrigatória; deve resultar em ciclo < 1 |
| Lógica de parada da simulação forward | Atinge o estágio terminal | Regra explícita de duas condições |
| Complexidade matemática     | Menor                           | Maior                               |

A mecânica de geração de cortes que produz os cortes que preenchem ambas as
organizações de conjuntos é tratada em [Gerenciamento de cortes](/pt-br/math/cut-management). O
algoritmo no qual o modo finito opera, e no qual o projeto cíclico reservado
é especificado para operar, é descrito em
[Algoritmo da PDDE](/pt-br/math/sddp-algorithm).

## 6. Referência

- [Costa et al. (2025)](/pt-br/reference/bibliography/#condicoes-de-contorno-e-modos-de-horizonte)

A estrutura formal do modo cíclico na seção 3 — a função de período sazonal,
a desigualdade de convergência do ciclo, o conjunto de cortes indexado por período sazonal com sua
equação de compartilhamento de cortes e o operador de Bellman de ponto fixo — segue
este artigo; a hipótese de estacionariedade e a contração do
encadeamento de operadores constituem o argumento padrão de programação dinâmica
periódica com desconto.

## Referências Cruzadas

- [Formulação da taxa de desconto](/pt-br/math/discount-rate) — Conversão da taxa anual em fator,
  mecânica de desconto por transição e desconto acumulado.
- [Gerenciamento de cortes](/pt-br/math/cut-management) — Mecânica de geração e agregação de cortes
  que produz os cortes que preenchem os conjuntos por estágio ou por período sazonal.
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — O algoritmo que o modo de horizonte
  parametriza; topologias do grafo da política finita (suportada) e cíclica (reservada);
  mecanismo de cortes de fronteira terminal.
- [Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary) — A
  função terminal que um estudo finito pode importar de uma política de montante.
- [Critérios de parada](/pt-br/math/stopping-rules) — Os critérios de parada que encerram o
  treinamento (training) no modo finito.
