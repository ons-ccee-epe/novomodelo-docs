---
title: Fronteira pós-estudo e estudos encadeados
description: Uma função terminal fixa importada de um conjunto de cortes de uma política a montante, os estudos encadeados (o conjunto de origem e as condições de compatibilidade), as duas famílias de estado transportado mantidas ativas para serem precificadas por ela, o mecanismo de precificação na fronteira β·x, a distribuição datada e ponderada por horas que concilia o calendário de entregas da origem com o do próprio estudo, e a inicialização das defasagens de afluência do primeiro estágio a partir do histórico realizado.
---

## 1. A fronteira direita

No modo de horizonte finito (acíclico), a condição terminal é $V_{T+1} = 0$:
nenhum estado transportado além do último estágio $T$ tem valor no modelo (veja
[Modos de horizonte §1](/pt-br/math/horizon-modes)). Em vez disso, um estudo pode importar uma **fronteira
direita**, no sentido de que ela precifica o horizonte a partir de sua extremidade final. Os
cortes de um conjunto de uma política a montante (§5.1) tornam-se o conjunto de cortes do
estágio terminal, que contém exatamente esses cortes e ao qual o treinamento (training) nunca acrescenta
nem do qual remove nenhum, de modo que a função terminal importada é fixa e substitui
$V_{T+1} = 0$. Ela precifica todas as coordenadas do estado terminal que a origem
modela: armazenamento, defasagens AR e o estado transportado do §2. O encadeamento de dois estudos
dessa forma é o tema do §5.

O **calendário pós-estudo** — uma sequência de estágios que começa exatamente onde
termina o horizonte de estudo — é independente da fronteira: um estudo pode declarar
estágios pós-estudo com ou sem uma fronteira carregada. Um estágio pós-estudo
nunca é despachado, nunca integra a cadeia de estágios do próprio estudo e nunca
acumula nem transporta um corte de Benders próprio: não contribui com subproblema de
PL nem com simulação backward. Seu papel é permitir que uma data além do horizonte
seja associada a uma posição do calendário — para que a conciliação da seção 4 tenha
onde se apoiar — e, para uma termelétrica com antecipação de despacho, declarar a capacidade
e o custo de uma entrega nesse período. Sem fronteira, o estado transportado até o
estágio terminal tem valor terminal nulo (§2); com ela, os cortes importados o
precificam (§3).

## 2. Estado mantido até o estágio terminal

Duas famílias de estado, de outro modo, deixariam o sistema modelado na
extremidade do horizonte, em vez de serem transportadas adiante e precificadas:

