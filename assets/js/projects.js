/* ==========================================================================
   Données des projets — source unique pour la grille et les pages projet.

   Ajouter des photos à un projet :
     1. déposer les fichiers dans assets/img/projects/<id>/
     2. les lister dans `images` : { src, alt: {fr, en}, caption: {fr, en} }
     3. (optionnel) `cover` : image ou vidéo utilisée à la place de l'ASCII art
        sur la carte et en tête de page — ex. 'assets/img/projects/kydefix/robot.jpg'

   Les champs texte acceptent une chaîne (identique dans les deux langues)
   ou un objet { fr: '…', en: '…' }.
   ========================================================================== */

window.PROJECTS = [
  {
    id: 'kydefix',
    featured: true,
    cats: ['embedded'],
    badge: { fr: 'PFE', en: 'capstone' },
    ascii: 'kydefix',
    period: { fr: 'avr. → juil. 2026', en: 'Apr. → Jul. 2026' },
    context: { fr: 'Projet de fin d\'études EPITA · commandé par Kyber', en: 'EPITA final-year project · commissioned by Kyber' },
    title: { fr: 'Kydéfix — robot quadrupède', en: 'Kydéfix — quadruped robot' },
    summary: {
      fr: 'Remplacer la couche de commande d\'un robot chien Nova SM3 pour le piloter à distance depuis le client Kyber, en QUIC sur WiFi.',
      en: 'Replacing the control layer of a Nova SM3 robot dog so it can be driven remotely from the Kyber client, over QUIC on WiFi.'
    },
    tags: ['RP2350', 'Raspberry Pi 4', 'QUIC', { fr: 'temps réel', en: 'real-time' }, { fr: 'machines à états', en: 'state machines' }],
    body: {
      fr: [
        'Projet commandé par l\'entreprise Kyber dans le cadre du projet de fin d\'études de l\'EPITA : remplacer la couche de commande du robot quadrupède Nova SM3 pour qu\'il puisse être piloté depuis le client Kyber, via une liaison QUIC sur WiFi.',
        'Le système est découpé en trois sous-systèmes — le client, une Raspberry Pi 4 et un microcontrôleur RP2350 — reliés d\'un côté par le réseau, de l\'autre par des trames inter-processeurs. Au cœur du robot : une boucle de contrôle temps réel qui calcule la démarche (gait) et la cinématique inverse, puis pilote les servomoteurs en PWM.',
        'Le projet a suivi une vraie démarche d\'ingénierie : cahier des charges, dossier d\'architecture logicielle (SAD) et spécifications techniques, avec un comportement modélisé par machines à états. Le petit chien qui se promène en haut de ce site lui rend hommage.'
      ],
      en: [
        'A project commissioned by the company Kyber as part of EPITA\'s final-year project: replacing the control layer of the Nova SM3 quadruped robot so that it can be driven from the Kyber client, over a QUIC link on WiFi.',
        'The system is split into three subsystems — the client, a Raspberry Pi 4 and an RP2350 microcontroller — connected by the network on one side and by inter-processor frames on the other. At the heart of the robot: a real-time control loop computing the gait and inverse kinematics, then driving the servos with PWM.',
        'The project followed a proper engineering process: requirements specification, software architecture document (SAD) and technical specifications, with behaviour modelled as state machines. The little dog walking at the top of this site is a tribute to it.'
      ]
    },
    highlights: {
      fr: [
        'Architecture en trois sous-systèmes : client ↔ Raspberry Pi 4 ↔ RP2350',
        'Liaison client ↔ robot en QUIC sur WiFi',
        'Boucle de contrôle temps réel : démarche (gait), cinématique inverse, PWM des servomoteurs',
        'Protocole de trames entre les deux processeurs',
        'Comportement modélisé par machines à états',
        'Livrables : cahier des charges, dossier d\'architecture (SAD), spécifications techniques'
      ],
      en: [
        'Three-subsystem architecture: client ↔ Raspberry Pi 4 ↔ RP2350',
        'Client ↔ robot link over QUIC on WiFi',
        'Real-time control loop: gait, inverse kinematics, servo PWM',
        'Frame protocol between the two processors',
        'Behaviour modelled as state machines',
        'Deliverables: requirements, software architecture document (SAD), technical specifications'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'mini-console',
    featured: true,
    cats: ['hardware', 'embedded'],
    ascii: 'console',
    period: { fr: 'fév. → juin 2026', en: 'Feb. → Jun. 2026' },
    context: { fr: 'Projet ELEC · EPITA', en: 'ELEC project · EPITA' },
    title: { fr: 'Mini-console de jeu — PCB & firmware', en: 'Handheld game console — PCB & firmware' },
    summary: {
      fr: 'Conception électronique complète d\'un prototype de mini-console : du besoin à la carte soudée qui fonctionne.',
      en: 'Full electronic design of a handheld console prototype: from the requirements to a soldered, working board.'
    },
    tags: ['KiCad', 'PCB', 'C++', { fr: 'soudure', en: 'soldering' }],
    body: {
      fr: [
        'Un projet d\'électronique de bout en bout : partir d\'un besoin, choisir les composants — microcontrôleur, alimentation, afficheur, matrice de LED, manette — puis dessiner le schéma et router la carte sous KiCad.',
        'Une fois les fichiers de fabrication générés (Gerber, perçage, nomenclature), la carte a été soudée puis programmée avec un firmware en C++, jusqu\'à obtenir un prototype fonctionnel.'
      ],
      en: [
        'An end-to-end electronics project: start from a need, pick the components — microcontroller, power supply, display, LED matrix, controller — then draw the schematic and route the board in KiCad.',
        'Once the manufacturing files were generated (Gerber, drill, bill of materials), the board was soldered and programmed with C++ firmware, all the way to a working prototype.'
      ]
    },
    highlights: {
      fr: [
        'Choix des composants : microcontrôleur, alimentation, afficheur, matrice de LED, manette',
        'Schéma et routage sous KiCad',
        'Fichiers de fabrication : Gerber, perçage, BOM',
        'Soudure et mise en route de la carte',
        'Firmware en C++'
      ],
      en: [
        'Component selection: microcontroller, power supply, display, LED matrix, controller',
        'Schematic capture and routing in KiCad',
        'Manufacturing files: Gerber, drill, BOM',
        'Soldering and board bring-up',
        'C++ firmware'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'cpu-vhdl',
    featured: true,
    cats: ['hardware'],
    ascii: 'cpu',
    period: { fr: 'mai → juil. 2026', en: 'May → Jul. 2026' },
    context: { fr: 'Projet VHDL · EPITA', en: 'VHDL project · EPITA' },
    title: { fr: 'Processeur mono-cœur en VHDL', en: 'Single-core processor in VHDL' },
    summary: {
      fr: 'Un processeur décrit en VHDL, vérifié par banc de test puis exécuté sur un FPGA MAX10.',
      en: 'A processor described in VHDL, verified with a testbench and then run on a MAX10 FPGA.'
    },
    tags: ['VHDL', 'FPGA', 'MAX10', 'testbench'],
    body: {
      fr: [
        'Conception d\'un processeur mono-cœur en VHDL, accompagné de son banc de test pour vérifier son comportement en simulation.',
        'Le design a ensuite été synthétisé et testé sur une carte FPGA MAX10 : le passage de la simulation au vrai matériel, là où chaque signal compte.'
      ],
      en: [
        'Design of a single-core processor in VHDL, together with its testbench to verify its behaviour in simulation.',
        'The design was then synthesised and tested on a MAX10 FPGA board: going from simulation to real hardware, where every signal counts.'
      ]
    },
    highlights: {
      fr: [
        'Description matérielle du processeur en VHDL',
        'Banc de test (testbench) pour la vérification en simulation',
        'Synthèse et validation sur FPGA MAX10'
      ],
      en: [
        'Hardware description of the processor in VHDL',
        'Testbench for verification in simulation',
        'Synthesis and validation on a MAX10 FPGA'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'motion-tracking',
    featured: true,
    cats: ['embedded'],
    ascii: 'motion',
    period: { fr: 'avr. → mai 2026', en: 'Apr. → May 2026' },
    context: { fr: 'Projet GAP · EPITA', en: 'GAP project · EPITA' },
    title: { fr: 'Motion tracking embarqué', en: 'Embedded motion tracking' },
    summary: {
      fr: 'Dérisquage d\'un système de suivi de mouvement sur STM32 avec une centrale inertielle MPU6050 — et un petit classifieur de mouvements en bonus.',
      en: 'De-risking a motion-tracking system on STM32 with an MPU6050 IMU — plus a small movement classifier as a bonus.'
    },
    tags: ['STM32F401RE', 'MPU6050', 'C', { fr: 'classification', en: 'classification' }],
    body: {
      fr: [
        'Objectif : dérisquer un projet de motion tracking, c\'est-à-dire valider au plus tôt les briques techniques les plus incertaines, sur une carte STM32F401RE reliée à une centrale inertielle MPU6050 (accéléromètre et gyroscope).',
        'En plus du périmètre demandé, j\'ai implémenté un petit modèle de classification capable de reconnaître les mouvements effectués. Hors sujet, mais apprécié par le professeur.'
      ],
      en: [
        'The goal: de-risk a motion-tracking project, i.e. validate the most uncertain technical building blocks as early as possible, on an STM32F401RE board connected to an MPU6050 IMU (accelerometer and gyroscope).',
        'On top of the requested scope, I implemented a small classification model able to recognise the movements being performed. Off-topic, but the professor liked it.'
      ]
    },
    highlights: {
      fr: [
        'Acquisition des données de l\'IMU MPU6050 sur STM32F401RE',
        'Démarche de dérisquage : valider tôt ce qui pourrait faire échouer le projet',
        'Petit modèle de classification des mouvements'
      ],
      en: [
        'Reading MPU6050 IMU data on an STM32F401RE',
        'De-risking approach: validate early what could make the project fail',
        'Small movement classification model'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'rs485-article',
    cats: ['writing'],
    badge: { fr: 'article', en: 'article' },
    ascii: 'rs485',
    period: { fr: 'juil. 2026', en: 'Jul. 2026' },
    context: { fr: 'Article technique · blog GISTRE', en: 'Technical article · GISTRE blog' },
    title: {
      fr: 'RS-485 en environnement bruité : pourquoi l\'UART ne suffit pas',
      en: 'RS-485 in noisy environments: why UART isn\'t enough'
    },
    summary: {
      fr: 'Un article technique tiré d\'un cas réel : le banc vibrant de mon stage chez Inpixal.',
      en: 'A technical article drawn from a real case: the vibration test bench from my internship at Inpixal.'
    },
    tags: ['RS-485', 'UART', { fr: 'signal différentiel', en: 'differential signalling' }],
    body: {
      fr: [
        'Article écrit pour le blog de la majeure GISTRE, à partir d\'un cas concret rencontré en stage : piloter en RS-485 le moteur d\'un banc vibrant, dans un environnement industriel électriquement bruité.',
        'Au programme : pourquoi une liaison UART classique ne tient pas, ce qu\'apporte la transmission différentielle, le rôle du transceiver et de la terminaison de ligne, et les pièges côté firmware du contrôle de direction.'
      ],
      en: [
        'An article written for the GISTRE major\'s blog, based on a concrete case from my internship: driving the motor of a vibration test bench over RS-485, in an electrically noisy industrial environment.',
        'What it covers: why a plain UART link doesn\'t hold up, what differential signalling brings, the role of the transceiver and of line termination, and the firmware pitfalls of direction control.'
      ]
    },
    highlights: {
      fr: [
        'Signal différentiel contre liaison asymétrique',
        'Transceiver et terminaison de ligne',
        'Pièges firmware du contrôle de direction (DE/RE)'
      ],
      en: [
        'Differential versus single-ended signalling',
        'Transceiver and line termination',
        'Firmware pitfalls of direction control (DE/RE)'
      ]
    },
    // Ajouter ici le lien vers l'article une fois publié :
    // links: [{ label: { fr: 'Lire l\'article', en: 'Read the article' }, url: 'https://…' }],
    links: [],
    images: []
  },

  {
    id: 'ar-sandbox',
    cats: ['software'],
    ascii: 'sandbox',
    period: { fr: 'sept. 2024 → juin 2025', en: 'Sep. 2024 → Jun. 2025' },
    context: { fr: 'Projet C++', en: 'C++ project' },
    title: { fr: 'Bac à sable topographique interactif', en: 'Interactive topographic sandbox' },
    summary: {
      fr: 'Un programme C++ qui projette en direct une carte topographique sur du sable, grâce à une Kinect et un vidéoprojecteur.',
      en: 'A C++ program that projects a live topographic map onto sand, using a Kinect and a projector.'
    },
    tags: ['C++', 'Kinect', { fr: 'vidéoprojection', en: 'projection' }, { fr: 'temps réel', en: 'real-time' }],
    body: {
      fr: [
        'On sculpte le sable à la main, et le relief se colore aussitôt : la Kinect mesure la profondeur de la surface, le programme en déduit une carte topographique, et le vidéoprojecteur la renvoie directement sur le sable.',
        'Un projet très visuel, à la croisée de la vision par ordinateur et du temps réel : la carte projetée doit suivre en direct les mouvements du sable.'
      ],
      en: [
        'You shape the sand by hand and the terrain lights up right away: the Kinect measures the depth of the surface, the program turns it into a topographic map, and the projector casts it straight back onto the sand.',
        'A very visual project at the crossroads of computer vision and real-time: the projected map has to follow the sand as it moves.'
      ]
    },
    highlights: {
      fr: [
        'Acquisition de la profondeur avec une Kinect',
        'Génération d\'une carte topographique à partir du relief mesuré',
        'Projection en direct sur le sable',
        'Programme écrit en C++'
      ],
      en: [
        'Depth acquisition with a Kinect',
        'Topographic map generated from the measured terrain',
        'Live projection onto the sand',
        'Written in C++'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'ping-erp',
    cats: ['software'],
    ascii: 'erp',
    period: { fr: 'mai → juil. 2025', en: 'May → Jul. 2025' },
    context: { fr: 'Projet PING · EPITA', en: 'PING project · EPITA' },
    title: { fr: 'PING — ERP pour pharmacie', en: 'PING — pharmacy ERP' },
    summary: {
      fr: 'Un ERP complet, frontend et backend, sur le thème de la pharmacie et de la gestion des médicaments.',
      en: 'A complete ERP — frontend and backend — themed around pharmacies and medicine management.'
    },
    tags: ['frontend', 'backend', { fr: 'authentification', en: 'authentication' }],
    body: {
      fr: [
        'Conception d\'un progiciel de gestion intégré (ERP) sur un thème imposé : la pharmacie et la gestion des médicaments.',
        'L\'application couvre les finances, les stocks, l\'équipe et les bâtiments, avec un système d\'identification et de gestion des comptes. Frontend et backend ont été conçus dans le cadre du projet.'
      ],
      en: [
        'Design of an enterprise resource planning (ERP) application on an assigned theme: pharmacies and medicine management.',
        'The application covers finances, stock, staff and buildings, with a login and account management system. Both the frontend and the backend were built as part of the project.'
      ]
    },
    highlights: {
      fr: [
        'Modules : finances, stocks, équipe, bâtiments',
        'Identification et gestion des comptes',
        'Frontend et backend'
      ],
      en: [
        'Modules: finances, stock, staff, buildings',
        'Login and account management',
        'Frontend and backend'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'jws',
    cats: ['software'],
    ascii: 'jws',
    period: { fr: 'fév. 2025', en: 'Feb. 2025' },
    context: { fr: 'Projet JWS · EPITA', en: 'JWS project · EPITA' },
    title: { fr: 'JWS — API backend Java', en: 'JWS — Java backend API' },
    summary: {
      fr: 'Une API backend en Java construite avec Quarkus, Hibernate et Kafka.',
      en: 'A Java backend API built with Quarkus, Hibernate and Kafka.'
    },
    tags: ['Java', 'Quarkus', 'Hibernate', 'Kafka'],
    body: {
      fr: [
        'Développement d\'une API backend en Java avec le framework Quarkus.',
        'La persistance des données passe par Hibernate (ORM), et Apache Kafka assure la communication par événements entre les composants.'
      ],
      en: [
        'Development of a Java backend API with the Quarkus framework.',
        'Data persistence goes through Hibernate (ORM), and Apache Kafka handles event-based communication between components.'
      ]
    },
    highlights: {
      fr: ['API backend avec Quarkus', 'Persistance avec Hibernate (ORM)', 'Communication par événements avec Kafka'],
      en: ['Backend API with Quarkus', 'Persistence with Hibernate (ORM)', 'Event-based messaging with Kafka']
    },
    links: [],
    images: []
  },

  {
    id: '42sh',
    cats: ['software'],
    ascii: 'shell',
    period: { fr: 'janv. 2025', en: 'Jan. 2025' },
    context: { fr: 'Projet 42sh · EPITA', en: '42sh project · EPITA' },
    title: { fr: '42sh — shell POSIX', en: '42sh — POSIX shell' },
    summary: {
      fr: 'Un shell conforme à la norme POSIX, écrit en C.',
      en: 'A POSIX-compliant shell written in C.'
    },
    tags: ['C', 'POSIX', 'Unix'],
    body: {
      fr: [
        'Conception d\'un shell en C conforme à la norme POSIX : lire une ligne de commande, l\'analyser, puis l\'exécuter comme le ferait sh.',
        'Un projet qui oblige à comprendre en profondeur la grammaire du shell et les mécanismes Unix sous-jacents : processus, descripteurs de fichiers, tubes et redirections.'
      ],
      en: [
        'Design of a POSIX-compliant shell in C: read a command line, parse it, then execute it the way sh would.',
        'A project that forces you to deeply understand the shell grammar and the underlying Unix mechanisms: processes, file descriptors, pipes and redirections.'
      ]
    },
    highlights: {
      fr: ['Analyse lexicale et syntaxique de la grammaire shell', 'Exécution : processus, tubes, redirections', 'Conformité à la norme POSIX'],
      en: ['Lexing and parsing of the shell grammar', 'Execution: processes, pipes, redirections', 'POSIX compliance']
    },
    links: [],
    images: []
  },

  {
    id: 'malloc',
    cats: ['software'],
    ascii: 'malloc',
    period: { fr: 'nov. 2024', en: 'Nov. 2024' },
    context: { fr: 'Projet · EPITA', en: 'Project · EPITA' },
    title: { fr: 'malloc — allocateur mémoire', en: 'malloc — memory allocator' },
    summary: {
      fr: 'Ré-implémentation de malloc, l\'allocateur mémoire de la bibliothèque standard C.',
      en: 'A re-implementation of malloc, the C standard library\'s memory allocator.'
    },
    tags: ['C', { fr: 'mémoire', en: 'memory' }, 'Unix'],
    body: {
      fr: [
        'Ré-implémenter malloc, la fonction d\'allocation dynamique de la bibliothèque standard C : obtenir de la mémoire auprès du système, la découper en blocs, et la rendre réutilisable une fois libérée.',
        'Un exercice exigeant sur la gestion mémoire bas niveau, où la moindre erreur se paie en corruption silencieuse.'
      ],
      en: [
        'Re-implementing malloc, the C standard library\'s dynamic allocation function: get memory from the system, split it into blocks, and make it reusable once freed.',
        'A demanding low-level memory management exercise, where the smallest mistake turns into silent corruption.'
      ]
    },
    highlights: {
      fr: ['Allocation dynamique bas niveau en C', 'Découpage et réutilisation des blocs libérés', 'Remplacement de l\'allocateur de la libc'],
      en: ['Low-level dynamic allocation in C', 'Splitting and reusing freed blocks', 'Drop-in replacement for the libc allocator']
    },
    links: [],
    images: []
  },

  {
    id: 'ocr',
    cats: ['software'],
    ascii: 'sudoku',
    cover: { src: 'assets/img/projects/ocr/ocr-pipeline.mp4', poster: 'assets/img/projects/ocr/05-resolution.webp' },
    period: { fr: 'sept. → déc. 2023', en: 'Sep. → Dec. 2023' },
    context: { fr: 'Projet OCR · EPITA · équipe de 4', en: 'OCR project · EPITA · team of 4' },
    title: { fr: 'OCR — résolveur de sudoku', en: 'OCR — sudoku solver' },
    summary: {
      fr: 'Photographier une grille de sudoku et la résoudre automatiquement : traitement d\'image, reconnaissance de caractères et réseau de neurones.',
      en: 'Take a picture of a sudoku grid and solve it automatically: image processing, character recognition and a neural network.'
    },
    tags: [{ fr: 'traitement d\'image', en: 'image processing' }, 'OCR', { fr: 'réseau de neurones', en: 'neural network' }],
    body: {
      fr: [
        'Une application qui prend en entrée la photo d\'une grille de sudoku et renvoie la grille résolue. Projet de deuxième année à l\'EPITA, réalisé à quatre en quatre mois, en partant de zéro.',
        'La chaîne de traitement : prétraitement de l\'image, détection des lignes de la grille, redressement, reconnaissance des chiffres par un réseau de neurones, puis résolution.'
      ],
      en: [
        'An application that takes a photo of a sudoku grid as input and returns the solved grid. A second-year project at EPITA, built by four students in four months, starting from scratch.',
        'The pipeline: image preprocessing, grid line detection, straightening, digit recognition with a neural network, then solving.'
      ]
    },
    highlights: {
      fr: ['Prétraitement et détection de la grille', 'Redressement automatique de l\'image', 'Reconnaissance des chiffres par réseau de neurones', 'Résolution du sudoku'],
      en: ['Preprocessing and grid detection', 'Automatic straightening of the image', 'Digit recognition with a neural network', 'Solving the sudoku']
    },
    links: [{ label: 'BAME-OCR', url: 'https://briossant.com/BAME-OCR/' }],
    images: [
      { src: 'assets/img/projects/ocr/01-photo.webp', alt: { fr: 'Photo d\'une grille de sudoku inclinée', en: 'Photo of a tilted sudoku grid' }, caption: { fr: '1 · image d\'entrée', en: '1 · input image' } },
      { src: 'assets/img/projects/ocr/02-pretraitement.webp', alt: { fr: 'Image prétraitée en noir et blanc', en: 'Preprocessed black and white image' }, caption: { fr: '2 · prétraitement', en: '2 · preprocessing' } },
      { src: 'assets/img/projects/ocr/03-lignes.webp', alt: { fr: 'Lignes de la grille détectées en rouge', en: 'Grid lines detected in red' }, caption: { fr: '3 · détection des lignes', en: '3 · line detection' } },
      { src: 'assets/img/projects/ocr/04-redressement.webp', alt: { fr: 'Grille redressée', en: 'Straightened grid' }, caption: { fr: '4 · redressement', en: '4 · straightening' } },
      { src: 'assets/img/projects/ocr/05-resolution.webp', alt: { fr: 'Grille de sudoku résolue', en: 'Solved sudoku grid' }, caption: { fr: '5 · grille résolue', en: '5 · solved grid' } }
    ]
  }
];

window.PROJECT_CATS = [
  { id: 'all', label: { fr: 'tous', en: 'all' } },
  { id: 'embedded', label: { fr: 'embarqué', en: 'embedded' } },
  { id: 'hardware', label: { fr: 'matériel', en: 'hardware' } },
  { id: 'software', label: { fr: 'logiciel', en: 'software' } },
  { id: 'writing', label: { fr: 'écrits', en: 'writing' } }
];
