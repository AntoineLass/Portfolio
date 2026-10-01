/* ==========================================================================
   Page projet : projet.html?id=<id> — rendu à partir de assets/js/projects.js
   ========================================================================== */

(function () {
  'use strict';

  var I18N = window.I18N;
  var projects = window.PROJECTS || [];
  var host = document.getElementById('project');
  if (!host || !I18N) return;

  var pid = new URLSearchParams(location.search).get('id') || '';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pick = I18N.pick;
  var t = I18N.t;

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

  function url(p) {
    return 'projet.html?id=' + encodeURIComponent(p.id) + (I18N.lang === 'en' ? '&lang=en' : '');
  }

  function backHref() {
    return 'index.html' + (I18N.lang === 'en' ? '?lang=en' : '') + '#projets';
  }

  function fact(label, node) {
    return el('div', null, [el('dt', { text: label }), el('dd', null, [node])]);
  }

  function media(p) {
    var box = el('div', { class: 'hero-media' });
    if (p.cover && p.cover.src) {
      if (/\.(mp4|webm)$/i.test(p.cover.src)) {
        var v = el('video', { src: p.cover.src, loop: '', playsinline: '', preload: 'metadata', 'aria-label': pick(p.title) });
        v.muted = true;
        v.setAttribute('muted', '');
        if (p.cover.poster) v.setAttribute('poster', p.cover.poster);
        if (reduceMotion.matches) v.setAttribute('controls', '');
        else { v.autoplay = true; v.setAttribute('autoplay', ''); }
        box.appendChild(v);
      } else {
        box.appendChild(el('img', { src: p.cover.src, alt: pick(p.title) }));
      }
    } else if (p.ascii && window.ASCII) {
      var a = el('div', { class: 'ascii' });
      box.appendChild(a);
      window.ASCII.mount(a, p.ascii, { animate: 'visible' });
    }
    return box;
  }

  function section(num, title, body) {
    return el('section', { class: 'prose' }, [
      el('h2', { html: '<b>' + num + '</b> ' + title }),
      el('div', { class: 'prose__body' }, [body])
    ]);
  }

  /* ---------- visionneuse ---------- */

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  var lbCap = document.getElementById('lightbox-cap');
  var lbImages = [];
  var lbIndex = 0;

  function showImage(i) {
    lbIndex = (i + lbImages.length) % lbImages.length;
    var im = lbImages[lbIndex];
    lbImg.src = im.src;
    lbImg.alt = pick(im.alt);
    lbCap.textContent = pick(im.caption) || pick(im.alt);
  }

  if (lb && lb.showModal) {
    document.getElementById('lightbox-close').addEventListener('click', function () { lb.close(); });
    document.getElementById('lightbox-prev').addEventListener('click', function () { showImage(lbIndex - 1); });
    document.getElementById('lightbox-next').addEventListener('click', function () { showImage(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showImage(lbIndex - 1);
      if (e.key === 'ArrowRight') showImage(lbIndex + 1);
    });
  }

  function gallery(p) {
    var ul = el('ul', { class: 'gallery' });
    p.images.forEach(function (im, i) {
      var btn = el('button', { type: 'button' }, [
        el('figure', null, [
          el('img', { src: im.src, alt: pick(im.alt), loading: 'lazy', decoding: 'async' }),
          im.caption ? el('figcaption', { text: pick(im.caption) }) : null
        ])
      ]);
      btn.addEventListener('click', function () {
        if (!lb || !lb.showModal) { window.open(im.src, '_blank'); return; }
        lbImages = p.images;
        showImage(i);
        lb.showModal();
      });
      ul.appendChild(el('li', null, [btn]));
    });
    return ul;
  }

  /* ---------- rendu ---------- */

  function panic() {
    document.title = t('notFoundTitle') + ' — Antoine Lassagne';
    var safe = (pid || '?').replace(/[<>&"]/g, '');
    var pre = el('pre');
    pre.innerHTML = [
      '[    4.200000] <b>' + t('notFound').replace('%s', safe) + '</b>',
      '[    4.200001] CPU: 0 PID: 1 Comm: portfolio',
      '[    4.200002] Call Trace:',
      '[    4.200003]  project_lookup+0x2a/0x40',
      '[    4.200004]  router_dispatch+0x13/0x37',
      '[    4.200005] ---[ end Kernel panic ]---'
    ].join('\n');
    host.className = 'panic wrap';
    host.appendChild(pre);
    host.appendChild(el('a', { class: 'btn btn--primary', href: backHref(), html: '← ' + t('notFoundBack') }));
  }

  function render() {
    host.innerHTML = '';
    var idx = -1;
    for (var i = 0; i < projects.length; i++) if (projects[i].id === pid) idx = i;
    if (idx < 0) { panic(); return; }
    host.className = 'project wrap';

    var p = projects[idx];
    var prev = projects[(idx - 1 + projects.length) % projects.length];
    var next = projects[(idx + 1) % projects.length];

    document.title = pick(p.title) + ' — Antoine Lassagne';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = pick(p.summary);

    host.appendChild(el('nav', { class: 'crumbs', 'aria-label': 'breadcrumb' }, [
      el('a', { href: backHref(), text: '← ' + t('back') }),
      el('span', { class: 'crumbs__path', html: '~/' + (I18N.lang === 'en' ? 'projects' : 'projets') + '/<b>' + p.id + '</b>' })
    ]));

    host.appendChild(el('p', { class: 'project__kicker', text: '// ' + pick(p.context) }));
    host.appendChild(el('h1', { class: 'project__title', text: pick(p.title) }));
    host.appendChild(el('p', { class: 'project__lead', text: pick(p.summary) }));

    var facts = el('dl', { class: 'facts' });
    facts.appendChild(fact(t('period'), document.createTextNode(pick(p.period))));
    facts.appendChild(fact(t('stack'), document.createTextNode((p.tags || []).map(pick).join(' · '))));
    if (p.links && p.links.length) {
      var span = el('span');
      p.links.forEach(function (l, k) {
        if (k) span.appendChild(document.createTextNode(' · '));
        span.appendChild(el('a', { href: l.url, target: '_blank', rel: 'noopener', text: pick(l.label) + ' ↗' }));
      });
      facts.appendChild(fact(t('links'), span));
    }
    host.appendChild(facts);

    host.appendChild(media(p));

    var body = el('div');
    (pick(p.body) || []).forEach(function (para) { body.appendChild(el('p', { text: para })); });
    host.appendChild(section('01', t('theProject'), body));

    var hl = pick(p.highlights) || [];
    if (hl.length) {
      var ul = el('ul');
      hl.forEach(function (h) { ul.appendChild(el('li', { text: h })); });
      host.appendChild(section('02', t('highlights'), ul));
    }

    if (p.images && p.images.length) {
      host.appendChild(section('03', t('gallery'), gallery(p)));
    }

    host.appendChild(el('nav', { class: 'pager', 'aria-label': 'projets' }, [
      el('a', { href: url(prev), class: 'prev' }, [el('span', { class: 'k', text: t('prev') }), el('span', { class: 't', text: pick(prev.title) })]),
      el('a', { href: url(next), class: 'next' }, [el('span', { class: 'k', text: t('next') }), el('span', { class: 't', text: pick(next.title) })])
    ]));
  }

  render();
  document.addEventListener('langchange', function () {
    // garde la langue dans l'URL pour les liens partagés
    var u = new URL(location.href);
    if (I18N.lang === 'en') u.searchParams.set('lang', 'en');
    else u.searchParams.delete('lang');
    history.replaceState(null, '', u);
    render();
  });
})();
