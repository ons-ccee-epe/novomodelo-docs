---
title: "Como ler este site"
description: Guia de navegação — as seções da barra lateral, o que cada uma cobre e roteiros de leitura para diferentes perfis de leitor.
---

## Objetivo

Este capítulo é um guia de navegação. Ele descreve as seções da barra lateral do site, explica o que cada seção cobre e sugere roteiros de leitura para diferentes perfis de leitor. Quem estiver avaliando se este site atende às suas necessidades deve ler este capítulo primeiro.

## 1. Estrutura do Site

O site está organizado nas seções exibidas na barra lateral, nesta ordem: Comece aqui, Entidades do modelo, Referência metodológica, Rodando estudos, Referência de execução e Exemplos resolvidos. Cada seção de referência vem logo depois da seção que complementa: a Referência metodológica depois de Entidades do modelo, e a Referência de execução depois de Rodando estudos. As duas seções de referência começam recolhidas.

**Comece aqui** responde o que o Novo Modelo calcula ([O que o Novo Modelo resolve](/pt-br/overview/what-novomodelo-solves)) e reúne [Como o modelo decide](/pt-br/overview/how-the-model-decides), o ciclo de decisão do modelo em uma página, e este guia de navegação. Quem estiver avaliando se o Novo Modelo se aplica ao seu problema deve começar por aqui.

