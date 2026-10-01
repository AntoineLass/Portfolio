/* ==========================================================================
   Fond : un circuit imprimé dessiné en caractères (canvas).
   - puces, pistes, vias et sérigraphie générés à chaque chargement
   - le curseur agit comme une sonde : la carte s'éclaire autour de lui
   - un clic injecte un signal qui se propage le long des pistes et traverse
     les puces ; à défaut de piste proche, une onde se diffuse
   ========================================================================== */

(function () {
  'use strict';

  var canvas = document.getElementById('board');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var schemeMq = window.matchMedia('(prefers-color-scheme: dark)');

  var FONT_FAMILY = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
  var DX = [0, 1, 0, -1];
  var DY = [-1, 0, 1, 0];

  // types de cellules
  var EMPTY = 0, TRACE = 1, VIA = 2, CHIP = 3, PIN = 4, SILK = 5, DOT = 6, CHIPTXT = 7;
  // poids d'affichage de chaque type dans la couche de base
  var WEIGHT = [0, 1, 1, 1.1, 1.1, 0.75, 0.45, 0.9];

  var CHIP_LABELS = ['STM32F4', 'RP2350', 'MAX10', 'BCM2711', 'MPU6050', 'ESP32', 'MAX485', 'FT232', 'W25Q64', 'LM1117', 'ATMEGA', 'ZYNQ', 'TPS5430', 'SN65HVD'];
  var SILK_LABELS = ['GND', '3V3', '5V', 'SWD', 'TX', 'RX', 'SDA', 'SCL', 'MOSI', 'MISO', 'CLK', 'nRST', 'BOOT', 'PWM', 'A', 'B', 'DE', 'VBAT', 'IRQ'];
  var HEX = '0123456789ABCDEF';

  var dpr = 1, W = 0, H = 0, fs = 14, cw = 8.4, chh = 18.5, cols = 0, rows = 0, N = 0;
  var chars, kind, conn, chipOf, chips;
  var base = document.createElement('canvas');
  var litAt, litPow, inLit, lit = [];
  var ripples = [];
  var colors = { fg: '#ece9e1', accent: '#ffb000', alpha: 0.13 };
  var probe = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: false, a: 0, moved: 0 };
  var raf = 0, lastT = 0, built = false, builtW = 0, builtH = 0;
  var rand = Math.random;

  /* ---------- utilitaires ---------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rint(a, b) { return a + Math.floor(rand() * (b - a + 1)); }
  function pickOne(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function inb(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows; }
  function id(x, y) { return y * cols + x; }

  function readColors() {
    var cs = getComputedStyle(root);
    colors.fg = cs.getPropertyValue('--fg').trim() || colors.fg;
    colors.accent = cs.getPropertyValue('--accent').trim() || colors.accent;
    colors.alpha = parseFloat(cs.getPropertyValue('--board-alpha')) || colors.alpha;
  }

  /* ---------- génération de la carte ---------- */

  var occ;

  function put(x, y, ch, k) {
    var i = id(x, y);
    chars[i] = ch;
    kind[i] = k;
    occ[i] = 1;
  }

  function areaFree(x0, y0, w, h) {
    for (var y = y0; y < y0 + h; y++) {
      for (var x = x0; x < x0 + w; x++) {
        if (!inb(x, y) || occ[id(x, y)]) return false;
      }
    }
    return true;
  }

  function placeChip(ci) {
    for (var attempt = 0; attempt < 40; attempt++) {
      var w = 10 + 2 * rint(0, 4);
      var h = 4 + rint(0, 3);
      var x = rint(3, cols - w - 4);
      var y = rint(2, rows - h - 3);
      if (x < 3 || y < 2) return null;
      if (!areaFree(x - 5, y - 3, w + 10, h + 6)) continue;

      var chip = { x: x, y: y, w: w, h: h, pins: [], cells: [], sides: [[], [], [], []] };
      for (var yy = y; yy < y + h; yy++) {
        for (var xx = x; xx < x + w; xx++) {
          var top = yy === y, bot = yy === y + h - 1, left = xx === x, right = xx === x + w - 1;
          var ch = ' ';
          if (top && left) ch = '┌';
          else if (top && right) ch = '┐';
          else if (bot && left) ch = '└';
          else if (bot && right) ch = '┘';
          else if (top || bot) ch = '─';
          else if (left || right) ch = '│';
          put(xx, yy, ch, ch === ' ' ? EMPTY : CHIP);
          chipOf[id(xx, yy)] = ci;
          chip.cells.push(id(xx, yy));
        }
      }
      // repère de la broche 1 + nom du composant
      put(x + 1, y + 1, '•', CHIPTXT);
      var fit = CHIP_LABELS.filter(function (l) { return l.length <= w - 4; });
      var label = pickOne(fit.length ? fit : ['IC']);
      var ly = y + Math.floor((h - 1) / 2) + (h > 4 ? 0 : 1);
      var lx = x + Math.floor((w - label.length) / 2);
      for (var k = 0; k < label.length; k++) put(lx + k, ly, label[k], CHIPTXT);
      chip.label = label;

      // broches : dessus (N), droite (E), dessous (S), gauche (W)
      var side, px, py;
      for (side = 0; side < 4; side++) {
        if (rand() < 0.22) continue;
        if (side === 0 || side === 2) {
          py = side === 0 ? y : y + h - 1;
          for (px = x + 2; px <= x + w - 3; px += 2) {
            if (rand() < 0.82) addPin(chip, ci, px, py, side);
          }
        } else {
          px = side === 1 ? x + w - 1 : x;
          for (py = y + 1; py <= y + h - 2; py += 2) {
            if (rand() < 0.85) addPin(chip, ci, px, py, side);
          }
        }
      }
      return chip;
    }
    return null;
  }

  function addPin(chip, ci, x, y, side) {
    var i = id(x, y);
    chars[i] = ['┴', '├', '┬', '┤'][side];
    kind[i] = PIN;
    conn[i] = 1 << side;
    chip.pins.push(i);
    chip.sides[side].push(i);
  }

  // le pas suivant est-il possible ? (cellule libre + dégagement latéral)
  function canStep(x, y, d) {
    if (!inb(x, y)) return false;
    if (occ[id(x, y)]) return false;
    var l = (d + 3) % 4, r = (d + 1) % 4;
    var lx = x + DX[l], ly = y + DY[l], rx = x + DX[r], ry = y + DY[r];
    if (inb(lx, ly) && occ[id(lx, ly)]) return false;
    if (inb(rx, ry) && occ[id(rx, ry)]) return false;
    return true;
  }

  /**
   * Trace une piste depuis (sx, sy) dans la direction d.
   * plan : liste de [longueur, virage] (virage : 1 = droite, -1 = gauche, 0 = aucun)
   * fromPin : indice de la broche de départ (ou -1)
   */
  function route(sx, sy, d, plan, fromPin) {
    var path = [];
    var dirs = [];
    var x = sx, y = sy;
    var exited = false;

    // première cellule
    if (!canStep(x, y, d)) return 0;
    path.push(id(x, y)); dirs.push(d); occ[id(x, y)] = 1;

    outer:
    for (var p = 0; p < plan.length; p++) {
      var len = plan[p][0], turn = plan[p][1];
      for (var s = 0; s < len; s++) {
        var nx = x + DX[d], ny = y + DY[d];
        if (!inb(nx, ny)) { exited = true; break outer; }
        if (!canStep(nx, ny, d)) break outer;
        x = nx; y = ny;
        path.push(id(x, y)); dirs.push(d); occ[id(x, y)] = 1;
      }
      if (turn) {
        var nd = (d + (turn > 0 ? 1 : 3)) % 4;
        var tx = x + DX[nd], ty = y + DY[nd];
        if (!inb(tx, ty)) { d = nd; exited = true; break; }
        if (!canStep(tx, ty, nd)) break;
        d = nd;
      }
    }

    // conversion du chemin en caractères
    for (var k = 0; k < path.length; k++) {
      var c = path[k];
      var inDir = (dirs[k] + 2) % 4; // d'où l'on vient
      var bits = 1 << inDir;
      var last = k === path.length - 1;
      if (!last) bits |= 1 << dirs[k + 1];
      else if (exited) bits |= 1 << d;
      conn[c] = bits;
      if (last && !exited) {
        chars[c] = rand() < 0.12 ? '◉' : 'o';
        kind[c] = VIA;
      } else {
        chars[c] = BOX[bits] || '·';
        kind[c] = TRACE;
      }
    }
    // une piste libre démarre aussi sur un via
    if (fromPin < 0 && path.length > 2) {
      chars[path[0]] = 'o';
      kind[path[0]] = VIA;
      conn[path[0]] = 1 << dirs[1];
    }
    return path.length;
  }

  var BOX = {};
  BOX[1 | 4] = '│'; BOX[2 | 8] = '─';
  BOX[1 | 2] = '╰'; BOX[1 | 8] = '╯'; BOX[4 | 2] = '╭'; BOX[4 | 8] = '╮';

  function routeSide(chip, side) {
    var pins = chip.sides[side];
    if (!pins.length) return;
    var turn = rand() < 0.25 ? 0 : (rand() < 0.5 ? 1 : -1);
    var turnDir = turn ? (side + (turn > 0 ? 1 : 3)) % 4 : -1;
    // tri : la broche la plus proche du côté du virage tourne en premier
    var sorted = pins.slice().sort(function (a, b) {
      var ax = a % cols, ay = (a / cols) | 0, bx = b % cols, by = (b / cols) | 0;
      if (turnDir < 0) return 0;
      var va = DX[turnDir] * ax + DY[turnDir] * ay;
      var vb = DX[turnDir] * bx + DY[turnDir] * by;
      return vb - va;
    });
    var baseLen = rint(0, 2);
    var run = rint(4, 18);
    for (var k = 0; k < sorted.length; k++) {
      var pin = sorted[k];
      var px = pin % cols, py = (pin / cols) | 0;
      var plan = [[baseLen + 2 * k, turn], [run + rint(0, 3), rand() < 0.5 ? (rand() < 0.5 ? 1 : -1) : 0]];
      for (var e = 0; e < 2; e++) plan.push([rint(3, 14), rand() < 0.5 ? 1 : -1]);
      plan.push([rint(2, 10), 0]);
      var n = route(px + DX[side], py + DY[side], side, plan, pin);
      if (!n) {
        // broche non routée : on la retire de la liste des broches actives
        conn[pin] = 0;
      }
    }
  }

  function placeSilk(x, y, text) {
    if (!areaFree(x - 1, y, text.length + 2, 1)) return false;
    for (var k = 0; k < text.length; k++) put(x + k, y, text[k], SILK);
    return true;
  }

  function generate() {
    rand = mulberry32(0x2027 + cols * 7 + rows);
    N = cols * rows;
    chars = new Array(N).fill('');
    kind = new Uint8Array(N);
    conn = new Uint8Array(N);
    chipOf = new Int16Array(N).fill(-1);
    occ = new Uint8Array(N);
    litAt = new Float64Array(N);
    litPow = new Float32Array(N);
    inLit = new Uint8Array(N);
    lit = [];
    chips = [];

    var target = Math.max(3, Math.min(16, Math.round(N / 1500)));
    for (var c = 0; c < target; c++) {
      var chip = placeChip(chips.length);
      if (chip) chips.push(chip);
    }
    chips.forEach(function (chip, i) {
      placeSilk(chip.x, chip.y - 2, 'U' + (i + 1));
      [0, 1, 2, 3].forEach(function (side) { routeSide(chip, side); });
    });

    // pistes libres
    var free = Math.round(N / 420);
    for (var f = 0; f < free; f++) {
      var x = rint(1, cols - 2), y = rint(1, rows - 2);
      var d = rint(0, 3);
      var plan = [];
      var segs = rint(1, 4);
      for (var s = 0; s < segs; s++) plan.push([rint(3, 16), rand() < 0.5 ? 1 : -1]);
      plan.push([rint(2, 12), 0]);
      route(x, y, d, plan, -1);
    }

    // sérigraphie près des vias
    for (var i = 0; i < N; i++) {
      if (kind[i] === VIA && rand() < 0.18) {
        var vx = i % cols, vy = (i / cols) | 0;
        placeSilk(vx + 2, vy, pickOne(SILK_LABELS));
      }
    }
    // composants passifs (2 pastilles)
    var passives = Math.round(N / 900);
    for (var p = 0; p < passives; p++) {
      var qx = rint(2, cols - 6), qy = rint(2, rows - 3);
      if (!areaFree(qx - 1, qy - 1, 6, 3)) continue;
      put(qx, qy, '▪', SILK); put(qx + 1, qy, '━', SILK); put(qx + 2, qy, '▪', SILK);
      placeSilk(qx, qy - 1, pickOne(['R', 'C', 'L', 'D']) + rint(1, 48));
    }
    // points de la plaque (perfboard)
    for (var j = 0; j < N; j++) {
      var jx = j % cols, jy = (j / cols) | 0;
      if (!occ[j] && jx % 4 === 0 && jy % 2 === 0) {
        chars[j] = '·';
        kind[j] = DOT;
      }
    }
  }

  /* ---------- rendu ---------- */

  function cellX(x) { return x * cw; }
  function cellY(y) { return y * chh + fs * 1.02; }

  function renderBase() {
    base.width = Math.round(W * dpr);
    base.height = Math.round(H * dpr);
    var b = base.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, W, H);
    b.font = fs + 'px ' + FONT_FAMILY;
    b.textBaseline = 'alphabetic';
    b.fillStyle = colors.fg;
    for (var k = 1; k < WEIGHT.length; k++) {
      b.globalAlpha = Math.min(1, colors.alpha * WEIGHT[k]);
      for (var i = 0; i < N; i++) {
        if (kind[i] === k && chars[i]) b.fillText(chars[i], cellX(i % cols), cellY((i / cols) | 0));
      }
    }
    b.globalAlpha = 1;
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    // hauteur de l'écran : évite de régénérer la carte quand la barre d'adresse mobile apparaît/disparaît
    H = Math.max(window.innerHeight, (window.screen && window.screen.height) || 0, builtH && W === builtW ? builtH : 0);
    fs = W < 640 ? 12 : 14;
    cw = fs * 0.6;
    chh = fs * 1.32;
    cols = Math.ceil(W / cw) + 1;
    rows = Math.ceil(H / chh) + 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + 'px';
    readColors();
    generate();
    renderBase();
    builtW = W;
    builtH = H;
    built = true;
    draw(performance.now());
  }

  function light(i, at, pow) {
    if (litAt[i] > at && inLit[i]) return; // un signal plus récent est déjà prévu
    litAt[i] = at;
    litPow[i] = Math.max(0.15, Math.min(1, pow));
    if (!inLit[i]) { inLit[i] = 1; lit.push(i); }
  }

  var LIFE = 950;

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.drawImage(base, 0, 0, W, H);
    ctx.font = fs + 'px ' + FONT_FAMILY;
    ctx.textBaseline = 'alphabetic';

    // halo de la sonde
    if (probe.a > 0.01) {
      var R = W < 640 ? 120 : 175;
      var x0 = Math.max(0, Math.floor((probe.x - R) / cw));
      var x1 = Math.min(cols - 1, Math.ceil((probe.x + R) / cw));
      var y0 = Math.max(0, Math.floor((probe.y - R) / chh));
      var y1 = Math.min(rows - 1, Math.ceil((probe.y + R) / chh));
      for (var y = y0; y <= y1; y++) {
        for (var x = x0; x <= x1; x++) {
          var i = id(x, y);
          if (!chars[i] || !kind[i]) continue;
          var dx = cellX(x) + cw / 2 - probe.x;
          var dy = y * chh + chh / 2 - probe.y;
          var dist = Math.sqrt(dx * dx + dy * dy) / R;
          if (dist >= 1) continue;
          var f = 1 - dist;
          f = f * f * (3 - 2 * f);
          var w = kind[i] === DOT ? 0.55 : 1;
          ctx.globalAlpha = Math.min(1, f * 0.62 * w * probe.a);
          ctx.fillStyle = colors.fg;
          ctx.fillText(chars[i], cellX(x), cellY(y));
          if (f > 0.55) {
            ctx.globalAlpha = Math.min(1, (f - 0.55) * 2.2 * w * probe.a);
            ctx.fillStyle = colors.accent;
            ctx.fillText(chars[i], cellX(x), cellY(y));
          }
        }
      }
    }

    // signaux
    if (lit.length) {
      var keep = [];
      for (var n = 0; n < lit.length; n++) {
        var c = lit[n];
        var age = now - litAt[c];
        if (age > LIFE) { inLit[c] = 0; continue; }
        keep.push(c);
        if (age < 0) continue;
        var a = Math.pow(1 - age / LIFE, 1.6) * litPow[c];
        var cx = cellX(c % cols), cy = cellY((c / cols) | 0);
        if (age < 70) {
          ctx.globalAlpha = Math.min(1, litPow[c] + 0.2);
          ctx.fillStyle = colors.fg;
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = colors.accent;
        }
        ctx.fillText(chars[c], cx, cy);
      }
      lit = keep;
    }

    // ondes
    if (ripples.length) {
      var alive = [];
      ctx.fillStyle = colors.accent;
      for (var r = 0; r < ripples.length; r++) {
        var rp = ripples[r];
        var rad = (now - rp.t0) * 0.55;
        if (rad > rp.max) continue;
        alive.push(rp);
        if (rad < 0) continue;
        var band = 20;
        var fade = 1 - rad / rp.max;
        var bx0 = Math.max(0, Math.floor((rp.x - rad - band) / cw));
        var bx1 = Math.min(cols - 1, Math.ceil((rp.x + rad + band) / cw));
        var by0 = Math.max(0, Math.floor((rp.y - rad - band) / chh));
        var by1 = Math.min(rows - 1, Math.ceil((rp.y + rad + band) / chh));
        for (var yy = by0; yy <= by1; yy++) {
          for (var xx = bx0; xx <= bx1; xx++) {
            var ddx = cellX(xx) + cw / 2 - rp.x;
            var ddy = yy * chh + chh / 2 - rp.y;
            var dd = Math.abs(Math.sqrt(ddx * ddx + ddy * ddy) - rad);
            if (dd > band / 2) continue;
            var ii = id(xx, yy);
            var g = 1 - dd / (band / 2);
            var has = chars[ii] && kind[ii] && kind[ii] !== DOT;
            ctx.globalAlpha = fade * g * (has ? 0.95 : 0.42);
            ctx.fillText(has ? chars[ii] : HEX[(Math.random() * 16) | 0], cellX(xx), cellY(yy));
          }
        }
      }
      ripples = alive;
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    raf = 0;
    if (!built) return;
    var dt = Math.min(64, lastT ? now - lastT : 16);
    lastT = now;
    var k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 120);
    probe.x += (probe.tx - probe.x) * k;
    probe.y += (probe.ty - probe.y) * k;
    var targetA = probe.on ? 1 : 0;
    probe.a += (targetA - probe.a) * (reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 220));
    if (Math.abs(targetA - probe.a) < 0.005) probe.a = targetA;

    draw(now);

    var moving = Math.abs(probe.tx - probe.x) > 0.3 || Math.abs(probe.ty - probe.y) > 0.3;
    if (moving || probe.a !== targetA || lit.length || ripples.length) schedule();
    else lastT = 0;
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  /* ---------- signaux ---------- */

  function conductive(i) {
    var k = kind[i];
    return k === TRACE || k === VIA || k === PIN;
  }

  function pulseFrom(start, now, opts) {
    opts = opts || {};
    var step = reduceMotion.matches ? 0 : (opts.step || 15);
    var max = opts.max || 1400;
    var pow = opts.pow || 1;
    var visited = new Uint8Array(N);
    var chipDone = {};
    var q = [start], tq = [0], head = 0;
    visited[start] = 1;
    while (head < q.length && head < max) {
      var c = q[head], t = tq[head];
      head++;
      var fall = Math.max(0.25, 1 - t / 2600);
      light(c, now + t, pow * fall);
      if (kind[c] === PIN) {
        var ci = chipOf[c];
        if (ci >= 0 && !chipDone[ci]) {
          chipDone[ci] = 1;
          var chip = chips[ci];
          var cells = chip.cells;
          for (var m = 0; m < cells.length; m++) {
            if (chars[cells[m]] && chars[cells[m]] !== ' ') light(cells[m], now + t + 60, pow * fall * 0.9);
          }
          for (var p = 0; p < chip.pins.length; p++) {
            var pin = chip.pins[p];
            if (!visited[pin] && conn[pin]) {
              visited[pin] = 1;
              q.push(pin);
              tq.push(t + (step ? 180 : 0));
            }
          }
        }
      }
      var cx = c % cols, cy = (c / cols) | 0;
      for (var d = 0; d < 4; d++) {
        if (!(conn[c] & (1 << d))) continue;
        var nx = cx + DX[d], ny = cy + DY[d];
        if (!inb(nx, ny)) continue;
        var n = id(nx, ny);
        if (visited[n] || !conductive(n)) continue;
        visited[n] = 1;
        q.push(n);
        tq.push(t + step);
      }
    }
    schedule();
    return head;
  }

  function nearestConductive(px, py, radius) {
    var cx = Math.floor(px / cw), cy = Math.floor(py / chh);
    var best = -1, bestD = Infinity;
    for (var y = cy - radius; y <= cy + radius; y++) {
      for (var x = cx - radius * 2; x <= cx + radius * 2; x++) {
        if (!inb(x, y)) continue;
        var i = id(x, y);
        if (!conductive(i)) continue;
        var dx = (x - cx) * cw, dy = (y - cy) * chh;
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  function signalAt(px, py) {
    if (!built) return false;
    var now = performance.now();
    var start = nearestConductive(px, py, 4);
    if (!reduceMotion.matches) {
      ripples.push({ x: px, y: py, t0: now, max: W < 640 ? 160 : 230 });
      if (ripples.length > 6) ripples.shift();
    }
    if (start >= 0) pulseFrom(start, now, { pow: 1 });
    schedule();
    return start >= 0;
  }

  function randomPulse(pow, max) {
    if (!built || !chips.length) return;
    var candidates = [];
    for (var c = 0; c < chips.length; c++) {
      for (var p = 0; p < chips[c].pins.length; p++) {
        if (conn[chips[c].pins[p]]) candidates.push(chips[c].pins[p]);
      }
    }
    if (!candidates.length) return;
    pulseFrom(pickOne(candidates), performance.now(), { pow: pow, max: max });
  }

  /* ---------- évènements ---------- */

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    probe.tx = e.clientX;
    probe.ty = e.clientY;
    if (!probe.on) {
      probe.on = true;
      if (probe.a < 0.02) { probe.x = e.clientX; probe.y = e.clientY; }
    }
    schedule();
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', function () {
    probe.on = false;
    schedule();
  });
  window.addEventListener('blur', function () {
    probe.on = false;
    schedule();
  });

  window.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    signalAt(e.clientX, e.clientY);
  }, { passive: true });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (w !== builtW || h > builtH + 60) {
        builtH = w !== builtW ? 0 : builtH;
        build();
      }
    }, 180);
  });

  function onTheme() {
    if (!built) return;
    readColors();
    renderBase();
    draw(performance.now());
  }
  document.addEventListener('themechange', onTheme);
  if (schemeMq.addEventListener) schemeMq.addEventListener('change', onTheme);

  // trafic ambiant : de temps en temps, un signal parcourt la carte
  function ambient() {
    setTimeout(ambient, 4200 + Math.random() * 4200);
    if (document.hidden || reduceMotion.matches) return;
    randomPulse(0.5, 160);
  }

  function start() {
    build();
    if (!reduceMotion.matches) {
      // mise sous tension
      setTimeout(function () { randomPulse(0.85, 700); }, 450);
      setTimeout(function () { randomPulse(0.7, 500); }, 900);
      setTimeout(ambient, 5000);
    }
  }

  var fontReady = document.fonts && document.fonts.load
    ? Promise.race([
        document.fonts.load('14px "JetBrains Mono"'),
        new Promise(function (r) { setTimeout(r, 1200); })
      ])
    : Promise.resolve();
  fontReady.then(start, start);

  window.BOARD = {
    signalAt: signalAt,
    randomPulse: randomPulse
  };
})();
