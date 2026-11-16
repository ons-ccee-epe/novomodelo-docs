---
title: "Como ler este site"
description: Guia de navegação — as seções da barra lateral, o que cada uma cobre e roteiros de leitura para diferentes perfis de leitor.
---

## Objetivo

Este capítulo é um guia de navegação. Ele descreve as seções da barra lateral do site, explica o que cada seção cobre e sugere roteiros de leitura para diferentes perfis de leitor. Quem estiver avaliando se este site atende às suas necessidades deve ler este capítulo primeiro.

## 1. Estrutura do site

O site está organizado nas seções exibidas na barra lateral, nesta ordem: Comece aqui, Entidades do modelo, Referência metodológica, Execução de estudos, Referência de execução e Exemplos resolvidos. Cada seção de referência vem logo depois da seção que complementa: a Referência metodológica depois de Entidades do modelo, e a Referência de execução depois de Execução de estudos. As duas seções de referência começam recolhidas.

**Comece aqui** responde o que o Novo Modelo calcula ([O que o Novo Modelo resolve](/overview/what-novomodelo-solves)) e reúne [Como o modelo decide](/overview/how-the-model-decides), o ciclo de decisão do modelo em uma página, e este guia de navegação. Quem estiver avaliando se o Novo Modelo se aplica ao seu problema deve começar por aqui.

