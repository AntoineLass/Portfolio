/* ==========================================================================
   Interface : navigation, thème, langue, grille des projets, formulaire,
   petites animations de l'accueil et HUD.
   ========================================================================== */

/* Coordonnées publiques. L'adresse est assemblée en JS pour limiter le spam. */
window.SITE = {
  email: ['antoine.lassagne', 'outlook.com'],
  github: 'https://github.com/AntoineLass',
  linkedin: '' // ex. 'https://www.linkedin.com/in/…' — laissé vide, le lien reste masqué
};

(function () {
  'use strict';

  var root = document.documentElement;
  var I18N = window.I18N;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var schemeMq = window.matchMedia('(prefers-color-scheme: dark)');
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ---------- thème ---------- */

  var SUN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  var MOON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';

  function currentTheme() {
    return root.dataset.theme || (schemeMq.matches ? 'dark' : 'light');
  }

  function syncThemeUi() {
    var icon = $('#theme-icon');
    if (icon) icon.innerHTML = currentTheme() === 'dark' ? MOON : SUN;
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  }

  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeUi();
      document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    });
  }
  if (schemeMq.addEventListener) schemeMq.addEventListener('change', syncThemeUi);
  syncThemeUi();

  /* ---------- langue ---------- */

  var langBtn = $('#lang-toggle');
  if (langBtn && I18N) langBtn.addEventListener('click', function () { I18N.toggle(); });

  // un ?lang= dans l'URL reste cohérent avec la langue choisie
  document.addEventListener('langchange', function () {
    if (!window.URL || !history.replaceState) return;
    var u = new URL(location.href);
    if (!u.searchParams.has('lang')) return;
    if (I18N.lang === 'en') u.searchParams.set('lang', 'en');
    else u.searchParams.delete('lang');
    history.replaceState(null, '', u);
  });

  /* ---------- navigation ---------- */

  var nav = $('#nav');
  var burger = $('.nav__burger');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // lien actif selon la section visible
  var links = $$('.nav__links a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = byId[e.target.id];
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (sid) {
      var s = document.getElementById(sid);
      if (s) io.observe(s);
    });
  }

  /* ---------- accueil : nom « décodé » + journal de démarrage ---------- */

  var nameEl = $('#hero-name');
  if (nameEl && !reduceMotion.matches) {
    var finalName = nameEl.textContent;
    var GLYPHS = '01<>/\\[]{}=+*#%&$@ABCDEF';
    var start = performance.now();
    var DUR = 750;
    nameEl.setAttribute('aria-label', finalName);
    (function scramble(now) {
      var p = Math.min(1, (now - start) / DUR);
      var out = '';
      for (var i = 0; i < finalName.length; i++) {
        var c = finalName[i];
        var reveal = p * finalName.length * 1.15 - i * 0.9;
        if (c === ' ' || reveal > 1) out += c === ' ' ? ' ' : c;
        else out += '<span class="scr">' + GLYPHS[(Math.random() * GLYPHS.length) | 0].replace('<', '&lt;').replace('>', '&gt;') + '</span>';
      }
      nameEl.innerHTML = out;
      if (p < 1) requestAnimationFrame(scramble);
      else nameEl.textContent = finalName;
    })(start);
  }

  var boot = $$('#bootlog li');
  if (boot.length && !reduceMotion.matches) {
    boot.forEach(function (li) { li.classList.add('is-hidden'); });
    boot.forEach(function (li, i) {
      setTimeout(function () { li.classList.remove('is-hidden'); }, 380 + i * 170);
    });
  }

  /* ---------- projets ---------- */

  var projects = window.PROJECTS || [];
  var cats = window.PROJECT_CATS || [];
  var activeCat = 'all';

  function projectUrl(p) {
    return 'projet.html?id=' + encodeURIComponent(p.id) + (I18N && I18N.lang === 'en' ? '&lang=en' : '');
  }

  function coverNode(p, animateHost) {
    var wrap = el('div', { class: 'card__cover' });
    if (p.cover && p.cover.src) {
      if (/\.(mp4|webm)$/i.test(p.cover.src)) {
        var v = el('video', { src: p.cover.src, muted: '', loop: '', playsinline: '', preload: 'metadata', 'aria-hidden': 'true' });
        if (p.cover.poster) v.setAttribute('poster', p.cover.poster);
        v.muted = true;
        if (!reduceMotion.matches) {
          v.autoplay = true;
          v.setAttribute('autoplay', '');
        }
        wrap.appendChild(v);
      } else {
        wrap.appendChild(el('img', { src: p.cover.src, alt: '', loading: 'lazy', decoding: 'async' }));
      }
    } else if (p.ascii && window.ASCII) {
      var a = el('div', { class: 'ascii' });
      wrap.appendChild(a);
      window.ASCII.mount(a, p.ascii, { animate: 'hover', hoverEl: animateHost });
    }
    return wrap;
  }

  function tagList(tags) {
    var ul = el('ul', { class: 'tags' });
    (tags || []).forEach(function (t) { ul.appendChild(el('li', { text: I18N.pick(t) })); });
    return ul;
  }

  function card(p) {
    var a = el('a', { class: 'card', href: projectUrl(p), 'data-cats': p.cats.join(' ') });
    a.appendChild(coverNode(p, a));
    var body = el('div', { class: 'card__body' }, [
      el('div', { class: 'card__meta' }, [
        p.badge ? el('span', { class: 'card__badge', text: I18N.pick(p.badge) }) : null,
        el('span', { text: I18N.pick(p.period) }),
        el('span', { text: I18N.pick(p.context) })
      ]),
      el('h3', { class: 'card__title', text: I18N.pick(p.title) }),
      el('p', { class: 'card__summary', text: I18N.pick(p.summary) }),
      el('div', { class: 'card__foot' }, [
        tagList(p.tags),
        el('span', { class: 'card__more', 'aria-hidden': 'true', text: I18N.t('open') + ' →' })
      ])
    ]);
    a.appendChild(body);
    return a;
  }

  function renderFilters() {
    var box = $('#filters');
    if (!box) return;
    box.innerHTML = '';
    cats.forEach(function (c) {
      var count = c.id === 'all' ? projects.length : projects.filter(function (p) { return p.cats.indexOf(c.id) >= 0; }).length;
      if (!count) return;
      var b = el('button', { class: 'filter', type: 'button', 'aria-pressed': String(c.id === activeCat), 'data-cat': c.id }, [
        document.createTextNode(I18N.pick(c.label)),
        el('span', { class: 'count', text: String(count) })
      ]);
      b.addEventListener('click', function () {
        activeCat = c.id;
        $$('.filter', box).forEach(function (f) { f.setAttribute('aria-pressed', String(f.dataset.cat === activeCat)); });
        applyFilter();
      });
      box.appendChild(b);
    });
  }

  function applyFilter() {
    ['#grid-featured', '#grid-rest'].forEach(function (sel) {
      var grid = $(sel);
      if (!grid) return;
      var shown = 0;
      $$('.card', grid).forEach(function (c) {
        var ok = activeCat === 'all' || c.dataset.cats.split(' ').indexOf(activeCat) >= 0;
        c.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      grid.hidden = shown === 0;
    });
  }

  function renderProjects() {
    var gf = $('#grid-featured'), gr = $('#grid-rest');
    if (!gf || !gr || !I18N) return;
    gf.innerHTML = '';
    gr.innerHTML = '';
    projects.forEach(function (p) { (p.featured ? gf : gr).appendChild(card(p)); });
    renderFilters();
    applyFilter();
  }

  renderProjects();
  document.addEventListener('langchange', renderProjects);

  /* ---------- contact ---------- */

  var email = (window.SITE.email || []).join('@');
  var emailText = $('#email-text');
  if (emailText && email) emailText.textContent = email;

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el('textarea', { readonly: '' });
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  var copyBtn = $('#email-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyText(email).then(function () {
        copyBtn.textContent = I18N.t('copied');
        copyBtn.classList.add('is-done');
      }, function () {
        copyBtn.textContent = I18N.t('copyFail');
        var r = document.createRange();
        r.selectNodeContents(emailText);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      });
      setTimeout(function () {
        copyBtn.classList.remove('is-done');
        copyBtn.textContent = I18N.t('copy');
      }, 2200);
    });
  }

  var li = $('#link-linkedin');
  if (li && window.SITE.linkedin) {
    li.href = window.SITE.linkedin;
    li.hidden = false;
  }

  var form = $('#contact-form');
  if (form) {
    var msg = $('#f-msg'), name = $('#f-name'), org = $('#f-org'), out = $('#f-out'), count = $('#f-count');
    var lastBody = '';

    msg.addEventListener('input', function () {
      count.textContent = msg.value.length + ' / ' + msg.maxLength;
    });

    function show(lines) {
      out.hidden = false;
      out.innerHTML = lines.join('<br>');
    }

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = name.value.trim();
      var m = msg.value.trim();
      if (!n) { show(['<span class="err">' + esc(I18N.t('errName')) + '</span>']); name.focus(); return; }
      if (!m) { show(['<span class="err">' + esc(I18N.t('errMsg')) + '</span>']); msg.focus(); return; }

      var topic = (form.querySelector('input[name="topic"]:checked') || {}).value || 'autre';
      var o = org.value.trim();
      var subject = '[Portfolio] ' + I18N.t('topics')[topic] + ' — ' + n + (o ? ' (' + o + ')' : '');
      var signature = n + (o ? ', ' + o : '');
      lastBody = m + '\n\n' + I18N.t('mailFrom').replace('%s', signature) + '\n' + I18N.t('mailVia');

      var href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lastBody);
      show([
        '<span class="ok">' + esc(I18N.t('outCompose')) + '</span>',
        esc(I18N.t('outOpen')),
        I18N.t('outHelp')
      ]);
      window.location.href = href;
    });

    out.addEventListener('click', function (e) {
      if (!e.target.matches('[data-copy-msg]')) return;
      copyText(lastBody).then(function () {
        e.target.outerHTML = '<span class="ok">' + esc(I18N.t('outCopied')) + '</span>';
      });
    });
  }

  /* ---------- HUD (position de la sonde, compteur d'interruptions) ---------- */

  var hud = $('#hud');
  var irq = 0;
  var hx = 0, hy = 0, hudRaf = 0;
  function hex(v) { return '0x' + ('0000' + Math.max(0, Math.round(v)).toString(16).toUpperCase()).slice(-4); }
  function paintHud() {
    hudRaf = 0;
    hud.innerHTML = 'probe x:' + hex(hx) + ' y:' + hex(hy) + ' · irq:<b>' + ('00' + irq).slice(-3) + '</b>';
  }
  var heroEl = $('#top');
  var heroVisible = !!heroEl;
  if (hud && heroEl && 'IntersectionObserver' in window) {
    // le HUD ne s'affiche qu'au-dessus de l'accueil, pour ne pas gêner la lecture
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].intersectionRatio > 0.6;
      if (!heroVisible) hud.classList.remove('is-on');
    }, { threshold: [0, 0.6, 1] }).observe(heroEl);
  }
  if (hud && heroEl) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      hx = e.clientX; hy = e.clientY + window.scrollY;
      if (!heroVisible) return;
      hud.classList.add('is-on');
      if (!hudRaf) hudRaf = requestAnimationFrame(paintHud);
    }, { passive: true });
    var countIrq = function () {
      irq++;
      if (!hudRaf) hudRaf = requestAnimationFrame(paintHud);
    };
    window.addEventListener('pointerdown', countIrq, { passive: true });
    document.addEventListener('irq', countIrq); // clic sur le chien (propagation stoppée)
    document.documentElement.addEventListener('mouseleave', function () { hud.classList.remove('is-on'); });
  }

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
