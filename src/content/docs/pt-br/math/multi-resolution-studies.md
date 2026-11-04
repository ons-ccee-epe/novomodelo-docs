---
title: "Estudos com múltiplas resoluções"
description: Estudos de PDDE com resoluções mistas, com estágios mensais e trimestrais (ou semanais e mensais) — um mapa de períodos sazonais cujos períodos sazonais grossos são períodos sazonais próprios, acumulação das defasagens com transbordamento e finalização dos períodos, a reconstrução das defasagens na mudança de resolução, grupos de ruído e agregação ponderada pela duração para o ajuste do PAR.
---

## Objetivo

Um estudo com múltiplas resoluções é um único estudo cujos estágios abrangem mais
de uma resolução temporal — mais comumente um trecho inicial mensal seguido de um
trecho final trimestral, ou um trecho inicial semanal seguido de um trecho final
mensal. Todos os estágios pertencem a um único horizonte da PDDE (SDDP) e
compartilham um único conjunto de cortes da função de custo futuro; não existe
fronteira de acoplamento. O desafio de modelagem é que o modelo de afluências
PAR(p) é indexado por período sazonal, e no entanto estágios de durações diferentes se
sucedem: cada estágio deve receber os parâmetros de um período sazonal na sua própria
resolução, e suas defasagens devem ser valores de períodos sazonais completos
nessa resolução. Este capítulo descreve como o Novo Modelo trata esse desafio.

**Fronteira com estudos encadeados.** Um estudo com múltiplas resoluções é um
estudo com um conjunto de cortes. Um estudo encadeado, por outro lado, são dois
estudos: o segundo importa uma função terminal fixa, os cortes de um dos conjuntos
de cortes da política do primeiro estudo, escolhido pela data e não
necessariamente o conjunto do último estágio do primeiro estudo (veja
[Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary)). Este
capítulo é responsável pela acumulação das defasagens em subperíodos (§2).

## 1. Mapa de Períodos Sazonais

O modelo PAR(p) associa cada estágio $t$ a um período sazonal $m(t)$, e os estágios de
um mesmo período sazonal compartilham seus parâmetros $\mu_m$, $s_m$ e $\psi_{m,\ell}$. Um
estudo com múltiplas resoluções declara seus períodos sazonais grossos — por exemplo,
trimestres — como períodos sazonais próprios, com identificadores distintos dos dos
períodos sazonais finos cujo intervalo de calendário eles recobrem. Quando o mapa de
períodos sazonais sobrepõe duas resoluções sobre os mesmos dias do calendário, as datas de
um estágio, por si sós, não determinam seu período sazonal, de modo que todo estágio
informa seu período sazonal; um estágio grosso recebe, portanto, seu período sazonal grosso e os
parâmetros PAR desse período sazonal. Quando não há dois períodos sazonais sobrepostos, o período sazonal
de um estágio decorre da sua data de início, e um estágio mais curto que a janela
do seu período sazonal pode informar o período sazonal que ele subdivide.

Estágios finos que subdividem um período sazonal — por exemplo, estágios semanais que
informam o período sazonal do seu mês — compartilham os parâmetros desse período sazonal. O mapa
de períodos sazonais fixa, assim, os parâmetros de todos os estágios; as §2 e §3 descrevem
como se formam as defasagens sobre as quais esses parâmetros atuam quando os
estágios têm durações diferentes.

## 2. Acumulação das Defasagens

As defasagens do modelo PAR são valores de períodos sazonais concluídos, e não de
estágios individuais. Um **período de defasagem** $\mathcal{W}$ é uma ocorrência da
janela do período sazonal de um estágio: a janela de calendário que o período sazonal cobre em um
ciclo, como um mês específico ou um trimestre específico. Denotando também por $t$
a janela de calendário do estágio $t$, a fração do período que o estágio $t$ cobre
é

$$
w_{t,\mathcal{W}} = \frac{\lvert t \cap \mathcal{W} \rvert}{\lvert \mathcal{W} \rvert}
$$

com $\lvert t \cap \mathcal{W} \rvert$ as horas do estágio $t$ dentro de
$\mathcal{W}$ e $\lvert \mathcal{W} \rvert$ as horas do período. O valor com que
um período concluído contribui para o estado de defasagens da usina hidrelétrica
$h \in \mathcal{H}$ é a média, ponderada pela duração, das afluências realizadas
$a_{h,t}$ dos estágios $t$ que o interceptam:

