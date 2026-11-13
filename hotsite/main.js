/* ==========================================================================
   Novo Modelo — comportamento da página (JavaScript puro, sem dependências)
   1. Utilitários          5. Timeline
   2. Menu mobile          6. Governança (tabs com setas)
   3. Submenu "Mais"       7. FAQ (busca, filtros, accordion, deep links)
   4. Navegação ativa
   ========================================================================== */
(function () {
  'use strict';

  /* 1. UTILITÁRIOS ------------------------------------------------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var mqMobile = window.matchMedia('(max-width: 767px)');
  var mqMenu = window.matchMedia('(max-width: 1199px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scrollBehavior = function () { return reduceMotion.matches ? 'auto' : 'smooth'; };

  // Remove acentos e caixa para busca tolerante ("aversao" encontra "aversão")
  var normalize = function (s) {
    return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  /* 2. MENU MOBILE ------------------------------------------------------- */
  var menuToggle = $('.menu-toggle');
  var headerMenu = $('#menu-principal');

  function setMenu(open, returnFocus) {
    if (!menuToggle || !headerMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.querySelector('.menu-toggle-label').textContent = open ? 'Fechar' : 'Menu';
    headerMenu.classList.toggle('is-open', open);
    if (!open && returnFocus) menuToggle.focus();
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    // Fecha ao escolher um destino
    headerMenu.addEventListener('click', function (e) {
      if (e.target.closest('a') && mqMenu.matches) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && headerMenu.classList.contains('is-open')) setMenu(false, true);
    });
    // Ao voltar para desktop, garante estado consistente
    var onMenuMq = function () { if (!mqMenu.matches) setMenu(false); };
    mqMenu.addEventListener ? mqMenu.addEventListener('change', onMenuMq) : mqMenu.addListener(onMenuMq);
  }

  /* 3. SUBMENU "MAIS" ---------------------------------------------------- */
  var moreToggle = $('.nav-more-toggle');
  var moreItem = $('.nav-more');
  function setMore(open) {
    if (moreToggle) moreToggle.setAttribute('aria-expanded', String(open));
  }
  if (moreToggle) {
    moreToggle.addEventListener('click', function () {
      setMore(moreToggle.getAttribute('aria-expanded') !== 'true');
    });
    moreItem.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && moreToggle.getAttribute('aria-expanded') === 'true') {
        e.stopPropagation(); setMore(false); moreToggle.focus();
      }
    });
    moreItem.addEventListener('focusout', function (e) {
      if (!mqMenu.matches && !moreItem.contains(e.relatedTarget)) setMore(false);
    });
    document.addEventListener('click', function (e) {
      if (!moreItem.contains(e.target)) setMore(false);
    });
    $$('.submenu a').forEach(function (a) { a.addEventListener('click', function () { setMore(false); }); });
  }

  /* 4. NAVEGAÇÃO ATIVA (scrollspy) -------------------------------------- */
  var navLinks = $$('.primary-nav .nav-link[href^="#"]');
  // Seções secundárias acendem o item principal correspondente
  var sectionToNav = {
    'inicio': '#inicio', 'o-novo-modelo': '#o-novo-modelo', 'o-que-saber': '#o-novo-modelo',
    'implantacao': '#implantacao', 'governanca': '#governanca', 'validacao': '#governanca',
    'curadoria': '#governanca', 'participe': '#participe', 'perguntas': null, 'contato': null
  };
  if ('IntersectionObserver' in window && navLinks.length) {
    var setCurrent = function (href) {
      navLinks.forEach(function (l) {
        if (l.getAttribute('href') === href) l.setAttribute('aria-current', 'location');
        else l.removeAttribute('aria-current');
      });
      if (moreToggle) {
        if (href === null) moreToggle.setAttribute('aria-current', 'location');
        else moreToggle.removeAttribute('aria-current');
      }
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(sectionToNav[entry.target.id]);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionToNav).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* 5. TIMELINE ---------------------------------------------------------- */
  var viewport = $('.timeline-viewport');
  var prevBtn = $('[data-tl="prev"]');
  var nextBtn = $('[data-tl="next"]');
  // Status das etapas conforme a data do computador:
  // fim anterior a hoje → "Realizado"; período em curso → "Situação atual";
  // demais → "Previsto". A janela de janeiro/2028 (sem data-inicio/data-fim)
  // permanece sempre como "Janela condicionada".
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var now = new Date();
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  $$('.tl-item[data-inicio][data-fim]').forEach(function (item) {
    var start = item.getAttribute('data-inicio');
    var end = item.getAttribute('data-fim');
    var state = end < today ? 'done' : (start <= today ? 'current' : 'planned');
    item.classList.toggle('tl-item--done', state === 'done');
    item.classList.toggle('tl-item--current', state === 'current');
    var label = $('.tl-status', item);
    if (label) label.textContent = state === 'done' ? 'Realizado' : (state === 'current' ? 'Situação atual' : 'Previsto');
  });

  // Painel abaixo da foto, sincronizado com a mesma data:
  // "Situação atual" = etapa em curso (a iniciada mais recentemente);
  // sem etapa em curso, a última etapa com período encerrado.
  // "Próximo marco" = primeira etapa futura; sem etapas futuras, a janela
  // condicionada de janeiro/2028. "Primeira janela considerada" não muda.
  var tlItems = $$('.tl-item[data-inicio][data-fim]');
  var info = function (item) {
    return { title: $('.tl-title', item).textContent.trim(), date: $('.tl-date', item).textContent.trim() };
  };
  var setText = function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; };
  var current = tlItems.filter(function (i) { return i.classList.contains('tl-item--current'); })
    .sort(function (a, b) {
      return b.getAttribute('data-inicio').localeCompare(a.getAttribute('data-inicio')) ||
             a.getAttribute('data-fim').localeCompare(b.getAttribute('data-fim'));
    })[0];
  if (current) {
    var c = info(current);
    setText('status-atual-valor', c.title);
    setText('status-atual-detalhe', c.date);
  } else {
    var done = tlItems.filter(function (i) { return i.classList.contains('tl-item--done'); })
      .sort(function (a, b) {
        return b.getAttribute('data-fim').localeCompare(a.getAttribute('data-fim')) ||
               b.getAttribute('data-inicio').localeCompare(a.getAttribute('data-inicio'));
      })[0];
    if (done) {
      var d = info(done);
      setText('status-atual-valor', d.title);
      setText('status-atual-detalhe', d.date + ' · período encerrado');
    }
  }
  var nextItem = tlItems.filter(function (i) { return i.getAttribute('data-inicio') > today; })
    .sort(function (a, b) { return a.getAttribute('data-inicio').localeCompare(b.getAttribute('data-inicio')); })[0] ||
    $('.tl-item--conditional');
  if (nextItem) {
    var n = info(nextItem);
    setText('status-proximo-valor', n.title);
    setText('status-proximo-detalhe', nextItem.classList.contains('tl-item--conditional')
      ? n.date + ' · condicionada à validação satisfatória e às aprovações competentes'
      : n.date);
  }

  if (viewport && prevBtn && nextBtn) {
    var step = function () {
      var item = $('.tl-item', viewport);
      return item ? item.getBoundingClientRect().width * 2 : 400;
    };
    var updateButtons = function () {
      var max = viewport.scrollWidth - viewport.clientWidth - 2;
      prevBtn.disabled = viewport.scrollLeft <= 2;
      nextBtn.disabled = viewport.scrollLeft >= max;
    };
    prevBtn.addEventListener('click', function () { viewport.scrollBy({ left: -step(), behavior: scrollBehavior() }); });
    nextBtn.addEventListener('click', function () { viewport.scrollBy({ left: step(), behavior: scrollBehavior() }); });
    // Clique em um quadro: centraliza-o na linha do tempo (navega como as setas).
    // Cliques em "Detalhes" continuam apenas abrindo/fechando o conteúdo.
    viewport.addEventListener('click', function (e) {
      if (mqMobile.matches || e.target.closest('summary, details[open] ul, a')) return;
      var card = e.target.closest('.tl-card');
      if (!card) return;
      var item = card.closest('.tl-item');
      var vp = viewport.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      var delta = (r.left + r.width / 2) - (vp.left + vp.width / 2);
      viewport.scrollBy({ left: delta, behavior: scrollBehavior() });
    });
    viewport.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  /* 6. GOVERNANÇA -------------------------------------------------------- */
  var tablist = $('.gov-flow[role="tablist"]');
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    var activate = function (tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activate(tab, false);
        // No celular o painel fica abaixo da lista: leva o leitor até ele
        if (mqMobile.matches) {
          var panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
        }
      });
    });
    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': next = tabs[(i + 1) % tabs.length]; break;
        case 'ArrowLeft': case 'ArrowUp': next = tabs[(i - 1 + tabs.length) % tabs.length]; break;
        case 'Home': next = tabs[0]; break;
        case 'End': next = tabs[tabs.length - 1]; break;
        default: return;
      }
      e.preventDefault();
      activate(next, true);
    });
  }

  /* 6b. ANTECEDENTES (marcos navegáveis) ------------------------------- */
  var antList = $('.ant-steps[role="tablist"]');
  if (antList) {
    var antTabs = $$('[role="tab"]', antList);
    var antSelect = function (tab, focus) {
      antTabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      // No celular a régua rola: mantém o marco escolhido visível
      if (antList.scrollWidth > antList.clientWidth) {
        antList.scrollTo({ left: tab.offsetLeft - antList.clientWidth / 2 + tab.offsetWidth / 2, behavior: scrollBehavior() });
      }
    };
    antTabs.forEach(function (t) { t.addEventListener('click', function () { antSelect(t, false); }); });
    antList.addEventListener('keydown', function (e) {
      var i = antTabs.indexOf(document.activeElement), next = null;
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = antTabs[(i + 1) % antTabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = antTabs[(i - 1 + antTabs.length) % antTabs.length];
      else if (e.key === 'Home') next = antTabs[0];
      else if (e.key === 'End') next = antTabs[antTabs.length - 1];
      if (!next) return;
      e.preventDefault();
      antSelect(next, true);
    });
    antSelect(antTabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || antTabs[0], false);
  }

  /* 7. FAQ --------------------------------------------------------------- */
  var faqSection = $('#perguntas');
  if (!faqSection) return;

  var items = $$('.faq-item', faqSection);
  var input = $('#faq-search');
  var clearBtn = $('.faq-clear', faqSection);
  var chips = $$('.chip', faqSection);
  var counter = $('#faq-count');
  var empty = $('.faq-empty', faqSection);
  var resetBtn = $('.faq-reset', faqSection);
  var activeFilter = 'todos';

  // Índice de busca e textos originais (para destacar termos sem perder HTML)
  items.forEach(function (item) {
    var q = $('.faq-q-text', item);
    item._qHTML = q.innerHTML;
    item._index = normalize(item.textContent);
    // Rodapé de cada resposta: link direto para a pergunta
    var inner = $('.faq-a-inner', item);
    var meta = document.createElement('p');
    meta.className = 'faq-meta';
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'faq-copy';
    copy.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5.8 8.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7l-.8.8M8.2 5.8a2.6 2.6 0 0 0-3.7 0L2.3 8a2.6 2.6 0 0 0 3.7 3.7l.8-.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Copiar link desta pergunta';
    var status = document.createElement('span');
    status.className = 'faq-copy-status';
    status.setAttribute('role', 'status');
    copy.addEventListener('click', function () { copyLink(item.id, status); });
    meta.appendChild(copy);
    meta.appendChild(status);
    inner.appendChild(meta);
  });

  // Contagem por categoria nos filtros
  chips.forEach(function (chip) {
    var f = chip.getAttribute('data-filter');
    var n = f === 'todos' ? items.length : items.filter(function (it) { return it.getAttribute('data-cat') === f; }).length;
    var span = document.createElement('span');
    span.className = 'chip-count';
    span.textContent = n;
    span.setAttribute('aria-label', n + (n === 1 ? ' pergunta' : ' perguntas'));
    chip.appendChild(span);
  });

  function copyLink(id, statusEl) {
    var url = location.href.split('#')[0] + '#' + id;
    var done = function (msg) { statusEl.textContent = msg; setTimeout(function () { statusEl.textContent = ''; }, 2500); };
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { done('Link copiado.'); }, function () { done('Link atualizado na barra de endereço.'); });
    } else {
      done('Link atualizado na barra de endereço.');
    }
  }

  function setOpen(item, open) {
    var btn = $('.faq-q button', item);
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
  }

  function toggle(item) {
    var willOpen = !item.classList.contains('is-open');
    // No celular, apenas um item aberto por vez
    if (willOpen && mqMobile.matches) {
      items.forEach(function (other) { if (other !== item) setOpen(other, false); });
    }
    setOpen(item, willOpen);
  }

  items.forEach(function (item) {
    $('.faq-q button', item).addEventListener('click', function () { toggle(item); });
  });

  // Teclado: setas navegam entre perguntas visíveis; Home/End vão aos extremos
  $('.faq-list', faqSection).addEventListener('keydown', function (e) {
    if (!e.target.matches('.faq-q button')) return;
    var visible = items.filter(function (it) { return !it.hidden; }).map(function (it) { return $('.faq-q button', it); });
    var i = visible.indexOf(e.target);
    var target = null;
    if (e.key === 'ArrowDown') target = visible[Math.min(i + 1, visible.length - 1)];
    else if (e.key === 'ArrowUp') target = visible[Math.max(i - 1, 0)];
    else if (e.key === 'Home') target = visible[0];
    else if (e.key === 'End') target = visible[visible.length - 1];
    if (target) { e.preventDefault(); target.focus(); }
  });

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Destaca termos na pergunta (comparação sem acentos, preservando o texto original)
  function highlight(item, terms) {
    var q = $('.faq-q-text', item);
    q.innerHTML = item._qHTML;
    if (!terms.length) return;
    var walker = document.createTreeWalker(q, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var norm = normalize(text);
      var ranges = [];
      terms.forEach(function (t) {
        var re = new RegExp(escapeRegExp(t), 'g'), m;
        while ((m = re.exec(norm))) ranges.push([m.index, m.index + t.length]);
      });
      if (!ranges.length) return;
      ranges.sort(function (a, b) { return a[0] - b[0]; });
      var frag = document.createDocumentFragment(), pos = 0;
      ranges.forEach(function (r) {
        if (r[0] < pos) return;
        frag.appendChild(document.createTextNode(text.slice(pos, r[0])));
        var mark = document.createElement('mark');
        mark.className = 'faq-hit';
        mark.textContent = text.slice(r[0], r[1]);
        frag.appendChild(mark);
        pos = r[1];
      });
      frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function apply() {
    var raw = input.value.trim();
    var terms = normalize(raw).split(/\s+/).filter(Boolean);
    var shown = 0;
    items.forEach(function (item) {
      var catOk = activeFilter === 'todos' || item.getAttribute('data-cat') === activeFilter;
      var textOk = terms.every(function (t) { return item._index.indexOf(t) !== -1; });
      var visible = catOk && textOk;
      item.hidden = !visible;
      if (visible) shown++;
      highlight(item, visible ? terms : []);
    });
    clearBtn.hidden = raw === '';
    empty.hidden = shown !== 0;

    var total = items.length;
    var msg;
    if (!raw && activeFilter === 'todos') msg = total + ' perguntas';
    else if (shown === 0) msg = 'Nenhum resultado';
    else msg = shown + (shown === 1 ? ' resultado' : ' resultados') + ' de ' + total + ' perguntas';
    if (raw) msg += ' para “' + raw + '”';
    counter.textContent = msg;
  }

  var debounce;
  input.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(apply, 120);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; apply(); }
  });
  clearBtn.addEventListener('click', function () { input.value = ''; apply(); input.focus(); });

  function setFilter(f) {
    activeFilter = f;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === f)); });
    apply();
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { setFilter(chip.getAttribute('data-filter')); });
  });
  resetBtn.addEventListener('click', function () { input.value = ''; setFilter('todos'); input.focus(); });

  // Deep links: #faq-<id> abre e rola até a pergunta
  function openFromHash(initial) {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || id.indexOf('faq-') !== 0) return;
    var item = document.getElementById(id);
    if (!item || !item.classList.contains('faq-item')) return;
    if (item.hidden) { input.value = ''; setFilter('todos'); }
    if (mqMobile.matches) items.forEach(function (o) { if (o !== item) setOpen(o, false); });
    setOpen(item, true);
    requestAnimationFrame(function () {
      item.scrollIntoView({ behavior: initial === true ? 'instant' : scrollBehavior(), block: 'start' });
      $('.faq-q button', item).focus({ preventScroll: true });
    });
  }
  window.addEventListener('hashchange', function () { openFromHash(false); });
  // Na carga inicial, aguarda o layout (fontes/imagem) e posiciona sem animação
  if (document.readyState === 'complete') openFromHash(true);
  else window.addEventListener('load', function () { openFromHash(true); });
})();
