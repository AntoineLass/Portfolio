/* ==========================================================================
   Le chien robot de l'accueil : un Nova SM3 en ASCII, clin d'œil au PFE.
   Une petite machine à états : IDLE → WALK → SLEEP, BARK au clic sur lui,
   ISR quand on clique ailleurs (chaque clic est une interruption).
   ========================================================================== */

(function () {
  'use strict';

  var dog = document.getElementById('dog');
  var bubble = document.getElementById('bubble');
  var ground = document.getElementById('ground');
  var hero = document.getElementById('top');
  var fsmLabel = document.getElementById('fsm');
  if (!dog || !ground || !hero) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var T = function (k) { return window.I18N ? window.I18N.t(k) : ''; };

  /* ---------- sprites (orientés vers la droite) ---------- */

  var BODY = [
    '               ╱╲',
    '              ╭┴─────╮',
    '╲     L       │   E  ╰─╮',
    ' ╲╭───┴───────┤        ▸',
    '  │ ■ ■ ═════ ╰──┬─────╯',
    '  ╰─┬──┬─────┬──┬╯'
  ];
  var WIDTH = 24;
  var LEG_X = [4, 7, 13, 16];
  var LEGS = {
    stand: ['│', '│', '╹'],
    fwd: ['╲', ' ╲', '  ╹'],
    back: ['╱', '╱', '╹'],
    lift: ['│', '╰╴', '']
  };
  var LYING = '    ╰╯ ╰╯     ╰╯ ╰╯';

  var MIRROR = {
    '╭': '╮', '╮': '╭', '╰': '╯', '╯': '╰', '┤': '├', '├': '┤', '┌': '┐', '┐': '┌',
    '└': '┘', '┘': '└', '▸': '◂', '◂': '▸', '╲': '╱', '╱': '╲', '╴': '╶', '╶': '╴'
  };

  function blank(n) { return new Array(n + 1).join(' '); }

  function setAt(line, x, s) {
    while (line.length < x + s.length) line += ' ';
    return line.slice(0, x) + s + line.slice(x + s.length);
  }

  function compose(o) {
    var lines = BODY.map(function (l) {
      return l.replace('L', o.led).replace('E', o.eye);
    });
    if (o.pose === 'lie') {
      lines.push(LYING);
    } else {
      var rows = ['', '', ''];
      for (var k = 0; k < 4; k++) {
        var leg = LEGS[o.legs[k]] || LEGS.stand;
        for (var r = 0; r < 3; r++) {
          if (leg[r]) rows[r] = setAt(rows[r], LEG_X[k], leg[r]);
        }
      }
      lines = lines.concat(rows);
    }
    lines = lines.map(function (l) { return (l + blank(WIDTH)).slice(0, WIDTH); });
    if (o.facing < 0) {
      lines = lines.map(function (l) {
        return l.split('').reverse().map(function (c) { return MIRROR[c] || c; }).join('');
      });
    }
    return lines.join('\n');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function toHtml(text, led, eye) {
    var html = escapeHtml(text);
    html = html.replace(/[●○]/g, function (c) { return '<span class="acc">' + c + '</span>'; });
    if (eye) html = html.split(escapeHtml(eye)).join('<span class="acc">' + escapeHtml(eye) + '</span>');
    return html;
  }

  /* ---------- état ---------- */

  var S = {
    state: 'IDLE',
    x: 40,
    target: 40,
    facing: 1,
    frame: 0,
    frameT: 0,
    idleT: 0,
    stateT: 0,
    hop: 0,
    lookY: 0
  };
  var pointer = { x: -1, y: -1, inHero: false };
  var bubbleTimer = 0;
  var visible = true;
  var raf = 0, lastT = 0;
  var lastIrq = 0;

  function setState(st) {
    if (S.state === st) return;
    S.state = st;
    S.stateT = 0;
    if (fsmLabel) fsmLabel.textContent = st;
  }

  function say(text, ms) {
    if (!bubble) return;
    var inner = ' ' + text + ' ';
    var bar = new Array(inner.length + 1).join('─');
    var lines = [
      '╭' + bar + '╮',
      '│' + escapeHtml(inner) + '│',
      (S.facing > 0 ? '╰─┬' + bar.slice(2) + '╯' : '╰' + bar.slice(2) + '┬─╯')
    ];
    bubble.innerHTML = lines.join('\n').replace(/[⚡✓]/g, function (c) { return '<span class="acc">' + c + '</span>'; });
    bubble.classList.add('is-on');
    positionBubble();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('is-on'); }, ms || 2200);
  }

  function positionBubble() {
    if (!bubble) return;
    var gw = ground.clientWidth;
    var dw = dog.offsetWidth;
    var bw = bubble.offsetWidth;
    var headX = S.facing > 0 ? S.x + dw * 0.62 : S.x + dw * 0.38 - bw;
    var bx = Math.max(6, Math.min(gw - bw - 6, headX));
    bubble.style.transform = 'translate(' + Math.round(bx) + 'px, ' + (-(dog.offsetHeight + 26)) + 'px)';
  }

  /* ---------- rendu ---------- */

  function render(now) {
    var led = '●';
    // battement de cœur : double clignotement
    var hb = (now % 1400);
    if (hb > 90 && hb < 200) led = '○';
    else if (hb > 290) led = '○';
    if (S.state === 'SLEEP') led = (now % 2400) < 200 ? '●' : '○';
    if (S.state === 'ISR' || S.state === 'BARK') led = '●';

    var eye = '◉';
    if (S.state === 'SLEEP') eye = '─';
    else if (S.state === 'BARK') eye = '^';
    else if (S.lookY < -0.5) eye = '°';
    else if (S.lookY > 0.6) eye = '.';
    // clignement des yeux de temps en temps
    if (S.state !== 'SLEEP' && S.state !== 'BARK' && (now % 4300) < 140) eye = '─';

    var legs;
    if (S.state === 'WALK') {
      legs = S.frame % 2 ? ['fwd', 'back', 'fwd', 'back'] : ['back', 'fwd', 'back', 'fwd'];
    } else if (S.state === 'BARK' && S.stateT < 260) {
      legs = ['lift', 'lift', 'lift', 'lift'];
    } else {
      legs = ['stand', 'stand', 'stand', 'stand'];
    }

    var text = compose({
      led: led,
      eye: eye,
      legs: legs,
      pose: S.state === 'SLEEP' ? 'lie' : 'stand',
      facing: S.facing
    });
    var html = toHtml(text, led, eye === '◉' || eye === '^' ? eye : '');
    if (dog.innerHTML !== html) dog.innerHTML = html;

    var bob = S.state === 'WALK' && S.frame % 2 ? -1 : 0;
    var hop = S.state === 'BARK' && S.stateT < 260 ? -8 : 0;
    dog.style.transform = 'translate(' + Math.round(S.x) + 'px, ' + (bob + hop) + 'px)';
  }

  function clampX(x) {
    var max = ground.clientWidth - dog.offsetWidth - 8;
    return Math.max(8, Math.min(max, x));
  }

  function tick(now) {
    raf = 0;
    var dt = Math.min(80, lastT ? now - lastT : 16);
    lastT = now;
    S.stateT += dt;

    var dw = dog.offsetWidth;
    if (pointer.inHero && !reduceMotion.matches) S.target = clampX(pointer.x - dw / 2);

    var dx = S.target - S.x;
    var busyState = S.state === 'BARK' || S.state === 'ISR';

    if (!busyState) {
      if (Math.abs(dx) > 6 && !reduceMotion.matches) {
        setState('WALK');
        S.facing = dx > 0 ? 1 : -1;
        var speed = 0.13 * dt;
        S.x += Math.sign(dx) * Math.min(Math.abs(dx), speed);
        S.frameT += dt;
        if (S.frameT > 150) { S.frameT = 0; S.frame++; }
        S.idleT = 0;
      } else {
        if (S.state !== 'SLEEP') setState('IDLE');
        S.idleT += dt;
        if (S.idleT > 12000 && S.state === 'IDLE') {
          setState('SLEEP');
          say('z z Z', 1800);
        }
        if (S.state === 'SLEEP' && S.stateT > 6000) {
          S.stateT = 0;
          say('z z Z', 1800);
        }
      }
    } else if ((S.state === 'BARK' && S.stateT > 1300) || (S.state === 'ISR' && S.stateT > 700)) {
      setState('IDLE');
      S.idleT = 0;
    }

    // regard : vers le haut si le curseur est bien au-dessus du chien
    if (pointer.y >= 0) {
      var r = dog.getBoundingClientRect();
      var rel = (pointer.y - (r.top + r.height / 3)) / 220;
      S.lookY = Math.max(-1, Math.min(1, rel));
    }

    render(now);
    if (bubble && bubble.classList.contains('is-on')) positionBubble();
    if (visible) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (!raf && visible) {
      lastT = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  /* ---------- évènements ---------- */

  function heroContains(clientY) {
    var r = hero.getBoundingClientRect();
    return clientY >= r.top && clientY <= r.bottom;
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    var gr = ground.getBoundingClientRect();
    pointer.x = e.clientX - gr.left;
    pointer.y = e.clientY;
    pointer.inHero = heroContains(e.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', function () {
    pointer.inHero = false;
  });

  dog.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    if (window.BOARD) {
      var r = dog.getBoundingClientRect();
      window.BOARD.signalAt(r.left + r.width * 0.2, r.top + 6);
    }
    S.idleT = 0;
    setState('BARK');
    var msgs = T('robot') || ['WOOF'];
    say(msgs[Math.floor(Math.random() * msgs.length)], 2400);
    document.dispatchEvent(new CustomEvent('irq', { detail: { source: 'dog' } }));
  });

  window.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !visible) return;
    var gr = ground.getBoundingClientRect();
    var x = e.clientX - gr.left;
    S.idleT = 0;
    if (S.state === 'SLEEP') {
      setState('ISR');
      say(T('robotWake'), 2000);
      return;
    }
    // sur écran tactile, le chien rejoint l'endroit touché
    if (e.pointerType === 'touch' && heroContains(e.clientY) && !reduceMotion.matches) {
      S.target = clampX(x - dog.offsetWidth / 2);
      return;
    }
    if (S.state === 'WALK') return;
    var now = performance.now();
    if (now - lastIrq < 900) return;
    lastIrq = now;
    S.facing = x > S.x + dog.offsetWidth / 2 ? 1 : -1;
    setState('ISR');
    var irqs = T('robotIrq') || ['IRQ!'];
    say(irqs[Math.floor(Math.random() * irqs.length)], 1100);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(ground);
  }

  window.addEventListener('resize', function () {
    S.x = clampX(S.x);
    S.target = clampX(S.target);
  });

  // position de départ : à droite du texte sur grand écran, à gauche sinon
  function init() {
    var gw = ground.clientWidth;
    S.x = clampX(gw > 900 ? gw * 0.68 : 16);
    S.target = S.x;
    render(performance.now());
    wake();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else init();
})();