$$
\frac{\sum_{t} w_{t,\mathcal{W}}\, a_{h,t}}{\sum_{t} w_{t,\mathcal{W}}}
$$

Um estágio que atravessa a fronteira de um período contribui para ambos os
períodos, cada um com sua própria fração (transbordamento). O período é concluído
no último estágio da sua ocorrência sazonal: ali, o valor concluído torna-se a
defasagem 1 e cada defasagem mais antiga recua uma posição, de modo que a
defasagem $\ell$ lida por um estágio é o valor do $\ell$-ésimo período mais recente
concluído antes dele. Em todo estágio anterior do período, o estado de defasagens
não se altera, de modo que os estágios dentro de um mesmo período enxergam as
mesmas defasagens. A acumulação parcial, isto é, as duas somas correntes da média,
acompanha cada trajetória e não é coordenada do estado dos cortes.

Em um estudo uniforme de resolução única, em que todo estágio abrange exatamente
um período sazonal, todo estágio é um período com fração 1 e a defasagem é a
afluência do estágio. A única exceção é um ciclo semanal em um ano com 53 semanas
ISO: a 53ª semana recebe o período sazonal da 52ª, de modo que esses dois estágios formam
um único período e a defasagem que eles concluem é a média das suas duas
afluências.

A figura abaixo representa essa acumulação para estágios semanais dentro de um
mês e para um trecho inicial mensal antes de um trecho final trimestral. No painel
superior, cada semana alimenta o período de defasagem do mês com sua fração das
horas do mês; a última semana atravessa o fim do mês, alimenta o período do mês
seguinte com seu transbordamento e, como último estágio do mês, conclui o período,
cuja média ponderada pela duração torna-se a defasagem 1. O colchete em torno das
semanas é o seu grupo de ruído (§4): na árvore de aberturas, elas compartilham um
único ruído por abertura. No painel inferior, desenhado para uma ordem grossa de
pelo menos 2, os meses da janela alcançada pela ordem grossa alimentam
tanto seus períodos de defasagem mensais quanto os períodos trimestrais (§3), e no
primeiro estágio trimestral o estado de defasagens é reconstruído a partir dos
períodos trimestrais concluídos, do mais recente para o mais antigo.

```d2
direction: down

classes: {
  hydro: {style: {stroke: "#4a90b8"}}
}

weekly: "Estágios semanais em um mês" {
  direction: down

  group: "grupo de ruído\nmesmo período sazonal e ano de início:\num ruído por abertura\nda árvore de aberturas" {
    direction: right
    wk_a: "semana"
    wk_b: "semana"
    wk_c: "semana"
    wk_last: "última semana\natravessa o\nfim do mês"
  }

  month_period: "período de defasagem do mês\nfração de cada semana\nnas horas do mês" {class: hydro}
  next_period: "período de defasagem\ndo mês seguinte" {class: hydro}
  lag_one: "estado de defasagens\ndefasagem 1 = média ponderada pela duração" {shape: oval; class: hydro}

  group.wk_a -> month_period: "fração"
  group.wk_b -> month_period: "fração"
  group.wk_c -> month_period: "fração"
  group.wk_last -> month_period: "fração"
  group.wk_last -> next_period: "transbordamento"
  month_period -> lag_one: "concluído na\núltima semana"
}

coarse: "De mensal para trimestral" {
  direction: down

  window: "janela alcançada pela ordem grossa" {
    direction: right
    months_old: "meses de um\ntrimestre anterior"
    months_new: "meses do\ntrimestre mais recente"
  }

  month_lags: "períodos de defasagem mensais" {class: hydro}
  quarter_old: "período trimestral\nanterior, concluído,\ntorna-se a defasagem 2" {class: hydro}
  quarter_new: "período trimestral\nmais recente, concluído,\ntorna-se a defasagem 1" {class: hydro}
  first_quarter: "primeiro estágio trimestral\nestado de defasagens reconstruído,\ndo mais recente ao mais antigo"

  window.months_old -> month_lags
  window.months_new -> month_lags
  window.months_old -> quarter_old: "fração das\nhoras do trimestre"
  window.months_new -> quarter_new: "fração das\nhoras do trimestre"
  quarter_new -> first_quarter
  quarter_old -> first_quarter
}

weekly -> coarse: "mesma regra de fração\ne de transbordamento"
```