**Entidades do modelo** explica o modelo uma entidade por vez, com uma página para cada uma das 16 entidades: o que cada entidade é, o que o modelo decide sobre ela e onde estão suas fórmulas e seus arquivos. Quatro subseções seguem as colunas da figura da [página inicial](/pt-br/#entidades): **Vazão** ([Afluências e modelo PAR(p)](/pt-br/entities/hydrology/inflows), [Cenários e aberturas](/pt-br/entities/hydrology/scenarios)), **Geração** ([Usinas hidrelétricas](/pt-br/entities/equipment/hydro-plants), [Usinas termelétricas](/pt-br/entities/equipment/thermal-plants), [Fontes não despacháveis](/pt-br/entities/equipment/non-controllable-sources), [Usinas elevatórias](/pt-br/entities/equipment/pumping-stations)), **Rede** ([Barramentos e subsistemas](/pt-br/entities/network/buses), [Linhas e intercâmbios](/pt-br/entities/network/lines), [Contratos de energia](/pt-br/entities/network/energy-contracts)) e **Consumo** ([Carga](/pt-br/entities/network/load), [Déficit](/pt-br/entities/network/deficit)). O [horizonte](/pt-br/entities/hydrology/time-structure), o [valor da água](/pt-br/entities/rules/water-value) e as regras do jogo ([restrições genéricas](/pt-br/entities/rules/generic-constraints), [penalidades](/pt-br/entities/rules/penalties) e [aversão a risco](/pt-br/entities/rules/risk-aversion)) fecham a seção.

**Referência metodológica** reúne os cinco blocos da metodologia descritos a seguir, seguidos do [Glossário](/pt-br/reference/glossary) e da [Bibliografia](/pt-br/reference/bibliography). Quem lê as páginas de entidades recorre a ela para a formulação completa por trás de cada entidade.

**Introdução** (o primeiro bloco da Referência metodológica) estabelece a base conceitual e de notação para o restante do site: uma apresentação em uma página do algoritmo de PDDE (SDDP) para leitores sem experiência em programação dinâmica estocástica ([A PDDE em uma página](/pt-br/overview/sddp-framework-overview)), a notação completa usada em todo o site ([Convenções de notação](/pt-br/overview/notation-conventions)) e, como complemento, este guia de navegação (mantido em Comece aqui). Seus capítulos podem ser lidos em sequência ou consultados individualmente.

**Modelagem do Sistema** define as entidades do sistema elétrico e o PL do estágio que o Novo Modelo resolve a cada iteração. Este bloco é a base matemática de tudo o que se segue: usinas hidrelétricas, usinas termelétricas, linhas de transmissão, estruturas de penalidade, o PL do estágio e o estado que ele transporta entre estágios. Quem deseja entender como o sistema físico é representado na otimização deve começar por aqui.

**Modelagem Estocástica** trata do modelo de incerteza das afluências. O Novo Modelo utiliza modelos autorregressivos periódicos (PAR) para gerar árvores de cenários; este bloco explica o grafo da política (policy graph) que liga os estágios, a estrutura do modelo PAR e seu procedimento de ajuste, o tratamento de realizações negativas de afluência, o fluxo de geração de cenários e os estudos que combinam diferentes resoluções de estágio. Quem se interessa pelo tratamento da incerteza, sem se preocupar com o algoritmo de otimização, pode ler este bloco independentemente de O Algoritmo de PDDE.

**O Algoritmo de PDDE** é o núcleo da metodologia. Cobre as simulações forward e backward, a geração e o gerenciamento de cortes, a estrutura do PL e seu escalonamento (scaling), as estratégias de aproveitamento de base, as medidas de risco, os critérios de parada, a avaliação do limite superior e as garantias de determinismo. Leitores vindos da literatura de PDDE encontrarão aqui as conexões com os tratamentos clássicos; leitores sem experiência em PDDE devem ler antes Introdução e Modelagem do Sistema.

**Acoplamento e Condições de Contorno** trata de como o horizonte de um estudo é fechado: o modo de horizonte, a fronteira pós-estudo que valora o estado deixado ao final do horizonte (incluindo estudos encadeados) e como o desconto interage com a aproximação por cortes. Veja [Modos de horizonte](/pt-br/math/horizon-modes) como ponto de entrada.

**Rodando estudos** segue as etapas de um estudo. A [Instalação](/pt-br/getting-started/installation) abre a seção. **Modos de execução** trata das três formas de executar o Novo Modelo: pela CLI ([Guia rápido](/pt-br/getting-started/quickstart)), pelo Python ([Guia rápido em Python](/pt-br/getting-started/python-quickstart)) ou por meio de um agente de IA ([Agentes de IA](/pt-br/running/mcp-server)). **Preparando o caso** trata dos arquivos de entrada ([Formato do caso](/pt-br/reference/case-format/)), das opções da execução ([Configuração](/pt-br/running/configuration)) e da conversão de um caso existente ([Conversão de casos](/pt-br/running/case-conversion)). **Executando o estudo** trata do treinamento e da simulação ([Executando estudos](/pt-br/running/running-studies)) e do reaproveitamento de uma política treinada ([Gerenciamento da política](/pt-br/running/policy-management)). **Desempenho e escala** trata dos [Aceleradores de desempenho](/pt-br/running/performance) e da [Implantação em HPC e clusters](/pt-br/running/hpc-deployment). **Analisando resultados** trata dos arquivos de saída ([Formato de saída](/pt-br/reference/output/)) e da leitura da convergência ([Convergência e diagnóstico](/pt-br/running/interpreting-results)). A [Solução de problemas](/pt-br/running/troubleshooting) fecha a seção e cobre falhas de todas as etapas. Quem executa estudos volta a esta seção depois do primeiro estudo.

**Referência de execução** reúne as páginas de consulta para executar estudos: a linguagem das [Restrições genéricas](/pt-br/reference/generic-constraints), os [Esquemas JSON](/pt-br/reference/json-schemas), os [Códigos de erro](/pt-br/reference/error-codes), o [Esquema FlatBuffers da política](/pt-br/reference/flatbuffers-schema), a [Referência da CLI](/pt-br/reference/cli-reference) e a [API Python](/pt-br/reference/python-api). Use esta seção como material de consulta, não como ponto de partida.

**Exemplos Resolvidos** traz dois roteiros didáticos do ciclo da PDDE: um caso-exemplo com um único reservatório e um caso-exemplo com quatro reservatórios, ambos pequenos o bastante para verificação manual. Esses capítulos percorrem a simulação forward, a simulação backward, a construção dos cortes e a atualização do limite inferior com números concretos. O repositório do novomodelo inclui os casos executáveis [`examples/1dtoy`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/1dtoy) e [`examples/4ree`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/4ree); cada roteiro informa como seus números se relacionam com o respectivo caso. Quem aprende PDDE na prática deve começar pelos exemplos resolvidos depois de ler a Introdução.

## 2. Ferramentas e Interfaces

O Novo Modelo é executado pelo programa de linha de comando `novomodelo` e pelo pacote `novomodelo-python`. [O que o Novo Modelo resolve §4](/pt-br/overview/what-novomodelo-solves#4-como-o-novo-modelo-e-usado) descreve as duas interfaces e os arquivos que uma execução grava. Os capítulos de metodologia usam "diretório do caso" e "configuração" como termos concretos para os artefatos que o usuário manipula; esses termos correspondem diretamente às duas interfaces.

Quem se interessa pelos compromissos de projeto que sustentam essas interfaces — reprodutibilidade, determinismo, invariância à ordem de declaração e legibilidade por agentes — deve ler [O que o Novo Modelo resolve §5](/pt-br/overview/what-novomodelo-solves#5-principios-metodologicos).

## 3. Roteiros de Leitura

Leitores diferentes chegam a este site por caminhos diferentes. Encontre a linha que corresponde ao seu perfil:

| Leitor | Roteiro de leitura |
| ------ | ------------ |
| Executa estudos | [Instalação](/pt-br/getting-started/installation), depois o [Guia rápido](/pt-br/getting-started/quickstart) e, em seguida, a seção Rodando estudos, começando por [Executando estudos](/pt-br/running/running-studies) e [Convergência e diagnóstico](/pt-br/running/interpreting-results). |
| Vem de outro software? | [O que o Novo Modelo resolve §6](/pt-br/overview/what-novomodelo-solves#6-vem-de-outro-software), depois [Convertendo um caso existente](/pt-br/running/case-conversion); para termos equivalentes em outras ferramentas de planejamento, consulte o [Glossário](/pt-br/reference/glossary). |
| Trabalha em Python | O [Guia rápido em Python](/pt-br/getting-started/python-quickstart) e, em seguida, a referência da [API Python](/pt-br/reference/python-api). |
| Não conhece PDDE | Leia [O que o Novo Modelo resolve](/pt-br/overview/what-novomodelo-solves) e toda a Introdução, na Referência metodológica; depois leia Modelagem do Sistema para entender o PL e, em seguida, O Algoritmo de PDDE para o algoritmo propriamente dito. Os exemplos em Exemplos Resolvidos reforçam os conceitos. |
| Conhece PDDE, mas não o Novo Modelo | Percorra rapidamente O que o Novo Modelo resolve e a Introdução, leia com atenção [Convenções de notação](/pt-br/overview/notation-conventions) e depois leia O Algoritmo de PDDE. Consulte Modelagem do Sistema para o PL do estágio e seu estado sempre que O Algoritmo de PDDE se referir a variáveis do estágio. |
| Procura um tema específico | Use a barra lateral para navegar até a seção pertinente. O Algoritmo de PDDE cobre o algoritmo; Modelagem do Sistema cobre o PL e o modelo do sistema; Modelagem Estocástica cobre o modelo de incerteza das afluências; Acoplamento e Condições de Contorno cobre as condições de contorno. [Convenções de notação](/pt-br/overview/notation-conventions) esclarece dúvidas de notação, e Rodando estudos trata do uso do software. A Referência de execução cobre a CLI, a API Python, os esquemas e os códigos de erro. |

## Referências Cruzadas

- [O que o Novo Modelo resolve](/pt-br/overview/what-novomodelo-solves) — o enunciado do problema, o nome do algoritmo, as garantias metodológicas, o resumo das funcionalidades para o usuário e uma orientação para leitores vindos de outros softwares
- [A PDDE em uma página](/pt-br/overview/sddp-framework-overview) — apresentação algorítmica em uma página para leitores sem experiência em programação dinâmica estocástica
- [Convenções de notação](/pt-br/overview/notation-conventions) — tabela completa de símbolos para conjuntos de índices, parâmetros, variáveis de decisão e variáveis duais
- [Visão geral da modelagem dos elementos do sistema](/pt-br/math/system-elements) — os elementos do sistema e suas variáveis: ponto de entrada de Modelagem do Sistema
- [Modelo de afluências PAR(p)](/pt-br/math/par-inflow-model) — modelo autorregressivo periódico de afluências: ponto de entrada de Modelagem Estocástica
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — simulação forward, simulação backward, geração de cortes, convergência: ponto de entrada de O Algoritmo de PDDE
- [Modos de horizonte](/pt-br/math/horizon-modes) — condições de contorno e concepção dos modos de horizonte: ponto de entrada de Acoplamento e Condições de Contorno
