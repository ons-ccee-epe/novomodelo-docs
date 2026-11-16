---
title: Bibliografia
description: Fontes externas citadas nos capítulos de metodologia.
---

Esta bibliografia reúne todas as fontes externas citadas nos capítulos de
metodologia deste site, além de referências de base nas quais a metodologia se
apoia sem citá-las diretamente. Os capítulos citam cada entrada de forma abreviada,
por autor e ano, com link para a seção abaixo que a contém.

Para termos do domínio, veja o [Glossário](/reference/glossary).

---

## Fundamentos da PDDE (SDDP)

- **Benders, J.F.** (1962). Partitioning procedures for solving mixed-variables programming problems. _Numerische Mathematik_, 4(1), 238–252. [doi:10.1007/BF01386316](https://doi.org/10.1007/BF01386316)
  O artigo original da decomposição de Benders. Base do método L-shaped e da PDDE.
  _Referência de base para [Algoritmo da PDDE](/math/sddp-algorithm), [Gerenciamento de cortes](/math/cut-management), [O que o Novo Modelo resolve](/overview/what-novomodelo-solves)._

- **Pereira, M.V.F. & Pinto, L.M.V.G.** (1991). Multi-stage stochastic optimization applied to energy planning. _Mathematical Programming_, 52(1–3), 359–375. [doi:10.1007/BF01582895](https://doi.org/10.1007/BF01582895)
  O artigo original da PDDE. Fundamental para todo o algoritmo e para a aplicação ao despacho hidrotérmico que motiva o Novo Modelo.
  _Referência de base para [Algoritmo da PDDE](/math/sddp-algorithm), [O que o Novo Modelo resolve](/overview/what-novomodelo-solves)._

- **Birge, J.R.** (1985). Decomposition and partitioning methods for multistage stochastic linear programs. _Operations Research_, 33(5), 989–1007. [doi:10.1287/opre.33.5.989](https://doi.org/10.1287/opre.33.5.989)
  Decomposição aninhada para programas lineares estocásticos multiestágio: cada estágio passa suas decisões adiante e recebe cortes de seus sucessores, o esquema que a PDDE aplica sobre cenários amostrados.
  _Referência de base para [Algoritmo da PDDE](/math/sddp-algorithm)._

- **Birge, J.R. & Louveaux, F.V.** (1988). A multicut algorithm for two-stage stochastic linear programs. _European Journal of Operational Research_, 34(3), 384–392. [doi:10.1016/0377-2217(88)90159-2](https://doi.org/10.1016/0377-2217(88)90159-2)
  O método L-shaped multicorte (multi-cut), que mantém um corte por realização, enquanto o método de corte único (single-cut) agrega as realizações em um só corte. A formulação de corte único de [Gerenciamento de cortes](/math/cut-management) é contrastada com ele.
  _Citado em [Gerenciamento de cortes](/math/cut-management) §3, [Algoritmo da PDDE](/math/sddp-algorithm) §6._

- **Birge, J.R. & Louveaux, F.V.** (2011). _Introduction to Stochastic Programming_, 2nd edition. Springer. [doi:10.1007/978-1-4614-0237-4](https://doi.org/10.1007/978-1-4614-0237-4)
  Livro-texto de referência sobre a teoria de programação estocástica e métodos de decomposição.
  _Referência de base para [Algoritmo da PDDE](/math/sddp-algorithm)._

- **Philpott, A.B. & Guan, Z.** (2008). On the convergence of stochastic dual dynamic programming and related methods. _Operations Research Letters_, 36(4), 450–455. [doi:10.1016/j.orl.2008.01.013](https://doi.org/10.1016/j.orl.2008.01.013)
  Teoria de convergência da PDDE com um número finito de cenários.
  _Referência de base para [Gerenciamento de cortes](/math/cut-management)._

- **Shapiro, A.** (2011). Analysis of stochastic dual dynamic programming method. _European Journal of Operational Research_, 209(1), 63–72. [doi:10.1016/j.ejor.2010.08.007](https://doi.org/10.1016/j.ejor.2010.08.007)
  Análise de convergência, limites de complexidade e extensões avessas ao risco para a PDDE.
  _Citado em [Medidas de risco](/math/risk-measures) §10._

- **Dowson, O.** (2020). The policy graph decomposition of multistage stochastic programming problems. _Networks_, 76(1), 3–23. [doi:10.1002/net.21932](https://doi.org/10.1002/net.21932)
  Define o grafo da política (policy graph): nós com subproblemas locais e conjuntos de cortes, ligados por arestas ponderadas por probabilidades, entre os quais um ciclo representa um horizonte infinito.
  _Citado em [Grafos da política](/math/policy-graphs) §4, [Modos de horizonte](/math/horizon-modes) §6._

---

## Gerenciamento de cortes e convergência

- **de Matos, V.L., Philpott, A.B. & Finardi, E.C.** (2015). Improving the performance of Stochastic Dual Dynamic Programming. _Journal of Computational and Applied Mathematics_, 290, 196–208. [doi:10.1016/j.cam.2015.04.048](https://doi.org/10.1016/j.cam.2015.04.048)
  Estratégias de seleção de cortes para a PDDE, incluindo o critério de cortes ativos de Nível 1 (Level-1).
  _Citado em [Gerenciamento de cortes](/math/cut-management) §7, §8._

- **Guigues, V. & Römisch, W.** (2012). Sampling-based decomposition methods for multistage stochastic programs based on extended polyhedral risk measures. _SIAM Journal on Optimization_, 22(2), 286–312. [doi:10.1137/100811696](https://doi.org/10.1137/100811696)
  Métodos de decomposição baseados em amostragem, entre eles a PDDE, avessos ao risco sob medidas de risco poliédricas estendidas, uma classe que contém o CVaR, com prova de convergência.
  _Citado em [Gerenciamento de cortes](/math/cut-management) §4 (Camada 2), [A PDDE em uma página](/overview/sddp-framework-overview) §2._

- **Guigues, V.** (2016). Convergence analysis of sampling-based decomposition methods for risk-averse multistage stochastic convex programs. _SIAM Journal on Optimization_, 26(4), 2468–2494. [doi:10.1137/140983136](https://doi.org/10.1137/140983136)
  Convergência dos métodos de decomposição baseados em amostragem avessos ao risco, entre eles a PDDE, para programas estocásticos convexos multiestágio.
  _Citado em [Gerenciamento de cortes](/math/cut-management) §4 (Camada 2), [A PDDE em uma página](/overview/sddp-framework-overview) §2._

- **Guigues, V.** (2017). Dual dynamic programing with cut selection: Convergence proof and numerical experiments. _European Journal of Operational Research_, 258(1), 47–57. [doi:10.1016/j.ejor.2016.10.047](https://doi.org/10.1016/j.ejor.2016.10.047)
  Define a seleção de cortes Nível 1 com memória limitada (Limited-Memory Level 1, LML1), que mantém em cada estado visitado apenas o mais antigo dos cortes de maior valor nesse ponto, e prova a convergência da programação dinâmica dual com ela.
  _Citado em [Gerenciamento de cortes](/math/cut-management) §6, §7, §9._

- **Bandarra, M. & Guigues, V.** (2021). Single cut and multicut stochastic dual dynamic programming with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments. _Computational Management Science_, 18(2), 125–148. [doi:10.1007/s10287-021-00387-8](https://doi.org/10.1007/s10287-021-00387-8). Preprint: [arXiv:1902.06757](https://arxiv.org/abs/1902.06757)
  Prova de convergência da PDDE com corte único e com multicorte sob as seleções de cortes Nível 1 e LML1: com um número finito de cenários, uma solução ótima do primeiro estágio após um número finito de iterações, com probabilidade 1.
  _Citado em [Gerenciamento de cortes](/math/cut-management) §9._

---

## Medidas de risco

- **Rockafellar, R.T. & Uryasev, S.** (2000). Optimization of conditional value-at-risk. _Journal of Risk_, 2(3), 21–41. [doi:10.21314/JOR.2000.038](https://doi.org/10.21314/JOR.2000.038)
  Definição do CVaR e a linearização que permite incorporá-lo a problemas de programação linear — a base da agregação de cortes avessa ao risco na PDDE.
  _Referência de base para [Medidas de risco](/math/risk-measures)._

- **Philpott, A.B. & de Matos, V.L.** (2012). Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion. _European Journal of Operational Research_, 218(2), 470–483. [doi:10.1016/j.ejor.2011.10.056](https://doi.org/10.1016/j.ejor.2011.10.056)
  Amostragem dinâmica com aversão ao risco e transições markovianas de cenários.
  _Referência de base para [Medidas de risco](/math/risk-measures)._

- **Philpott, A.B., de Matos, V.L. & Finardi, E.C.** (2013). On solving multistage stochastic programs with coherent risk measures. _Operations Research_, 61(4), 957–970. [doi:10.1287/opre.2013.1175](https://doi.org/10.1287/opre.2013.1175)
  PDDE avessa ao risco e consistente no tempo com CVaR. Representação dual e pesos de agregação para a geração de cortes avessa ao risco, uma prova de convergência do método avesso ao risco e uma aproximação interna da função de custo futuro a partir da qual se avalia um limite superior determinístico.
  _Citado em [Medidas de risco](/math/risk-measures) §9, §10, [Gerenciamento de cortes](/math/cut-management) §4 (Camada 2), [A PDDE em uma página](/overview/sddp-framework-overview) §2, [Avaliação do limite superior](/math/upper-bound-evaluation) (Apêndice, Referências)._

---

## Avaliação do limite superior

- **Costa, B.F.P. & Leclère, V.** (2023). Duality of upper bounds in stochastic dynamic programming. _Optimization Online_. Preprint: [optimization-online.org/?p=23738](https://optimization-online.org/?p=23738)
  Arcabouço de dualidade para limites superiores por aproximação interna, construído sobre a aproximação interna de Philpott, de Matos & Finardi (2013). Base do estimador por aproximação interna SIDP descrito em [Avaliação do limite superior](/math/upper-bound-evaluation).
  _Citado em [Avaliação do limite superior](/math/upper-bound-evaluation) (Apêndice, Referências)._

---

## Produção hidrelétrica

- **Diniz, A.L. & Maceira, M.E.P.** (2008). A four-dimensional model of hydro generation for the short-term hydrothermal dispatch problem considering head and spillage effects. _IEEE Transactions on Power Systems_, 23(3), 1298–1308. [doi:10.1109/TPWRS.2008.922253](https://doi.org/10.1109/TPWRS.2008.922253)
  A função de produção hidrelétrica linear por partes (FPHA): a geração em função do armazenamento, da vazão turbinada e do vertimento, com a queda calculada a partir dos níveis de montante e de jusante e as regiões não côncavas da função exata aproximadas por convexificação e regressão. Origem da abordagem ajustada em [Modelos de função de produção hidrelétrica](/math/hydro-production-models) §2. O Novo Modelo ajusta seus planos sobre armazenamento e vazão turbinada com vertimento = 0 e representa o efeito do vertimento por uma secante de vazão lateral por plano, em vez de um eixo de vertimento no ajuste.
  _Citado em [Modelos de função de produção hidrelétrica](/math/hydro-production-models) §2._

---

## Modelagem de afluências

- **Box, G.E.P. & Jenkins, G.M.** (1976). _Time Series Analysis: Forecasting and Control_, revised edition. Holden-Day, San Francisco.
  Livro-texto fundamental sobre modelagem de séries temporais ARMA / autorregressivas e sobre o método de estimação de Yule-Walker, no qual se baseia o procedimento de ajuste do modelo PAR(p). Seu estimador da autocovariância amostral usa o divisor populacional $1/N$.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §3.2. Referência de base para [Geração de cenários](/math/scenario-generation)._

- **Hipel, K.W. & McLeod, A.I.** (1994). _Time Series Modelling of Water Resources and Environmental Systems_. Elsevier, Amsterdam.
  O capítulo 14 é a apresentação canônica dos modelos periódicos: a definição do modelo PAR, as convenções de autocovariância/FAC periódicas (a observação mais recente define o período sazonal), as equações periódicas de Yule-Walker, a identidade da variância na defasagem 0, a FACP periódica com sua faixa de significância $\pm 1.96/\sqrt{N_m}$ e a condição de estacionariedade periódica. O procedimento de ajuste do Novo Modelo é essa formulação escrita na forma de correlações sobre a série padronizada por $s_m$.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §3.5._

- **Maceira, M.E.P. & Damázio, J.M.** (2006). Use of the PAR(p) model in the stochastic dual dynamic programming optimization scheme used in the operation planning of the Brazilian hydropower system. _Probability in the Engineering and Informational Sciences_, 20(1), 143–156. [doi:10.1017/S0269964806060098](https://doi.org/10.1017/S0269964806060098)
  O modelo autorregressivo periódico PAR(p), tal como ajustado na PDDE para o sistema brasileiro. Origem do procedimento iterativo de redução da ordem AR que mantém não negativas as contribuições compostas das defasagens.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §3.6, §7.6._

- **Treistman, F., Maceira, M.E.P., Damázio, J.M. & Cruz, C.B.** (2020). Periodic time series model with annual component applied to operation planning of hydrothermal systems. In _2020 International Conference on Probabilistic Methods Applied to Power Systems (PMAPS)_, Liège, Belgium, 1–6. [doi:10.1109/PMAPS47429.2020.9183472](https://doi.org/10.1109/PMAPS47429.2020.9183472)
  O modelo PAR(p)-A: o modelo autorregressivo periódico acrescido de uma componente anual, um termo de regressão sobre a média anual móvel (a média das doze vazões mensais anteriores), que estende a memória do modelo a longos períodos secos e úmidos.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §7._

- **Larroyd, P.V., Pedrini, R., Beltrán, F., Teixeira, G., Finardi, E.C. & Picarelli, L.B.** (2022). Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem. _Energies_, 15(3), 1115. [doi:10.3390/en15031115](https://doi.org/10.3390/en15031115)
  Estratégias de penalidade, truncamento e truncamento combinado com penalidade para vazões afluentes negativas do modelo PAR(p) na PDDE: em todas elas, o estado do modelo PAR mantém a realização bruta e uma correção acrescenta água à vazão afluente recebida pelo balanço hídrico, limitada ao montante truncado nas estratégias de truncamento. Sua §2.5 mostra que, com truncamento, os valores dos problemas dos estágios ficam abaixo dos problemas mestres construídos a partir dos cortes, de modo que o limite inferior pode superar um limite superior avaliado sobre os problemas dos estágios.
  _Citado em [Métodos de tratamento de afluências negativas](/math/inflow-nonnegativity) §6.2, §7, §9._

- **Maceira, M.E.P., Terry, L.A., Costa, F.S., Damázio, J.M. & Melo, A.C.G.** (2002). Chain of optimization models for setting the energy dispatch and spot price in the Brazilian system. In _Proceedings of the 14th Power Systems Computation Conference (PSCC)_, Seville, Spain.
  A cadeia de modelos de otimização NEWAVE / DECOMP / GEVAZP para o sistema brasileiro, na qual o estudo de médio prazo obtém sua função de custo futuro terminal dos cortes da política de longo prazo. Origem da árvore de cenários no estilo do DECOMP — um tronco determinístico com ramificação no último estágio —, expressa como um leque terminal de nós irmãos percorridos por seleção enumerada, e contrapartida publicada dos estudos encadeados de [Fronteira pós-estudo e estudos encadeados](/math/post-study-boundary) §5.
  _Citado em [Geração de cenários](/math/scenario-generation) §6, [Fronteira pós-estudo e estudos encadeados](/math/post-study-boundary) §5._

---

## Condições de contorno e modos de horizonte

- **Birge, J.R. & Zhao, G.** (2007). Successive linear approximation solution of infinite-horizon dynamic stochastic programs. _SIAM Journal on Optimization_, 18(4), 1165–1186. [doi:10.1137/060665506](https://doi.org/10.1137/060665506)
  Programas lineares estocásticos de horizonte infinito com desconto, resolvidos por aproximação por planos de corte de uma função de valor estacionária, com prova de convergência.
  _Citado em [Modos de horizonte](/math/horizon-modes) §6._

- **Shapiro, A. & Ding, L.** (2020). Periodical multistage stochastic programs. _SIAM Journal on Optimization_, 30(3), 2083–2102. [doi:10.1137/19M129406X](https://doi.org/10.1137/19M129406X)
  Programas multiestágio de horizonte infinito com dados periódicos: o análogo periódico das equações de Bellman com desconto, cujas funções de valor se repetem com o período, e o algoritmo da PDDE que compartilha cortes entre os estágios de um mesmo período.
  _Citado em [Modos de horizonte](/math/horizon-modes) §6._

- **Costa, B.F.P., Calixto, A.O., Sousa, R.F.S., Figueiredo, R.T., Penna, D.D.J., Khenayfis, L.S. & Oliveira, A.M.R.** (2025). Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach. _Proceeding Series of the Brazilian Society of Computational and Applied Mathematics_, 11(1), 1–7. [doi:10.5540/03.2025.011.01.0355](https://doi.org/10.5540/03.2025.011.01.0355)
  Grafo da política periódico e formulação da PDDE com horizonte infinito para o planejamento da operação hidrotérmica. O projeto cíclico reservado descrito em [Modos de horizonte](/math/horizon-modes) segue sua apresentação da função de período sazonal $\tau(t)$, da desigualdade de convergência do ciclo, do conjunto de cortes indexado por período sazonal com sua equação de compartilhamento de cortes e do operador de Bellman de ponto fixo.
  _Citado em [Modos de horizonte](/math/horizon-modes) §6._

---

## Aumento do espaço de estados

- **Diniz, A.L. & Maceira, M.E.P.** (2013). Multi-lag Benders decomposition for power generation planning with nonanticipativity constraints on the dispatch of LNG thermal plants. In H.I. Gassmann & W.T. Ziemba (eds.), _Stochastic Programming: Applications in Finance, Energy, Planning and Logistics_, World Scientific Series in Finance, 443–464. [doi:10.1142/9789814407519_0016](https://doi.org/10.1142/9789814407519_0016)
  Despacho térmico decidido estágios antes da entrega, representado como estado dos subproblemas dos estágios da PDDE: a contrapartida publicada dos compromissos de despacho antecipado de [Aumento do espaço de estados](/math/state-augmentation) §5.
  _Citado em [Aumento do espaço de estados](/math/state-augmentation) §5._

---

## Referências de software

- **Dowson, O. & Kapelevich, L.** (2021). SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming. _INFORMS Journal on Computing_, 33(1), 27–33. [doi:10.1287/ijoc.2020.0987](https://doi.org/10.1287/ijoc.2020.0987). Documentação: [sddp.dev](https://sddp.dev/stable/)
  Implementação de referência da PDDE em Julia. Influenciou as abstrações de esquemas de amostragem, a estrutura de medida de risco por combinação convexa e as convenções de notação do Novo Modelo. Sua medida `EAVaR` põe o peso $\lambda$ no valor esperado; [Medidas de risco](/math/risk-measures) §3 dá a correspondência com o $\lambda$ do Novo Modelo.
  _Citado em [Convenções de notação](/overview/notation-conventions), [Geração de cenários](/math/scenario-generation) §3, [Medidas de risco](/math/risk-measures) §3, [Grafos da política](/math/policy-graphs) §4._

- **Huangfu, Q. & Hall, J.A.J.** (2018). Parallelizing the dual revised simplex method. _Mathematical Programming Computation_, 10(1), 119–142. [doi:10.1007/s12532-017-0130-5](https://doi.org/10.1007/s12532-017-0130-5)
  Implementação do simplex dual do HiGHS. O HiGHS é o solver de PL padrão do Novo Modelo.
  _Referência de base para [Aproveitamento de base do PL](/math/lp-warm-start)._

---

## Métodos numéricos

- **Tomlin, J.A.** (1975). On scaling linear programming problems. In _Computational Practice in Mathematical Programming_, Mathematical Programming Studies 4, 146–166. [doi:10.1007/BFb0120718](https://doi.org/10.1007/BFb0120718)
  Compara métodos de escalonamento para programas lineares, entre eles o escalonamento pela média geométrica, que define o fator de cada linha ou coluna a partir da maior e da menor magnitude nela.
  _Citado em [Estrutura e escalonamento do PL](/math/lp-layout-and-scaling) §2.2._

- **Higham, N.J.** (1988). Computing a nearest symmetric positive semidefinite matrix. _Linear Algebra and its Applications_, 103, 103–118. [doi:10.1016/0024-3795(88)90223-6](https://doi.org/10.1016/0024-3795(88)90223-6)
  A matriz simétrica semidefinida positiva mais próxima de uma matriz simétrica, na norma de Frobenius, é a matriz com seus autovalores negativos zerados: o truncamento de autovalores aplicado na fatoração da matriz de correlação espacial.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §6, [Geração de cenários](/math/scenario-generation) §2.1._

- **Elble, J.M. & Sahinidis, N.V.** (2012). Scaling linear optimization problems prior to application of the simplex method. _Computational Optimization and Applications_, 52(2), 345–371. [doi:10.1007/s10589-011-9420-4](https://doi.org/10.1007/s10589-011-9420-4)
  Comparação computacional dos métodos de escalonamento aplicados antes do método simplex, entre eles o escalonamento pela média geométrica e a equilibração.
  _Citado em [Estrutura e escalonamento do PL](/math/lp-layout-and-scaling) §2.2._

- **Higham, N.J.** (2002). Computing the nearest correlation matrix — a problem from finance. _IMA Journal of Numerical Analysis_, 22(3), 329–343. [doi:10.1093/imanum/22.3.329](https://doi.org/10.1093/imanum/22.3.329)
  O problema da matriz de correlação mais próxima, que acrescenta à projeção sobre as matrizes semidefinidas positivas a restrição de diagonal unitária que o truncamento de autovalores não preserva.
  _Citado em [Modelo de afluências PAR(p)](/math/par-inflow-model) §6._

---

## Contexto do setor elétrico brasileiro

- **CEPEL — Centro de Pesquisas de Energia Elétrica** (n.d.). _Documentação Técnica dos modelos para Planejamento da Operação do SIN – Ambiente Libs_. Manual on-line: [see.cepel.br/manual/libs/latest/](https://see.cepel.br/manual/libs/latest/)
  Documentação oficial do conjunto de modelos de despacho estocástico NEWAVE / DECOMP / DESSEM, utilizados na operação do sistema brasileiro. Citada apenas para termos e notação usuais no setor: as tabelas de termos equivalentes do glossário, a distribuição dos resíduos do GEVAZP (seção _Distribuição Lognormal 3 parâmetros_) e a notação do modelo PAR(p) (seção _Modelo Autorregressivo Periódico - Par(p)_). Os métodos implementados nesses modelos são creditados aos respectivos artigos originais, listados acima: FPHA → Diniz & Maceira (2008); PAR(p) e redução iterativa de ordem → Maceira & Damázio (2006); PAR(p)-A → Treistman et al. (2020); árvore de cenários no estilo do DECOMP → Maceira et al. (2002). O modelo de enchimento de volume morto do Novo Modelo é próprio e não é atribuído aqui.
  _Citado em [Glossário — Ecossistema do setor elétrico brasileiro](/reference/glossary/#ecossistema-do-setor-eletrico-brasileiro) e [Glossário — Termos equivalentes em outras ferramentas de planejamento](/reference/glossary/#termos-equivalentes-em-outras-ferramentas-de-planejamento)._
