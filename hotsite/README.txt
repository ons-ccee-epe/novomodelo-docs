=====================================================================
HOTSITE — NOVO MODELO COMPUTACIONAL DO SETOR ELÉTRICO BRASILEIRO
ONS · CCEE · EPE
=====================================================================

Site estático (HTML5 + CSS3 + JavaScript puro). Não exige instalação,
servidor, internet nem dependências. Todos os caminhos são relativos:
a pasta pode ser copiada para qualquer computador ou servidor.

Conteúdo baseado no Position Paper "Novo Modelo Computacional do Setor
Elétrico Brasileiro" (V5, outubro de 2026).


---------------------------------------------------------------------
ATENÇÃO — PENDÊNCIAS ANTES DA PUBLICAÇÃO
---------------------------------------------------------------------
1. FOTOGRAFIA E MARCAS: foram instaladas a fotografia oficial
   (hero-setor-eletrico.png) e as marcas brancas fornecidas
   (ons-white.png, ccee-white.png) sem edição. O logo EPE 20+
   (Logo_Novo_EPE.jpeg, 300×117, sem transparência) foi tratado:
   fundo removido, ruído JPEG limpo e ampliado para 1094×430 PNG,
   sem redesenho. Um PNG transparente ou SVG oficial deixaria o
   resultado ainda melhor.
   Observação: nos arquivos fornecidos, ONS e EPE têm opacidade de
   ~80% nos traços, enquanto a CCEE é branco pleno; por isso ONS e EPE
   aparecem levemente acinzentadas. Se houver versões em branco 100%,
   substitua conforme a seção 5.
2. CONTATO: o Position Paper registra que o canal de atendimento ainda
   estava pendente. Confirme os e-mails ctpmopld@ons.org.br e
   ctpmopld@ccee.org.br antes de publicar (seção 6).
3. Informações fornecidas pela equipe, não presentes no Position
   Paper: período e objetivo da Consulta Externa CE-005/2026
   (24/08 a 08/10/2026), o "ciclo seguinte (Janeiro/2029)" no quadro
   de Janeiro/2028 e o papel do MME como "Recebe e avalia a
   proposição da alternativa", a nova resposta da FAQ sobre o módulo
   de expansão e o parecer independente sobre o software (três
   pilares), que substitui a menção a dois pareceres do documento.
4. Duas notas internas de revisão do documento NÃO foram publicadas:
   a observação sobre "formulação ambígua" na pergunta "Quem é o
   fornecedor?" e a nota sobre canal de atendimento pendente.


---------------------------------------------------------------------
1. ESTRUTURA DO PROJETO
---------------------------------------------------------------------
index.html ............. todo o conteúdo da página
style.css .............. estilos, organizados em 15 seções numeradas
main.js ................ interações (menu, timeline, governança, FAQ)
README.txt ............. este arquivo
assets/images/ ......... hero.jpg, hero.webp (1536 px) e versões 1200 px
assets/logos/ .......... ons-branca.png, ccee-branca.png, epe-branca.png
                         (arquivos ons-white, ccee-white e epe-white
                         fornecidos, apenas renomeados)
assets/icons/ .......... favicon.svg
assets/fonts/ .......... fonte Inter 4.0 (woff2, subconjuntos latinos,
                         local) e LICENSE-Inter.txt, o texto da SIL OFL
                         1.1 que acompanha as fontes e que gen:notices
                         copia para THIRD-PARTY-NOTICES.txt


---------------------------------------------------------------------
2. COMO ABRIR LOCALMENTE
---------------------------------------------------------------------
Dê duplo clique em index.html. Funciona em Chrome, Edge, Firefox e
Safari atuais. Mantenha index.html, style.css, main.js e a pasta
assets juntos na mesma pasta.


---------------------------------------------------------------------
3. SERVIDOR HTTP OPCIONAL (para testes)
---------------------------------------------------------------------
Dentro da pasta do projeto, execute um dos comandos:
  Python:   python -m http.server 8080
  Node.js:  npx serve .
Depois acesse http://localhost:8080
(Com servidor, o botão "Copiar link desta pergunta" do FAQ também
copia para a área de transferência; abrindo o arquivo direto, ele
atualiza o endereço na barra do navegador.)


---------------------------------------------------------------------
4. COMO SUBSTITUIR A FOTOGRAFIA DO HERO
---------------------------------------------------------------------
Caminho mais simples: substitua os arquivos mantendo os nomes.
  assets/images/hero.jpg ....... largura total (atual: 1536 px;
                                 ideal: 2400 px ou mais)
  assets/images/hero-1200.jpg .. 1200 px de largura
  assets/images/hero.webp ...... versão WebP da largura total
  assets/images/hero-1200.webp . versão WebP de 1200 px