**Entidades do modelo** explica o modelo uma entidade por vez, com uma página para cada uma das 16 entidades: o que cada entidade é, o que o modelo decide sobre ela e onde estão suas fórmulas e seus arquivos. Quatro subseções seguem as colunas da figura da [página inicial](/#entities): **Afluências** ([Afluências e modelo PAR(p)](/entities/inflows/inflows), [Cenários e aberturas](/entities/inflows/scenarios)), **Geração** ([Usinas hidrelétricas](/entities/generation/hydro-plants), [Usinas termelétricas](/entities/generation/thermal-plants), [Fontes não despacháveis](/entities/generation/non-controllable-sources), [Usinas elevatórias](/entities/generation/pumping-stations)), **Rede** ([Barramentos e subsistemas](/entities/network/buses), [Linhas e intercâmbios](/entities/network/lines), [Contratos de energia](/entities/network/energy-contracts)) e **Consumo** ([Carga](/entities/consumption/load), [Déficit](/entities/consumption/deficit)). O [horizonte](/entities/time-structure), o [valor da água](/entities/water-value) e as regras do jogo ([restrições genéricas](/entities/generic-constraints), [penalidades](/entities/penalties) e [aversão a risco](/entities/risk-aversion)) fecham a seção.

**Referência metodológica** reúne os cinco blocos da metodologia descritos a seguir, seguidos do [Glossário](/reference/glossary) e da [Bibliografia](/reference/bibliography). Quem lê as páginas de entidades recorre a ela para a formulação completa por trás de cada entidade.

**Introdução** (o primeiro bloco da Referência metodológica) estabelece a base conceitual e de notação para o restante do site: uma apresentação em uma página do algoritmo de PDDE (SDDP) para leitores sem experiência em programação dinâmica estocástica ([A PDDE em uma página](/overview/sddp-framework-overview)), a notação completa usada em todo o site ([Convenções de notação](/overview/notation-conventions)) e, como complemento, este guia de navegação (mantido em Comece aqui). Seus capítulos podem ser lidos em sequência ou consultados individualmente.

**Modelagem do Sistema** define as entidades do sistema elétrico e o PL do estágio que o Novo Modelo resolve a cada iteração. Este bloco é a base matemática de tudo o que se segue: usinas hidrelétricas, usinas termelétricas, linhas de transmissão, estruturas de penalidade, o PL do estágio e o estado que ele transporta entre estágios. Quem deseja entender como o sistema físico é representado na otimização deve começar por aqui.

**Modelagem Estocástica** trata do modelo de incerteza das afluências. O Novo Modelo utiliza modelos autorregressivos periódicos (PAR) para gerar árvores de cenários; este bloco explica o grafo da política (policy graph) que liga os estágios, a estrutura do modelo PAR e seu procedimento de ajuste, o tratamento de realizações negativas de afluência, o fluxo de geração de cenários e os estudos que combinam diferentes resoluções de estágio. Quem se interessa pelo tratamento da incerteza, sem se preocupar com o algoritmo de otimização, pode ler este bloco independentemente de O Algoritmo de PDDE.

**O Algoritmo de PDDE** é o núcleo da metodologia. Cobre as simulações forward e backward, a geração e o gerenciamento de cortes, a estrutura do PL e seu escalonamento (scaling), as estratégias de aproveitamento de base, as medidas de risco, os critérios de parada, a avaliação do limite superior e as garantias de determinismo. Leitores vindos da literatura de PDDE encontrarão aqui as conexões com os tratamentos clássicos; leitores sem experiência em PDDE devem ler antes Introdução e Modelagem do Sistema.

**Acoplamento e Condições de Contorno** trata de como o horizonte de um estudo é fechado: o modo de horizonte, a fronteira pós-estudo que valora o estado deixado ao final do horizonte (incluindo estudos encadeados) e como o desconto interage com a aproximação por cortes. Veja [Modos de horizonte](/math/horizon-modes) como ponto de entrada.

**Execução de estudos** segue as etapas de um estudo. A [Instalação](/getting-started/installation) abre a seção. **Modos de execução** trata das três formas de executar o Novo Modelo: pela CLI ([Guia rápido](/getting-started/quickstart)), pelo Python ([Guia rápido em Python](/getting-started/python-quickstart)) ou por meio de um agente de IA ([Agentes de IA](/running/mcp-server)). **Preparando o caso** trata dos arquivos de entrada ([Formato do caso](/reference/case-format/)), das opções da execução ([Configuração](/running/configuration)) e da conversão de um caso existente ([Conversão de casos](/running/case-conversion)). **Executando o estudo** trata do treinamento e da simulação ([Executando estudos](/running/running-studies)) e do reaproveitamento de uma política treinada ([Gerenciamento da política](/running/policy-management)). **Desempenho e escala** trata dos [Aceleradores de desempenho](/running/performance) e da [Implantação em HPC e clusters](/running/hpc-deployment). **Analisando resultados** trata dos arquivos de saída ([Formato de saída](/reference/output/)) e da leitura da convergência ([Convergência e diagnóstico](/running/interpreting-results)). A [Solução de problemas](/running/troubleshooting) fecha a seção e cobre falhas de todas as etapas. Quem executa estudos volta a esta seção depois do primeiro estudo.

**Referência de execução** reúne as páginas de consulta para executar estudos: a linguagem das [Restrições genéricas](/reference/generic-constraints), os [Esquemas JSON](/reference/json-schemas), os [Códigos de erro](/reference/error-codes), o [Esquema FlatBuffers da política](/reference/flatbuffers-schema), a [Referência da CLI](/reference/cli-reference) e a [API Python](/reference/python-api). Use esta seção como material de consulta, não como ponto de partida.

**Exemplos Resolvidos** traz dois roteiros didáticos do ciclo da PDDE: um caso-exemplo com um único reservatório e um caso-exemplo com quatro reservatórios, ambos pequenos o bastante para verificação manual. Esses capítulos percorrem a simulação forward, a simulação backward, a construção dos cortes e a atualização do limite inferior com números concretos. O repositório do novomodelo inclui os casos executáveis [`examples/1dtoy`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/1dtoy) e [`examples/4ree`](https://github.com/ons-ccee-epe/novomodelo/tree/main/examples/4ree); cada roteiro informa como seus números se relacionam com o respectivo caso. Quem aprende PDDE na prática deve começar pelos exemplos resolvidos depois de ler a Introdução.

## 2. Ferramentas e interfaces

O Novo Modelo é executado pelo programa de linha de comando `novomodelo` e pelo pacote `novomodelo-python`. [O que o Novo Modelo resolve §4](/overview/what-novomodelo-solves#4-como-o-novo-modelo-e-usado) descreve as duas interfaces e os arquivos que uma execução grava. Os capítulos de metodologia usam "diretório do caso" e "configuração" como termos concretos para os artefatos que o usuário manipula; esses termos correspondem diretamente às duas interfaces.

Quem se interessa pelos compromissos de projeto que sustentam essas interfaces — reprodutibilidade, determinismo, invariância à ordem de declaração e legibilidade por agentes — deve ler [O que o Novo Modelo resolve §5](/overview/what-novomodelo-solves#5-principios-metodologicos).

## 3. Roteiros de leitura

Leitores diferentes chegam a este site por caminhos diferentes. Encontre a linha que corresponde ao seu perfil:

| Leitor | Roteiro de leitura |
| ------ | ------------ |
| Executa estudos | [Instalação](/getting-started/installation), depois o [Guia rápido](/getting-started/quickstart) e, em seguida, a seção Execução de estudos, começando por [Executando estudos](/running/running-studies) e [Convergência e diagnóstico](/running/interpreting-results). |
| Vem de outro software? | [O que o Novo Modelo resolve §6](/overview/what-novomodelo-solves#6-vem-de-outro-software), depois [Convertendo um caso existente](/running/case-conversion); para termos equivalentes em outras ferramentas de planejamento, consulte o [Glossário](/reference/glossary). |
| Trabalha em Python | O [Guia rápido em Python](/getting-started/python-quickstart) e, em seguida, a referência da [API Python](/reference/python-api). |
| Não conhece PDDE | Leia [O que o Novo Modelo resolve](/overview/what-novomodelo-solves) e toda a Introdução, na Referência metodológica; depois leia Modelagem do Sistema para entender o PL e, em seguida, O Algoritmo de PDDE para o algoritmo propriamente dito. Os exemplos em Exemplos Resolvidos reforçam os conceitos. |
| Conhece PDDE, mas não o Novo Modelo | Percorra rapidamente O que o Novo Modelo resolve e a Introdução, leia com atenção [Convenções de notação](/overview/notation-conventions) e depois leia O Algoritmo de PDDE. Consulte Modelagem do Sistema para o PL do estágio e seu estado sempre que O Algoritmo de PDDE se referir a variáveis do estágio. |
| Procura um tema específico | Use a barra lateral para navegar até a seção pertinente. O algoritmo da PDDE cobre o algoritmo; Modelagem do sistema cobre o PL e o modelo do sistema; Modelagem estocástica cobre o modelo de incerteza das afluências; Acoplamento e condições de contorno cobre as condições de contorno. [Convenções de notação](/overview/notation-conventions) esclarece dúvidas de notação, e Execução de estudos trata do uso do software. A Referência de execução cobre a CLI, a API Python, os esquemas e os códigos de erro. |

## Referências cruzadas

- [O que o Novo Modelo resolve](/overview/what-novomodelo-solves) — o enunciado do problema, o nome do algoritmo, as garantias metodológicas, o resumo das funcionalidades para o usuário e uma orientação para leitores vindos de outros softwares
- [A PDDE em uma página](/overview/sddp-framework-overview) — apresentação algorítmica em uma página para leitores sem experiência em programação dinâmica estocástica
- [Convenções de notação](/overview/notation-conventions) — tabela completa de símbolos para conjuntos de índices, parâmetros, variáveis de decisão e variáveis duais
- [Visão geral da modelagem dos elementos do sistema](/math/system-elements) — os elementos do sistema e suas variáveis: ponto de entrada de Modelagem do Sistema
- [Modelo de afluências PAR(p)](/math/par-inflow-model) — modelo autorregressivo periódico de afluências: ponto de entrada de Modelagem Estocástica
- [Algoritmo da PDDE](/math/sddp-algorithm) — simulação forward, simulação backward, geração de cortes, convergência: ponto de entrada de O Algoritmo de PDDE
- [Modos de horizonte](/math/horizon-modes) — condições de contorno e concepção dos modos de horizonte: ponto de entrada de Acoplamento e Condições de Contorno