- **Compromissos entregues além do horizonte.** Um compromisso decidido no
  estudo para um estágio de entrega posterior a $T$ só existe quando esse estágio de entrega
  está no calendário pós-estudo declarado e a usina está em operação nele;
  é então uma decisão efetiva, limitada e custeada pela capacidade e pelo custo
  declarados do estágio pós-estudo, e transportada em seu ring slot até o
  estágio terminal (veja
  [Visão geral da modelagem dos elementos do sistema §4](/pt-br/math/system-elements#usinas-termeletricas-com-antecipacao-de-despacho) e
  [Aumento do espaço de estados — Linhas do ring](/pt-br/math/state-augmentation#linhas-do-ring)). Uma entrega
  além de $T$ fora desse calendário não tem decisão. Sem uma fronteira carregada,
  o compromisso transportado tem valor terminal nulo, enquanto seu combustível continua sendo
  cobrado na coluna de decisão, e a preparação do estudo emite um aviso a respeito.
- **In-transit buckets com defasagem profunda no estágio terminal.** A água liberada no final do horizonte
  pode ainda estar em trânsito em $T$ (veja
  [Visão geral da modelagem dos elementos do sistema — Tempo de viagem na cascata](/pt-br/math/system-elements#tempo-de-viagem-na-cascata)).
  Com uma fronteira carregada, toda defasagem alcançada pelas defluências de um estágio é mantida ativa até
  o estágio terminal; sem ela, uma defasagem que amadureceria além do horizonte é
  truncada e sua água é descartada (veja
  [Aumento do espaço de estados — Limitação do horizonte](/pt-br/math/state-augmentation#limitacao-de-horizonte)).

As duas famílias são condicionadas de formas diferentes: o calendário pós-estudo decide
se um compromisso pós-horizonte é assumido, e a fronteira decide se um
bucket de defasagem profunda sobrevive até o estágio terminal. Uma coordenada que alcança o
estágio terminal é mantida ativa no estado de saída do estágio terminal, como o
armazenamento ou as defasagens AR, e a fronteira a precifica; uma coordenada fixada em zero ou
descartada antes do estágio terminal não deixa nada sobre o que um corte possa atuar.

A figura acompanha um compromisso decidido no estágio $t$ para um estágio de entrega
pós-estudo $m$. Ele é depositado em seu ring slot em $t$, transportado até o estágio
terminal $T$ e valorado ali pelo corte de fronteira por meio do coeficiente do slot,
enquanto seu combustível é cobrado em $t$; o próprio estágio de entrega $m$ está no
calendário pós-estudo, além da fronteira. Um compromisso decidido antes do estudo
para um estágio pós-estudo não ocupa slot (o caminho tracejado), e sua contribuição
de estado entra no termo independente do corte de fronteira.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
}

decide: "estágio t\ndecisão, combustível cobrado" {class: thermal}
carry: "estágio T\nring slot transportado"
prestudy: "compromisso pré-estudo\nsem ring slot" {shape: parallelogram}
boundary: "fronteira terminal" {shape: oval}
deliver: "estágio pós-estudo m\nentrega" {class: thermal}

decide -> carry: "ring slot"
carry -> boundary: "coeficiente do corte"
prestudy -> boundary: "termo independente" {style.stroke-dash: 4}
boundary -> deliver: "calendário pós-estudo"
```

As duas famílias são transportadas pelo mecanismo de estado interno ao estudo — ring slots e
colunas de buckets, com suas cópias de entrada fixadas por limites de coluna — e uma fronteira
direita não acrescenta nenhum mecanismo de transporte de estado: para essas duas famílias, ela apenas
altera quais defasagens de bucket alcançam o estágio terminal.

## 3. Precificação na fronteira (`β·x`)

Um corte terminal importado tem um termo independente $\beta_0$ e um coeficiente
$\beta$ para cada coordenada do estado de saída do estágio terminal — uma
entrada por armazenamento hidrelétrico, por defasagem AR, por in-transit bucket e por
slot do commitment ring. Cada corte é o conhecido piso afim sobre a variável de
custo futuro terminal,

$$
\theta \;\geq\; \beta_0 \;+\; \beta^{\top} x_T,
$$

avaliado pela mesma **linha** de corte usada por todos os outros cortes de Benders (veja
[Algoritmo da PDDE (SDDP) §6](/pt-br/math/sddp-algorithm) para a forma de corte único). O
coeficiente de um ring slot ou de um bucket multiplica a coluna de saída do estágio terminal
para essa coordenada, que a linha de depósito ou de transporte do compromisso,
ou a linha de definição do bucket, vincula à decisão ou à defluência que
a produziu
([Aumento do espaço de estados — Coeficiente do corte dos ring slots](/pt-br/math/state-augmentation#coeficiente-de-corte-dos-ring-slots);
[Aumento do espaço de estados — Linhas de definição dos buckets](/pt-br/math/state-augmentation#linhas-de-definicao-dos-buckets)).
Uma fronteira direita não acrescenta um segundo mecanismo de precificação; ela fornece os
coeficientes do estado mantido ativo no estágio terminal.

A precificação do estado transportado por $\beta^{\top} x_T$ é mantida deliberadamente
separada da precificação do combustível consumido por um compromisso antecipado. O combustível de
um compromisso pós-horizonte é contabilizado em sua coluna de decisão, no estágio de
decisão, ao custo declarado do estágio pós-estudo e descontado a partir do
estágio de entrega
([Aumento do espaço de estados — Contribuições para a função objetivo](/pt-br/math/state-augmentation#contribuicoes-a-funcao-objetivo);
[Formulação da taxa de desconto — Extensão pós-estudo](/pt-br/math/discount-rate#extensao-pos-estudo)),
enquanto $\beta^{\top} x_T$ precifica o _estado_ que o compromisso deixa em
seu ring slot. A valoração do estado e a contabilização do combustível ocorrem em colunas disjuntas: uma é um
termo de $\beta^{\top} x_T$ na coluna de saída do slot, a outra é o próprio
coeficiente do compromisso na função objetivo, em sua coluna de decisão. Como nenhuma
coluna desempenha os dois papéis, eles se compõem sem contar duas vezes a
mesma energia entregue — a mesma disciplina que os mecanismos de entrega e de função objetivo
internos ao estudo já aplicam às entregas dentro do horizonte.

Um compromisso decidido **antes do estudo** para uma entrega além do horizonte é
fixo: não tem coluna de decisão, ring slot nem coordenada em $\beta$.
Seu combustível é custo afundado e não entra em nenhuma função objetivo. Quando uma fronteira é carregada
([Cortes de fronteira](/pt-br/running/policy-management/#cortes-de-fronteira)), sua contribuição
de estado — o valor que o corte de fronteira atribui à taxa comprometida sobre as
slots de origem com que sua janela de entrega se sobrepõe, ponderado por horas — é somada uma única vez,
na carga, ao termo independente $\beta_0$ de todo corte de fronteira; nenhum coeficiente
muda. Sem fronteira carregada, ela não entra em nenhum termo, e a preparação do estudo emite um aviso
quando sua taxa comprometida é não nula. Em ambos os casos, ela é informada em sua
data real de entrega
([Saídas da simulação](/pt-br/reference/output/simulation/#anticipatedfixed_deliveriesparquet)).

## 4. Conciliação de calendários (distribuição)

O estado terminal de uma execução a montante é expresso em seu próprio calendário, que não precisa
compartilhar as fronteiras de estágio do estudo atual — uma origem mensal que alimenta
um estudo semanal ou mensal é o caso típico. Por isso, a carga da fronteira
concilia o estado datado da origem com o calendário do próprio estudo atual
antes que qualquer coeficiente seja usado: cada mês da origem é distribuído entre as
janelas de entrega do próprio estudo na proporção das horas que cada uma compartilha com ele
(cada peso é o número de horas compartilhadas dividido pelas horas do mês da origem), uma
**distribuição datada e ponderada por horas**. Uma janela que cai inteiramente dentro de
um único mês precificado da origem recebe apenas a parcela desse mês; uma janela que abrange
mais de um mês da origem recebe a parcela ponderada por horas de cada um; somente uma
janela que avança sobre um trecho que a origem nunca precificou é renormalizada
sobre o intervalo efetivamente coberto pela origem: considera-se o valor da origem
distribuído uniformemente pela janela, de modo que a densidade da parte coberta é estendida
à parte não coberta.

A origem e o estudo atual não precisam sequer modelar o **mesmo conjunto de coordenadas
de estado**. Uma origem treinada sem in-transit buckets, ou com slots
antecipados mensais onde o estudo atual tem slots semanais, apresenta um
estado terminal de formato diferente. Por isso, a conciliação associa cada
coordenada de destino à origem **pela identidade da entidade e pela data de entrega**, nunca
pela posição no vetor de estado: uma coordenada de armazenamento se liga ao mesmo
reservatório, um slot antecipado à mesma usina e data de entrega, um
in-transit bucket ao mesmo arco e maturação. Uma coordenada da origem que o estudo atual
não modela não tem onde se apoiar e é **descartada** — contabilizada, por
família, no resumo de conciliação descrito abaixo, em vez de ser descartada silenciosamente —
e a carga ainda assim é bem-sucedida **por padrão**. No sentido inverso, uma coordenada de armazenamento
ou de defasagem AR do estudo atual que a origem não precifica
faz a carga ser recusada (§5.2), e somente um slot do commitment ring ou um in-transit bucket
sem intervalo de origem sobreposto recebe coeficiente nulo. Existe uma admissão mais
estrita que, em vez disso, **rejeita** uma origem que seja um superconjunto — que
precifica estado que o estudo atual não modela — em vez de descartá-lo e
relatá-lo; veja
[Requisitos de compatibilidade](/pt-br/running/policy-management/#requisitos-de-compatibilidade)
para saber como a camada de software a exige.

A distribuição é produzida uma única vez, na carga, e seu resultado é resumido, em vez
de ficar implícito: um **resumo de conciliação por família** informa, para
armazenamento, defasagens de afluência, in-transit buckets e compromissos
antecipados, quantas coordenadas de destino foram copiadas de forma idêntica de uma coordenada
da origem associada pela identidade da entidade, quantas foram resolvidas pela distribuição
datada (uma janela dentro de um único mês da origem conta aqui, como uma combinação de um
só termo, e as renormalizadas por avançarem sobre um trecho que a origem nunca
precificou também são contadas separadamente como transpassantes), quantas não tinham
informação correspondente na origem e receberam coeficiente nulo, em vez de um
valor estimado, e quantas coordenadas da origem o estudo atual não
modela e descartou. Para armazenamento e defasagens de afluência, as contagens de distribuídas e de nulas
são sempre zero em uma carga bem-sucedida, pois uma coordenada não precificada de
qualquer dessas famílias faz a carga ser recusada (§5.2). O
resumo é um diagnóstico de carga, não uma variável de estado — existe para que uma
inconsistência entre o estado ou os calendários da origem e os atuais fique visível,
em vez de ser absorvida silenciosamente.

O estado da origem vem do único conjunto a montante que o §5.1 seleciona pela data.

Uma entrega além do horizonte decidida pelo estudo tem exatamente um estágio de
decisão $t_i(m)$
([Aumento do espaço de estados §5](/pt-br/math/state-augmentation#5-compromissos-de-despacho-das-termeletricas-com-antecipacao)).
Nesse estágio, cada cenário a decide como qualquer outra decisão de estágio e a
transporta em seu ring slot até o estágio terminal, e a fronteira precifica o
valor transportado pelos cortes de fronteira do PL do estágio terminal desse cenário.

A figura mostra a distribuição além da extremidade do horizonte, o fim do estágio $T$, no
segmento pós-estudo que começa ali. Um mês precificado da origem é distribuído
entre as janelas de entrega do estudo com as quais se sobrepõe, desenhadas aqui para um compromisso,
cada uma com um peso horário: as horas compartilhadas divididas pelas horas do
mês da origem. A janela dentro do mês recebe apenas a parcela desse mês. A
janela transpassante avança sobre um trecho que a origem nunca precificou e é
renormalizada sobre o intervalo coberto pela origem, de modo que sua parte não coberta recebe a
densidade da parte coberta.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
}

horizon: "extremidade do horizonte\nfim do estágio T" {shape: oval}

post: "segmento pós-estudo" {
  source: "calendário da origem" {
    month: "mês precificado da origem" {width: 320}
    gap: "trecho não precificado" {style.stroke-dash: 4}
  }
  inside: "janela dentro do mês\napenas a parcela desse mês" {class: thermal}
  straddle: "janela transpassante\nrenormalizada sobre o intervalo coberto" {class: thermal}

  source.month -> inside: "horas compartilhadas ÷\nhoras do mês da origem"
  source.month -> straddle: "horas compartilhadas ÷\nhoras do mês da origem"
  source.gap -> straddle: "parte não coberta" {style.stroke-dash: 4}
}

horizon -> post: "início do segmento"
```

## 5. Estudos encadeados

Um estudo encadeado acopla dois estudos por meio de uma fronteira direita. Um estudo
a montante treina uma política sobre um horizonte mais longo ou de resolução mais grossa, e um estudo a jusante
importa um de seus conjuntos como sua fronteira direita (§1). A dependência tem um único
sentido: o estudo a montante nunca lê o estudo a jusante, e executar novamente o
estudo a jusante requer apenas a política a montante arquivada. Cada estudo sorteia sua
própria árvore de cenários, e os estágios a jusante podem ser mais finos que os do estudo a montante
— por exemplo, estágios semanais sob uma política mensal. Um único estudo cujos próprios
estágios misturam resoluções é um caso diferente, tratado em
[Estudos com múltiplas resoluções](/pt-br/math/multi-resolution-studies).

### 5.1 Conjunto de origem

Cada conjunto da política a montante precifica o estado que deixa seu estágio, na
data final desse estágio. A origem é o conjunto precificado no fim do horizonte
a jusante, a data final do último estágio do estudo a jusante; não precisa ser o
conjunto do estágio terminal do estudo a montante. A carga é recusada quando nenhum conjunto,
ou mais de um, é precificado nessa data, e também quando o conjunto selecionado é
compartilhado por mais de um nó do grafo da política (policy graph) a montante.

A figura mostra os estudos a montante e a jusante como duas linhas do tempo. Cada
conjunto a montante é precificado na data final de seu estágio, e a origem é o conjunto
precificado no fim do horizonte a jusante, desenhado aqui como um conjunto intermediário seguido por estágios
a montante posteriores. Seus cortes tornam-se o conjunto terminal fixo do
estágio $T$ do estudo a jusante, e a única aresta entre os estudos tem
sentido único.

```d2
direction: down

upstream: "estudo a montante" {
  early: "estágios anteriores\ncada conjunto precificado\nno fim de seu estágio"
  source: "conjunto de origem\nprecificado no fim do\nhorizonte a jusante"
  later: "estágios posteriores\naté o estágio terminal\na montante"
}

downstream: "estudo a jusante" {
  label.near: bottom-center
  before: "estágios anteriores a T"
  last: "estágio T\nconjunto terminal fixo"
}

upstream.source -> downstream.last: "cortes, sentido único"
```

### 5.2 Condições de compatibilidade

A carga de uma fronteira impõe estas condições ao conjunto de origem e ao estudo
a jusante:

- (a) **Conjunto de origem.** A origem é o conjunto do §5.1; caso contrário, a carga é
  recusada.
- (b) **Períodos sazonais.** Quando o estudo declara um mapa de períodos sazonais, a origem tem
  o mesmo ciclo de períodos sazonais e o mesmo número de períodos sazonais e, para toda usina
  cuja afluência o estudo modela, uma entrada com a mesma ordem PAR em toda
  período sazonal em que o estudo a modela; caso contrário, a carga é recusada.
- (c) **Correspondência de armazenamentos e defasagens.** Toda coordenada de armazenamento do
  estado terminal do estudo tem uma contraparte na origem para o mesmo reservatório, e
  toda coordenada de defasagem AR tem uma para a mesma usina e profundidade de defasagem que, quando
  ambos os lados a datam, se refere ao mesmo período passado; caso contrário, a carga é
  recusada. Um conjunto só precifica uma dimensão de armazenamento ou de defasagem AR quando a
  projeção do corte que define sua dimensão, a seleção de seu estágio sucessor, a inclui
  ([Aumento do espaço de estados — Projeção do estado dos cortes](/pt-br/math/state-augmentation#7-projecao-de-estado-do-corte));
  o conjunto terminal sempre a inclui, de modo que um conjunto de origem intermediário escolhido sob uma
  projeção somente de armazenamento não tem contraparte de defasagem AR.
- (d) **Profundidade das defasagens.** O estado de defasagens do estudo é estendido até a defasagem mais profunda
  referenciada pelos cortes de qualquer conjunto da política de fronteira: sua profundidade é a
  maior entre a ordem AR máxima do estudo e essa defasagem, de modo que todo coeficiente
  de defasagem dos cortes importados tem uma coordenada.
- (e) **Estado com data futura.** As coordenadas de slots do commitment ring e de in-transit buckets
  são conciliadas por data (§4) e recebem coeficiente nulo quando
  a origem não tem nenhum.
- (f) **Estado excedente na origem.** Uma coordenada da origem que o estudo não modela
  é descartada e relatada ou, sob a admissão mais estrita, faz a carga ser recusada.

Uma origem que precifica apenas coordenadas de armazenamento e de defasagem AR não precisa
de calendário pós-estudo, pois essas coordenadas são associadas por identidade;
somente as coordenadas com data futura do §4 são datadas nele.

A ordem das verificações e as mensagens de recusa estão em
[Gerenciamento da política — Requisitos de compatibilidade](/pt-br/running/policy-management/#requisitos-de-compatibilidade).

### 5.3 Consistência

A função importada é uma aproximação externa válida da função de custo futuro do modelo
a montante, e de nenhum outro; a política a jusante e seu limite inferior são
válidos em relação a ela. Um modelo a jusante que difere do modelo a montante —
nos coeficientes do modelo de afluências, nos reservatórios que só o estudo a montante
modela ou em suas penalidades — recebe um valor terminal precificado para um sistema
diferente, e a diferença enviesa a política a jusante perto do horizonte;
o treinamento não a corrige, pois o conjunto terminal nunca muda (§1).
Executar com valor terminal nulo, em vez disso, desacopla os dois estudos, ao
custo do efeito de fim de mundo ([Modos de horizonte §1](/pt-br/math/horizon-modes)).

## 6. Inicialização das defasagens

Todo estudo inicializa as defasagens AR de seu primeiro estágio a partir de seu histórico
de vazões realizado: a série histórica juntamente com as observações recentes de suas
condições iniciais, estas substituindo aquela em todo dia coberto por ambas,
nunca promediadas com ela. Cada defasagem é inicializada a partir de um dos períodos sazonais
que precedem o do primeiro estágio — o período imediatamente anterior para a
primeira defasagem, o anterior a esse para a segunda, e assim por diante, retrocedendo
pelo ciclo de períodos sazonais — e seu valor inicial é a média, ponderada pela duração, do histórico
sobre os dias cobertos desse período.

Quando o estudo começa no meio de um período sazonal, a parte já decorrida desse período
inicializa a acumulação parcial do período, e os primeiros estágios completam o
período pela acumulação de defasagens de
[Estudos com múltiplas resoluções](/pt-br/math/multi-resolution-studies). Um período
em andamento coberto apenas parcialmente pelo histórico é aceito, com um aviso.

A ordem autorregressiva — fornecida ou escolhida pela seleção de ordem de
[Modelo de afluências PAR(p) §3.6](/pt-br/math/par-inflow-model#36-selecao-de-ordem) — é o
número de defasagens que os coeficientes autorregressivos de cada estágio leem. Quando o estudo
fornece seus coeficientes autorregressivos, o valor inicial de toda defasagem até a
maior dessas ordens deve estar integralmente coberto pelo histórico, ou o caso é
recusado na carga, a menos que o período sazonal do primeiro estágio não possa ser resolvida: nesse caso essas
defasagens são inicializadas com zero, com um aviso. Uma defasagem nunca é igualada à média de seu
período sazonal.

Os valores iniciais condicionam as afluências dos primeiros estágios por meio dos
termos autorregressivos, sem alterar os parâmetros do modelo de afluências, de modo que um estudo inicializado a partir de
observações recentes responde às condições em que começa. Em um estudo
encadeado, o estudo a jusante inicializa suas próprias defasagens dessa forma, enquanto a fronteira
fornece apenas a função terminal (§1). A estimação, no ajuste, das
estatísticas dos períodos sazonais das defasagens fora da janela do estudo é um mecanismo diferente;
veja
[Modelo de afluências PAR(p) §3.8](/pt-br/math/par-inflow-model#38-estudos-que-cobrem-parte-do-ano-e-a-janela-de-defasagens-pre-estudo).

## Referências cruzadas

- [Aumento do espaço de estados](/pt-br/math/state-augmentation) — §5 o commitment ring
  (hold ring, linhas do ring, coeficiente do corte dos ring slots, contribuições para a função objetivo);
  §6 estado dos in-transit buckets, fixação e o truncamento por limitação do horizonte que uma
  fronteira direita remove.
- [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) — §4 o commitment ring
  das termelétricas com antecipação de despacho e §5 o tempo de viagem na cascata, a origem, no nível dos elementos, das
  duas famílias transportadas.
- [Modos de horizonte](/pt-br/math/horizon-modes) — o valor terminal nulo que uma fronteira
  direita substitui e o contexto de horizonte finito ao qual o segmento pós-estudo
  se acopla.
- [Formulação da taxa de desconto](/pt-br/math/discount-rate) — o fator acumulado estendido aos
  estágios pós-estudo.
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — §7 o resumo da fronteira terminal.
- [Estudos com múltiplas resoluções](/pt-br/math/multi-resolution-studies) — um único estudo com
  resoluções mistas; a acumulação de defasagens e a acumulação parcial do
  período que os primeiros estágios de um estudo completam, inicializada pelo §6 deste capítulo.
- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — seleção de ordem; a
  janela de defasagens pré-estudo do ajuste.
- **Execução do Novo Modelo:**
  [Gerenciamento da política](/pt-br/running/policy-management/#cortes-de-fronteira) — configuração
  da fronteira e requisitos de compatibilidade.