Se não for gerar WebP, apague a linha <source type="image/webp" ...>
dentro de <picture class="hero-media"> e a linha <link rel="preload"
as="image" ...> no <head> do index.html, e atualize width/height do
<img> para as dimensões reais da nova foto.

Ajustes de enquadramento (style.css, seção 7. HERO):
  .hero-media img { object-position: 60% 40%; }  → ponto focal desktop
  @media (max-width: 767px) ... object-position   → ponto focal celular
Intensidade do gradiente: .hero-overlay (forte à esquerda, zero a
partir de ~76% da largura). Mantenha o lado direito claro.


---------------------------------------------------------------------
5. COMO ATUALIZAR AS LOGOS
---------------------------------------------------------------------
Substitua os PNG em assets/logos/ mantendo os nomes. Recorte o arquivo
rente à marca (sem margens transparentes) para o alinhamento funcionar.
Os arquivos coloridos originais não fazem parte do pacote.
As marcas aparecem no header e no footer (procure por "inst-logos" no
index.html). Se as proporções mudarem, atualize width/height das <img>.

Equalização óptica (style.css, seção 6. HEADER):
  .logo-ccee { height: var(--logo-ccee-h, 16px) }  ← mais baixa de
  .logo-epe  { height: var(--logo-epe-h, 28px) }      propósito
  .logo-ons  { height: var(--logo-ons-h, 26px) }
As marcas seguem a ordem alfabética: CCEE, EPE, ONS.
No footer: .inst-logos--footer { --logo-ons-h: 30px; ... }
A CCEE é renderizada mais baixa porque o desenho é horizontal e
denso; com a mesma altura pareceria maior que ONS e EPE.


---------------------------------------------------------------------
6. COMO ATUALIZAR TEXTOS
---------------------------------------------------------------------
Todo o texto está no index.html, dividido por comentários:
  HEADER · HERO · PAINEL DE STATUS · CONHEÇA O NOVO MODELO ·
  O QUE VOCÊ PRECISA SABER · IMPLANTAÇÃO — TIMELINE · GOVERNANÇA ·
  VALIDAÇÃO TÉCNICA · CURADORIA E GESTÃO · CÓDIGO ABERTO E
  PARTICIPAÇÃO · PERGUNTAS FREQUENTES · CONTATO · FOOTER
Edite com qualquer editor de texto (VS Code, Notepad++), salvando em
UTF-8. Preserve as expressões condicionais do documento-fonte
("previsto", "eventual adoção", "condicionada à validação",
"aprovações competentes", "primeira janela considerada").

Painel de status: bloco <section class="status">. Atualize "Situação
atual" e "Próximo marco" conforme o cronograma avançar.

Contato: bloco <section ... id="contato">. Cada e-mail é um
<a href="mailto:...">. Para remover a seção, apague o bloco e o item
"Contato" do submenu "Mais" e do footer.


---------------------------------------------------------------------
7. COMO ALTERAR OS CTAs
---------------------------------------------------------------------
No HERO, em <div class="hero-actions">:
  <a class="btn btn--primary" href="#o-novo-modelo">...   (verde-água)
  <a class="btn btn--ghost-light" href="#implantacao">... (contorno)
Troque o texto e o href (âncora interna "#id" ou URL completa). Para
URL externa, acrescente target="_blank" rel="noopener noreferrer".


---------------------------------------------------------------------
8. COMO ATUALIZAR A TIMELINE
---------------------------------------------------------------------
Em <ol class="timeline-track">, cada etapa é um <li class="tl-item">:
  <li class="tl-item" data-year="2027">
    <span class="tl-dot" aria-hidden="true"></span>
    <div class="tl-card">
      <p class="tl-date">Até 30 abr 2027</p>
      <p class="tl-status">Previsto</p>
      <h3 class="tl-title">Envio ao CMSE</h3>
      <details class="tl-details"><summary>Detalhes</summary>
        <ul><li>...</li></ul></details>
    </div>
  </li>
Estados visuais:
  class="tl-item tl-item--current"      → situação atual (preenchido)
  class="tl-item"                        → etapa prevista
  class="tl-item tl-item--conditional"  → janela condicionada (tracejado)
Para marcar a virada de ano, inclua no primeiro item do ano:
  <span class="tl-year" aria-hidden="true">2027</span>
Ao mover a "situação atual", troque a classe --current e o texto de
.tl-status do item antigo para "Previsto"/"Concluído".
A faixa "Execução sombra" está logo abaixo, em <div class="shadow-run">.
Janeiro de 2028 deve continuar com a classe --conditional e o texto de
condicionante enquanto não houver aprovação formal.


