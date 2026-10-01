/* ==========================================================================
   Easter egg : NOVA//RUN — un petit monde 3D rendu en caractères ASCII.
   On y pilote un robot quadrupède sur une carte géante : ramasser les
   cellules d'énergie avant que la batterie ne se vide, éviter les bugs.

   Tout est fait à la main, sans bibliothèque : un tampon de caractères avec
   profondeur (z-buffer), un sol calculé par lancer de rayon, des boîtes et
   des segments projetés en perspective, puis le tout écrit dans un canvas.
   ========================================================================== */

(function () {
  'use strict';

  var canvas = document.getElementById('game');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var lang = root.dataset.lang === 'en' ? 'en' : 'fr';
  var touch = window.matchMedia('(hover: none)').matches;

  var STR = {
    fr: {
      sub: 'easter egg · un monde 3D en ASCII',
      goal1: 'Ramasse les cellules [o] avant que la batterie',
      goal2: 'soit vide. Évite les bugs [x] : saute par-dessus.',
      keys1: 'ZQSD / flèches : bouger',
      keys2: 'espace : sauter · maj : sprint · P : pause',
      touch1: 'glisse à gauche : bouger',
      touch2: 'touche à droite : sauter',
      start: touch ? '> touche l\'écran pour démarrer <' : '> appuie sur une touche pour démarrer <',
      over: 'BATTERIE VIDE',
      score: 'cellules',
      best: 'record',
      newBest: 'nouveau record !',
      again: touch ? '> touche l\'écran pour rejouer <' : '> entrée ou R : rejouer <',
      pause: 'PAUSE',
      resume: touch ? 'touche l\'écran pour reprendre' : 'P pour reprendre',
      bat: 'bat',
      bug: 'BUG !  -15 %',
      cell: '+1 cellule',
      low: 'batterie faible',
      radar: 'radar'
    },
    en: {
      sub: 'easter egg · a 3D world in ASCII',
      goal1: 'Grab the energy cells [o] before the battery',
      goal2: 'runs out. Avoid the bugs [x]: jump over them.',
      keys1: 'WASD / arrows: move',
      keys2: 'space: jump · shift: sprint · P: pause',
      touch1: 'drag on the left: move',
      touch2: 'tap on the right: jump',
      start: touch ? '> tap the screen to start <' : '> press any key to start <',
      over: 'BATTERY EMPTY',
      score: 'cells',
      best: 'best',
      newBest: 'new record!',
      again: touch ? '> tap the screen to play again <' : '> enter or R: play again <',
      pause: 'PAUSE',
      resume: touch ? 'tap the screen to resume' : 'P to resume',
      bat: 'bat',
      bug: 'BUG!  -15%',
      cell: '+1 cell',
      low: 'low battery',
      radar: 'radar'
    }
  };
  var T = STR[lang];

  /* ---------- tampon de caractères ---------- */

  var W = 0, H = 0, dpr = 1, fs = 14, cw = 8.4, chh = 16.8, cols = 0, rows = 0, fpx = 500;
  var chr = new Uint16Array(0), colr = new Uint8Array(0), dep = new Float32Array(0);
  var font = '';
  var PALETTE = ['#888', '#bbb', '#eee', '#fb0'];   // 0 atténué · 1 normal · 2 fort · 3 accent
  var bg = '#0b0b0a';
  var lightTheme = false;
  var RAMP = '-=xX#%@';
  var NEAR = 0.25;
  var SPACE = 32;

  function readTheme() {
    var cs = getComputedStyle(root);
    var v = function (name, fallback) { return cs.getPropertyValue(name).trim() || fallback; };
    bg = v('--bg', '#0b0b0a');
    PALETTE = [v('--fg-3', '#8a877f'), v('--fg-2', '#b6b3aa'), v('--fg', '#ece9e1'), v('--accent', '#ffb000')];
    var theme = root.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    lightTheme = theme === 'light';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    fs = Math.max(9, Math.min(15, W / 78), W / 120);
    font = fs + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.font = font;
    cw = ctx.measureText('MMMMMMMMMM').width / 10 || fs * 0.6;
    chh = fs * 1.2;
    cols = Math.max(1, Math.ceil(W / cw));
    rows = Math.max(1, Math.ceil(H / chh));
    var n = cols * rows;
    chr = new Uint16Array(n);
    colr = new Uint8Array(n);
    dep = new Float32Array(n);
    fpx = Math.min(H * 0.83, W * (W < H ? 0.95 : 0.66));   // en portrait, on zoome sur le robot
  }

  /* ---------- caméra et projection ---------- */

  var cam = { x: 0, y: 2.3, z: -4.4 };
  var rx = 1, rz = 0;                 // droite (toujours horizontale)
  var ux = 0, uy = 1, uz = 0;         // haut
  var fx = 0, fy = 0, fz = 1;         // avant

  function lookAt(tx, ty, tz) {
    fx = tx - cam.x; fy = ty - cam.y; fz = tz - cam.z;
    var l = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
    fx /= l; fy /= l; fz /= l;
    rx = fz; rz = -fx;
    l = Math.sqrt(rx * rx + rz * rz) || 1;
    rx /= l; rz /= l;
    ux = fy * rz; uy = fz * rx - fx * rz; uz = -fy * rx;
  }

  // projette un point du monde dans le tampon `out` : colonne, ligne, profondeur
  function project(x, y, z, out, o) {
    var vx = x - cam.x, vy = y - cam.y, vz = z - cam.z;
    var zz = vx * fx + vy * fy + vz * fz;
    out[o + 2] = zz;
    if (zz < NEAR) return false;
    var k = fpx / zz;
    out[o] = (W / 2 + (vx * rx + vz * rz) * k) / cw;
    out[o + 1] = (H / 2 - (vx * ux + vy * uy + vz * uz) * k) / chh;
    return true;
  }

  var LX = 0.42, LY = 0.82, LZ = -0.39;   // direction de la lumière (normalisée)

  function shade(nx, ny, nz) {
    var i = 0.22 + 0.78 * Math.max(0, nx * LX + ny * LY + nz * LZ);
    if (lightTheme) i = 1.08 - i;        // sur fond clair, l'encre dense fait l'ombre
    var k = Math.round(i * (RAMP.length - 1));
    return RAMP.charCodeAt(k < 0 ? 0 : k >= RAMP.length ? RAMP.length - 1 : k);
  }

  function tri(ax, ay, az, bx, by, bz, cx, cy, cz, code, color) {
    var minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    var maxX = Math.min(cols - 1, Math.ceil(Math.max(ax, bx, cx)));
    var minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    var maxY = Math.min(rows - 1, Math.ceil(Math.max(ay, by, cy)));
    if (minX > maxX || minY > maxY) return;
    var area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (area > -1e-6 && area < 1e-6) return;
    var inv = 1 / area;
    var iza = 1 / az, izb = 1 / bz, izc = 1 / cz;
    for (var y = minY; y <= maxY; y++) {
      var py = y + 0.5;
      var row = y * cols;
      for (var x = minX; x <= maxX; x++) {
        var px = x + 0.5;
        var w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) * inv;
        if (w0 < 0) continue;
        var w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) * inv;
        if (w1 < 0) continue;
        var w2 = 1 - w0 - w1;
        if (w2 < 0) continue;
        var z = 1 / (w0 * iza + w1 * izb + w2 * izc);
        var i = row + x;
        if (z < dep[i]) { dep[i] = z; chr[i] = code; colr[i] = color; }
      }
    }
  }

  var P2 = new Float32Array(6);

  function line(x0, y0, z0, x1, y1, z1, code, color) {
    if (!project(x0, y0, z0, P2, 0) || !project(x1, y1, z1, P2, 3)) return;
    var dx = P2[3] - P2[0], dy = P2[4] - P2[1];
    var steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) || 1;
    if (steps > 400) return;
    var iz0 = 1 / P2[2], iz1 = 1 / P2[5];
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var x = Math.floor(P2[0] + dx * t), y = Math.floor(P2[1] + dy * t);
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      var z = 1 / (iz0 + (iz1 - iz0) * t) - 0.06;
      var i = y * cols + x;
      if (z < dep[i]) { dep[i] = z; chr[i] = code; colr[i] = color; }
    }
  }

  /* ---------- boîtes orientées ---------- */

  var BW = new Float32Array(24), BP = new Float32Array(24), BOK = new Uint8Array(8);
  var FACES = [
    [1, 3, 7, 5, 1, 0], [0, 4, 6, 2, -1, 0],
    [2, 6, 7, 3, 1, 1], [0, 1, 5, 4, -1, 1],
    [4, 5, 7, 6, 1, 2], [0, 2, 3, 1, -1, 2]
  ];
  var AX = new Float32Array(9), HS = new Float32Array(3);

  // centre, trois axes unitaires (a, b, c) et demi-dimensions
  function box(cx, cy, cz, a0, a1, a2, b0, b1, b2, c0, c1, c2, ha, hb, hc, color) {
    AX[0] = a0; AX[1] = a1; AX[2] = a2; AX[3] = b0; AX[4] = b1; AX[5] = b2; AX[6] = c0; AX[7] = c1; AX[8] = c2;
    HS[0] = ha; HS[1] = hb; HS[2] = hc;
    for (var i = 0; i < 8; i++) {
      var sa = i & 1 ? ha : -ha, sb = i & 2 ? hb : -hb, sc = i & 4 ? hc : -hc;
      var x = cx + a0 * sa + b0 * sb + c0 * sc;
      var y = cy + a1 * sa + b1 * sb + c1 * sc;
      var z = cz + a2 * sa + b2 * sb + c2 * sc;
      BW[i * 3] = x; BW[i * 3 + 1] = y; BW[i * 3 + 2] = z;
      BOK[i] = project(x, y, z, BP, i * 3) ? 1 : 0;
    }
    for (var f = 0; f < 6; f++) {
      var F = FACES[f];
      var s = F[4], k = F[5] * 3;
      var nx = AX[k] * s, ny = AX[k + 1] * s, nz = AX[k + 2] * s;
      var h = HS[F[5]];
      // face tournée vers la caméra ?
      if (nx * (cam.x - cx - nx * h) + ny * (cam.y - cy - ny * h) + nz * (cam.z - cz - nz * h) <= 0) continue;
      if (!BOK[F[0]] || !BOK[F[1]] || !BOK[F[2]] || !BOK[F[3]]) continue;
      var code = shade(nx, ny, nz);
      var p = F[0] * 3, q = F[1] * 3, r = F[2] * 3, t = F[3] * 3;
      tri(BP[p], BP[p + 1], BP[p + 2], BP[q], BP[q + 1], BP[q + 2], BP[r], BP[r + 1], BP[r + 2], code, color);
      tri(BP[p], BP[p + 1], BP[p + 2], BP[r], BP[r + 1], BP[r + 2], BP[t], BP[t + 1], BP[t + 2], code, color);
    }
  }

  function aabb(x, y, z, hx, hy, hz, color) {
    box(x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1, hx, hy, hz, color);
  }

  // segment épais entre deux points (pattes) ; `s` = axe latéral du robot
  function limb(ax, ay, az, bx, by, bz, sx, sz, thick, color) {
    var dx = bx - ax, dy = by - ay, dz = bz - az;
    var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= l; dy /= l; dz /= l;
    // troisième axe = d × s
    var wx = dy * sz, wy = dz * sx - dx * sz, wz = -dy * sx;
    var wl = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1;
    box((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, dx, dy, dz, sx, 0, sz, wx / wl, wy / wl, wz / wl, l / 2 + thick * 0.6, thick, thick, color);
  }

  var OV = new Float32Array(18), OP = new Float32Array(18);

  function octa(cx, cy, cz, r, ang, color) {
    OV[0] = cx; OV[1] = cy + r * 1.35; OV[2] = cz;
    OV[3] = cx; OV[4] = cy - r * 1.35; OV[5] = cz;
    for (var k = 0; k < 4; k++) {
      var a = ang + k * Math.PI / 2;
      OV[6 + k * 3] = cx + Math.cos(a) * r; OV[7 + k * 3] = cy; OV[8 + k * 3] = cz + Math.sin(a) * r;
    }
    for (var i = 0; i < 6; i++) if (!project(OV[i * 3], OV[i * 3 + 1], OV[i * 3 + 2], OP, i * 3)) return;
    for (var f = 0; f < 8; f++) {
      var tip = f < 4 ? 0 : 3, e0 = 6 + (f % 4) * 3, e1 = 6 + ((f + 1) % 4) * 3;
      // normale approchée : du centre vers le milieu de la face
      var nx = (OV[tip] + OV[e0] + OV[e1]) / 3 - cx, ny = (OV[tip + 1] + OV[e0 + 1] + OV[e1 + 1]) / 3 - cy, nz = (OV[tip + 2] + OV[e0 + 2] + OV[e1 + 2]) / 3 - cz;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      tri(OP[tip], OP[tip + 1], OP[tip + 2], OP[e0], OP[e0 + 1], OP[e0 + 2], OP[e1], OP[e1 + 1], OP[e1 + 2], shade(nx / nl, ny / nl, nz / nl), color);
    }
  }

  /* ---------- le monde ---------- */

  var R = 18;   // demi-côté de la carte

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // composants posés sur la carte : puces basses (on peut sauter dessus),
  // condensateurs hauts, connecteurs longs
  var obstacles = [];
  (function buildWorld() {
    var rnd = rng(20270201);
    var tries = 0;
    while (obstacles.length < 26 && tries++ < 600) {
      var kind = rnd();
      var o;
      if (kind < 0.5) o = { hx: 0.8 + rnd() * 0.9, hz: 0.8 + rnd() * 0.9, h: 0.36 + rnd() * 0.16, low: true };
      else if (kind < 0.8) o = { hx: 0.45, hz: 0.45, h: 1.4 + rnd() * 1.1, low: false };
      else if (rnd() < 0.5) o = { hx: 2 + rnd(), hz: 0.4, h: 0.8, low: false };
      else o = { hx: 0.4, hz: 2 + rnd(), h: 0.8, low: false };
      o.x = (rnd() * 2 - 1) * (R - 2.5);
      o.z = (rnd() * 2 - 1) * (R - 2.5);
      if (Math.abs(o.x) < 4 + o.hx && Math.abs(o.z) < 4 + o.hz) continue;   // zone de départ dégagée
      var ok = true;
      for (var i = 0; i < obstacles.length; i++) {
        var q = obstacles[i];
        if (Math.abs(q.x - o.x) < q.hx + o.hx + 1.3 && Math.abs(q.z - o.z) < q.hz + o.hz + 1.3) { ok = false; break; }
      }
      if (ok) obstacles.push(o);
    }
  })();

  function blockedAt(x, z, margin) {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (Math.abs(x - o.x) < o.hx + margin && Math.abs(z - o.z) < o.hz + margin) return o;
    }
    return null;
  }

  // repousse un cercle hors des composants plus hauts que ses pieds
  function collide(e, radius, feetY) {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (feetY >= o.h - 0.06) continue;
      var px = Math.max(o.x - o.hx, Math.min(o.x + o.hx, e.x));
      var pz = Math.max(o.z - o.hz, Math.min(o.z + o.hz, e.z));
      var dx = e.x - px, dz = e.z - pz;
      var d2 = dx * dx + dz * dz;
      if (d2 >= radius * radius) continue;
      if (d2 > 1e-8) {
        var d = Math.sqrt(d2), push = radius - d;
        e.x += dx / d * push; e.z += dz / d * push;
      } else {
        // centre à l'intérieur : sortir par le côté le plus proche
        var ox = o.hx - Math.abs(e.x - o.x), oz = o.hz - Math.abs(e.z - o.z);
        if (ox < oz) e.x += (e.x < o.x ? -1 : 1) * (ox + radius);
        else e.z += (e.z < o.z ? -1 : 1) * (oz + radius);
      }
    }
    var lim = R - radius - 0.1;
    if (e.x > lim) e.x = lim; else if (e.x < -lim) e.x = -lim;
    if (e.z > lim) e.z = lim; else if (e.z < -lim) e.z = -lim;
  }

  function groundAt(x, z, feetY) {
    var h = 0;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.h > h && feetY >= o.h - 0.06 && Math.abs(x - o.x) <= o.hx + 0.12 && Math.abs(z - o.z) <= o.hz + 0.12) h = o.h;
    }
    return h;
  }

  /* ---------- état du jeu ---------- */

  var best = 0;
  try { best = parseInt(localStorage.getItem('nova-best'), 10) || 0; } catch (e) {}

  var G = {
    state: 'title',   // title | play | pause | over
    time: 0,
    score: 0,
    bat: 100,
    record: false,
    glitch: 0,
    msg: '', msgT: 0,
    overT: 0,
    hintT: 0
  };
  var P = { x: 0, y: 0, z: 0, yaw: 0, v: 0, vy: 0, phase: 0, grounded: true, hurt: 0, turn: 0 };
  var camYaw = 0;
  var cells = [], bugs = [];
  var keys = {};
  var stick = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };

  function placeCell(c) {
    for (var n = 0; n < 60; n++) {
      var x, z, o = null;
      if (Math.random() < 0.28) {
        // perchée sur une puce : il faut sauter
        var lows = obstacles.filter(function (q) { return q.low; });
        o = lows[Math.floor(Math.random() * lows.length)];
        x = o.x; z = o.z;
      } else {
        x = (Math.random() * 2 - 1) * (R - 2);
        z = (Math.random() * 2 - 1) * (R - 2);
        if (blockedAt(x, z, 0.7)) continue;
      }
      var dx = x - P.x, dz = z - P.z;
      if (dx * dx + dz * dz < 16) continue;
      var clash = false;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i] !== c && Math.abs(cells[i].x - x) < 2 && Math.abs(cells[i].z - z) < 2) clash = true;
      }
      if (clash) continue;
      c.x = x; c.z = z; c.h = o ? o.h : 0; c.spin = Math.random() * 6;
      return;
    }
  }

  function placeBug(b) {
    for (var n = 0; n < 60; n++) {
      var x = (Math.random() * 2 - 1) * (R - 2), z = (Math.random() * 2 - 1) * (R - 2);
      var dx = x - P.x, dz = z - P.z;
      if (dx * dx + dz * dz < 90 || blockedAt(x, z, 0.6)) continue;
      b.x = x; b.z = z; b.yaw = Math.random() * 6.28; b.t = 0;
      return;
    }
    b.x = -P.x; b.z = -P.z; b.yaw = 0; b.t = 0;
  }

  function reset() {
    P.x = 0; P.y = 0; P.z = 0; P.yaw = 0; P.v = 0; P.vy = 0; P.phase = 0; P.hurt = 0; P.grounded = true;
    camYaw = 0;
    G.score = 0; G.bat = 100; G.record = false; G.glitch = 0; G.msgT = 0; G.hintT = 9;
    cells = [];
    for (var i = 0; i < 6; i++) { var c = {}; cells.push(c); placeCell(c); }
    bugs = [];
    for (var j = 0; j < 2; j++) { var b = {}; bugs.push(b); placeBug(b); }
  }

  function start() {
    reset();
    G.state = 'play';
  }

  function say(text) { G.msg = text; G.msgT = 1.3; }

  function gameOver() {
    G.state = 'over';
    G.overT = 0;
    G.bat = 0;
    if (G.score > best) {
      best = G.score;
      G.record = true;
      try { localStorage.setItem('nova-best', String(best)); } catch (e) {}
    }
  }

  /* ---------- mise à jour ---------- */

  function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function movePlayer(dt, fwdIn, turnIn, sprint, jump) {
    var maxV = sprint ? 6.8 : 4.2;
    var target = fwdIn > 0 ? fwdIn * maxV : fwdIn * 2.2;
    P.v += (target - P.v) * Math.min(1, dt * 8);
    P.turn = turnIn;
    P.yaw = wrapAngle(P.yaw + turnIn * (sprint ? 2.1 : 2.7) * dt);
    P.x += Math.sin(P.yaw) * P.v * dt;
    P.z += Math.cos(P.yaw) * P.v * dt;
    collide(P, 0.6, P.y);

    if (jump && P.grounded) { P.vy = 7; P.grounded = false; }
    P.vy -= 20 * dt;
    P.y += P.vy * dt;
    var gh = groundAt(P.x, P.z, P.y - P.vy * dt);
    if (P.y <= gh) { P.y = gh; P.vy = 0; P.grounded = true; } else P.grounded = false;

    P.phase += (Math.abs(P.v) / 0.62 + (Math.abs(P.v) < 0.5 ? Math.abs(turnIn) * 1.4 : 0)) * dt;
    if (P.hurt > 0) P.hurt -= dt;
  }

  var jumpQueued = false;

  function update(dt) {
    G.time += dt;
    if (G.msgT > 0) G.msgT -= dt;
    if (G.glitch > 0) G.glitch -= dt;
    if (G.hintT > 0) G.hintT -= dt;

    var fwdIn = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + stick.y;
    var turnIn = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.x;
    fwdIn = Math.max(-1, Math.min(1, fwdIn));
    turnIn = Math.max(-1, Math.min(1, turnIn));
    var sprint = !!(keys.ShiftLeft || keys.ShiftRight) || stick.y > 0.92;
    movePlayer(dt, fwdIn, turnIn, sprint, jumpQueued);
    jumpQueued = false;

    G.bat -= (2 + Math.min(2.6, G.score * 0.06) + (sprint && P.v > 4 ? 1.4 : 0)) * dt;

    // cellules d'énergie
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      c.spin += dt * 2.4;
      var dx = c.x - P.x, dz = c.z - P.z;
      if (dx * dx + dz * dz < 0.95 && Math.abs(P.y - c.h) < 0.9) {
        G.score++;
        G.bat = Math.min(100, G.bat + 11);
        say(T.cell);
        placeCell(c);
        if (bugs.length < Math.min(8, 2 + Math.floor(G.score / 4))) { var nb = {}; bugs.push(nb); placeBug(nb); }
      }
    }

    // bugs : ils errent, puis foncent quand le robot approche
    var bugV = Math.min(2.7, 1.5 + G.score * 0.04);
    for (var j = 0; j < bugs.length; j++) {
      var b = bugs[j];
      b.t -= dt;
      var bx = P.x - b.x, bz = P.z - b.z;
      var d2 = bx * bx + bz * bz;
      if (d2 < 49) b.yaw += wrapAngle(Math.atan2(bx, bz) - b.yaw) * Math.min(1, dt * 2.2);
      else if (b.t <= 0) { b.yaw += (Math.random() - 0.5) * 2.4; b.t = 0.8 + Math.random() * 1.6; }
      var nx = b.x + Math.sin(b.yaw) * bugV * dt, nz = b.z + Math.cos(b.yaw) * bugV * dt;
      if (blockedAt(nx, nz, 0.35) || Math.abs(nx) > R - 0.8 || Math.abs(nz) > R - 0.8) {
        b.yaw += 1.9 + Math.random();
        b.t = 0.6;
      } else { b.x = nx; b.z = nz; }
      if (d2 < 0.9 && P.y < 0.5 && P.hurt <= 0) {
        G.bat -= 15;
        G.glitch = 0.4;
        P.hurt = 1.4;
        P.v = -4;
        say(T.bug);
        placeBug(b);
      }
    }

    if (G.bat <= 0) gameOver();
  }

  // écran titre : le robot trotte en rond pendant que la caméra tourne
  function attract(dt) {
    G.time += dt;
    movePlayer(dt, 0.62, 0.3, false, false);
    for (var i = 0; i < cells.length; i++) cells[i].spin += dt * 2.4;
  }

  /* ---------- dessin du robot ---------- */

  var K = 1.5;            // échelle du robot
  var LEG = 0.26 * K;     // longueur d'un segment de patte
  var HIPS = [[0.36, 0.2, 0], [0.36, -0.2, 0.5], [-0.36, 0.2, 0.5], [-0.36, -0.2, 0]];   // avant, côté, déphasage

  function drawRobot() {
    if (P.hurt > 0 && Math.floor(P.hurt * 12) % 2) return;   // clignote après un choc
    var sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    var Fx = sy, Fz = cy, Sx = cy, Sz = -sy;
    var moving = Math.abs(P.v) > 0.3 || (Math.abs(P.turn) > 0.2 && P.grounded);
    var down = G.state === 'over';
    var bob = moving && P.grounded ? Math.sin(P.phase * Math.PI * 4) * 0.02 : 0;
    var bodyY = P.y + (down ? 0.3 : 0.5) * K + bob;
    var dir = P.v < -0.1 ? -1 : 1;
    var stride = Math.min(0.42, 0.12 + Math.abs(P.v) * 0.055) * K;

    for (var k = 0; k < 4; k++) {
      var hp = HIPS[k];
      var off = 0, lift = 0;
      if (!P.grounded) { off = -0.08 * K; lift = 0.16 * K; }
      else if (moving) {
        var p = (P.phase + hp[2]) % 1;
        if (p < 0.5) off = stride * (0.5 - p * 2) * dir;
        else { var q = (p - 0.5) * 2; off = stride * (q - 0.5) * dir; lift = Math.sin(q * Math.PI) * 0.13 * K; }
      }
      // genou par cinématique inverse dans le plan avant/haut
      var hz = hp[0] * K, hy = bodyY - 0.08 * K;
      var tz = hz + off, ty = P.y + lift + 0.04;
      var dz = tz - hz, dy = ty - hy;
      var d = Math.min(LEG * 2 - 0.01, Math.sqrt(dz * dz + dy * dy));
      var base = Math.atan2(dy, dz);
      var bend = Math.acos(Math.max(-1, Math.min(1, d / (2 * LEG))));
      var kz = hz + Math.cos(base - bend) * LEG, ky = hy + Math.sin(base - bend) * LEG;
      var ex = P.x + Sx * hp[1] * K, ez = P.z + Sz * hp[1] * K;
      limb(ex + Fx * hz, hy, ez + Fz * hz, ex + Fx * kz, ky, ez + Fz * kz, Sx, Sz, 0.05 * K, 2);
      limb(ex + Fx * kz, ky, ez + Fz * kz, ex + Fx * tz, ty, ez + Fz * tz, Sx, Sz, 0.04 * K, 2);
    }
    // corps, tête, antenne
    box(P.x, bodyY, P.z, Fx, 0, Fz, 0, 1, 0, Sx, 0, Sz, 0.5 * K, 0.11 * K, 0.18 * K, 3);
    box(P.x + Fx * 0.6 * K, bodyY + 0.06 * K, P.z + Fz * 0.6 * K, Fx, 0, Fz, 0, 1, 0, Sx, 0, Sz, 0.13 * K, 0.085 * K, 0.12 * K, 2);
    var tx = P.x - Fx * 0.46 * K, tz2 = P.z - Fz * 0.46 * K;
    line(tx, bodyY + 0.11 * K, tz2, tx, bodyY + 0.42 * K, tz2, 124, 2);
    splat(tx, bodyY + 0.47 * K, tz2, 42, 3);
  }

  function drawBug(b) {
    var sy = Math.sin(b.yaw), cy = Math.cos(b.yaw);
    var wig = Math.sin(G.time * 16 + b.x) * 0.08;
    box(b.x, 0.24, b.z, sy, 0, cy, 0, 1, 0, cy, 0, -sy, 0.34, 0.12, 0.24, 2);
    for (var s = -1; s <= 1; s += 2) {
      for (var k = -1; k <= 1; k++) {
        var lx = b.x + sy * k * 0.17 + cy * s * 0.19, lz = b.z + cy * k * 0.17 - sy * s * 0.19;
        var w = (k === 0 ? -wig : wig) * s;
        line(lx, 0.18, lz, lx + cy * s * 0.24 + sy * w, 0.01, lz - sy * s * 0.24 + cy * w, 120, 2);
      }
      line(b.x + sy * 0.27 + cy * s * 0.08, 0.3, b.z + cy * 0.27 - sy * s * 0.08, b.x + sy * 0.5 + cy * s * 0.2, 0.46, b.z + cy * 0.5 - sy * s * 0.2, 39, 2);
    }
  }

  /* ---------- rendu ---------- */

  var SP = new Float32Array(3);

  // pose un caractère à l'emplacement d'un point du monde
  function splat(x, y, z, code, color) {
    if (!project(x, y, z, SP, 0)) return;
    var cx = Math.floor(SP[0]), cy = Math.floor(SP[1]);
    if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) return;
    var i = cy * cols + cx;
    if (SP[2] < dep[i]) { dep[i] = SP[2]; chr[i] = code; colr[i] = color; }
  }

  // Le sol : un semis de points sur la grille (un caractère par point, donc
  // net quel que soit l'angle), le bord de la carte, les ombres et les halos.
  function drawGround(now) {
    var x, z, k, a;
    for (x = -R; x <= R; x++) {
      for (z = -R; z <= R; z++) {
        var dx = x - P.x, dz = z - P.z;
        splat(x, 0, z, dx * dx + dz * dz < 200 ? 43 : 46, 0);
      }
    }
    // maillage plus fin autour du robot : on lit mieux la vitesse
    var px = Math.round(P.x), pz = Math.round(P.z);
    for (x = px - 7; x <= px + 7; x++) {
      for (z = pz - 7; z <= pz + 7; z++) {
        if (x + 0.5 < R && x + 0.5 > -R && z <= R && z >= -R) splat(x + 0.5, 0, z, 46, 0);
        if (z + 0.5 < R && z + 0.5 > -R && x <= R && x >= -R) splat(x, 0, z + 0.5, 46, 0);
      }
    }
    for (k = -R; k <= R; k += 0.07) {
      splat(k, 0, -R, 35, 1); splat(k, 0, R, 35, 1);
      splat(-R, 0, k, 35, 1); splat(R, 0, k, 35, 1);
    }
    // ombre du robot (elle reste au sol quand il saute)
    for (x = -0.6; x <= 0.6; x += 0.1) {
      for (z = -0.6; z <= 0.6; z += 0.1) {
        if (x * x + z * z < 0.36) splat(P.x + x, groundAt(P.x, P.z, P.y), P.z + z, 58, 0);
      }
    }
    for (k = 0; k < cells.length; k++) {
      var c = cells[k];
      var r = 0.55 + 0.07 * Math.sin(now * 4 + k);
      for (a = 0; a < 6.28; a += 0.26) splat(c.x + Math.cos(a) * r, c.h + 0.01, c.z + Math.sin(a) * r, 111, 3);
    }

    // ciel : quelques étoiles fixes, qui défilent quand on tourne
    for (var y = 0; y < rows; y++) {
      var vy = H / 2 - (y + 0.5) * chh;
      var bx = fx * fpx + ux * vy, by = fy * fpx + uy * vy, bz = fz * fpx + uz * vy;
      if (by < 0) break;
      var len2 = bx * bx + by * by + bz * bz;
      var row = y * cols;
      for (var sx = 0; sx < cols; sx++) {
        var svx = (sx + 0.5) * cw - W / 2;
        var az = Math.floor(Math.atan2(bx + rx * svx, bz + rz * svx) * 46), el = Math.floor(by / Math.sqrt(len2 + svx * svx) * 60);
        var hsh = Math.imul(az * 374761393 + el * 668265263, 1274126177);
        hsh ^= hsh >>> 13;
        if ((hsh & 255) === 7) { chr[row + sx] = (hsh & 1024) ? 43 : 46; colr[row + sx] = 0; }
      }
    }
  }

  function put(x, y, s, color) {
    if (y < 0 || y >= rows) return;
    for (var k = 0; k < s.length; k++) {
      var xx = x + k;
      if (xx < 0 || xx >= cols) continue;
      chr[y * cols + xx] = s.charCodeAt(k);
      colr[y * cols + xx] = color;
    }
  }

  // centré, avec une marge vide de chaque côté pour rester lisible sur le décor
  function center(y, s, color) { put(Math.floor((cols - s.length) / 2) - 2, y, '  ' + s + '  ', color); }

  function panel(x0, y0, w, h) {
    var bar = '+' + new Array(w - 1).join('-') + '+';
    var mid = '|' + new Array(w - 1).join(' ') + '|';
    for (var y = 0; y < h; y++) put(x0, y0 + y, y === 0 || y === h - 1 ? bar : mid, 0);
  }

  var GLYPHS = {
    N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
    O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
    V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
    A: [' ### ', '#   #', '#####', '#   #', '#   #'],
    R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
    U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
    '/': ['    #', '   # ', '  #  ', ' #   ', '#    ']
  };

  function logo(y) {
    var word = 'NOVA//RUN';
    var x0 = Math.floor((cols - word.length * 6 + 1) / 2);
    for (var r = 0; r < 5; r++) {
      for (var k = 0; k < word.length; k++) put(x0 + k * 6, y + r, GLYPHS[word[k]][r], word[k] === '/' ? 0 : 3);
    }
  }

  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }

  function drawRadar() {
    var w = 21, h = 11;
    if (cols < 70 || rows < 30) { w = 15; h = 9; }
    var x0 = cols - w - 2, y0 = rows - h - 2;
    panel(x0, y0, w, h);
    put(x0 + 2, y0, ' ' + T.radar + ' ', 0);
    var cx = x0 + (w >> 1), cy = y0 + (h >> 1);
    var sy = Math.sin(P.yaw), cyw = Math.cos(P.yaw);
    var hw = (w >> 1) - 1, hh = (h >> 1) - 1;
    function blip(ex, ez, ch, color) {
      var dx = ex - P.x, dz = ez - P.z;
      var lx = dx * cyw - dz * sy, lz = dx * sy + dz * cyw;
      var px = Math.max(-hw, Math.min(hw, Math.round(lx / 18 * hw)));
      var py = Math.max(-hh, Math.min(hh, Math.round(lz / 18 * hh)));
      put(cx + px, cy - py, ch, color);
    }
    for (var b = 0; b < bugs.length; b++) blip(bugs[b].x, bugs[b].z, 'x', 2);
    for (var c = 0; c < cells.length; c++) blip(cells[c].x, cells[c].z, 'o', 3);
    put(cx, cy, '^', 3);
  }

  function drawHud(now) {
    if (G.state === 'title') {
      var h = 17, w = Math.min(cols - 2, 60);
      var y0 = Math.max(1, Math.floor(rows * 0.12));
      panel(Math.floor((cols - w) / 2), y0, w, h);
      logo(y0 + 2);
      center(y0 + 8, T.sub, 1);
      center(y0 + 10, T.goal1, 2);
      center(y0 + 11, T.goal2, 2);
      center(y0 + 13, touch ? T.touch1 : T.keys1, 1);
      center(y0 + 14, touch ? T.touch2 : T.keys2, 1);
      if (Math.floor(now * 1.6) % 2) center(y0 + h + 1, T.start, 3);
      if (best) center(y0 + h + 3, T.best + ' : ' + pad(best, 3), 0);
      return;
    }

    // score et batterie, en haut à droite
    var s1 = T.score + ' ' + pad(G.score, 3) + '   ' + T.best + ' ' + pad(Math.max(best, G.score), 3);
    put(cols - s1.length - 2, 1, s1, 2);
    var n = 20, fill = Math.max(0, Math.min(n, Math.ceil(G.bat / 100 * n)));
    var lowBat = G.bat < 25;
    var blink = lowBat && Math.floor(now * 4) % 2;
    var bar = T.bat + ' [' + new Array(fill + 1).join('#') + new Array(n - fill + 1).join('-') + '] ' + pad(Math.max(0, Math.ceil(G.bat)), 3) + '%';
    put(cols - bar.length - 2, 2, bar, blink ? 2 : 3);
    if (lowBat && G.state === 'play') put(cols - T.low.length - 2, 3, T.low, blink ? 3 : 0);
    drawRadar();

    if (G.msgT > 0 && G.state === 'play') center(Math.floor(rows * 0.3), G.msg, 3);
    if (G.hintT > 0 && G.state === 'play') {
      var hy = cols < 90 ? 5 : rows - 3;   // sur petit écran, le bas est pris par le radar
      center(hy, touch ? T.touch1 : T.keys1, 0);
      center(hy + 1, touch ? T.touch2 : T.keys2, 0);
    }

    if (G.state === 'pause') {
      var pw = Math.min(cols - 2, 40), py = Math.floor(rows / 2) - 3;
      panel(Math.floor((cols - pw) / 2), py, pw, 6);
      center(py + 2, T.pause, 3);
      center(py + 3, T.resume, 1);
    } else if (G.state === 'over') {
      var ow = Math.min(cols - 2, 44), oy = Math.floor(rows / 2) - 5;
      panel(Math.floor((cols - ow) / 2), oy, ow, 10);
      center(oy + 2, T.over, 3);
      center(oy + 4, T.score + ' : ' + pad(G.score, 3) + '    ' + T.best + ' : ' + pad(best, 3), 2);
      if (G.record) center(oy + 5, T.newBest, 3);
      if (G.overT > 0.8 && Math.floor(now * 1.6) % 2) center(oy + 7, T.again, 3);
    }
  }

  var GLITCH = '01#%$@&';

  function render(now) {
    // caméra à la troisième personne, qui suit le robot avec un peu de retard
    var cyaw = camYaw + 0.34;   // vue de trois quarts arrière : on voit le profil du robot
    cam.x = P.x - Math.sin(cyaw) * 5;
    cam.z = P.z - Math.cos(cyaw) * 5;
    cam.y = P.y * 0.6 + 2.5;
    lookAt(P.x + Math.sin(cyaw) * 1.4, P.y * 0.6 + 0.9, P.z + Math.cos(cyaw) * 1.4);

    var n = cols * rows;
    for (var i = 0; i < n; i++) { chr[i] = SPACE; dep[i] = 1e9; }

    drawGround(now);

    for (var o = 0; o < obstacles.length; o++) {
      var ob = obstacles[o];
      aabb(ob.x, ob.h / 2, ob.z, ob.hx, ob.h / 2, ob.hz, 1);
    }
    for (var c = 0; c < cells.length; c++) {
      var ce = cells[c];
      var cyy = ce.h + 0.72 + Math.sin(ce.spin * 1.3) * 0.08;
      octa(ce.x, cyy, ce.z, 0.3, ce.spin, 3);
      line(ce.x, cyy + 0.5, ce.z, ce.x, cyy + 2.6, ce.z, 58, 3);   // balise visible de loin
    }
    for (var b = 0; b < bugs.length; b++) drawBug(bugs[b]);
    drawRobot();

    if (G.glitch > 0) {
      var g = Math.floor(n * 0.05);
      for (var k = 0; k < g; k++) {
        var j = Math.floor(Math.random() * n);
        chr[j] = GLITCH.charCodeAt(Math.floor(Math.random() * GLITCH.length));
        colr[j] = 3;
      }
    }

    drawHud(now);

    // écriture dans le canvas : une passe par couleur, ligne par ligne
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.font = font;
    ctx.textBaseline = 'top';
    var offY = (chh - fs) / 2;
    for (var y = 0; y < rows; y++) {
      var s0 = '', s1 = '', s2 = '', s3 = '';
      var u0 = false, u1 = false, u2 = false, u3 = false;
      var row = y * cols;
      for (var x = 0; x < cols; x++) {
        var code = chr[row + x];
        if (code === SPACE) { s0 += ' '; s1 += ' '; s2 += ' '; s3 += ' '; continue; }
        var ch = String.fromCharCode(code);
        var col = colr[row + x];
        if (col === 0) { s0 += ch; s1 += ' '; s2 += ' '; s3 += ' '; u0 = true; }
        else if (col === 1) { s0 += ' '; s1 += ch; s2 += ' '; s3 += ' '; u1 = true; }
        else if (col === 2) { s0 += ' '; s1 += ' '; s2 += ch; s3 += ' '; u2 = true; }
        else { s0 += ' '; s1 += ' '; s2 += ' '; s3 += ch; u3 = true; }
      }
      var yy = y * chh + offY;
      if (u0) { ctx.fillStyle = PALETTE[0]; ctx.fillText(s0, 0, yy); }
      if (u1) { ctx.fillStyle = PALETTE[1]; ctx.fillText(s1, 0, yy); }
      if (u2) { ctx.fillStyle = PALETTE[2]; ctx.fillText(s2, 0, yy); }
      if (u3) { ctx.fillStyle = PALETTE[3]; ctx.fillText(s3, 0, yy); }
    }
  }

  /* ---------- boucle ---------- */

  var last = 0;

  function frame(ms) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, last ? (ms - last) / 1000 : 0.016);
    last = ms;
    if (G.state === 'play') {
      update(dt);
      camYaw += wrapAngle(P.yaw - camYaw) * Math.min(1, dt * 4.5);
    } else if (G.state === 'title') {
      attract(dt);
      camYaw = wrapAngle(camYaw + dt * 0.22);
    } else if (G.state === 'over') {
      G.overT += dt;
      if (G.glitch > 0) G.glitch -= dt;
      camYaw = wrapAngle(camYaw + dt * 0.15);
    }
    render(ms / 1000);
  }

  /* ---------- entrées ---------- */

  function act() {
    if (G.state === 'title') start();
    else if (G.state === 'over' && G.overT > 0.8) start();
    else if (G.state === 'pause') G.state = 'play';
  }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var code = e.code;
    if (code === 'Space' || code.indexOf('Arrow') === 0) e.preventDefault();
    if (e.repeat) return;
    keys[code] = true;
    if (G.state === 'play') {
      if (code === 'Space') jumpQueued = true;
      else if (code === 'KeyP' || code === 'Escape') G.state = 'pause';
      else if (code === 'KeyR') start();
    } else if (G.state === 'pause') {
      if (code === 'KeyP' || code === 'Escape' || code === 'Enter' || code === 'Space') G.state = 'play';
    } else if (G.state === 'over') {
      if (code === 'Enter' || code === 'KeyR' || code === 'Space') act();
    } else if (code !== 'Tab' && code !== 'Escape' && code.indexOf('Shift') !== 0 && !/^F\d/.test(code)) {
      start();
    }
  });

  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; stick.id = -1; stick.x = stick.y = 0; });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.state !== 'play') { act(); return; }
    if (e.clientX < W * 0.55 && stick.id < 0) {
      stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.x = stick.y = 0;
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    } else {
      jumpQueued = true;
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerId !== stick.id) return;
    var dx = (e.clientX - stick.ox) / 46, dy = (stick.oy - e.clientY) / 46;
    stick.x = Math.abs(dx) < 0.18 ? 0 : Math.max(-1, Math.min(1, dx));
    stick.y = Math.abs(dy) < 0.18 ? 0 : Math.max(-1, Math.min(1, dy));
  });
  function release(e) {
    if (e.pointerId !== stick.id) return;
    stick.id = -1; stick.x = stick.y = 0;
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && G.state === 'play') G.state = 'pause';
    last = 0;
  });

  window.addEventListener('resize', resize);

  // ?debug dans l'URL : expose l'état pour les essais
  if (/[?&]debug\b/.test(location.search)) {
    window.NOVA = { G: G, P: P, cells: function () { return cells; }, bugs: function () { return bugs; }, obstacles: obstacles };
  }

  function boot() {
    readTheme();
    resize();
    reset();
    G.state = 'title';
    requestAnimationFrame(frame);
  }

  if (document.fonts && document.fonts.load) {
    document.fonts.load('14px "JetBrains Mono"').then(boot, boot);
  } else boot();
})();
