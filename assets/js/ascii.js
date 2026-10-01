/* ==========================================================================
   ASCII art des projets (couvertures). Chaque dessin fait au plus 48 colonnes.
   - text  : dessin statique
   - frame : fonction (t en secondes) -> texte, pour les dessins animés
   - acc / lo / hi : motifs (chaînes ou regex) colorés en accent / atténué / fort
   ========================================================================== */

window.ASCII = (function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function art(s) {
    return s.replace(/^\n/, '').replace(/\n\s*$/, '');
  }

  /* ---------- outils pour les dessins animés ---------- */

  var SPARK = '▁▂▃▄▅▆▇█';

  function spark(fn, n, t) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var v = Math.max(0, Math.min(0.999, fn(i, t)));
      out += SPARK[Math.floor(v * SPARK.length)];
    }
    return out;
  }

  function pad(s, n) {
    while (s.length < n) s += ' ';
    return s;
  }

  // Signal différentiel RS-485 : A et B en opposition de phase (2 lignes chacun)
  var BITS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1];
  function wave(bits, invert, offset, width) {
    var W = 4;
    var top = '', bot = '';
    for (var x = 0; x < width; x++) {
      var gx = x + offset;
      var bi = Math.floor(gx / W) % bits.length;
      var b = bits[bi] ^ (invert ? 1 : 0);
      var prev = bits[(bi - 1 + bits.length) % bits.length] ^ (invert ? 1 : 0);
      if (gx % W === 0 && prev !== b) {
        top += b ? '┌' : '┐';
        bot += b ? '┘' : '└';
      } else {
        top += b ? '─' : ' ';
        bot += b ? ' ' : '─';
      }
    }
    return [top, bot];
  }
  function bitRow(bits, offset, width) {
    var W = 4;
    var s = '';
    for (var x = 0; x < width; x++) {
      var gx = x + offset;
      s += gx % W === 1 ? String(bits[Math.floor(gx / W) % bits.length]) : ' ';
    }
    return s;
  }

  /* ---------- dessins ---------- */

  var ARTS = {
    kydefix: {
      text: art(String.raw`
 ┌──────┐   QUIC   ┌──────┐  frames  ┌──────┐
 │client├─────────▶│ rpi4 ├═════════▶│rp2350│
 └──────┘   wifi   └──────┘          └──┬───┘
                                        │ pwm
                   ╱╲                   │
                  ╭┴─────╮              │
    ╲     ●       │   ◉  ╰─╮   ◀────────╯
     ╲╭───┴───────┤        ▸
      │ ■ ■ ═════ ╰──┬─────╯
      ╰─┬──┬─────┬──┬╯
        │  │     │  │
        │  │     │  │
        ╹  ╹     ╹  ╹
`),
      acc: ['●', '◉', '▶', '◀', '▸', 'QUIC'],
      lo: ['wifi', 'frames', 'pwm']
    },

    console: {
      text: art(String.raw`
╭──────────────────────────────────────────────╮
│ ┌──────────────────┐                         │
│ │    ▄▄      ▄     │   ● ● ○ ● ○ ○ ● ●       │
│ │   ▀██▀    ▀█▀    │   ○ ● ● ● ● ○ ○ ●       │
│ │       ▄▄▄        │   ● ○ ○ ● ● ● ○ ○       │
│ │ ▄▄▄▄▄█████▄▄▄▄▄▄ │   ○ ○ ● ○ ○ ● ● ●       │
│ └──────────────────┘                         │
│                                      (B)     │
│      ▲         [sel] [start]     (A)         │
│    ◀ ● ▶                                     │
│      ▼            ⏻ 3V3                      │
╰──────────────────────────────────────────────╯
`),
      acc: ['●', '(A)', '(B)', '⏻'],
      lo: ['○', '3V3', '[sel]', '[start]']
    },

    cpu: {
      text: art(String.raw`
  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
  │  PC  ├───▶│FETCH ├───▶│DECODE├───▶│ ALU  │
  └──▲───┘    └──────┘    └──┬───┘    └──┬───┘
     │                       │           │
     │        ┌──────┐    ┌──▼───┐       │
     └────────┤ CTRL │◀───┤ REGS │◀──────┘
              └──────┘    └──────┘
  clk ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐
      ┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─
  ┌┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┐
  │ MAX10    entity cpu is port (clk, rst)   │
  └┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┘
`),
      acc: ['▶', '◀', '▲', '▼', 'MAX10'],
      lo: ['clk', /entity cpu is port \(clk, rst\)/g, /[┴┬]/g, /^      [┘└─ ]+$/gm]
    },

    motion: {
      frame: function (t) {
        var n = 24;
        var ax = spark(function (i, t) { return 0.5 + 0.42 * Math.sin((i + t * 9) * 0.45); }, n, t);
        var ay = spark(function (i, t) { return 0.5 + 0.25 * Math.sin((i + t * 7) * 0.8) + 0.15 * Math.sin((i + t * 7) * 0.21); }, n, t);
        var az = spark(function (i, t) { var p = ((i + t * 11) % 8) / 8; return 0.15 + 0.8 * Math.exp(-Math.pow((p - 0.5) * 5, 2)); }, n, t);
        var cls = ['#0', '#1', '#2', '#3'][Math.floor(t / 1.6) % 4];
        return [
          '     z               ┌────────────────────────┐',
          '     │   y        ax │' + ax + '│',
          '     │  ╱         ay │' + ay + '│',
          '     │ ╱          az │' + az + '│',
          '     │╱              └────────────────────────┘',
          '     ●───── x',
          '',
          ' ┌─────────┐  i2c  ┌─────────────┐   ┌───────┐',
          ' │ MPU6050 ├──────▶│ STM32F401RE ├──▶│ ' + pad('▶ ' + cls, 6) + '│',
          ' └─────────┘       └─────────────┘   └───────┘'
        ].join('\n');
      },
      acc: ['●', '▶', /[▁▂▃▄▅▆▇█]+/g],
      lo: ['i2c', 'ax', 'ay', 'az', 'x', 'y', 'z']
    },

    rs485: {
      cols: 47,
      frame: function (t) {
        var w = 40;
        var off = Math.floor(t * 10);
        var A = wave(BITS, false, off, w);
        var B = wave(BITS, true, off, w);
        return [
          '',
          '  A   ' + A[0],
          '      ' + A[1],
          '  B   ' + B[0],
          '      ' + B[1],
          '  A-B ' + bitRow(BITS, off, w),
          '',
          '       ┌──────┐                    ┌──────┐',
          '  MCU ─┤  TX  ╞═╤════════════════╤═╡  RX  ├─ M',
          '       └──┬───┘ ┴ 120Ω      120Ω ┴ └──────┘',
          '        DE/RE     twisted pair',
          '',
          '   ~ ≈ ~~ ≈ ~ noise ~ ≈≈ ~ ≈ ~~ ≈ ~ ≈ ~'
        ].join('\n');
      },
      acc: [/^(  [AB]   |      )[ ┘└─┌┐]+$/gm, 'DE/RE', '120Ω'],
      lo: [/[~≈]+/g, 'noise', 'twisted pair', /^  A-B .*$/gm]
    },

    sandbox: {
      cols: 46,
      frame: function (t) {
        var W = 46, H = 13, L = 7;
        // deux « collines » qui se déplacent lentement, comme du sable remodelé
        function h(x, y) {
          var u = x / W, v = y / H;
          var g1 = Math.exp(-(Math.pow((u - 0.3 - 0.06 * Math.sin(t * 0.4)) * 3.2, 2) + Math.pow((v - 0.45) * 2.4, 2)));
          var g2 = Math.exp(-(Math.pow((u - 0.72) * 3.6, 2) + Math.pow((v - 0.55 - 0.08 * Math.cos(t * 0.3)) * 2.2, 2)));
          return 0.08 + 0.78 * g1 + 0.62 * g2 + 0.05 * Math.sin(u * 7 + t * 0.6);
        }
        var lv = [];
        for (var y = 0; y <= H; y++) {
          lv.push([]);
          for (var x = 0; x <= W; x++) {
            lv[y].push(Math.floor(Math.max(0, Math.min(0.999, h(x, y))) * L));
          }
        }
        var lines = [];
        for (var yy = 0; yy < H; yy++) {
          var row = '';
          for (var xx = 0; xx < W; xx++) {
            var a = lv[yy][xx], r = lv[yy][xx + 1], d = lv[yy + 1][xx];
            var hiLv = a >= L - 3;
            var ch;
            if (a !== r && a !== d) ch = (r > a) === (d > a) ? '╱' : '╲';
            else if (a !== r) ch = hiLv ? '┃' : '│';
            else if (a !== d) ch = hiLv ? '━' : '─';
            else ch = a >= L - 1 ? '░' : (a <= 1 && (xx + yy) % 4 === 0 ? '·' : ' ');
            row += ch;
          }
          lines.push(row);
        }
        return lines.join('\n');
      },
      acc: [/[━┃░]+/g],
      lo: [/·/g]
    },

    erp: {
      text: art(String.raw`
┌──────────────────────────────────────────────┐
│ ⊕ PHARMA·ERP                   ◉ admin   ⏻   │
├────────────┬─────────────────────────────────┤
│ ▸ stock    │ paracetamol 500   ██████▌    72 │
│   finance  │ ibuprofen 200     ███▏       31 │
│   team     │ amoxicillin 1g    ████████▊  88 │
│   sites    │ cough syrup       ▌           9 │
│            │                                 │
│ ⏻ logout   │ ▁▂▃▃▅▄▆▅▇▆▇█  sales / month     │
└────────────┴─────────────────────────────────┘
`),
      acc: ['⊕', '▸', '◉', /▌(?=\s+9)/g, /[▁▂▃▄▅▆▇█]{6,}/g],
      lo: ['sales / month', 'logout', 'finance', 'team', 'sites']
    },

    jws: {
      text: art(String.raw`
 $ curl -X POST :8080/api/items
        │
 ┌──────▼─────────┐  publish  ┌──────────────┐
 │    Quarkus     ├──────────▶│    Kafka     │
 │  resource/API  │           │ ██████░░░░░░ │
 └──────┬─────────┘           └──────┬───────┘
        │ Hibernate (ORM)            │ consume
 ┌──────▼─────────┐           ┌──────▼───────┐
 │   ◫ database   │           │  consumers   │
 └────────────────┘           └──────────────┘
`),
      acc: ['$', '▶', '▼', '██████'],
      lo: ['publish', 'consume', 'Hibernate (ORM)', '░░░░░░']
    },

    shell: {
      text: art(String.raw`
 42sh$ echo 'hello' | tr a-z A-Z
 HELLO
 42sh$ for i in 1 2 3; do echo "n=$i"; done
 n=1
 n=2
 n=3
 42sh$ ls nope 2>/dev/null || echo fallback
 fallback
 42sh$ cat <<EOF > out.txt
 > it works
 > EOF
 42sh$ █
`),
      acc: ['42sh$', '█', /\|\|?/g],
      lo: [/^ (?!42sh\$| >).*$/gm, /^ >/gm]
    },

    malloc: {
      text: art(String.raw`
  void *p = malloc(64);
  ┌───┬──────────┬───┬───────┬───┬────────────┐
  │hdr│██████████│hdr│░░░░░░░│hdr│████████████│
  └───┴──────────┴───┴───────┴───┴────────────┘
      ▲ p          ▲ free      ▲ used

  free(p);
  ┌───┬──────────┬───┬───────┬───┬────────────┐
  │hdr│░░░░░░░░░░│hdr│░░░░░░░│hdr│████████████│
  └───┴──────────┴───┴───────┴───┴────────────┘
      ▲ free       ▲ free      ▲ used
`),
      acc: [/█+/g, 'malloc', 'free(p)'],
      lo: [/░+/g, 'hdr', /▲ (free|used)/g]
    },

    // OCR : la grille est lue (chiffres imprimés), puis le solveur la complète
    ocr: {
      cols: 44,
      frame: function (t) {
        var GIVEN = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
        var SOLVED = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
        var STEPS = ['photo', 'gray', 'lines', 'warp', 'ocr', 'solve'];
        var READ = 1.6, FILL = 5.6, HOLD = 2.4;
        var u = (t + 2.6) % (READ + FILL + HOLD);
        var read = Math.min(81, Math.floor((u / READ) * 81));       // cases déjà lues
        var blanks = 81 - GIVEN.replace(/\./g, '').length;
        var solved = u < READ ? 0 : Math.min(blanks, Math.floor(((u - READ) / FILL) * blanks));
        var step = u < READ ? Math.min(4, Math.floor((u / READ) * 5)) : 5;
        var spans = [];
        var text = '';
        function put(s, cls) {
          if (cls) spans.push([text.length, text.length + s.length, cls]);
          text += s;
        }

        put('  ');
        STEPS.forEach(function (s, i) {
          if (i) put(' ▸ ', 'lo');
          put(s, i === step ? 'acc' : i < step ? 'hi' : 'lo');
        });
        put('\n');

        var seen = 0;
        for (var r = 0; r < 9; r++) {
          if (r % 3 === 0) put('         ' + (r ? '├───────┼───────┼───────┤' : '┌───────┬───────┬───────┐') + '\n');
          put('         │');
          for (var c = 0; c < 9; c++) {
            var i = r * 9 + c;
            put(' ');
            if (GIVEN[i] !== '.') {
              if (i < read) put(GIVEN[i], 'hi');
              else put('▒', 'lo');
            } else {
              if (seen < solved) put(SOLVED[i], 'acc');
              else if (seen === solved && u >= READ && solved < blanks) put(String(1 + Math.floor(t * 24) % 9), 'acc');
              else put('·', 'lo');
              seen++;
            }
            if (c % 3 === 2) put(' │');
          }
          put('\n');
        }
        put('         └───────┴───────┴───────┘\n');

        var done = solved >= blanks;
        var W = 16;
        var n = Math.round((u < READ ? read / 81 : solved / blanks) * W);
        put('  ' + (u < READ ? 'ocr  ' : 'solve') + ' ');
        put(new Array(n + 1).join('█'), 'acc');
        put(new Array(W - n + 1).join('░'), 'lo');
        put(' ' + (u < READ ? read + '/81' : done ? 'solved ✓' : solved + '/' + blanks), done ? 'acc' : 'lo');
        return { text: text, spans: spans };
      }
    }
  };

  /* ---------- rendu ---------- */

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function toRegex(p) {
    if (p instanceof RegExp) return new RegExp(p.source, p.flags.indexOf('g') < 0 ? p.flags + 'g' : p.flags);
    return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  }

  function classify(text, a, spans) {
    var cls = new Array(text.length);
    [['lo', a.lo], ['hi', a.hi], ['acc', a.acc]].forEach(function (pair) {
      (pair[1] || []).forEach(function (p) {
        var re = toRegex(p);
        var m;
        while ((m = re.exec(text))) {
          if (!m[0].length) { re.lastIndex++; continue; }
          for (var i = m.index; i < m.index + m[0].length; i++) cls[i] = pair[0];
        }
      });
    });
    // un dessin animé peut colorer lui-même des plages : [début, fin, classe]
    (spans || []).forEach(function (s) {
      for (var i = s[0]; i < s[1]; i++) cls[i] = s[2];
    });
    return cls;
  }

  function toHtml(frame, a) {
    var text = frame.text != null ? frame.text : frame;
    var cls = classify(text, a, frame.spans);
    var html = '';
    var i = 0;
    while (i < text.length) {
      var c = cls[i];
      var j = i + 1;
      while (j < text.length && cls[j] === c && text[j] !== '\n') j++;
      var chunk = escapeHtml(text.slice(i, j));
      html += c ? '<span class="' + c + '">' + chunk + '</span>' : chunk;
      i = j;
    }
    return html;
  }

  function textOf(a, t) {
    return a.frame ? a.frame(t) : a.text;
  }

  function plain(frame) {
    return frame.text != null ? frame.text : frame;
  }

  function colsOf(a) {
    if (a.cols) return a.cols;
    var lines = plain(textOf(a, 0)).split('\n');
    return lines.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
  }

  /**
   * Monte un dessin dans `el` (élément .ascii).
   * opts.animate : 'hover' (anime au survol de opts.hoverEl), 'visible' (anime à l'écran) ou false
   */
  function mount(el, name, opts) {
    var a = ARTS[name];
    if (!a) return null;
    opts = opts || {};
    var pre = document.createElement('pre');
    pre.setAttribute('aria-hidden', 'true');
    var sample = plain(textOf(a, 0)).split('\n');
    el.style.setProperty('--cols', String(Math.max(colsOf(a), 30)));
    el.style.setProperty('--rows', String(Math.max(sample.length, 8)));
    el.appendChild(pre);

    var t0 = performance.now() - 2000 * Math.random();
    function draw(now) {
      pre.innerHTML = toHtml(textOf(a, ((now || performance.now()) - t0) / 1000), a);
    }
    draw(t0 + 1500);

    if (!a.frame || !opts.animate || reduceMotion.matches) return pre;

    var timer = null;
    function start() {
      if (timer) return;
      timer = setInterval(function () { draw(); }, 90);
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }

    if (opts.animate === 'hover') {
      var host = opts.hoverEl || el;
      host.addEventListener('pointerenter', start);
      host.addEventListener('pointerleave', stop);
      host.addEventListener('focusin', start);
      host.addEventListener('focusout', stop);
    } else if (opts.animate === 'visible' && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { (e.isIntersecting ? start : stop)(); });
      }).observe(el);
    }
    return pre;
  }

  return { ARTS: ARTS, mount: mount, toHtml: toHtml };
})();