---------------------------------------------------------------------
9. COMO ATUALIZAR O FAQ
---------------------------------------------------------------------
Cada pergunta é um bloco <article class="faq-item">. Para adicionar,
copie um bloco inteiro e altere TODOS os identificadores:
  <article class="faq-item" id="faq-NOVO" data-cat="governanca">
    <h3 class="faq-q"><button type="button" id="faq-NOVO-btn"
        aria-expanded="false" aria-controls="faq-NOVO-ans">
      <span class="faq-q-text">Pergunta?</span>
      <span class="faq-toggle" aria-hidden="true"></span></button></h3>
    <div class="faq-a" id="faq-NOVO-ans" role="region"
        aria-labelledby="faq-NOVO-btn"><div class="faq-a-inner">
      <p>Resposta.</p>
    </div></div>
  </article>
Regras: o id deve começar com "faq-" e ser único; use letras
minúsculas, números e hífens. data-cat aceita:
  novo-modelo | governanca | tecnologia | validacao | participacao |
  cronograma
Busca, contagem por categoria, contador e link direto funcionam
automaticamente. Link direto: index.html#faq-NOVO
Nova categoria: adicione um botão em <div class="faq-filters">:
  <button type="button" class="chip" data-filter="NOVA"
          aria-pressed="false">Nome</button>
Atualize também o texto inicial do contador (<p id="faq-count">).


---------------------------------------------------------------------
10. COMO ADICIONAR UM REPOSITÓRIO OU PACOTE
---------------------------------------------------------------------
Em <ul class="repo-grid">, copie um <li class="repo">:
  <li class="repo">
    <a href="https://github.com/ons-ccee-epe/NOME" target="_blank"
       rel="noopener noreferrer">
      <span class="repo-type">GitHub</span>
      <span class="repo-name">NOME</span>
      <span class="repo-desc">Descrição curta.</span>
      <span class="repo-url">github.com/ons-ccee-epe/NOME<span
        class="visually-hidden"> (abre em nova aba)</span></span>
    </a>
  </li>
Use somente endereços oficiais.


---------------------------------------------------------------------
11. COMO PUBLICAR EM SERVIDOR WEB
---------------------------------------------------------------------
Copie a pasta inteira (index.html, style.css, main.js, assets/) para
o diretório público do servidor (Apache, Nginx, IIS, GitHub Pages,
Azure Static Web Apps etc.). Não há build nem backend.
Recomendações: HTTPS; cache longo para assets/ e curto para
index.html, style.css e main.js; compressão gzip/brotli para
.html/.css/.js. O README.txt pode ser omitido na publicação.


---------------------------------------------------------------------
12. PUBLICAÇÃO EM SHAREPOINT
---------------------------------------------------------------------
- SharePoint Online, por padrão, NÃO renderiza arquivos .html em
  bibliotecas de documentos: o arquivo é baixado em vez de exibido
  (scripts personalizados ficam bloqueados). Executar o hotsite como
  página exige liberação de script personalizado pelo administrador
  do tenant, o que costuma ser desaconselhado por governança de TI.
- Alternativas recomendadas:
  a) hospedar o hotsite em servidor web/estático institucional e
     incluí-lo no SharePoint via web part "Inserir" (iframe), com o
     domínio autorizado em "Domínios de inserção" do site;
  b) recriar o conteúdo com web parts modernas (Texto, Acordeão/
     Perguntas, Imagem), usando este hotsite como referência visual
     e o texto do index.html como fonte;
  c) SharePoint Server on-premises com scripts habilitados: enviar
     a pasta completa para uma biblioteca, preservando a estrutura
     assets/, e abrir index.html.
- Em qualquer caso, mantenha a estrutura de pastas e os caminhos
  relativos; não renomeie arquivos sem atualizar o index.html.


---------------------------------------------------------------------
ACESSIBILIDADE E TECNOLOGIA (resumo)
---------------------------------------------------------------------
- HTML semântico, landmarks, um único H1, skip link, foco visível.
- Menu e submenu com aria-expanded; governança como tabs (setas,
  Home/End, aria-selected); FAQ com aria-expanded/aria-controls,
  setas para navegar, Escape para limpar a busca.
- Respeita prefers-reduced-motion. Sem JavaScript, todo o conteúdo
  (inclusive as respostas do FAQ) continua legível.
- Contrastes verificados (AA). #86B7B3 é usado como acento/fundo de
  botão; para texto sobre branco usa-se a variação --color-accent
  (#2F6C67).
- Breakpoints: desktop >= 1280 px; tablet 768–1279 px; mobile
  <= 767 px; menu hambúrguer abaixo de 1200 px.