## 3. Mudança de Resolução

Os coeficientes AR de um período sazonal grosso atuam sobre defasagens de períodos
grossos, de modo que o estado de defasagens muda de resolução junto com os
estágios. Quando estágios finos precedem estágios grossos que possuem períodos sazonais
grossos próprios (§1) — um trecho inicial mensal antes de um trecho final
trimestral —, os estágios finos da janela anterior ao primeiro estágio grosso
também se acumulam nos períodos grossos, tantos quantos a ordem do modelo grosso
alcança para trás, com as frações e o transbordamento da §2. No primeiro estágio
grosso, o estado de defasagens é reconstruído a partir desses períodos grossos
concluídos, do mais recente para o mais antigo: o mais recente torna-se a
defasagem 1, o anterior a defasagem 2, e assim por diante. A partir daí, a
acumulação ocorre na resolução grossa.

## 4. Grupos de Ruído

Na árvore de aberturas, estágios consecutivos que compartilham um período sazonal e o ano
civil do seu início formam um **grupo de ruído** e compartilham um único ruído por
abertura, como quando vários estágios semanais caem dentro de um período sazonal mensal.
Um estágio posterior de um grupo não tem mais aberturas que o primeiro estágio do grupo, e
um com menos compartilha as primeiras delas.
Na árvore de aberturas, portanto, o ruído $\varepsilon_t$ de um período sazonal não é
reamostrado para cada estágio em que o período sazonal é subdividido. Um estágio sem
período sazonal forma seu próprio grupo, e em um estudo uniforme de resolução única todo
grupo é um único estágio, de modo que cada estágio é sorteado de forma
independente, exceto que, em um ciclo semanal, a 53ª semana de um ano de 53
semanas recebe o período sazonal da 52ª e entra no seu grupo. A regra de amostragem está
enunciada em [Geração de cenários](/pt-br/math/scenario-generation); a atribuição dos
grupos depende apenas do calendário dos estágios, de modo que todo processo (rank
MPI) calcula os mesmos grupos (veja
[Determinismo e rastreabilidade](/pt-br/math/determinism-guarantees)).

Ao longo de uma trajetória, os estágios dentro de um mesmo período de defasagem
enxergam as mesmas defasagens (§2).

## 5. Agregação Ponderada pela Duração para o Ajuste

As estatísticas sazonais de um período sazonal devem se referir à resolução em que o seu
modelo PAR é avaliado. Quando um período sazonal é mais grosso que o histórico de
observações — um período sazonal trimestral sobre um histórico mensal —, as observações
de cada ocorrência integralmente observada desse período sazonal são reduzidas à sua média
ponderada pela duração antes da estimação, de modo que as estatísticas do período sazonal
se refiram à sua própria resolução. O agregado é uma média, e não uma soma: mantém
as unidades de uma vazão, e observações de durações diferentes, como meses de
comprimentos diferentes, pesam em proporção à sua duração. O procedimento de
estimação do PAR de
[Modelo de afluências PAR(p) §3](/pt-br/math/par-inflow-model#3-estimacao) aplica-se
então por período sazonal sem modificação, e cada estágio recebe os parâmetros do seu
período sazonal quando as grandezas PAR de execução são montadas
([Modelo de afluências PAR(p) §4.2](/pt-br/math/par-inflow-model#42-grandezas-em-execucao)).
O ajuste de um período sazonal grosso enxerga apenas a variação na resolução grossa: a
variação entre as observações finas dentro de uma ocorrência não chega aos seus
parâmetros.

## Referências Cruzadas

- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — O procedimento de ajuste (§3) que se aplica às estatísticas agregadas; o conjunto de parâmetros que as estatísticas agregadas preenchem; a forma pronta para o PL que os estágios trimestrais usam em tempo de execução.
- [Geração de cenários](/pt-br/math/scenario-generation) — Geração da árvore de aberturas que produz os vetores de ruído por estágio; a regra de amostragem por grupo de ruído.
- [Fronteira pós-estudo e estudos encadeados](/pt-br/math/post-study-boundary) — Dois estudos acoplados por uma função terminal importada da política de montante, em vez de um único estudo com estágios mistos; a inicialização das defasagens no início de um estudo.
