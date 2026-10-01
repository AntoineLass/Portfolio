/* ==========================================================================
   Le compagnon de l'accueil, en ASCII. Au choix : le chien robot (un Nova SM3,
   clin d'œil au PFE), un petit robot à chenilles ou un drone FPV.
   Une petite machine à états : il suit le curseur, attend, s'assoit, dort ou
   fait un tour selon l'ordre donné dans son menu (clic sur lui). Un clic
   ailleurs est une interruption (ISR).
   ========================================================================== */

(function () {
  'use strict';

  var pet = document.getElementById('pet');
  var spriteEl = document.getElementById('pet-sprite');
  var shadowEl = document.getElementById('pet-shadow');
  var bubble = document.getElementById('bubble');
  var menu = document.getElementById('pet-menu');
  var toggle = document.getElementById('pet-toggle');
  var nameLabel = document.getElementById('pet-name');
  var ground = document.getElementById('ground');
  var hero = document.getElementById('top');
  var fsmLabel = document.getElementById('fsm');
  if (!pet || !spriteEl || !ground || !hero) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var T = function (k) { return window.I18N ? window.I18N.t(k) : null; };

  /* ---------- outils de dessin ---------- */

  var MIRROR = {
    '╭': '╮', '╮': '╭', '╰': '╯', '╯': '╰', '┤': '├', '├': '┤', '┌': '┐', '┐': '┌',
    '└': '┘', '┘': '└', '▸': '◂', '◂': '▸', '╲': '╱', '╱': '╲', '╴': '╶', '╶': '╴',
    '╸': '╺', '╺': '╸', '(': ')', ')': '('
  };
  var VFLIP = { '╭': '╰', '╰': '╭', '╮': '╯', '╯': '╮', '┴': '┬', '┬': '┴' };

  function blank(n) { return new Array(n + 1).join(' '); }

  function setAt(line, x, s) {
    while (line.length < x + s.length) line += ' ';
    return line.slice(0, x) + s + line.slice(x + s.length);
  }

  function fill(line, o) {
    return line.replace('L', o.led).replace(/E/g, o.eye);
  }

  /* ---------- le chien (orienté vers la droite) ---------- */

  var DOG_BODY = [
    '               ╱╲',
    '              ╭┴─────╮',
    '╲     L       │   E  ╰─╮',
    ' ╲╭───┴───────┤        ▸',
    '  │ ■ ■ ═════ ╰──┬─────╯',
    '  ╰─┬──┬─────┬──┬╯'
  ];
  var DOG_SIT = [
    '               ╱╲',
    '              ╭┴─────╮',
    '              │   E  ╰─╮',
    '       L  ╭───┤        ▸',
    '  ╭────┴──╯   ╰──┬─────╯',
    '╲ │ ■ ■ ═══  ╭──┬╯',
    ' ╲│      ╭───╯  │',
    '  │   ╭──╯      │',
    '  ╰───┴══╸      ╹'
  ];
  var DOG_LEG_X = [4, 7, 13, 16];
  var DOG_LEGS = {
    stand: ['│', '│', '╹'],
    fwd: ['╲', ' ╲', '  ╹'],
    back: ['╱', '╱', '╹'],
    lift: ['│', '╰╴', '']
  };
  var DOG_LYING = '    ╰╯ ╰╯     ╰╯ ╰╯';

  function dogLines(o) {
    if (o.pose === 'sit') return DOG_SIT.map(function (l) { return fill(l, o); });
    var lines = DOG_BODY.map(function (l) { return fill(l, o); });
    if (o.pose === 'lie') return lines.concat([DOG_LYING]);
    var gait = 'stand';
    if (o.moving) gait = o.frame % 2 ? ['fwd', 'back', 'fwd', 'back'] : ['back', 'fwd', 'back', 'fwd'];
    else if (o.air) gait = 'lift';
    var rows = ['', '', ''];
    for (var k = 0; k < 4; k++) {
      var leg = DOG_LEGS[typeof gait === 'string' ? gait : gait[k]];
      for (var r = 0; r < 3; r++) {
        if (leg[r]) rows[r] = setAt(rows[r], DOG_LEG_X[k], leg[r]);
      }
    }
    return lines.concat(rows);
  }

  /* ---------- le robot à chenilles ---------- */

  var BOT_HEAD = [
    '       L',
    '   ╭───┴───╮',
    '   │  E  E │'
  ];
  var BOT_NECK = ['   ╰──┬─┬──╯', ' ╭────┴─┴────╮'];
  var BOT_CROUCH = [' ╭─┴───────┴─╮'];
  var BOT_BODY = [' │ ■ ■ ═══ ▫ │', ' ╰┬─────────┬╯'];
  var BOT_TRACKS = [' (o═o═o═o═o═o)', ' (═o═o═o═o═o═)'];

  function botLines(o) {
    var crouch = o.pose !== 'stand';
    var lines = BOT_HEAD.concat(crouch ? BOT_CROUCH : BOT_NECK, BOT_BODY)
      .map(function (l) { return fill(l, o); });
    lines.push(BOT_TRACKS[o.moving ? o.frame % 2 : 0]);
    var above = lines.length - 4, chest = lines.length - 3, below = lines.length - 2;
    var arms = 'rest';
    if (o.trick) arms = Math.floor(o.now / 220) % 2 ? 'a' : 'b';
    else if (o.air) arms = 'wave';
    if (arms === 'a') {
      lines[above] = setAt(lines[above], 0, '╲');
      lines[below] = setAt(lines[below], 14, '╲');
    } else if (arms === 'b') {
      lines[above] = setAt(lines[above], 14, '╱');
      lines[below] = setAt(lines[below], 0, '╱');
    } else {
      lines[chest] = setAt(lines[chest], 0, '╶┤');
      if (arms === 'wave') {
        lines[above] = setAt(lines[above], 14, '╱');
        lines[chest] = setAt(lines[chest], 13, '├');
      } else {
        lines[chest] = setAt(lines[chest], 13, '├╴');
      }
    }
    return lines;
  }

  /* ---------- le drone FPV ---------- */

  var DRONE_BODY = [
    '   ┴    ╭───╮    ┴',
    '   ╰────┤ L ├────┴─╮',
    '        ╰───┴─────E╯'
  ];
  var PROPS = ['╺━━━━━╸', ' ╺━━━╸ ', '  ╺━╸  ', ' ╺━━━╸ '];
  var PROP_OFF = '╶─────╴';

  function droneLines(o) {
    var prop = PROP_OFF;
    if (o.pose !== 'lie') prop = PROPS[Math.floor(o.now / (o.pose === 'sit' ? 240 : 70)) % PROPS.length];
    var lines = [setAt(setAt('', 0, prop), 14, prop)]
      .concat(DRONE_BODY.map(function (l) { return fill(l, o); }));
    if (o.trick && o.p > 0.3 && o.p < 0.7) {
      // tonneau : le drone passe sur le dos au sommet de la trajectoire
      lines = lines.reverse().map(function (l) {
        return l.split('').map(function (c) { return VFLIP[c] || c; }).join('');
      });
    }
    return lines;
  }

  /* ---------- les trois compagnons ---------- */

  var KINDS = {
    dog: {
      name: 'nova-sm3', width: 24, speed: 0.13, trickMs: 1300, lines: dogLines,
      eyes: { open: '◉', happy: '^', up: '°', down: '.', closed: '─' },
      labels: { idle: 'IDLE', move: 'WALK', stay: 'STAY', sit: 'SIT', sleep: 'SLEEP', react: 'BARK', isr: 'ISR', trick: 'JUMP' }
    },
    robot: {
      name: 'bot-01', width: 15, speed: 0.1, trickMs: 1800, lines: botLines,
      eyes: { open: '◉', happy: '^', up: '°', down: '.', closed: '─' },
      labels: { idle: 'IDLE', move: 'ROLL', stay: 'HALT', sit: 'CROUCH', sleep: 'STANDBY', react: 'BEEP', isr: 'ISR', trick: 'DANCE' }
    },
    drone: {
      name: 'quad-5in', width: 21, speed: 0.22, trickMs: 1100, lines: droneLines, flies: true,
      eyes: { open: '◉', happy: '◉', up: '◉', down: '◉', closed: '·' },
      labels: { idle: 'HOVER', move: 'FLY', stay: 'HOLD', sit: 'LANDED', sleep: 'DISARMED', react: 'BEEP', isr: 'ISR', trick: 'FLIP' }
    }
  };
  var KIND_IDS = ['dog', 'robot', 'drone'];
  var CMD_IDS = ['follow', 'stay', 'sit', 'trick', 'sleep'];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function toHtml(text) {
    return escapeHtml(text).replace(/[●○◉^]/g, function (c) { return '<span class="acc">' + c + '</span>'; });
  }

  /* ---------- état ---------- */

  var S = {
    kind: 'dog',
    mode: 'follow',   // ordre en cours : follow | stay | sit | sleep
    state: 'idle',    // idle | move | stay | sit | sleep | react | isr | trick
    napping: false,   // endormi tout seul, faute d'activité
    x: 40,
    target: 40,
    facing: 1,
    frame: 0,
    frameT: 0,
    idleT: 0,
    stateT: 0,
    lookY: 0,
    alt: 0
  };
  var pointer = { x: -1, y: -1, inHero: false };
  var menuOpen = false;
  var bubbleText = '', bubbleSide = '', bubbleTimer = 0;
  var visible = true;
  var raf = 0, lastT = 0;
  var lastIrq = 0;

  try {
    var saved = localStorage.getItem('pet');
    if (KINDS[saved]) S.kind = saved;
  } catch (e) {}

  function K() { return KINDS[S.kind]; }

  function setState(st) {
    if (S.state === st) return;
    S.state = st;
    S.stateT = 0;
    syncLabels();
  }

  function syncLabels() {
    if (fsmLabel) fsmLabel.textContent = K().labels[S.state];
    if (nameLabel) nameLabel.textContent = K().name;
  }

  function restState() {
    if (S.mode === 'follow') return S.napping ? 'sleep' : 'idle';
    return S.mode;
  }

  function pose() {
    if (S.state === 'trick' || S.state === 'move') return 'stand';
    if (S.state === 'sleep') return 'lie';
    if (S.mode === 'sit') return 'sit';
    return 'stand';
  }

  function lineHeight() {
    var n = spriteEl.textContent.split('\n').length || 1;
    return spriteEl.offsetHeight / n;
  }

  /* ---------- bulle ---------- */

  function sideFor(w) {
    var gw = ground.clientWidth, pw = pet.offsetWidth;
    var fits = { right: gw - (S.x + pw) - 8 >= w + 10, left: S.x - 8 >= w + 10 };
    var first = S.facing > 0 ? 'right' : 'left';
    var other = first === 'right' ? 'left' : 'right';
    return fits[first] ? first : fits[other] ? other : '';
  }

  function drawBubble(side) {
    var inner = ' ' + bubbleText + ' ';
    var bar = new Array(inner.length + 1).join('─');
    var text = escapeHtml(inner);
    var lines;
    if (side === 'right') lines = ['╭' + bar + '╮', '┤' + text + '│', '╰' + bar + '╯'];
    else if (side === 'left') lines = ['╭' + bar + '╮', '│' + text + '├', '╰' + bar + '╯'];
    else lines = ['╭' + bar + '╮', '│' + text + '│', S.facing > 0 ? '╰─┬' + bar.slice(2) + '╯' : '╰' + bar.slice(2) + '┬─╯'];
    bubble.innerHTML = lines.join('\n').replace(/[⚡✓]/g, function (c) { return '<span class="acc">' + c + '</span>'; });
    bubbleSide = side;
  }

  function say(text, ms) {
    if (!text) return;
    if (menuOpen) { setMenuSay(text); return; }
    if (!bubble) return;
    bubbleText = text;
    drawBubble('above');
    bubble.classList.add('is-on');
    positionBubble();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hush, ms || 2200);
  }

  function hush() {
    clearTimeout(bubbleTimer);
    if (bubble) bubble.classList.remove('is-on');
  }

  // à côté de la tête quand il y a la place, au-dessus sinon (petits écrans)
  function positionBubble() {
    if (!bubble) return;
    var gw = ground.clientWidth;
    var pw = pet.offsetWidth, ph = spriteEl.offsetHeight;
    var bw = bubble.offsetWidth;
    var side = sideFor(bw);
    if ((side || 'above') !== bubbleSide) drawBubble(side || 'above');
    var bx, by;
    if (side) {
      bx = side === 'right' ? S.x + pw + 6 : S.x - bw - 6;
      by = 23 + S.alt + ph * 0.55;
    } else {
      var headX = S.facing > 0 ? S.x + pw * 0.62 : S.x + pw * 0.38 - bw;
      bx = Math.max(6, Math.min(gw - bw - 6, headX));
      by = ph + S.alt + 26;
    }
    bubble.style.transform = 'translate(' + Math.round(bx) + 'px, ' + (-Math.round(by)) + 'px)';
  }

  /* ---------- menu des ordres ---------- */

  function setMenuSay(text) {
    var line = menu && menu.querySelector('.pet-menu__say span');
    if (line) line.textContent = text;
  }

  function chip(attr, id, label, pressed) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute(attr, id);
    b.textContent = label;
    if (pressed != null) b.setAttribute('aria-pressed', String(pressed));
    return b;
  }

  function buildMenu() {
    if (!menu) return;
    var cmds = (T('petCmds') || {})[S.kind] || {};
    var kinds = T('petKinds') || {};
    var said = menu.querySelector('.pet-menu__say span');
    var keep = said ? said.textContent : '';
    menu.innerHTML = '';

    var sayLine = document.createElement('p');
    sayLine.className = 'pet-menu__say';
    var who = document.createElement('b');
    who.textContent = K().name + ' >';
    var what = document.createElement('span');
    what.textContent = keep;
    sayLine.appendChild(who);
    sayLine.appendChild(document.createTextNode(' '));
    sayLine.appendChild(what);
    menu.appendChild(sayLine);

    var rowCmds = document.createElement('div');
    rowCmds.className = 'pet-menu__row';
    rowCmds.setAttribute('role', 'group');
    rowCmds.setAttribute('aria-label', T('petCmdLabel') || '');
    CMD_IDS.forEach(function (c) {
      rowCmds.appendChild(chip('data-cmd', c, cmds[c] || c, c === 'trick' ? null : S.mode === c && !S.napping));
    });
    menu.appendChild(rowCmds);

    var rowKinds = document.createElement('div');
    rowKinds.className = 'pet-menu__row pet-menu__row--kinds';
    rowKinds.setAttribute('role', 'group');
    rowKinds.setAttribute('aria-label', T('petKindLabel') || '');
    KIND_IDS.forEach(function (k) {
      rowKinds.appendChild(chip('data-kind', k, kinds[k] || k, S.kind === k));
    });
    menu.appendChild(rowKinds);
  }

  // à côté du compagnon quand il y a la place, sous la ligne de sol sinon
  function positionMenu() {
    if (!menu || !menuOpen) return;
    var gw = ground.clientWidth;
    var pw = pet.offsetWidth;
    var mw = menu.offsetWidth, mh = menu.offsetHeight;
    var side = sideFor(mw);
    var mx, my;
    if (side) {
      mx = side === 'right' ? S.x + pw + 8 : S.x - mw - 8;
      my = -26;
    } else {
      mx = Math.max(6, Math.min(gw - mw - 6, S.x + pw / 2 - mw / 2));
      my = mh - 14;
    }
    menu.style.transform = 'translate(' + Math.round(mx) + 'px, ' + Math.round(my) + 'px)';
  }

  function openMenu(text) {
    if (!menu || menuOpen) return;
    menuOpen = true;
    hush();
    S.target = S.x;
    buildMenu();
    setMenuSay(text || '');
    menu.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    positionMenu();
    wake();
  }

  function closeMenu() {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.hidden = true;
    S.target = S.x;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function command(cmd) {
    S.napping = false;
    S.idleT = 0;
    S.target = S.x;
    if (cmd === 'trick') {
      if (S.mode === 'sleep') S.mode = 'stay';
      S.state = '';
      setState('trick');
    } else {
      S.mode = cmd;
      S.state = '';
      setState(restState());
    }
    closeMenu();
    say(((T('petAck') || {})[S.kind] || {})[cmd], 1800);
  }

  function setKind(kind) {
    if (!KINDS[kind] || kind === S.kind) return;
    S.kind = kind;
    S.alt = 0;
    try { localStorage.setItem('pet', kind); } catch (e) {}
    syncLabels();
    render(performance.now());
    S.x = clampX(S.x);
    S.target = S.x;
    buildMenu();
    setMenuSay(pick(T('petSay')));
    positionMenu();
  }

  function pick(byKind) {
    var list = (byKind || {})[S.kind] || [];
    return list.length ? list[Math.floor(Math.random() * list.length)] : '';
  }

  /* ---------- rendu ---------- */

  function render(now) {
    var kind = K();
    var led = '●';
    // battement de cœur : double clignotement
    var hb = now % 1400;
    if (hb > 90 && hb < 200) led = '○';
    else if (hb > 290) led = '○';
    if (S.state === 'sleep') led = (now % 2400) < 200 ? '●' : '○';
    if (S.state === 'isr' || S.state === 'react' || S.state === 'trick') led = '●';

    var eye = kind.eyes.open;
    if (S.state === 'sleep') eye = kind.eyes.closed;
    else if (S.state === 'react' || S.state === 'trick') eye = kind.eyes.happy;
    else if (S.lookY < -0.5) eye = kind.eyes.up;
    else if (S.lookY > 0.6) eye = kind.eyes.down;
    // clignement des yeux de temps en temps
    if (S.state !== 'sleep' && S.state !== 'react' && S.state !== 'trick' && (now % 4300) < 140) eye = kind.eyes.closed;

    var p = S.state === 'trick' ? Math.min(1, S.stateT / kind.trickMs) : 0;
    var hop = 0;
    if (S.state === 'react' && S.stateT < 260) hop = 8;
    else if (S.state === 'trick' && !kind.flies) {
      hop = S.kind === 'dog' ? 26 * Math.abs(Math.sin(p * Math.PI * 2)) : (Math.floor(now / 220) % 2 ? 4 : 0);
    } else if (S.state === 'move' && !kind.flies && S.frame % 2) hop = 1;

    var lines = kind.lines({
      led: led,
      eye: eye,
      pose: pose(),
      moving: S.state === 'move',
      frame: S.frame,
      air: hop > 4,
      trick: S.state === 'trick',
      p: p,
      now: now
    }).map(function (l) { return (l + blank(kind.width)).slice(0, kind.width); });
    if (S.facing < 0) {
      lines = lines.map(function (l) {
        return l.split('').reverse().map(function (c) { return MIRROR[c] || c; }).join('');
      });
    }
    var html = toHtml(lines.join('\n'));
    if (spriteEl.innerHTML !== html) spriteEl.innerHTML = html;

    var lift = hop;
    if (kind.flies) {
      var lh = lineHeight();
      lift = S.alt;
      if (S.alt > lh * 0.5 && !reduceMotion.matches) lift += Math.sin(now / 380) * 2.5;
      if (S.state === 'trick') lift += Math.sin(p * Math.PI) * lh * 2.2;
    }
    pet.style.transform = 'translateX(' + Math.round(S.x) + 'px)';
    spriteEl.style.transform = 'translateY(' + (-Math.round(lift)) + 'px)';

    if (shadowEl) {
      var shadow = kind.flies ? blank(4) + new Array(14).join('╌') : '';
      if (shadowEl.textContent !== shadow) shadowEl.textContent = shadow;
      shadowEl.style.opacity = kind.flies && lift > 4 ? '1' : '0';
    }
  }

  function clampX(x) {
    var max = ground.clientWidth - pet.offsetWidth - 8;
    return Math.max(8, Math.min(max, x));
  }

  function tick(now) {
    raf = 0;
    var dt = Math.min(80, lastT ? now - lastT : 16);
    lastT = now;
    S.stateT += dt;

    var kind = K();
    var pw = pet.offsetWidth;
    var canMove = S.mode === 'follow' && !menuOpen && !reduceMotion.matches;
    if (canMove && pointer.inHero) S.target = clampX(pointer.x - pw / 2);
    if (!canMove) S.target = S.x;

    var dx = S.target - S.x;
    var busy = S.state === 'react' || S.state === 'isr' || S.state === 'trick';

    if (busy) {
      var dur = S.state === 'react' ? 1300 : S.state === 'isr' ? 700 : kind.trickMs;
      if (S.stateT > dur) {
        setState(restState());
        S.idleT = 0;
      }
    } else if (canMove && Math.abs(dx) > 6) {
      S.napping = false;
      setState('move');
      S.facing = dx > 0 ? 1 : -1;
      S.x += Math.sign(dx) * Math.min(Math.abs(dx), kind.speed * dt);
      S.frameT += dt;
      if (S.frameT > 150) { S.frameT = 0; S.frame++; }
      S.idleT = 0;
    } else {
      setState(restState());
      if (S.state === 'idle' && !menuOpen) {
        S.idleT += dt;
        if (S.idleT > 12000) {
          S.napping = true;
          setState('sleep');
          say((T('petZzz') || {})[S.kind], 1800);
        }
      }
      if (S.state === 'sleep' && S.stateT > 6000) {
        S.stateT = 0;
        say((T('petZzz') || {})[S.kind], 1800);
      }
      // à l'arrêt, il suit le curseur de la tête
      if ((S.state === 'stay' || S.state === 'sit' || menuOpen) && S.state !== 'sleep' && pointer.x >= 0) {
        var off = pointer.x - (S.x + pw / 2);
        if (Math.abs(off) > pw * 0.3) S.facing = off > 0 ? 1 : -1;
      }
    }

    // regard : vers le haut si le curseur est bien au-dessus de lui
    if (pointer.y >= 0) {
      var r = pet.getBoundingClientRect();
      var rel = (pointer.y - (r.top + r.height / 3)) / 220;
      S.lookY = Math.max(-1, Math.min(1, rel));
    }

    if (kind.flies) {
      var up = pose() === 'stand' ? lineHeight() * 1.7 : 0;
      S.alt += (up - S.alt) * Math.min(1, dt * 0.006);
      if (Math.abs(up - S.alt) < 0.5) S.alt = up;
    } else {
      S.alt = 0;
    }

    render(now);
    if (bubble && bubble.classList.contains('is-on')) positionBubble();
    if (menuOpen) positionMenu();
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

  /* ---------- easter egg : le monde 3D (nova.html) ---------- */

  // clic droit ou appui long sur lui, ou le code Konami au clavier
  var leaving = false, pressTimer = 0;

  function secret() {
    if (leaving) return;
    leaving = true;
    clearTimeout(pressTimer);
    closeMenu();
    if (window.BOARD) {
      var r = pet.getBoundingClientRect();
      window.BOARD.signalAt(r.left + r.width / 2, r.top + 6);
    }
    S.napping = false;
    S.state = '';
    setState('trick');
    say(T('petSecret'), 1500);
    var lang = window.I18N ? window.I18N.lang : 'fr';   // la langue affichée suit le visiteur
    setTimeout(function () { window.location.href = 'nova.html?lang=' + lang; }, 750);
  }

  pet.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    secret();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    pet.addEventListener(type, function () { clearTimeout(pressTimer); });
  });

  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  var konami = 0;
  window.addEventListener('keydown', function (e) {
    // e.key pour les lettres : le code doit marcher en AZERTY comme en QWERTY
    var code = e.code || '';
    var k = code.indexOf('Arrow') === 0 ? code : 'Key' + String(e.key).toUpperCase();
    konami = k === KONAMI[konami] ? konami + 1 : (k === KONAMI[0] ? 1 : 0);
    if (konami === KONAMI.length) { konami = 0; secret(); }
  });

  // retour arrière du navigateur : la page est restaurée telle quelle
  window.addEventListener('pageshow', function () { leaving = false; });

  // clic sur lui : il réagit et ouvre le menu des ordres
  pet.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    if (e.button === 2 || leaving) return;   // clic droit : voir l'easter egg
    clearTimeout(pressTimer);
    if (e.pointerType === 'touch') pressTimer = setTimeout(secret, 750);
    if (window.BOARD) {
      var r = pet.getBoundingClientRect();
      window.BOARD.signalAt(r.left + r.width * 0.2, r.top + 6);
    }
    document.dispatchEvent(new CustomEvent('irq', { detail: { source: 'pet' } }));
    if (menuOpen) { closeMenu(); return; }
    var text = pick(T('petSay'));
    if (S.state === 'sleep') {
      text = (T('petWake') || {})[S.kind];
      S.napping = false;
      if (S.mode === 'sleep') S.mode = 'follow';
    }
    S.idleT = 0;
    S.state = '';
    setState('react');
    openMenu(text);
  });

  if (toggle) {
    toggle.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    toggle.addEventListener('click', function () {
      if (menuOpen) closeMenu();
      else openMenu(pick(T('petSay')));
    });
  }

  if (menu) {
    menu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      if (b.dataset.cmd) command(b.dataset.cmd);
      else if (b.dataset.kind) setKind(b.dataset.kind);
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeMenu();
      if (toggle) toggle.focus();
    });
  }

  window.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !visible) return;
    if (menuOpen) { closeMenu(); return; }
    var gr = ground.getBoundingClientRect();
    var x = e.clientX - gr.left;
    S.idleT = 0;
    if (S.state === 'sleep') {
      if (!S.napping) return; // endormi sur ordre : seul un clic sur lui le réveille
      S.napping = false;
      setState('isr');
      say((T('petWake') || {})[S.kind], 2000);
      return;
    }
    // sur écran tactile, il rejoint l'endroit touché
    if (e.pointerType === 'touch' && S.mode === 'follow' && heroContains(e.clientY) && !reduceMotion.matches) {
      S.target = clampX(x - pet.offsetWidth / 2);
      return;
    }
    if (S.state === 'move' || S.state === 'trick') return;
    var now = performance.now();
    if (now - lastIrq < 900) return;
    lastIrq = now;
    S.facing = x > S.x + pet.offsetWidth / 2 ? 1 : -1;
    setState('isr');
    var irqs = T('petIrq') || ['IRQ!'];
    say(irqs[Math.floor(Math.random() * irqs.length)], 1100);
  }, { passive: true });

  document.addEventListener('langchange', function () {
    hush();
    if (menuOpen) { buildMenu(); positionMenu(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else closeMenu();
    }).observe(ground);
  }

  window.addEventListener('resize', function () {
    S.x = clampX(S.x);
    S.target = clampX(S.target);
  });

  // position de départ : à droite du texte sur grand écran, à gauche sinon
  function init() {
    syncLabels();
    render(performance.now());
    var gw = ground.clientWidth;
    S.x = clampX(gw > 900 ? gw * 0.68 : 16);
    S.target = S.x;
    render(performance.now());
    wake();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else init();
})();
