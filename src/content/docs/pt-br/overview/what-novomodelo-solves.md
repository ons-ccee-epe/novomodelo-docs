---
title: "O que o Novo Modelo resolve"
description: O problema de despacho hidrotérmico estocástico multiestágio — visão geral do algoritmo, garantias metodológicas e funcionalidades para o usuário.
---

## Objetivo

Este capítulo responde à pergunta fundamental: que problema o Novo Modelo calcula e o que o usuário obtém ao final de uma execução? Ele delimita o escopo dos capítulos seguintes e articula as afirmações sobre funcionalidades que aparecem ao longo deste site.

## 1. O Problema

Sistemas elétricos fortemente dependentes de geração hidrelétrica enfrentam um problema de planejamento ao mesmo tempo de grande porte e profundamente incerto. A água armazenada hoje nos reservatórios é a água disponível para geração nos meses futuros; a política de despacho adequada depende de quanta chuva deve ocorrer ao longo de um horizonte plurianual, do custo das alternativas termelétricas e da aversão ao risco do operador do sistema.

O Novo Modelo resolve o **problema de despacho hidrotérmico estocástico multiestágio**: dado um sistema elétrico com reservatórios hidrelétricos, usinas termelétricas e um processo estocástico de afluências, encontrar a política de operação que minimiza o custo esperado de geração ao longo de um horizonte de planejamento, atendendo à carga em todos os estágios e em todos os cenários. O espaço de estados é contínuo (níveis dos reservatórios, defasagens autorregressivas das afluências), a incerteza é estruturada por um modelo autorregressivo periódico e o horizonte abrange muitos estágios.

Trata-se de um problema de planejamento de sistemas elétricos de predominância hidrelétrica, e é para ele que o solver de PDDE (SDDP) do Novo Modelo foi construído.

## 2. O Algoritmo

O Novo Modelo implementa a **Programação Dinâmica Dual Estocástica (PDDE)**. A PDDE resolve o problema multiestágio decompondo-o em problemas de programação linear por estágio, ligados por variáveis de estado (níveis dos reservatórios e defasagens das afluências). Iterando para a frente e para trás pela árvore de estágios, o algoritmo constrói aproximações lineares por partes da função de custo futuro em cada estágio. Essas aproximações, chamadas cortes de Benders, levam a informação de custo futuro do último estágio de volta ao primeiro.

