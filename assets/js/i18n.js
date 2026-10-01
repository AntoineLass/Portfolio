/* ==========================================================================
   Traductions. Le français est écrit directement dans le HTML ; ce fichier
   contient la version anglaise des éléments [data-i18n] et les textes
   utilisés par les scripts (UI.fr / UI.en).
   ========================================================================== */

window.I18N = (function () {
  'use strict';

  var EN = {
    'meta.title': 'Antoine Lassagne — embedded systems',
    'meta.desc': 'Portfolio of Antoine Lassagne, engineering student at EPITA (GISTRE major) and SESI Master\'s student at Sorbonne University: embedded systems, real-time, FPGA.',
    'skip': 'Skip to content',
    'nav.menu': 'Menu',
    'nav.about': 'about',
    'nav.projects': 'projects',
    'nav.path': 'background',
    'nav.contact': 'contact',
    'nav.lang': 'Passer en français',
    'nav.theme': 'Toggle theme',

    'hero.role': 'Engineering student in <strong>embedded &amp; real-time systems</strong>, somewhere between code and silicon.',
    'hero.bootlog': 'Summary',
    'boot.0': 'Mounted /epita/gistre — real-time &amp; embedded systems',
    'boot.1': 'Mounted /sorbonne/sesi — Master\'s, double degree',
    'boot.2': 'Drivers loaded: STM32 · RP2350 · FPGA · Linux · CUDA',
    'boot.3': 'Looking for an end-of-studies internship · Feb → Jun 2027',
    'hero.cta1': 'see projects',
    'hero.cta2': 'get in touch',
    'hero.hint': '// click anywhere to send a signal',

    'about.title': 'About',
    'about.p1': 'I\'m an engineering student at EPITA, majoring in <strong>GISTRE</strong> — real-time and embedded systems — on a double degree with the <strong>SESI Master\'s at Sorbonne University</strong>. What draws me in is the boundary between software and hardware: a driver, a control loop, a signal that shows up (or doesn\'t) on the right pin.',
    'about.p2': 'During my internship at <strong>Inpixal</strong>, I designed and delivered an automated test bench for video-processing FPGA boards end to end: it caught two critical firmware bugs as soon as it went live. Since then, I\'ve driven a quadruped robot in real time, designed a processor in VHDL and routed a board in KiCad.',
    'about.p3': 'This year I\'m branching out into parallel computing and accelerators: CUDA, high-level synthesis, manycore architectures. Away from the oscilloscope, I build and fly FPV drones, and I do competitive scale modelling — up to the French championship.',
    'about.spec': 'Summary sheet',
    'about.specTitle': 'datasheet',
    'spec.k1': 'education',
    'spec.v1': 'EPITA — engineering degree, GISTRE major<span class="sub">Sorbonne University — SESI Master\'s · 2026 → 2027</span>',
    'spec.k2': 'looking for',
    'spec.v2': '<span class="led" aria-hidden="true"></span>End-of-studies internship in embedded systems<span class="sub">February → June 2027</span>',
    'spec.k3': 'playground',
    'spec.k4': 'languages',
    'spec.v4': 'French (native) · English (B2-C1)<span class="sub">TOEIC 890/990 · semester in Australia</span>',
    'spec.k5': 'off-screen',
    'spec.v5': 'FPV drones · scale modelling · electronics',

    'projects.title': 'Projects',
    'projects.lead': 'From a quadruped robot to a POSIX shell: a selection of school and personal projects. Each card opens its own page.',
    'projects.filter': 'Filter projects',

    'path.title': 'Background',
    'path.k.next': 'next step',
    'path.k.edu': 'education',
    'path.k.work': 'experience',
    'path.k.asso': 'student life',
    'path.0.date': 'Feb → Jun 2027',
    'path.0.title': 'End-of-studies internship — embedded systems',
    'path.0.org': 'Your company?',
    'path.0.body': 'I\'m looking for a 5-month internship starting in February 2027 to complete my EPITA × Sorbonne double degree. Embedded, real-time, FPGA or accelerators: <a href="#contact">let\'s talk →</a>',
    'path.1.title': 'SESI Master\'s — Electronic and Computer Systems',
    'path.1.org': 'Sorbonne University · Paris · double degree with EPITA',
    'path.1.body': 'Chosen courses: <strong>PACC</strong> (parallelism and accelerators: CUDA/OpenCL, SIMD, MPI), <strong>PBD-HLS</strong> (hardware/software co-design and high-level synthesis, with a LeNet CNN on Zynq), <strong>MASSOC</strong> (SoC modelling and simulation, SystemC), <strong>SMC</strong> (manycore architectures and their OS) and <strong>HOTOP</strong> (research seminars: AI accelerators, hardware security…).',
    'path.2.date': 'Sep 2025 → Jan 2026',
    'path.2.title': 'R&amp;D engineering intern — embedded systems / FPGA validation',
    'path.2.org': 'Inpixal · Rennes, France · 5 months',
    'path.2.intro': 'An SME specialised in real-time embedded image processing. Sole developer on the project, with weekly check-ins with the project lead and the hardware developer.',
    'path.2.b1': 'Designed and delivered <strong>end to end</strong> an automated test bench for video-processing FPGA boards, simulating drone infrared cameras: <strong>2 critical firmware bugs caught as soon as it was deployed</strong>.',
    'path.2.b2': 'Reproducing a field bug used to take about 4 days before the bench; non-regression tests are now centralised and systematic.',
    'path.2.b3': 'Modernised a <strong>Linux PCIe driver</strong> (Terasic board) for recent Ubuntu releases.',
    'path.2.b4': 'Real-time synchronisation between PC, interface board and board under test within a <strong>~40 ms per frame</strong> budget: compared 3 transmission architectures, implemented multi-buffering.',
    'path.2.b5': 'Closed-loop control of a vibration test bench: Raspberry Pi + IMU over SPI, frequency measurement by FFT, PID control, motor driven over RS-485.',
    'path.3.title': 'President of the Labbaye student association',
    'path.3.body': 'Campus life: around ten themed events and tournaments over the year, managing the board (5 active members), the budget and communication. Alongside that, member of the school\'s communication staff: open days, fairs, videos.',
    'path.4.date': 'Feb → Jul 2024',
    'path.4.title': 'Exchange semester — computer science &amp; mathematics',
    'path.4.org': 'Murdoch University · Perth, Australia',
    'path.4.body': 'A semester fully in English, on the other side of the world: independence and technical English every day.',
    'path.5.title': 'Engineering degree — GISTRE major',
    'path.5.org': 'EPITA · computer engineering school',
    'path.5.body': 'Real-time and embedded systems engineering. Key courses: microcontrollers (STM32, ESP32, on-target debugging with an ST-Link probe and GDB), VHDL, KiCad, de-risking, boot sequences, kernels and OS.',

    'skills.title': 'Skills',
    'skills.h1': 'function',
    'skills.h2': 'detail',
    'skills.1.k': 'Embedded &amp; robotics',
    'skills.1.v': 'C, C++ · STM32, ESP32, RP2350, Raspberry Pi · real-time control loops · state machines',
    'skills.2.k': 'FPGA &amp; electronics',
    'skills.2.v': 'VHDL · FPGA (MAX10) · PCB design in KiCad · soldering',
    'skills.3.k': 'Low level &amp; Linux',
    'skills.3.v': 'Drivers (PCIe) · multithreading · real-time · Lua/LuaJIT + FFI · x86 assembly',
    'skills.4.k': 'Protocols &amp; signal',
    'skills.5.k': 'GPU &amp; parallel computing',
    'skills.5.v': 'CUDA <span class="note">(self-taught, ongoing project)</span> · Nsight Systems · parallel programming models',
    'skills.6.k': 'Software &amp; tools',
    'skills.6.v': 'Git · Bash · Python (scripting) · Java (Quarkus, Hibernate, Kafka) · technical writing',
    'skills.7.k': 'Languages',
    'skills.7.v': 'French (native) · English B2-C1 <span class="note">(TOEIC 890/990)</span>',

    'contact.title': 'Contact',
    'contact.intro': 'An internship, a project, a question about an article? Write to me directly:',
    'contact.copy': 'copy',
    'contact.cv': 'Full CV available on request.',
    'form.topic': 'subject',
    'form.t1': 'internship',
    'form.t2': 'a project',
    'form.t3': 'other',
    'form.name': 'name',
    'form.namePh': 'Ada Lovelace',
    'form.org': 'company',
    'form.orgPh': '(optional)',
    'form.msg': 'message',
    'form.msgPh': 'Hi Antoine, …',
    'form.send': 'send',
    'form.note': 'No third-party service: the form drafts an email in your own mail app, and nothing goes through another server.',
    'footer.made': 'handmade · HTML, CSS &amp; JS, no framework · <a href="https://github.com/AntoineLass/Portfolio" target="_blank" rel="noopener">source code</a>'
  };

  var UI = {
    fr: {
      back: 'cd ../projets',
      open: 'ouvrir',
      featured: 'à la une',
      period: 'période',
      context: 'contexte',
      stack: 'stack',
      links: 'liens',
      theProject: 'le projet',
      highlights: 'points clés',
      gallery: 'galerie',
      prev: '← précédent',
      next: 'suivant →',
      close: 'fermer',
      notFoundTitle: 'Projet introuvable',
      notFound: 'Kernel panic - not syncing: projet « %s » introuvable.',
      notFoundBack: 'retour aux projets',
      copy: 'copier',
      copied: 'copié ✓',
      copyFail: 'sélectionnez l\'adresse',
      topics: { stage: 'Stage', projet: 'Projet', autre: 'Contact' },
      mailHello: 'Bonjour Antoine,',
      mailFrom: '—\n%s',
      mailVia: '(envoyé depuis le portfolio)',
      outCompose: '> rédaction du message … ok',
      outOpen: '> ouverture de votre messagerie …',
      outHelp: 'Rien ne s\'ouvre ? <button type="button" data-copy-msg>copier le message</button> et envoyez-le à l\'adresse ci-contre.',
      outCopied: 'message copié ✓',
      errName: 'erreur : le champ « nom » est vide.',
      errMsg: 'erreur : le message est vide.',
      langLabel: 'Switch to English',
      robot: [
        'WOOF → 0x57 0x4F 0x4F 0x46',
        'ping ? pong.',
        'ACK ✓',
        'watchdog nourri ✓',
        'servo : 1,5 ms, au neutre',
        '115200 8N1',
        'bip boup',
        '*remue la queue*',
        'HardFault ? pas aujourd\'hui.',
        'IK : ok',
        'SPI : 0xA5 → 0x5A',
        'je cherche un stage, moi aussi',
        'sudo assis'
      ],
      robotIrq: ['IRQ !', 'irq reçue', 'interruption ⚡', 'ISR ok'],
      robotWake: '!? je ne dormais pas.'
    },
    en: {
      back: 'cd ../projects',
      open: 'open',
      featured: 'featured',
      period: 'period',
      context: 'context',
      stack: 'stack',
      links: 'links',
      theProject: 'the project',
      highlights: 'highlights',
      gallery: 'gallery',
      prev: '← previous',
      next: 'next →',
      close: 'close',
      notFoundTitle: 'Project not found',
      notFound: 'Kernel panic - not syncing: project "%s" not found.',
      notFoundBack: 'back to projects',
      copy: 'copy',
      copied: 'copied ✓',
      copyFail: 'select the address',
      topics: { stage: 'Internship', projet: 'Project', autre: 'Contact' },
      mailHello: 'Hi Antoine,',
      mailFrom: '—\n%s',
      mailVia: '(sent from the portfolio)',
      outCompose: '> composing message … ok',
      outOpen: '> opening your mail app …',
      outHelp: 'Nothing happened? <button type="button" data-copy-msg>copy the message</button> and send it to the address on the right.',
      outCopied: 'message copied ✓',
      errName: 'error: the "name" field is empty.',
      errMsg: 'error: the message is empty.',
      langLabel: 'Passer en français',
      robot: [
        'WOOF → 0x57 0x4F 0x4F 0x46',
        'ping? pong.',
        'ACK ✓',
        'watchdog fed ✓',
        'servo: 1.5 ms, centred',
        '115200 8N1',
        'beep boop',
        '*wags tail*',
        'HardFault? not today.',
        'IK: ok',
        'SPI: 0xA5 → 0x5A',
        'looking for an internship too',
        'sudo sit'
      ],
      robotIrq: ['IRQ!', 'irq received', 'interrupt ⚡', 'ISR ok'],
      robotWake: '!? I wasn\'t sleeping.'
    }
  };

  var root = document.documentElement;
  var lang = root.dataset.lang === 'en' ? 'en' : 'fr';
  var originals = new Map();

  function pick(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v[lang] != null ? v[lang] : v.fr;
  }

  function t(key) {
    var v = UI[lang][key];
    return v != null ? v : UI.fr[key];
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!originals.has(el)) originals.set(el, el.innerHTML);
      var html = lang === 'en' && EN[key] != null ? EN[key] : originals.get(el);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        var attr = p[0].trim();
        var key = p[1].trim();
        var store = 'i18nOrig' + attr.replace(/[^a-z]/gi, '');
        if (el.dataset[store] == null) el.dataset[store] = el.getAttribute(attr) || '';
        el.setAttribute(attr, lang === 'en' && EN[key] != null ? EN[key] : el.dataset[store]);
      });
    });
    root.lang = lang;
    root.dataset.lang = lang;
    var titleKey = document.body && document.body.dataset.titleKey;
    if (titleKey !== 'none') {
      if (!originals.has('title')) originals.set('title', document.title);
      document.title = lang === 'en' ? EN['meta.title'] : originals.get('title');
    }
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (!originals.has('desc')) originals.set('desc', desc.content);
      desc.content = lang === 'en' ? EN['meta.desc'] : originals.get('desc');
    }
    document.querySelectorAll('[data-lang-label]').forEach(function (el) {
      el.dataset.on = String(el.dataset.langLabel === lang);
    });
    root.classList.remove('i18n-pending');
  }

  function set(l) {
    if (l !== 'fr' && l !== 'en') return;
    lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();

  return {
    get lang() { return lang; },
    set: set,
    toggle: function () { set(lang === 'fr' ? 'en' : 'fr'); },
    t: t,
    pick: pick,
    apply: apply
  };
})();
