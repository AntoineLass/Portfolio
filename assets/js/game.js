/* ==========================================================================
   Easter egg : NOVA//RUN — un petit monde 3D rendu en caractères ASCII.
   On y pilote un robot quadrupède sur une carte géante : ramasser les
   cellules d'énergie avant que la batterie ne se vide, éviter les bugs…
   et ne pas se casser la figure.

   Tout est fait à la main, sans bibliothèque :
   - rendu : un tampon de caractères dense avec profondeur (z-buffer), un sol
     calculé par lancer de rayon, des boîtes projetées en perspective, un
     contour tracé là où deux surfaces se rencontrent ;
   - physique : des corps rigides (position, orientation, vitesses), des
     contacts résolus par impulsions avec frottement, et pour le robot quatre
     pattes modélisées comme des ressorts amortis, plus une commande
     d'équilibre. On peut donc basculer, culbuter et tomber de la carte.
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
      goal2: 'soit vide. Évite les bugs [x], les chocs et le vide.',
      keys1: 'ZQSD / flèches : bouger · maj : sprint',
      keys2: 'espace : sauter, se relever · P : pause',
      touch1: 'glisse à gauche : bouger',
      touch2: 'touche à droite : sauter, se relever',
      start: touch ? '> touche l\'écran pour démarrer <' : '> appuie sur une touche pour démarrer <',
      over: 'BATTERIE VIDE',
      score: 'cellules',
      best: 'record',
      newBest: 'nouveau record !',
      again: touch ? '> touche l\'écran pour rejouer <' : '> entrée ou R : rejouer <',
      pause: 'PAUSE',
      resume: touch ? 'touche l\'écran pour reprendre' : 'P pour reprendre',
      bat: 'bat',
      bug: 'BUG !  -10 %',
      cell: '+1 cellule',
      low: 'batterie faible',
      radar: 'radar',
      down: touch ? 'À TERRE ! touche à droite pour te relever' : 'À TERRE ! espace pour te relever',
      crash: 'CHOC  -',
      fell: 'CHUTE DANS LE VIDE  -20 %',
      up: 'debout.'
    },
    en: {
      sub: 'easter egg · a 3D world in ASCII',
      goal1: 'Grab the energy cells [o] before the battery',
      goal2: 'runs out. Avoid bugs [x], crashes and the void.',
      keys1: 'WASD / arrows: move · shift: sprint',
      keys2: 'space: jump, get up · P: pause',
      touch1: 'drag on the left: move',
      touch2: 'tap on the right: jump, get up',
      start: touch ? '> tap the screen to start <' : '> press any key to start <',
      over: 'BATTERY EMPTY',
      score: 'cells',
      best: 'best',
      newBest: 'new record!',
      again: touch ? '> tap the screen to play again <' : '> enter or R: play again <',
      pause: 'PAUSE',
      resume: touch ? 'tap the screen to resume' : 'P to resume',
      bat: 'bat',
      bug: 'BUG!  -10%',
      cell: '+1 cell',
      low: 'low battery',
      radar: 'radar',
      down: touch ? 'DOWN! tap on the right to get up' : 'DOWN! press space to get up',
      crash: 'CRASH  -',
      fell: 'FELL INTO THE VOID  -20%',
      up: 'back up.'
    }
  };
  var T = STR[lang];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ==========================================================================
     RENDU
     ========================================================================== */

  var W = 0, H = 0, dpr = 1, fs = 7, cw = 4.2, chh = 8, cols = 0, rows = 0, fpx = 500;
  var chr = new Uint16Array(0), colr = new Uint8Array(0), dep = new Float32Array(0), oid = new Uint16Array(0), edge = new Uint8Array(0);
  var bgc = new Uint8Array(0);   // teinte de fond de chaque cellule (0 = aucune) : c'est elle qui donne des surfaces pleines
  var rowBuf = [];
  var font = '';
  var quality = 1;        // > 1 : caractères plus gros, si la machine peine
  var NEAR = 0.3;
  var SPACE = 32;

  // palette : quatre niveaux de neutre (du plus sombre au plus clair) et deux d'accent
  var PAL = ['#444', '#777', '#aaa', '#eee', '#a70', '#fb0'];
  var bg = '#0b0b0a', bgSoft = 'rgba(11,11,10,0.86)';
  // fonds : 1-2 damier du sol, 3 bord de la carte, 4 à 9 = teinte atténuée des six couleurs
  var BGP = ['', '#111', '#0e0e0e', '#333', '#111', '#222', '#333', '#444', '#320', '#540'];
  var RAMP = ' .:-=+*#%@';
  var LUT_CODE = new Uint16Array(256), LUT_N = new Uint8Array(256), LUT_A = new Uint8Array(256);

  function hex(c, fallback) {
    var m = /^#([0-9a-f]{6})$/i.exec(c) || /^#([0-9a-f]{6})$/i.exec(fallback);
    var n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  function readTheme() {
    var cs = getComputedStyle(root);
    var B = hex(cs.getPropertyValue('--bg').trim(), '#0b0b0a');
    var F = hex(cs.getPropertyValue('--fg').trim(), '#ece9e1');
    var A = hex(cs.getPropertyValue('--accent').trim(), '#ffb000');
    bg = mix(B, B, 0);
    bgSoft = 'rgba(' + B[0] + ',' + B[1] + ',' + B[2] + ',0.86)';
    PAL = [mix(B, F, 0.34), mix(B, F, 0.56), mix(B, F, 0.8), mix(B, F, 1), mix(B, A, 0.7), mix(B, A, 1)];
    BGP = ['', mix(B, F, 0.085), mix(B, F, 0.035), mix(B, F, 0.3), mix(B, F, 0.1), mix(B, F, 0.17), mix(B, F, 0.26), mix(B, F, 0.36), mix(B, A, 0.24), mix(B, A, 0.4)];
    for (var i = 0; i < 256; i++) {
      LUT_CODE[i] = RAMP.charCodeAt(Math.min(RAMP.length - 1, Math.floor(i / 256 * RAMP.length)));
      LUT_N[i] = i < 60 ? 0 : i < 118 ? 1 : i < 176 ? 2 : 3;
      LUT_A[i] = i < 128 ? 4 : 5;
    }
  }

  var hfs = 13, hcw = 7.8, hch = 17, hcols = 0, hrows = 0, hfont = '';
  var hchr = new Uint16Array(0), hcolr = new Uint8Array(0), hbg = new Uint8Array(0), hbuf = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    // grille du décor : très dense (jusqu'à ~300 colonnes)
    var target = Math.min(300, W / 4.1);
    fs = Math.max(6.4, W / target / 0.6) * quality;
    font = '800 ' + fs + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.font = font;
    cw = ctx.measureText('MMMMMMMMMM').width / 10 || fs * 0.6;
    chh = fs * 1.12;
    cols = Math.max(1, Math.ceil(W / cw));
    rows = Math.max(1, Math.ceil(H / chh));
    var n = cols * rows;
    chr = new Uint16Array(n);
    colr = new Uint8Array(n);
    dep = new Float32Array(n);
    oid = new Uint16Array(n);
    edge = new Uint8Array(n);
    bgc = new Uint8Array(n);
    rowBuf = [];
    for (var c = 0; c < 6; c++) rowBuf.push(new Uint16Array(cols));
    fpx = Math.min(H * 0.83, W * (W < H ? 0.95 : 0.66));   // en portrait, on zoome sur le robot

    // grille de l'affichage (score, messages) : taille lisible
    hfs = clamp(W / 62, 10, 14);
    hfont = hfs + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.font = hfont;
    hcw = ctx.measureText('MMMMMMMMMM').width / 10 || hfs * 0.6;
    hch = Math.round(hfs * 1.35);
    hcols = Math.max(1, Math.floor(W / hcw));
    hrows = Math.max(1, Math.floor(H / hch));
    hchr = new Uint16Array(hcols * hrows);
    hcolr = new Uint8Array(hcols * hrows);
    hbg = new Uint8Array(hcols * hrows);
    hbuf = [];
    for (c = 0; c < 6; c++) hbuf.push(new Uint16Array(hcols));
  }

  /* ---------- caméra et projection ---------- */

  var cam = { x: 0, y: 2.5, z: -5 };
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

  // projette un point du monde dans `out` : colonne, ligne, profondeur
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

  var LX = 0.55, LY = 0.75, LZ = -0.36;   // direction de la lumière (normalisée)

  function lum(nx, ny, nz) {
    var i = 0.3 + 0.7 * Math.max(0, nx * LX + ny * LY + nz * LZ);
    return Math.min(255, Math.floor(i * 256));
  }

  function tri(ax, ay, az, bx, by, bz, cx, cy, cz, code, color, id) {
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
        if (z < dep[i]) { dep[i] = z; chr[i] = code; colr[i] = color; oid[i] = id; bgc[i] = 4 + color; }
      }
    }
  }

  var P2 = new Float32Array(6);

  function line(x0, y0, z0, x1, y1, z1, code, color, id) {
    if (!project(x0, y0, z0, P2, 0) || !project(x1, y1, z1, P2, 3)) return;
    var dx = P2[3] - P2[0], dy = P2[4] - P2[1];
    var steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) || 1;
    if (steps > 900) return;
    var iz0 = 1 / P2[2], iz1 = 1 / P2[5];
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var x = Math.floor(P2[0] + dx * t), y = Math.floor(P2[1] + dy * t);
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      var z = 1 / (iz0 + (iz1 - iz0) * t) - 0.06;
      var i = y * cols + x;
      if (z < dep[i]) { dep[i] = z; chr[i] = code; colr[i] = color; oid[i] = id; }
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
  var nextId = 8;

  // centre, trois axes unitaires (a, b, c), demi-dimensions ; accent = couleur d'accent
  function box(cx, cy, cz, a0, a1, a2, b0, b1, b2, c0, c1, c2, ha, hb, hc, accent) {
    AX[0] = a0; AX[1] = a1; AX[2] = a2; AX[3] = b0; AX[4] = b1; AX[5] = b2; AX[6] = c0; AX[7] = c1; AX[8] = c2;
    HS[0] = ha; HS[1] = hb; HS[2] = hc;
    var id = nextId;
    nextId += 8;
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
      var l = lum(nx, ny, nz);
      var code = LUT_CODE[l], color = accent ? LUT_A[l] : LUT_N[l];
      var p = F[0] * 3, q = F[1] * 3, r = F[2] * 3, t = F[3] * 3;
      tri(BP[p], BP[p + 1], BP[p + 2], BP[q], BP[q + 1], BP[q + 2], BP[r], BP[r + 1], BP[r + 2], code, color, id + f);
      tri(BP[p], BP[p + 1], BP[p + 2], BP[r], BP[r + 1], BP[r + 2], BP[t], BP[t + 1], BP[t + 2], code, color, id + f);
    }
  }

  // segment épais entre deux points (pattes) ; s = axe latéral
  function limb(ax, ay, az, bx, by, bz, sx, sy, sz, thick, accent) {
    var dx = bx - ax, dy = by - ay, dz = bz - az;
    var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= l; dy /= l; dz /= l;
    var wx = dy * sz - dz * sy, wy = dz * sx - dx * sz, wz = dx * sy - dy * sx;
    var wl = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1;
    wx /= wl; wy /= wl; wz /= wl;
    // on réorthogonalise l'axe latéral
    var tx = wy * dz - wz * dy, ty = wz * dx - wx * dz, tz = wx * dy - wy * dx;
    box((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, dx, dy, dz, tx, ty, tz, wx, wy, wz, l / 2 + thick * 0.5, thick, thick, accent);
  }

  var OV = new Float32Array(18), OP = new Float32Array(18);

  function octa(cx, cy, cz, r, ang) {
    var id = nextId;
    nextId += 8;
    OV[0] = cx; OV[1] = cy + r * 1.4; OV[2] = cz;
    OV[3] = cx; OV[4] = cy - r * 1.4; OV[5] = cz;
    for (var k = 0; k < 4; k++) {
      var a = ang + k * Math.PI / 2;
      OV[6 + k * 3] = cx + Math.cos(a) * r; OV[7 + k * 3] = cy; OV[8 + k * 3] = cz + Math.sin(a) * r;
    }
    for (var i = 0; i < 6; i++) if (!project(OV[i * 3], OV[i * 3 + 1], OV[i * 3 + 2], OP, i * 3)) return;
    for (var f = 0; f < 8; f++) {
      var tip = f < 4 ? 0 : 3, e0 = 6 + (f % 4) * 3, e1 = 6 + ((f + 1) % 4) * 3;
      var nx = (OV[tip] + OV[e0] + OV[e1]) / 3 - cx, ny = (OV[tip + 1] + OV[e0 + 1] + OV[e1 + 1]) / 3 - cy, nz = (OV[tip + 2] + OV[e0 + 2] + OV[e1 + 2]) / 3 - cz;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var l = lum(nx / nl, ny / nl, nz / nl);
      tri(OP[tip], OP[tip + 1], OP[tip + 2], OP[e0], OP[e0 + 1], OP[e0 + 2], OP[e1], OP[e1 + 1], OP[e1 + 2], LUT_CODE[l], LUT_A[l], id + f);
    }
  }

  /* ==========================================================================
     LE MONDE
     ========================================================================== */

  var R = 18;             // demi-côté de la carte
  var NOFLOOR = -1e9;     // au-delà du bord : le vide

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // composants fixes posés sur la carte : puces basses (on peut sauter dessus),
  // condensateurs hauts, connecteurs longs
  var obstacles = [];
  var rnd = rng(20270201);
  (function buildWorld() {
    var tries = 0;
    while (obstacles.length < 24 && tries++ < 600) {
      var kind = rnd();
      var o;
      if (kind < 0.5) o = { hx: 1 + rnd() * 0.9, hz: 1 + rnd() * 0.9, h: 0.36 + rnd() * 0.16, low: true };
      else if (kind < 0.8) o = { hx: 0.5, hz: 0.5, h: 1.5 + rnd() * 1.1, low: false };
      else if (rnd() < 0.5) o = { hx: 2 + rnd(), hz: 0.45, h: 0.95, low: false };
      else o = { hx: 0.45, hz: 2 + rnd(), h: 0.95, low: false };
      o.x = (rnd() * 2 - 1) * (R - 3);
      o.z = (rnd() * 2 - 1) * (R - 3);
      if (Math.abs(o.x) < 4.5 + o.hx && Math.abs(o.z) < 4.5 + o.hz) continue;   // zone de départ dégagée
      var ok = true;
      for (var i = 0; i < obstacles.length; i++) {
        var q = obstacles[i];
        if (Math.abs(q.x - o.x) < q.hx + o.hx + 1.9 && Math.abs(q.z - o.z) < q.hz + o.hz + 1.9) { ok = false; break; }
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

  // hauteur du sol sous un point ; un composant ne compte que si son dessus est sous `maxTop`
  function floorAt(x, z, maxTop) {
    if (x > R || x < -R || z > R || z < -R) return NOFLOOR;
    var h = 0;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (o.h > h && o.h <= maxTop && Math.abs(x - o.x) <= o.hx && Math.abs(z - o.z) <= o.hz) h = o.h;
    }
    return h;
  }

  // ombres portées des composants fixes, calculées une fois (8 échantillons par unité)
  var SMR = 8, SMN = 2 * R * SMR;
  var shadowMap = new Uint8Array(SMN * SMN);
  (function bakeShadows() {
    var ax = LX / LY, az = LZ / LY;
    for (var iz = 0; iz < SMN; iz++) {
      for (var ix = 0; ix < SMN; ix++) {
        var x = (ix + 0.5) / SMR - R, z = (iz + 0.5) / SMR - R;
        for (var k = 0; k < obstacles.length; k++) {
          var o = obstacles[k];
          // le rayon vers la lumière traverse-t-il la boîte entre y = 0 et y = h ?
          var lo = 0, hi = o.h;
          var a = (o.x - o.hx - x) / ax, b = (o.x + o.hx - x) / ax;
          if (a > b) { var t = a; a = b; b = t; }
          if (a > lo) lo = a;
          if (b < hi) hi = b;
          a = (o.z - o.hz - z) / az; b = (o.z + o.hz - z) / az;
          if (a > b) { t = a; a = b; b = t; }
          if (a > lo) lo = a;
          if (b < hi) hi = b;
          if (lo < hi) { shadowMap[iz * SMN + ix] = 1; break; }
        }
      }
    }
  })();

  /* ==========================================================================
     PHYSIQUE : corps rigides et contacts par impulsions
     ========================================================================== */

  var GRAV = 20;

  function Body(hx, hy, hz, mass, inertiaScale) {
    this.hx = hx; this.hy = hy; this.hz = hz;            // demi-dimensions (latéral, haut, avant)
    this.m = mass; this.im = 1 / mass;
    var s = inertiaScale || 1;
    this.ix = 3 / (mass * (hy * hy + hz * hz) * s);      // inverses des inerties principales
    this.iy = 3 / (mass * (hx * hx + hz * hz) * s);
    this.iz = 3 / (mass * (hx * hx + hy * hy) * s);
    this.px = 0; this.py = 0; this.pz = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.wx = 0; this.wy = 0; this.wz = 0;
    this.qw = 1; this.qx = 0; this.qy = 0; this.qz = 0;
    this.R = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);   // colonnes = axes du corps dans le monde
    this.rad = Math.sqrt(hx * hx + hy * hy + hz * hz);
    this.asleep = false;
    this.still = 0;
    this.hit = 0;        // plus fort choc encaissé pendant le pas (variation de vitesse)
    this.fixed = false;  // piloté à la main (le robot qui se relève)
  }

  function updateR(b) {
    var w = b.qw, x = b.qx, y = b.qy, z = b.qz;
    var l = Math.sqrt(w * w + x * x + y * y + z * z) || 1;
    w /= l; x /= l; y /= l; z /= l;
    b.qw = w; b.qx = x; b.qy = y; b.qz = z;
    var M = b.R;
    M[0] = 1 - 2 * (y * y + z * z); M[1] = 2 * (x * y - w * z); M[2] = 2 * (x * z + w * y);
    M[3] = 2 * (x * y + w * z); M[4] = 1 - 2 * (x * x + z * z); M[5] = 2 * (y * z - w * x);
    M[6] = 2 * (x * z - w * y); M[7] = 2 * (y * z + w * x); M[8] = 1 - 2 * (x * x + y * y);
  }

  function setYaw(b, yaw) {
    b.qw = Math.cos(yaw / 2); b.qx = 0; b.qy = Math.sin(yaw / 2); b.qz = 0;
    updateR(b);
  }

  var ox = 0, oy = 0, oz = 0;   // résultat de invI

  // applique l'inverse du tenseur d'inertie (exprimé dans le monde) à un vecteur
  function invI(b, tx, ty, tz) {
    var M = b.R;
    var lx = (M[0] * tx + M[3] * ty + M[6] * tz) * b.ix;
    var ly = (M[1] * tx + M[4] * ty + M[7] * tz) * b.iy;
    var lz = (M[2] * tx + M[5] * ty + M[8] * tz) * b.iz;
    ox = M[0] * lx + M[1] * ly + M[2] * lz;
    oy = M[3] * lx + M[4] * ly + M[5] * lz;
    oz = M[6] * lx + M[7] * ly + M[8] * lz;
  }

  // impulsion j appliquée au point d'offset r (depuis le centre de masse)
  function impulse(b, rx, ry, rz, jx, jy, jz) {
    b.vx += jx * b.im; b.vy += jy * b.im; b.vz += jz * b.im;
    invI(b, ry * jz - rz * jy, rz * jx - rx * jz, rx * jy - ry * jx);
    b.wx += ox; b.wy += oy; b.wz += oz;
  }

  // « masse effective » inverse vue par une impulsion de direction n au point r
  function kTerm(b, rx, ry, rz, nx, ny, nz) {
    invI(b, ry * nz - rz * ny, rz * nx - rx * nz, rx * ny - ry * nx);
    return b.im + (oy * rz - oz * ry) * nx + (oz * rx - ox * rz) * ny + (ox * ry - oy * rx) * nz;
  }

  // contact d'un point du corps avec le décor fixe : rebond, frottement, dépénétration
  function hitStatic(b, rx, ry, rz, nx, ny, nz, depth, mu, rest) {
    var vx = b.vx + b.wy * rz - b.wz * ry, vy = b.vy + b.wz * rx - b.wx * rz, vz = b.vz + b.wx * ry - b.wy * rx;
    var vn = vx * nx + vy * ny + vz * nz;
    if (vn < 0) {
      var jn = -(1 + (vn < -1.5 ? rest : 0)) * vn / kTerm(b, rx, ry, rz, nx, ny, nz);
      impulse(b, rx, ry, rz, nx * jn, ny * jn, nz * jn);
      if (-vn > b.hit) b.hit = -vn;
      vx = b.vx + b.wy * rz - b.wz * ry; vy = b.vy + b.wz * rx - b.wx * rz; vz = b.vz + b.wx * ry - b.wy * rx;
      vn = vx * nx + vy * ny + vz * nz;
      var tx = vx - vn * nx, ty = vy - vn * ny, tz = vz - vn * nz;
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tl > 1e-4) {
        tx /= tl; ty /= tl; tz /= tl;
        var jt = Math.min(mu * jn, tl / kTerm(b, rx, ry, rz, tx, ty, tz));
        impulse(b, rx, ry, rz, -tx * jt, -ty * jt, -tz * jt);
      }
    }
    if (depth > 0.005) {
      var c = Math.min(depth - 0.005, 0.1) * 0.22;
      b.px += nx * c; b.py += ny * c; b.pz += nz * c;
    }
  }

  // les huit coins d'un corps contre le sol et les composants fixes
  function staticContacts(b, mu, rest) {
    var M = b.R;
    for (var i = 0; i < 8; i++) {
      var sx = i & 1 ? b.hx : -b.hx, sy = i & 2 ? b.hy : -b.hy, sz = i & 4 ? b.hz : -b.hz;
      var rx = M[0] * sx + M[1] * sy + M[2] * sz;
      var ry = M[3] * sx + M[4] * sy + M[5] * sz;
      var rz = M[6] * sx + M[7] * sy + M[8] * sz;
      var x = b.px + rx, y = b.py + ry, z = b.pz + rz;
      if (y < 0 && y > -0.8 && x <= R && x >= -R && z <= R && z >= -R) hitStatic(b, rx, ry, rz, 0, 1, 0, -y, mu, rest);
      for (var k = 0; k < obstacles.length; k++) {
        var o = obstacles[k];
        var dx = x - o.x, dz = z - o.z;
        var px = o.hx - (dx < 0 ? -dx : dx), pz = o.hz - (dz < 0 ? -dz : dz), py = o.h - y;
        if (px <= 0 || pz <= 0 || py <= 0 || y < -0.2) continue;
        if (py <= px && py <= pz) hitStatic(b, rx, ry, rz, 0, 1, 0, py, mu, rest);
        else if (px <= pz) hitStatic(b, rx, ry, rz, dx < 0 ? -1 : 1, 0, 0, px, mu, rest);
        else hitStatic(b, rx, ry, rz, 0, 0, dz < 0 ? -1 : 1, pz, mu, rest);
      }
    }
  }

  var bodies = [];   // tous les corps dynamiques : le robot d'abord, puis les caisses

  function wake(b) {
    if (!b.asleep) return;
    b.asleep = false;
    b.still = 0;
    for (var i = 0; i < bodies.length; i++) {
      var o = bodies[i];
      if (!o.asleep) continue;
      var dx = o.px - b.px, dy = o.py - b.py, dz = o.pz - b.pz, r = o.rad + b.rad + 0.06;
      if (dx * dx + dy * dy + dz * dz < r * r) wake(o);
    }
  }

  // les coins de A qui pénètrent dans B : impulsion entre les deux corps
  function cornersInto(A, B, mu) {
    var MA = A.R, MB = B.R;
    for (var i = 0; i < 8; i++) {
      var sx = i & 1 ? A.hx : -A.hx, sy = i & 2 ? A.hy : -A.hy, sz = i & 4 ? A.hz : -A.hz;
      var rax = MA[0] * sx + MA[1] * sy + MA[2] * sz;
      var ray = MA[3] * sx + MA[4] * sy + MA[5] * sz;
      var raz = MA[6] * sx + MA[7] * sy + MA[8] * sz;
      var rbx = A.px + rax - B.px, rby = A.py + ray - B.py, rbz = A.pz + raz - B.pz;
      // le coin dans le repère de B
      var lx = MB[0] * rbx + MB[3] * rby + MB[6] * rbz;
      var ly = MB[1] * rbx + MB[4] * rby + MB[7] * rbz;
      var lz = MB[2] * rbx + MB[5] * rby + MB[8] * rbz;
      var dx = B.hx - (lx < 0 ? -lx : lx), dy = B.hy - (ly < 0 ? -ly : ly), dz = B.hz - (lz < 0 ? -lz : lz);
      if (dx <= 0 || dy <= 0 || dz <= 0) continue;
      // face de B la plus proche : c'est la normale du contact
      var nx, ny, nz, depth, s;
      if (dx <= dy && dx <= dz) { s = lx < 0 ? -1 : 1; nx = MB[0] * s; ny = MB[3] * s; nz = MB[6] * s; depth = dx; }
      else if (dy <= dz) { s = ly < 0 ? -1 : 1; nx = MB[1] * s; ny = MB[4] * s; nz = MB[7] * s; depth = dy; }
      else { s = lz < 0 ? -1 : 1; nx = MB[2] * s; ny = MB[5] * s; nz = MB[8] * s; depth = dz; }
      if (B.asleep) wake(B);
      if (A.asleep) wake(A);
      var vx = A.vx + A.wy * raz - A.wz * ray - (B.vx + B.wy * rbz - B.wz * rby);
      var vy = A.vy + A.wz * rax - A.wx * raz - (B.vy + B.wz * rbx - B.wx * rbz);
      var vz = A.vz + A.wx * ray - A.wy * rax - (B.vz + B.wx * rby - B.wy * rbx);
      var vn = vx * nx + vy * ny + vz * nz;
      if (vn < 0) {
        var jn = -(vn < -1.5 ? 1.2 : 1) * vn / (kTerm(A, rax, ray, raz, nx, ny, nz) + kTerm(B, rbx, rby, rbz, nx, ny, nz));
        impulse(A, rax, ray, raz, nx * jn, ny * jn, nz * jn);
        impulse(B, rbx, rby, rbz, -nx * jn, -ny * jn, -nz * jn);
        var shock = -vn * B.m / (A.m + B.m);
        if (shock > A.hit) A.hit = shock;
        vx = A.vx + A.wy * raz - A.wz * ray - (B.vx + B.wy * rbz - B.wz * rby);
        vy = A.vy + A.wz * rax - A.wx * raz - (B.vy + B.wz * rbx - B.wx * rbz);
        vz = A.vz + A.wx * ray - A.wy * rax - (B.vz + B.wx * rby - B.wy * rbx);
        vn = vx * nx + vy * ny + vz * nz;
        var tx = vx - vn * nx, ty = vy - vn * ny, tz = vz - vn * nz;
        var tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (tl > 1e-4) {
          tx /= tl; ty /= tl; tz /= tl;
          var jt = Math.min(mu * jn, tl / (kTerm(A, rax, ray, raz, tx, ty, tz) + kTerm(B, rbx, rby, rbz, tx, ty, tz)));
          impulse(A, rax, ray, raz, -tx * jt, -ty * jt, -tz * jt);
          impulse(B, rbx, rby, rbz, tx * jt, ty * jt, tz * jt);
        }
      }
      if (depth > 0.005) {
        var c = Math.min(depth - 0.005, 0.1) * 0.25;
        var ka = A.fixed ? 0 : B.fixed ? 1 : A.im / (A.im + B.im), kb = 1 - ka;
        A.px += nx * c * ka; A.py += ny * c * ka; A.pz += nz * c * ka;
        B.px -= nx * c * kb; B.py -= ny * c * kb; B.pz -= nz * c * kb;
      }
    }
  }

  function integrate(b, dt) {
    b.px += b.vx * dt; b.py += b.vy * dt; b.pz += b.vz * dt;
    var w = b.qw, x = b.qx, y = b.qy, z = b.qz, h = dt * 0.5;
    b.qw = w - h * (b.wx * x + b.wy * y + b.wz * z);
    b.qx = x + h * (b.wx * w + b.wy * z - b.wz * y);
    b.qy = y + h * (b.wy * w + b.wz * x - b.wx * z);
    b.qz = z + h * (b.wz * w + b.wx * y - b.wy * x);
    updateR(b);
  }

  /* ==========================================================================
     LE ROBOT : un corps rigide porté par quatre pattes-ressorts
     ========================================================================== */

  var K = 1.5;                         // échelle du robot
  var TORSO = [0.18 * K, 0.11 * K, 0.5 * K];
  var HIP = [[0.2 * K, -0.07 * K, 0.36 * K], [-0.2 * K, -0.07 * K, 0.36 * K], [0.2 * K, -0.07 * K, -0.36 * K], [-0.2 * K, -0.07 * K, -0.36 * K]];
  var GAIT = [0, 0.5, 0.5, 0];         // trot : les diagonales marchent ensemble
  var LEG = 0.26 * K;                  // longueur d'un segment de patte
  var L0 = 0.6, LMAX = 0.75;           // longueur au repos / portée maximale d'une patte
  var KS = 860, KD = 72, FMAX = 420;   // raideur, amortissement, effort maximal
  // réglages de conduite : traction des pieds (gain, adhérence avant / latérale) et commande
  // d'équilibre (rappel, amortissement, couple maximal)
  var CFG = { KT: 85, MUF: 0.5, MUL: 0.75, LEVER: 0.8, KP: 150, KDB: 17, TMAX: 62, TRIP: 4.7, CRASH: 4.6, WALK: 4, RUN: 6.6, TURN: 2.5, RUNTURN: 1.9 };
  var STAND = L0 - 60 / KS + 0.07 * K; // hauteur du centre du torse à l'arrêt

  var bot = {
    body: new Body(TORSO[0], TORSO[1], TORSO[2], 12, 2.2),
    state: 'ok',        // ok | down (à terre) | up (se relève)
    feet: 0,
    yaw: 0,
    phase: 0,
    targetV: 0, targetW: 0,
    jump: false, jumpCool: 0,
    fallT: 0, upT: 0, hurt: 0, dmgCool: 0, shock: 0,
    q0: [1, 0, 0, 0], p0: [0, 0, 0], y1: 0
  };
  var legs = HIP.map(function () { return { on: false, fx: 0, fy: 0, fz: 0, hx: 0, hy: 0, hz: 0 }; });
  var PUSH = HIP.map(function () { return new Float64Array(6); });   // bras de levier + impulsion de chaque patte

  function placeRobot(x, y, z, yaw) {
    var b = bot.body;
    b.px = x; b.py = y; b.pz = z;
    b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0;
    setYaw(b, yaw);
    b.fixed = false;
    bot.state = 'ok'; bot.yaw = yaw; bot.fallT = 0; bot.targetV = 0; bot.targetW = 0; bot.jump = false;
  }

  // forces des pattes et commande, sur un pas de temps
  function stepRobot(dt) {
    var b = bot.body, M = b.R;
    var upx = M[1], upy = M[4], upz = M[7];
    var fwx = M[2], fwz = M[8];
    var fl = Math.sqrt(fwx * fwx + fwz * fwz);
    if (fl > 0.25 && upy > 0.3) bot.yaw = Math.atan2(fwx, fwz);
    var hx = fl > 0.25 ? fwx / fl : Math.sin(bot.yaw), hz = fl > 0.25 ? fwz / fl : Math.cos(bot.yaw);
    var active = bot.state === 'ok';
    var n = 0;
    // les efforts des quatre pattes sont calculés sur le même état, puis appliqués ensemble :
    // sinon l'ordre des pattes fausse la traction et le robot dérive
    var v0x = b.vx, v0y = b.vy, v0z = b.vz, w0x = b.wx, w0y = b.wy, w0z = b.wz;
    var tripped = 0, tripX = 0, tripZ = 0;

    for (var i = 0; i < 4; i++) {
      var L = legs[i], h = HIP[i];
      var rx = M[0] * h[0] + M[1] * h[1] + M[2] * h[2];
      var ry = M[3] * h[0] + M[4] * h[1] + M[5] * h[2];
      var rz = M[6] * h[0] + M[7] * h[1] + M[8] * h[2];
      var px = b.px + rx, py = b.py + ry, pz = b.pz + rz;
      L.hx = px; L.hy = py; L.hz = pz; L.on = false;
      if (!active || upy < 0.35) continue;

      // le pied : là où la patte, dirigée vers le bas du torse, rencontre le sol
      var g = floorAt(px, pz, py - 0.3);
      if (g === NOFLOOR) continue;
      var t = (py - g) / upy;
      var qx = px - upx * t, qz = pz - upz * t;
      var g2 = floorAt(qx, qz, py - 0.3);
      if (g2 === NOFLOOR) continue;
      if (g2 !== g) { g = g2; t = (py - g) / upy; qx = px - upx * t; qz = pz - upz * t; }
      if (t > LMAX) continue;
      var ax = qx - b.px, ay = g - b.py, az = qz - b.pz;   // bras de levier du pied

      // un pied ne traverse pas le flanc d'un composant : il bute dessus
      var o = blockedAt(qx, qz, 0);
      if (o && o.h > g + 0.14) {
        var dx = qx - o.x, dz = qz - o.z;
        var ex = o.hx - Math.abs(dx), ez = o.hz - Math.abs(dz);
        var bnx = ex < ez ? (dx < 0 ? -1 : 1) : 0, bnz = ex < ez ? 0 : (dz < 0 ? -1 : 1);
        // lancé trop vite, il se prend les pattes dedans et part en avant
        var approach = -(b.vx * bnx + b.vz * bnz);
        if (approach > CFG.TRIP && approach > tripped) { tripped = approach; tripX = bnx; tripZ = bnz; }
        hitStatic(b, ax, ay + 0.2, az, bnx, 0, bnz, ex < ez ? ex : ez, 0.2, 0);
      }

      // ressort amorti : la patte pousse d'autant plus qu'elle est comprimée
      var len = t < 0.14 ? 0.14 : t;
      var vyh = v0y + w0z * rx - w0x * rz;
      var F = KS * (L0 - len) - KD * vyh;
      if (F <= 0) continue;
      if (F > FMAX) F = FMAX;
      n++;
      L.on = true; L.fx = qx; L.fy = g; L.fz = qz;

      // traction : le pied cherche à donner au torse la vitesse demandée (avance + rotation),
      // dans la limite de l'adhérence
      var pvx = v0x + w0y * az - w0z * ay, pvz = v0z + w0x * ay - w0y * ax;
      var dvx = hx * bot.targetV + bot.targetW * az - pvx;
      var dvz = hz * bot.targetV - bot.targetW * ax - pvz;
      var ef = dvx * hx + dvz * hz, el = dvx * hz - dvz * hx;
      var Ff = clamp(CFG.KT * ef, -CFG.MUF * F, CFG.MUF * F), Fl = clamp(CFG.KT * el, -CFG.MUL * F, CFG.MUL * F);
      var J = PUSH[i];
      J[0] = ax; J[1] = ay; J[2] = az; J[3] = (hx * Ff + hz * Fl) * dt; J[4] = F * dt; J[5] = (hz * Ff - hx * Fl) * dt;
    }
    for (i = 0; i < 4; i++) {
      if (!legs[i].on) continue;
      var P = PUSH[i];
      // l'appui s'exerce au pied ; la traction un peu plus haut (la patte fléchit), ce qui limite le roulis
      impulse(b, P[0], P[1], P[2], 0, P[4], 0);
      impulse(b, P[0], P[1] * CFG.LEVER, P[2], P[3], 0, P[5]);
    }
    bot.feet = n;

    if (active && n >= 2) {
      // équilibre : un couple limité ramène le torse à l'horizontale ; s'il ne suffit pas, on tombe
      var k = n >= 3 ? 1 : 0.7;
      var wu = b.wx * upx + b.wy * upy + b.wz * upz;
      var tx = -upz * CFG.KP - (b.wx - wu * upx) * CFG.KDB;
      var ty = -(b.wy - wu * upy) * CFG.KDB;
      var tz = upx * CFG.KP - (b.wz - wu * upz) * CFG.KDB;
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tl > CFG.TMAX) { tx *= CFG.TMAX / tl; ty *= CFG.TMAX / tl; tz *= CFG.TMAX / tl; }
      invI(b, tx * dt * k, ty * dt * k, tz * dt * k);
      b.wx += ox; b.wy += oy; b.wz += oz;
    }

    if (bot.jumpCool > 0) bot.jumpCool -= dt;
    if (bot.jump && active && n >= 3 && upy > 0.75 && bot.jumpCool <= 0) {
      b.vy += 6.6;
      bot.jumpCool = 0.45;
    }
    bot.jump = false;

    if (active) {
      if (upy < 0.4) bot.fallT += dt; else bot.fallT = Math.max(0, bot.fallT - dt * 2);
      if (bot.fallT > 0.4) { bot.state = 'down'; bot.fallT = 0; }
      if (tripped) {
        bot.state = 'down';
        if (tripped > bot.shock) bot.shock = tripped;
        // les pattes restent accrochées : le torse pivote par-dessus et part en culbute
        var spin = tripped / 0.85;
        b.wx -= tripZ * spin; b.wz += tripX * spin;
        b.vx *= 0.55; b.vz *= 0.55; b.vy += tripped * 0.34;
      }
    }
  }

  // se relever : le torse est ramené à plat et à hauteur, puis rendu à la physique
  function startGetUp() {
    var b = bot.body;
    var g = floorAt(b.px, b.pz, b.py + 0.4);
    if (g === NOFLOOR || b.py < -0.5) return false;
    bot.state = 'up'; bot.upT = 0;
    bot.q0 = [b.qw, b.qx, b.qy, b.qz];
    bot.p0 = [b.px, b.py, b.pz];
    bot.y1 = g + STAND + 0.04;
    b.fixed = true;
    b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0;
    return true;
  }

  function stepGetUp(dt) {
    var b = bot.body;
    bot.upT += dt;
    var t = Math.min(1, bot.upT / 0.75);
    var e = t * t * (3 - 2 * t);
    var tw = Math.cos(bot.yaw / 2), ty = Math.sin(bot.yaw / 2);
    var q = bot.q0;
    var s = q[0] * tw + q[2] * ty < 0 ? -1 : 1;   // chemin le plus court
    b.qw = q[0] + (s * tw - q[0]) * e; b.qx = q[1] * (1 - e); b.qy = q[2] + (s * ty - q[2]) * e; b.qz = q[3] * (1 - e);
    updateR(b);
    b.py = bot.p0[1] + (bot.y1 - bot.p0[1]) * Math.sin(e * Math.PI / 2);
    b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0;
    var M = b.R;
    for (var i = 0; i < 4; i++) {
      var h = HIP[i], L = legs[i];
      L.hx = b.px + M[0] * h[0] + M[1] * h[1] + M[2] * h[2];
      L.hy = b.py + M[3] * h[0] + M[4] * h[1] + M[5] * h[2];
      L.hz = b.pz + M[6] * h[0] + M[7] * h[1] + M[8] * h[2];
      L.on = false;
    }
    if (t >= 1) { b.fixed = false; bot.state = 'ok'; bot.fallT = 0; }
  }

  /* ==========================================================================
     LE JEU
     ========================================================================== */

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
  var camYaw = 0, camX = 0, camZ = 0;
  var cells = [], bugs = [], crates = [];
  var keys = {};
  var stick = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };

  function say(text, t) { G.msg = text; G.msgT = t || 1.4; }

  function placeCell(c) {
    var b = bot.body;
    for (var n = 0; n < 60; n++) {
      var x, z, o = null;
      if (Math.random() < 0.25) {
        // perchée sur une puce : il faut sauter
        var lows = obstacles.filter(function (q) { return q.low; });
        o = lows[Math.floor(Math.random() * lows.length)];
        x = o.x; z = o.z;
      } else {
        x = (Math.random() * 2 - 1) * (R - 2.5);
        z = (Math.random() * 2 - 1) * (R - 2.5);
        if (blockedAt(x, z, 0.8)) continue;
      }
      var dx = x - b.px, dz = z - b.pz;
      if (dx * dx + dz * dz < 20) continue;
      var clash = false;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i] !== c && Math.abs(cells[i].x - x) < 2.5 && Math.abs(cells[i].z - z) < 2.5) clash = true;
      }
      if (clash) continue;
      c.x = x; c.z = z; c.h = o ? o.h : 0; c.spin = Math.random() * 6;
      return;
    }
  }

  function placeBug(g) {
    var b = bot.body;
    for (var n = 0; n < 60; n++) {
      var x = (Math.random() * 2 - 1) * (R - 2), z = (Math.random() * 2 - 1) * (R - 2);
      var dx = x - b.px, dz = z - b.pz;
      if (dx * dx + dz * dz < 100 || blockedAt(x, z, 0.6)) continue;
      g.x = x; g.z = z; g.yaw = Math.random() * 6.28; g.t = 0;
      return;
    }
    g.x = -b.px * 0.8; g.z = -b.pz * 0.8; g.yaw = 0; g.t = 0;
  }

  // caisses : des corps rigides à bousculer (une grosse, parfois une petite posée dessus)
  function buildCrates() {
    var r = rng(4242);
    crates = [];
    var spots = 0, tries = 0;
    while (spots < 7 && tries++ < 400) {
      var x = (r() * 2 - 1) * (R - 3.5), z = (r() * 2 - 1) * (R - 3.5);
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
      if (blockedAt(x, z, 1.4)) continue;
      var near = false;
      for (var i = 0; i < crates.length; i++) if (Math.abs(crates[i].px - x) < 2.4 && Math.abs(crates[i].pz - z) < 2.4) near = true;
      if (near) continue;
      spots++;
      var big = new Body(0.42, 0.42, 0.42, 3);
      big.px = x; big.py = 0.42; big.pz = z;
      setYaw(big, r() * 1.5);
      big.asleep = true;
      crates.push(big);
      if (spots % 2) {
        var small = new Body(0.28, 0.28, 0.28, 1.4);
        small.px = x; small.py = 0.84 + 0.28; small.pz = z;
        setYaw(small, r() * 1.5);
        small.asleep = true;
        crates.push(small);
      }
    }
    bodies = [bot.body].concat(crates);
  }

  function reset() {
    placeRobot(0, STAND + 0.02, 0, 0);
    camYaw = 0; camX = 0; camZ = 0;
    G.score = 0; G.bat = 100; G.record = false; G.glitch = 0; G.msgT = 0; G.hintT = 10;
    bot.hurt = 0; bot.dmgCool = 0; bot.phase = 0;
    buildCrates();
    cells = [];
    for (var i = 0; i < 6; i++) { var c = {}; cells.push(c); placeCell(c); }
    bugs = [];
    for (var j = 0; j < 2; j++) { var g = {}; bugs.push(g); placeBug(g); }
  }

  function start() {
    reset();
    G.state = 'play';
  }

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

  function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  /* ---------- un pas de simulation ---------- */

  var STEP = 1 / 120;
  var acc = 0;

  function physicsStep(dt) {
    var b = bot.body, i, j;
    var pvx = b.vx, pvz = b.vz;   // vitesse avant le pas, pour savoir dans quel sens on culbute
    if (bot.state === 'up') stepGetUp(dt);
    else stepRobot(dt);

    for (i = 0; i < bodies.length; i++) {
      var o = bodies[i];
      if (o.asleep || o.fixed) continue;
      o.vy -= GRAV * dt;
      o.wx *= 0.997; o.wy *= 0.997; o.wz *= 0.997;
    }
    for (var it = 0; it < 2; it++) {
      for (i = 0; i < bodies.length; i++) {
        if (!bodies[i].asleep && !bodies[i].fixed) staticContacts(bodies[i], i ? 0.6 : 0.5, i ? 0.1 : 0.22);
      }
      for (i = 0; i < bodies.length; i++) {
        for (j = i + 1; j < bodies.length; j++) {
          var A = bodies[i], B = bodies[j];
          if (A.asleep && B.asleep) continue;
          var dx = A.px - B.px, dy = A.py - B.py, dz = A.pz - B.pz, r = A.rad + B.rad;
          if (dx * dx + dy * dy + dz * dz > r * r) continue;
          cornersInto(A, B, 0.5);
          cornersInto(B, A, 0.5);
        }
      }
    }
    for (i = 0; i < bodies.length; i++) {
      var c = bodies[i];
      if (c.asleep || c.fixed) continue;
      integrate(c, dt);
      if (i > 0) {
        // une caisse immobile s'endort : plus de calcul tant qu'on ne la touche pas
        if (c.vx * c.vx + c.vy * c.vy + c.vz * c.vz < 0.03 && c.wx * c.wx + c.wy * c.wy + c.wz * c.wz < 0.06) c.still += dt; else c.still = 0;
        if (c.still > 0.6) { c.asleep = true; c.vx = c.vy = c.vz = c.wx = c.wy = c.wz = 0; }
        if (c.py < -30) { c.asleep = true; c.py = -1000; }
      }
    }
    if (b.hit > bot.shock) bot.shock = b.hit;
    // un choc violent du torse : les pattes lâchent, il faudra se relever
    if (b.hit > CFG.CRASH && bot.state === 'ok') {
      bot.state = 'down';
      var sp = Math.sqrt(pvx * pvx + pvz * pvz);
      if (sp > 2) {
        // emporté par l'élan : le torse bascule vers l'avant et passe par-dessus
        var ux2 = pvx / sp, uz2 = pvz / sp, spin = sp / 1.1;
        b.wx += uz2 * spin; b.wz -= ux2 * spin;
        b.vx += ux2 * sp * 0.3; b.vz += uz2 * sp * 0.3; b.vy += sp * 0.42;
      }
    }
    b.hit = 0;
  }

  function runPhysics(dt) {
    acc += dt;
    var steps = 0;
    while (acc >= STEP && steps < 8) { physicsStep(STEP); acc -= STEP; steps++; }
    if (acc > STEP) acc = 0;
  }

  function update(dt, playing) {
    G.time += dt;
    if (G.msgT > 0) G.msgT -= dt;
    if (G.glitch > 0) G.glitch -= dt;
    if (G.hintT > 0) G.hintT -= dt;
    if (bot.hurt > 0) bot.hurt -= dt;
    if (bot.dmgCool > 0) bot.dmgCool -= dt;
    var b = bot.body;

    // commandes
    var fwdIn, turnIn, sprint = false;
    if (playing) {
      fwdIn = clamp((keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + stick.y, -1, 1);
      turnIn = clamp((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.x, -1, 1);
      sprint = !!(keys.ShiftLeft || keys.ShiftRight) || stick.y > 0.92;
    } else {
      fwdIn = 0.55; turnIn = 0.28;   // écran titre : il trotte en rond
    }
    var want = fwdIn > 0 ? fwdIn * (sprint ? CFG.RUN : CFG.WALK) : fwdIn * 2.3;
    bot.targetV += (want - bot.targetV) * Math.min(1, dt * 5);
    bot.targetW = turnIn * (sprint ? CFG.RUNTURN : CFG.TURN);

    bot.shock = 0;
    runPhysics(dt);

    var hs = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
    bot.phase += (hs / 1.25 + Math.abs(b.wy) * 0.22) * dt;

    if (!isFinite(b.px + b.py + b.pz + b.qw)) placeRobot(0, STAND + 0.5, 0, 0);

    if (!playing) {
      if (bot.state === 'down') startGetUp();
      if (b.py < -12) placeRobot(0, STAND + 1, 0, 0);
      for (var q = 0; q < cells.length; q++) cells[q].spin += dt * 2.4;
      return;
    }

    // à terre : il faut demander à se relever
    if (bot.state === 'down' && G.msgT <= 0.2) say(T.down, 0.5);

    // chocs : un impact violent du torse coûte de la batterie
    if (bot.shock > 4.6 && bot.dmgCool <= 0 && bot.state !== 'up') {
      var dmg = Math.round(clamp((bot.shock - 4.6) * 2.4, 2, 14));
      G.bat -= dmg;
      G.glitch = 0.2;
      bot.dmgCool = 0.6;
      say(T.crash + dmg + (lang === 'fr' ? ' %' : '%'));
    }

    // chute dans le vide : retour au centre, batterie entamée
    if (b.py < -12) {
      G.bat -= 20;
      G.glitch = 0.5;
      placeRobot(0, STAND + 1.2, 0, 0);
      camYaw = 0;
      say(T.fell, 2);
    }

    G.bat -= (2 + Math.min(2.6, G.score * 0.06) + (sprint && hs > 4.6 ? 1.3 : 0)) * dt;

    // cellules d'énergie
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      c.spin += dt * 2.4;
      var dx = c.x - b.px, dy = c.h + 0.75 - b.py, dz = c.z - b.pz;
      if (dx * dx + dz * dz < 1.1 && dy * dy < 1) {
        G.score++;
        G.bat = Math.min(100, G.bat + 11);
        say(T.cell);
        placeCell(c);
        if (bugs.length < Math.min(8, 2 + Math.floor(G.score / 4))) { var nb = {}; bugs.push(nb); placeBug(nb); }
      }
    }

    // bugs : ils errent, puis foncent quand le robot approche ; un contact le bouscule
    var bugV = Math.min(2.8, 1.5 + G.score * 0.04);
    for (var j = 0; j < bugs.length; j++) {
      var g = bugs[j];
      g.t -= dt;
      var bx = b.px - g.x, bz = b.pz - g.z;
      var d2 = bx * bx + bz * bz;
      if (d2 < 49 && b.py > -1) g.yaw += wrapAngle(Math.atan2(bx, bz) - g.yaw) * Math.min(1, dt * 2.2);
      else if (g.t <= 0) { g.yaw += (Math.random() - 0.5) * 2.4; g.t = 0.8 + Math.random() * 1.6; }
      var nx = g.x + Math.sin(g.yaw) * bugV * dt, nz = g.z + Math.cos(g.yaw) * bugV * dt;
      if (blockedAt(nx, nz, 0.4) || Math.abs(nx) > R - 1 || Math.abs(nz) > R - 1) {
        g.yaw += 1.9 + Math.random();
        g.t = 0.6;
      } else { g.x = nx; g.z = nz; }
      if (d2 < 1 && b.py < 1.25 && b.py > -0.5 && bot.hurt <= 0) {
        var d = Math.sqrt(d2) || 1;
        G.bat -= 10;
        G.glitch = 0.4;
        bot.hurt = 1.5;
        bot.dmgCool = 1.2;
        // le bug fauche le robot par le bas : il est projeté et part en roulé-boulé
        if (bot.state === 'ok') bot.state = 'down';
        impulse(b, -bx / d * 0.3, -0.25, -bz / d * 0.3, bx / d * 62, 48, bz / d * 62);
        say(T.bug);
        placeBug(g);
      }
    }

    if (G.bat <= 0) gameOver();
  }

  /* ==========================================================================
     DESSIN DE LA SCÈNE
     ========================================================================== */

  function drawRobot() {
    if (bot.hurt > 0 && Math.floor(bot.hurt * 12) % 2) return;   // clignote après un choc
    var b = bot.body, M = b.R;
    var sx = M[0], sy = M[3], sz = M[6];
    var upx = M[1], upy = M[4], upz = M[7];
    var fwx = M[2], fwy = M[5], fwz = M[8];
    var fl = Math.sqrt(fwx * fwx + fwz * fwz) || 1;
    var hx = fwx / fl, hz = fwz / fl;
    var speed = b.vx * hx + b.vz * hz;
    var moving = Math.abs(speed) > 0.35 || Math.abs(b.wy) > 0.5;
    var dir = speed < -0.2 ? -1 : 1;
    var stride = Math.min(0.55, 0.16 + Math.abs(speed) * 0.075);

    for (var k = 0; k < 4; k++) {
      var L = legs[k];
      var tx, ty, tz;
      if (L.on) {
        var off = 0, lift = 0;
        if (moving) {
          var p = (bot.phase + GAIT[k]) % 1;
          if (p < 0.5) off = stride * (0.5 - p * 2) * dir;
          else { var q = (p - 0.5) * 2; off = stride * (q - 0.5) * dir; lift = Math.sin(q * Math.PI) * 0.2; }
        }
        tx = L.fx + hx * off; ty = L.fy + lift + 0.05; tz = L.fz + hz * off;
      } else {
        // patte en l'air : elle pend sous la hanche et gigote
        var wig = Math.sin(G.time * 11 + k * 1.9) * 0.16;
        tx = L.hx - upx * 0.48 + fwx * wig; ty = L.hy - upy * 0.48 + fwy * wig; tz = L.hz - upz * 0.48 + fwz * wig;
      }
      // genou par cinématique inverse : il plie vers l'arrière du robot
      var ax = tx - L.hx, ay = ty - L.hy, az = tz - L.hz;
      var len = Math.sqrt(ax * ax + ay * ay + az * az) || 0.01;
      if (len > LEG * 2 - 0.01) {
        var s = (LEG * 2 - 0.01) / len;
        ax *= s; ay *= s; az *= s; len = LEG * 2 - 0.01;
        tx = L.hx + ax; ty = L.hy + ay; tz = L.hz + az;
      }
      var dot = (-fwx * ax - fwy * ay - fwz * az) / (len * len);
      var bx = -fwx - ax * dot, by = -fwy - ay * dot, bz = -fwz - az * dot;
      var bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      var kh = Math.sqrt(Math.max(0, LEG * LEG - len * len / 4)) / bl;
      var kx = L.hx + ax / 2 + bx * kh, ky = L.hy + ay / 2 + by * kh, kz = L.hz + az / 2 + bz * kh;
      limb(L.hx, L.hy, L.hz, kx, ky, kz, sx, sy, sz, 0.055 * K, false);
      limb(kx, ky, kz, tx, ty, tz, sx, sy, sz, 0.042 * K, false);
      box(L.hx, L.hy, L.hz, fwx, fwy, fwz, upx, upy, upz, sx, sy, sz, 0.09 * K, 0.075 * K, 0.05 * K, false);
    }
    // torse, tête (capteurs), antenne
    box(b.px, b.py, b.pz, fwx, fwy, fwz, upx, upy, upz, sx, sy, sz, TORSO[2], TORSO[1], TORSO[0], true);
    var hd = TORSO[2] + 0.1 * K;
    box(b.px + fwx * hd + upx * 0.03, b.py + fwy * hd + upy * 0.03, b.pz + fwz * hd + upz * 0.03, fwx, fwy, fwz, upx, upy, upz, sx, sy, sz, 0.1 * K, 0.085 * K, 0.13 * K, false);
    var tb = -TORSO[2] * 0.8, t0 = TORSO[1], t1 = TORSO[1] + 0.42;
    line(b.px + fwx * tb + upx * t0, b.py + fwy * tb + upy * t0, b.pz + fwz * tb + upz * t0,
      b.px + fwx * tb + upx * t1, b.py + fwy * tb + upy * t1, b.pz + fwz * tb + upz * t1, 124, 3, 2);
  }

  function drawBug(g) {
    var sy = Math.sin(g.yaw), cy = Math.cos(g.yaw);
    var wig = Math.sin(G.time * 16 + g.x) * 0.09;
    box(g.x, 0.26, g.z, sy, 0, cy, 0, 1, 0, cy, 0, -sy, 0.36, 0.13, 0.25, false);
    for (var s = -1; s <= 1; s += 2) {
      for (var k = -1; k <= 1; k++) {
        var lx = g.x + sy * k * 0.22 + cy * s * 0.25, lz = g.z + cy * k * 0.22 - sy * s * 0.25;
        var w = (k === 0 ? -wig : wig) * s;
        line(lx, 0.22, lz, lx + cy * s * 0.3 + sy * w, 0.01, lz - sy * s * 0.3 + cy * w, 120, 3, 3);
      }
      line(g.x + sy * 0.36 + cy * s * 0.1, 0.38, g.z + cy * 0.36 - sy * s * 0.1, g.x + sy * 0.66 + cy * s * 0.26, 0.6, g.z + cy * 0.66 - sy * s * 0.26, 39, 3, 3);
    }
  }

  var blobs = [];   // ombres mobiles au sol : x, z, rayon²
  var rings = [];   // halos des cellules posées au sol : x, z, rayon

  // Le sol, cellule par cellule : damier, bord de la carte, ombres, halos des cellules
  function drawGround(now) {
    var i, k;
    var sxo = -LX / LY, szo = -LZ / LY;   // décalage d'une ombre par unité de hauteur
    var b = bot.body;
    blobs.length = 0;
    if (b.py > -1 && b.py < 6) {
      var M = b.R, hy = Math.max(0, b.py);
      blobs.push([b.px + M[2] * 0.4 + sxo * hy, b.pz + M[8] * 0.4 + szo * hy, 0.3]);
      blobs.push([b.px - M[2] * 0.4 + sxo * hy, b.pz - M[8] * 0.4 + szo * hy, 0.3]);
    }
    for (k = 0; k < crates.length; k++) {
      var c = crates[k];
      if (c.py > -1 && c.py < 6) blobs.push([c.px + sxo * c.py, c.pz + szo * c.py, c.hx * c.hx * 1.7]);
    }
    for (k = 0; k < bugs.length; k++) blobs.push([bugs[k].x + sxo * 0.2, bugs[k].z + szo * 0.2, 0.16]);
    var nb = blobs.length;
    rings.length = 0;
    for (k = 0; k < cells.length; k++) if (!cells[k].h) rings.push([cells[k].x, cells[k].z, 0.62 + 0.08 * Math.sin(now * 4 + k)]);
    var nr = rings.length;

    for (var y = 0; y < rows; y++) {
      var vy = H / 2 - (y + 0.5) * chh;
      var bx = fx * fpx + ux * vy, by = fy * fpx + uy * vy, bz = fz * fpx + uz * vy;
      var row = y * cols;
      if (by < -1e-3) {
        var t = -cam.y / by;
        var zview = t * fpx;
        var far = zview > 19;
        var ringW = Math.max(0.06, t * cw * 1.2);
        for (var x = 0; x < cols; x++) {
          var vx = (x + 0.5) * cw - W / 2;
          var wx = cam.x + (bx + rx * vx) * t, wz = cam.z + (bz + rz * vx) * t;
          if (wx >= R || wx <= -R || wz >= R || wz <= -R) continue;   // le vide autour de la carte
          i = row + x;
          dep[i] = zview;
          oid[i] = 1;
          var ax = wx < 0 ? -wx : wx, az = wz < 0 ? -wz : wz;
          if (R - ax < 0.28 || R - az < 0.28) { chr[i] = 35; colr[i] = 2; bgc[i] = 3; continue; }
          var light = (Math.floor(wx) + Math.floor(wz)) & 1;
          var dark = shadowMap[Math.floor((wz + R) * SMR) * SMN + Math.floor((wx + R) * SMR)];
          if (!dark) {
            for (k = 0; k < nb; k++) {
              var B = blobs[k], ddx = wx - B[0], ddz = wz - B[1];
              if (ddx * ddx + ddz * ddz < B[2]) { dark = 1; break; }
            }
          }
          var ring = false;
          for (k = 0; k < nr; k++) {
            var G2 = rings[k], rdx = wx - G2[0], rdz = wz - G2[1];
            var rd = Math.sqrt(rdx * rdx + rdz * rdz) - G2[2];
            if (rd < ringW && rd > -ringW) { ring = true; break; }
          }
          if (ring) { chr[i] = 111; colr[i] = 5; bgc[i] = 8; continue; }
          if (dark) { chr[i] = light ? 46 : SPACE; colr[i] = 0; continue; }
          // au loin le damier ne se distingue plus : une teinte unie évite le moiré
          chr[i] = light && !far ? 58 : 46;
          colr[i] = far ? 0 : 1;
          bgc[i] = light && !far ? 1 : 2;
        }
      } else {
        // ciel : une brume près de l'horizon et quelques étoiles, qui défilent quand on tourne
        var len2 = bx * bx + by * by + bz * bz;
        for (var sx = 0; sx < cols; sx++) {
          var svx = (sx + 0.5) * cw - W / 2;
          var el = by / Math.sqrt(len2 + svx * svx);
          var azi = Math.floor(Math.atan2(bx + rx * svx, bz + rz * svx) * 90), eli = Math.floor(el * 130);
          var hsh = Math.imul(azi * 374761393 + eli * 668265263, 1274126177);
          hsh ^= hsh >>> 13;
          if ((hsh & 255) === 7) { chr[row + sx] = (hsh & 1024) ? 43 : 46; colr[row + sx] = (hsh & 2048) ? 1 : 0; }
          else if (el < 0.07 && (hsh & 7) < 2) { chr[row + sx] = 46; colr[row + sx] = 0; }
        }
      }
    }
  }

  // contour : là où deux surfaces différentes se touchent à l'écran, on trace un trait
  function outline() {
    var n = cols * rows, x, y, i, j;
    for (i = 0; i < n; i++) edge[i] = 0;
    for (y = 0; y < rows - 1; y++) {
      var row = y * cols;
      for (x = 0; x < cols - 1; x++) {
        i = row + x;
        var a = oid[i];
        if (a !== oid[i + 1]) { j = dep[i] <= dep[i + 1] ? i : i + 1; if (oid[j] > 7) edge[j] |= 1; }
        if (a !== oid[i + cols]) { j = dep[i] <= dep[i + cols] ? i : i + cols; if (oid[j] > 7) edge[j] |= 2; }
      }
    }
    for (i = 0; i < n; i++) {
      var e = edge[i];
      if (!e) continue;
      chr[i] = e === 1 ? 124 : e === 2 ? 45 : 43;
      colr[i] = colr[i] >= 4 ? 5 : 3;
    }
  }

  // le segment caméra → robot traverse-t-il ce composant (un peu élargi) ?
  function hides(o, b) {
    var dx = b.px - cam.x, dy = b.py - cam.y, dz = b.pz - cam.z;
    var t0 = 0, t1 = 0.9, m = 0.35, a, c, t;
    if (dx > -1e-6 && dx < 1e-6) { if (cam.x < o.x - o.hx - m || cam.x > o.x + o.hx + m) return false; }
    else { a = (o.x - o.hx - m - cam.x) / dx; c = (o.x + o.hx + m - cam.x) / dx; if (a > c) { t = a; a = c; c = t; } if (a > t0) t0 = a; if (c < t1) t1 = c; }
    if (dz > -1e-6 && dz < 1e-6) { if (cam.z < o.z - o.hz - m || cam.z > o.z + o.hz + m) return false; }
    else { a = (o.z - o.hz - m - cam.z) / dz; c = (o.z + o.hz + m - cam.z) / dz; if (a > c) { t = a; a = c; c = t; } if (a > t0) t0 = a; if (c < t1) t1 = c; }
    if (dy > -1e-6 && dy < 1e-6) { if (cam.y > o.h + m) return false; }
    else { a = (-m - cam.y) / dy; c = (o.h + m - cam.y) / dy; if (a > c) { t = a; a = c; c = t; } if (a > t0) t0 = a; if (c < t1) t1 = c; }
    return t0 < t1;
  }

  function wire(o) {
    var x0 = o.x - o.hx, x1 = o.x + o.hx, z0 = o.z - o.hz, z1 = o.z + o.hz, h = o.h;
    for (var y = 0; y <= 1; y++) {
      var yy = y * h;
      line(x0, yy, z0, x1, yy, z0, 46, 2, 2); line(x1, yy, z0, x1, yy, z1, 46, 2, 2);
      line(x1, yy, z1, x0, yy, z1, 46, 2, 2); line(x0, yy, z1, x0, yy, z0, 46, 2, 2);
    }
    line(x0, 0, z0, x0, h, z0, 58, 2, 2); line(x1, 0, z0, x1, h, z0, 58, 2, 2);
    line(x1, 0, z1, x1, h, z1, 58, 2, 2); line(x0, 0, z1, x0, h, z1, 58, 2, 2);
  }

  var GLITCH = '01#%$@&';

  function render(now) {
    var b = bot.body;
    // caméra à la troisième personne, de trois quarts arrière
    var cyaw = camYaw + 0.34;
    var by = Math.max(b.py, 0.2);
    cam.x = camX - Math.sin(cyaw) * 4.1;
    cam.z = camZ - Math.cos(cyaw) * 4.1;
    cam.y = Math.min(by, 3) * 0.5 + 2.05;
    lookAt(camX + Math.sin(cyaw) * 1.2, Math.max(b.py, -6) * 0.7 + 0.3, camZ + Math.cos(cyaw) * 1.2);

    var n = cols * rows, i;
    for (i = 0; i < n; i++) { chr[i] = SPACE; dep[i] = 1e9; oid[i] = 0; bgc[i] = 0; }
    nextId = 8;

    drawGround(now);

    for (i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (hides(o, b)) wire(o);   // un composant entre la caméra et le robot : on n'en garde que les arêtes
      else box(o.x, o.h / 2, o.z, 1, 0, 0, 0, 1, 0, 0, 0, 1, o.hx, o.h / 2, o.hz, false);
    }
    for (i = 0; i < crates.length; i++) {
      var c = crates[i], M = c.R;
      if (c.py < -20) continue;
      box(c.px, c.py, c.pz, M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8], c.hx, c.hy, c.hz, false);
    }
    for (i = 0; i < cells.length; i++) {
      var ce = cells[i];
      var cy = ce.h + 0.78 + Math.sin(ce.spin * 1.3) * 0.08;
      octa(ce.x, cy, ce.z, 0.32, ce.spin);
      line(ce.x, cy + 0.6, ce.z, ce.x, cy + 3.2, ce.z, 58, 5, 4);   // balise visible de loin
    }
    for (i = 0; i < bugs.length; i++) drawBug(bugs[i]);
    drawRobot();
    outline();

    if (G.glitch > 0) {
      var g = Math.floor(n * 0.05);
      for (i = 0; i < g; i++) {
        var j = Math.floor(Math.random() * n);
        chr[j] = GLITCH.charCodeAt(Math.floor(Math.random() * GLITCH.length));
        colr[j] = 5;
      }
    }

    // écriture du décor : une passe par couleur, ligne par ligne
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (var y = 0; y < rows; y++) {
      var row = y * cols, x = 0;
      while (x < cols) {
        var t = bgc[row + x];
        if (!t) { x++; continue; }
        var x1 = x + 1;
        while (x1 < cols && bgc[row + x1] === t) x1++;
        ctx.fillStyle = BGP[t];
        ctx.fillRect(x * cw, y * chh, (x1 - x) * cw + 0.5, chh + 0.5);
        x = x1;
      }
    }
    ctx.font = font;
    ctx.textBaseline = 'top';
    paint(chr, colr, cols, rows, rowBuf, chh, (chh - fs) / 2);

    drawHud(now);
  }

  var used = [0, 0, 0, 0, 0, 0];

  function paint(codes, colors, w, h, bufs, lineH, offY) {
    for (var y = 0; y < h; y++) {
      var row = y * w, c;
      used[0] = used[1] = used[2] = used[3] = used[4] = used[5] = 0;
      for (var x = 0; x < w; x++) {
        var code = codes[row + x];
        if (code === SPACE || code === 0) continue;
        c = colors[row + x];
        if (!used[c]) { bufs[c].fill(SPACE); used[c] = 1; }
        bufs[c][x] = code;
      }
      for (c = 0; c < 6; c++) {
        if (!used[c]) continue;
        ctx.fillStyle = PAL[c];
        ctx.fillText(String.fromCharCode.apply(null, bufs[c]), 0, y * lineH + offY);
      }
    }
  }

  /* ==========================================================================
     AFFICHAGE : score, batterie, radar, messages (grille à part, lisible)
     ========================================================================== */

  function hput(x, y, s, color) {
    if (y < 0 || y >= hrows) return;
    for (var k = 0; k < s.length; k++) {
      var xx = x + k;
      if (xx < 0 || xx >= hcols) continue;
      var i = y * hcols + xx;
      hchr[i] = s.charCodeAt(k);
      hcolr[i] = color;
      hbg[i] = 1;
    }
  }

  // centré, avec une marge de chaque côté
  function hcenter(y, s, color) { hput(Math.floor((hcols - s.length) / 2) - 1, y, ' ' + s + ' ', color); }

  function hpanel(x0, y0, w, h) {
    var bar = '+' + new Array(w - 1).join('-') + '+';
    var mid = '|' + new Array(w - 1).join(' ') + '|';
    for (var y = 0; y < h; y++) hput(x0, y0 + y, y === 0 || y === h - 1 ? bar : mid, 1);
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
    var x0 = Math.floor((hcols - word.length * 6 + 1) / 2);
    for (var r = 0; r < 5; r++) {
      for (var k = 0; k < word.length; k++) hput(x0 + k * 6, y + r, GLYPHS[word[k]][r], word[k] === '/' ? 1 : 5);
    }
  }

  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }

  function drawRadar() {
    var w = 21, h = 11;
    if (hcols < 70 || hrows < 30) { w = 15; h = 9; }
    var x0 = hcols - w - 1, y0 = hrows - h - 1;
    hpanel(x0, y0, w, h);
    hput(x0 + 2, y0, ' ' + T.radar + ' ', 1);
    var cx = x0 + (w >> 1), cy = y0 + (h >> 1);
    var b = bot.body;
    var sy = Math.sin(bot.yaw), cyw = Math.cos(bot.yaw);
    var hw = (w >> 1) - 1, hh = (h >> 1) - 1;
    function blip(ex, ez, ch, color) {
      var dx = ex - b.px, dz = ez - b.pz;
      var lx = dx * cyw - dz * sy, lz = dx * sy + dz * cyw;
      hput(cx + clamp(Math.round(lx / 18 * hw), -hw, hw), cy - clamp(Math.round(lz / 18 * hh), -hh, hh), ch, color);
    }
    for (var g = 0; g < bugs.length; g++) blip(bugs[g].x, bugs[g].z, 'x', 3);
    for (var c = 0; c < cells.length; c++) blip(cells[c].x, cells[c].z, 'o', 5);
    hput(cx, cy, '^', 5);
  }

  function drawHud(now) {
    var n = hcols * hrows, i;
    for (i = 0; i < n; i++) { hchr[i] = 0; hbg[i] = 0; }

    if (G.state === 'title') {
      var h = 17, w = Math.min(hcols - 2, 60);
      var y0 = Math.max(2, Math.floor(hrows * 0.1));
      hpanel(Math.floor((hcols - w) / 2), y0, w, h);
      logo(y0 + 2);
      hcenter(y0 + 8, T.sub, 2);
      hcenter(y0 + 10, T.goal1, 3);
      hcenter(y0 + 11, T.goal2, 3);
      hcenter(y0 + 13, touch ? T.touch1 : T.keys1, 2);
      hcenter(y0 + 14, touch ? T.touch2 : T.keys2, 2);
      if (Math.floor(now * 1.6) % 2) hcenter(y0 + h + 1, T.start, 5);
      if (best) hcenter(y0 + h + 3, T.best + ' : ' + pad(best, 3), 2);
    } else {
      // score et batterie, en haut à droite
      var s1 = ' ' + T.score + ' ' + pad(G.score, 3) + '   ' + T.best + ' ' + pad(Math.max(best, G.score), 3) + ' ';
      hput(hcols - s1.length - 1, 1, s1, 3);
      var m = 20, fill = clamp(Math.ceil(G.bat / 100 * m), 0, m);
      var lowBat = G.bat < 25;
      var blink = lowBat && Math.floor(now * 4) % 2;
      var bar = ' ' + T.bat + ' [' + new Array(fill + 1).join('#') + new Array(m - fill + 1).join('-') + '] ' + pad(Math.max(0, Math.ceil(G.bat)), 3) + '% ';
      hput(hcols - bar.length - 1, 2, bar, blink ? 3 : 5);
      if (lowBat && G.state === 'play') hput(hcols - T.low.length - 3, 3, ' ' + T.low + ' ', blink ? 5 : 2);
      drawRadar();

      if (G.msgT > 0 && G.state === 'play') hcenter(Math.floor(hrows * 0.26), G.msg, 5);
      if (G.hintT > 0 && G.state === 'play') {
        var hy = hcols < 90 ? 5 : hrows - 3;   // sur petit écran, le bas est pris par le radar
        hcenter(hy, touch ? T.touch1 : T.keys1, 2);
        hcenter(hy + 1, touch ? T.touch2 : T.keys2, 2);
      }
      if (G.state === 'pause') {
        var pw = Math.min(hcols - 2, 40), py = Math.floor(hrows / 2) - 3;
        hpanel(Math.floor((hcols - pw) / 2), py, pw, 6);
        hcenter(py + 2, T.pause, 5);
        hcenter(py + 3, T.resume, 2);
      } else if (G.state === 'over') {
        var ow = Math.min(hcols - 2, 44), oy2 = Math.floor(hrows / 2) - 5;
        hpanel(Math.floor((hcols - ow) / 2), oy2, ow, 10);
        hcenter(oy2 + 2, T.over, 5);
        hcenter(oy2 + 4, T.score + ' : ' + pad(G.score, 3) + '    ' + T.best + ' : ' + pad(best, 3), 3);
        if (G.record) hcenter(oy2 + 5, T.newBest, 5);
        if (G.overT > 0.8 && Math.floor(now * 1.6) % 2) hcenter(oy2 + 7, T.again, 5);
      }
    }

    // fond sombre derrière le texte, puis le texte
    ctx.font = hfont;
    ctx.fillStyle = bgSoft;
    for (var y = 0; y < hrows; y++) {
      var x = 0;
      while (x < hcols) {
        if (!hbg[y * hcols + x]) { x++; continue; }
        var x1 = x;
        while (x1 < hcols && hbg[y * hcols + x1]) x1++;
        ctx.fillRect(x * hcw, y * hch, (x1 - x) * hcw, hch);
        x = x1;
      }
    }
    paint(hchr, hcolr, hcols, hrows, hbuf, hch, (hch - hfs) / 2);
  }

  /* ==========================================================================
     BOUCLE, ENTRÉES
     ========================================================================== */

  var last = 0, slow = 0, renderMs = 0;

  function frame(ms) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, last ? (ms - last) / 1000 : 0.016);
    last = ms;
    var b = bot.body;

    if (G.state === 'play') {
      update(dt, true);
      camYaw += wrapAngle(bot.yaw - camYaw) * Math.min(1, dt * 3.5);
    } else if (G.state === 'title') {
      update(dt, false);
      camYaw = wrapAngle(camYaw + dt * 0.2);
    } else if (G.state === 'over') {
      G.overT += dt;
      G.time += dt;
      if (G.glitch > 0) G.glitch -= dt;
      // la batterie est vide : le robot s'affaisse, la physique continue
      bot.targetV = 0; bot.targetW = 0;
      if (bot.state === 'ok') bot.state = 'down';
      runPhysics(dt);
      camYaw = wrapAngle(camYaw + dt * 0.15);
    }
    if (G.state !== 'pause') {
      var k = Math.min(1, dt * 9);
      camX += (b.px - camX) * k;
      camZ += (b.pz - camZ) * k;
    }

    var t0 = performance.now();
    render(ms / 1000);
    renderMs += (performance.now() - t0 - renderMs) * 0.1;
    // si le rendu est trop lent, on grossit un peu les caractères
    if (performance.now() - t0 > 26) slow++; else if (slow > 0) slow--;
    if (slow > 45 && quality < 2) { quality *= 1.2; slow = 0; resize(); }
  }

  function act() {
    if (G.state === 'title') start();
    else if (G.state === 'over' && G.overT > 0.8) start();
    else if (G.state === 'pause') G.state = 'play';
  }

  function jumpOrGetUp() {
    if (bot.state === 'down') { if (startGetUp()) { G.bat -= 3; say(T.up, 0.8); } }
    else bot.jump = true;
  }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var code = e.code || '';
    if (code === 'Space' || code.indexOf('Arrow') === 0) e.preventDefault();
    if (e.repeat) return;
    keys[code] = true;
    if (G.state === 'play') {
      if (code === 'Space') jumpOrGetUp();
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
      jumpOrGetUp();
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerId !== stick.id) return;
    var dx = (e.clientX - stick.ox) / 46, dy = (stick.oy - e.clientY) / 46;
    stick.x = Math.abs(dx) < 0.18 ? 0 : clamp(dx, -1, 1);
    stick.y = Math.abs(dy) < 0.18 ? 0 : clamp(dy, -1, 1);
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
    window.NOVA = {
      G: G, bot: bot, legs: legs, obstacles: obstacles, keys: function () { return keys; },
      cells: function () { return cells; }, bugs: function () { return bugs; }, crates: function () { return crates; },
      place: placeRobot, step: physicsStep, cfg: CFG, update: update, impulse: impulse, start: start,
      grid: function () { return { cols: cols, rows: rows, fs: fs, quality: quality, renderMs: renderMs }; }
    };
  }

  function boot() {
    readTheme();
    resize();
    reset();
    G.state = 'title';
    requestAnimationFrame(frame);
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('800 14px "JetBrains Mono"'), document.fonts.load('14px "JetBrains Mono"')]).then(boot, boot);
  } else boot();
})();