Cada iteração atualiza um limite inferior e uma avaliação de limite superior do custo da política ([Garantias Metodológicas](#3-garantias-metodologicas)); o treinamento (training) termina quando seus critérios de parada são atendidos ([Critérios de parada](/pt-br/math/stopping-rules)). Veja [A PDDE em uma página](/pt-br/overview/sddp-framework-overview) para a apresentação em uma página e [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) para o tratamento algorítmico completo.

## 3. Garantias Metodológicas

Na convergência, o Novo Modelo fornece um limite inferior para o custo da política ótima e uma de duas avaliações de limite superior do custo da política, selecionada pela simulação forward:

1. **Limite inferior** — o valor ajustado ao risco do primeiro estágio sobre suas aberturas com os cortes atuais ([definição](/pt-br/math/upper-bound-evaluation#limite-inferior)). Ele não decresce ao longo das iterações. Sob as hipóteses de [Gerenciamento de cortes — quando os limites e certificados valem](/pt-br/math/cut-management#quando-os-limites-e-certificados-valem), é um limite inferior válido (Camada 1) e, sob uma medida de esperança em todos os estágios, converge com probabilidade 1 para o valor ótimo do modelo tal como treinado (Camada 2).
2. **Limite superior estatístico** — o custo médio amostral das simulações forward sob a política atual, com um intervalo de confiança. Essa estimativa carrega erro amostral genuíno, que só se reduz à medida que mais cenários são sorteados; ela pode ficar abaixo do limite inferior e não constitui um certificado.
3. **Limite superior exato (determinístico)** — o custo da política avaliado sobre uma árvore de cenários enumerada, percorrendo cada caminho até as folhas exatamente uma vez. Não carrega erro amostral. Junto com o limite inferior, limita por cima o quanto o custo da política excede o valor ótimo quando a medida de risco é uniforme entre os estágios ([Camada 3](/pt-br/math/cut-management#camada-3-certificado-do-gap)).

A garantia de determinismo do Novo Modelo é enunciada por binário em [Princípios Metodológicos](#5-principios-metodologicos).

## 4. Como o Novo Modelo É Usado

O Novo Modelo é operado por meio de duas interfaces equivalentes:

**CLI**: o Novo Modelo é acionado pela CLI `novomodelo`; os mesmos diretórios de caso e arquivos de configuração usados a partir do Python são usados pela CLI.

**Python**: o Novo Modelo pode ser chamado a partir do Python por meio de bindings PyO3; é possível configurar casos, disparar execuções e carregar resultados pelo Python sem sair da camada metodológica.

Uma execução grava saídas legíveis por máquina (arquivos JSON e Parquet, além do checkpoint binário da política) junto com o acompanhamento do progresso legível por humanos. Os resultados são estruturados e autodescritivos: uma execução de treinamento concluída grava a política, o registro de convergência e as estatísticas de saída em caminhos conhecidos no seu diretório de saída (`output/` dentro do diretório do caso, salvo indicação de outro).

Uma execução de treinamento grava sua política como checkpoint ao final do treinamento. Uma execução posterior da mesma versão do novomodelo sobre o mesmo estudo (mesma dimensão de estado, mesma entidade por trás de cada variável de estado, mesmos estágios e mesmo grafo do estudo) pode [retomar o treinamento a partir dele](/pt-br/running/policy-management/#retomada) em vez de recomeçar do zero.

Um estudo é executado em um único processo ou, com a versão MPI, em vários processos (ranks MPI) ([Implantação em HPC e clusters](/pt-br/running/hpc-deployment/)). Um mesmo binário em uma mesma imagem de plataforma produz resultados idênticos bit a bit para qualquer número de processos e de threads; as versões de processo único e MPI são binários distintos, cujos resultados não têm garantia de igualdade ([Determinismo e rastreabilidade](/pt-br/math/determinism-guarantees)).

O Novo Modelo foi concebido para estudos em escala de produção: um horizonte de planejamento longo, com muitos estágios, grandes parques de usinas hidrelétricas e termelétricas, muitos cenários de afluência por estágio e vários patamares de carga em cada estágio.

## 5. Princípios Metodológicos

Os princípios a seguir orientam a construção do Novo Modelo.

- **Reprodutibilidade** — Toda execução do Novo Modelo pode ser refeita por qualquer pessoa que disponha de suas entradas e dos metadados que ela registra: as mesmas entradas e semente, executadas pelo mesmo binário na mesma imagem de plataforma, produzem a mesma política, os mesmos limites em cada iteração e os mesmos custos de simulação, até a iteração de parada no caso de um critério de parada por tempo de relógio. Veja [Determinismo e rastreabilidade §5](/pt-br/math/determinism-guarantees#5-rastreabilidade) para o que cada execução registra.

- **Determinismo** — O Novo Modelo produz resultados idênticos bit a bit para qualquer número de processos MPI e de threads de um mesmo binário em uma mesma imagem de plataforma, e em toda reexecução com as mesmas entradas e semente. Trata-se de um compromisso metodológico explícito, obtido por mecanismos coordenados no projeto do algoritmo. Veja [Determinismo e rastreabilidade](/pt-br/math/determinism-guarantees) para o escopo, os mecanismos e o que está fora do escopo.

- **Invariância à ordem de declaração** — Os resultados da otimização são idênticos bit a bit independentemente da ordem em que as entidades são declaradas nos arquivos de entrada; o Novo Modelo ordena as entidades de cada tipo pela data de entrada em operação e, em seguida, pelo ID, antes de montar qualquer problema de estágio. Reordenar usinas hidrelétricas, usinas termelétricas ou linhas de transmissão na configuração do caso não altera a política nem os limites calculados. Essa propriedade é essencial em fluxos de trabalho automatizados, nos quais os arquivos de entrada são montados por ferramentas em vez de editados manualmente.

- **Legibilidade por agentes** — Uma execução grava seus resultados como arquivos JSON e Parquet, cujos leiautes estão documentados nas páginas de Referência, junto com o acompanhamento do progresso legível por humanos, de modo que ferramentas automatizadas possam compor, monitorar e verificar fluxos de trabalho do Novo Modelo.

## 6. Vem de outro software?

O Novo Modelo lê seu próprio formato de caso: um diretório do caso com arquivos de entrada JSON e Parquet. Um caso preparado para uma ferramenta de planejamento hidrotérmico suportada é convertido em um caso do Novo Modelo pelo novomodelo-bridge, um pacote Python separado; [Convertendo um caso existente](/pt-br/running/case-conversion/) descreve o que ele converte e como comparar os resultados da ferramenta de origem com os do Novo Modelo.

**Escopo e limitações.** Todo problema de estágio é um problema de programação linear; portanto, o Novo Modelo não tem decisões inteiras de compromisso de despacho (unit commitment). A rede de transmissão é um modelo de transporte: cada linha transporta fluxo entre dois barramentos, até uma capacidade em cada sentido, e não se aplicam equações de fluxo de potência. Os problemas de estágio não têm perdas: as perdas de transmissão não entram neles, e o Novo Modelo as calcula a partir dos fluxos resolvidos e as informa nos resultados da simulação.

**O que difere.** O Novo Modelo representa cada usina hidrelétrica individualmente, com seu próprio armazenamento, modelo de geração e, quando houver, usina de jusante. Não se espera que um caso convertido resolvido pelo Novo Modelo reproduza exatamente os resultados de outra ferramenta, pois os dois modelos podem diferir na formulação, no modelo de afluências e no critério de parada. Para termos equivalentes em outras ferramentas de planejamento, consulte o [Glossário](/pt-br/reference/glossary/).

## Referências Cruzadas

- [A PDDE em uma página](/pt-br/overview/sddp-framework-overview) — apresentação algorítmica em uma página: simulação forward, geração de cortes na simulação backward e limites de convergência
- [Como ler este site](/pt-br/overview/how-to-read) — guia de navegação pelos grupos da barra lateral e roteiros de leitura para diferentes perfis de leitor
- [Algoritmo da PDDE](/pt-br/math/sddp-algorithm) — tratamento algorítmico completo: PLs dos estágios, geração de cortes, teoria de convergência
- [Determinismo e rastreabilidade](/pt-br/math/determinism-guarantees) — escopo de identidade bit a bit por binário, mecanismos de coordenação e o que cada execução registra
