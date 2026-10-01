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
    tags: [{ fr: 'temps réel', en: 'real-time' }, { fr: 'machines à états', en: 'state machines' }, 'QUIC', 'Raspberry Pi 4', 'RP2350'],
    body: {
      fr: [
        'Projet commandé par l\'entreprise Kyber dans le cadre du projet de fin d\'études de l\'EPITA : remplacer la couche de commande du robot quadrupède Nova SM3 pour qu\'il puisse être piloté depuis le client Kyber, via une liaison QUIC sur WiFi.',
        'Le système est découpé en trois sous-systèmes — le client, une Raspberry Pi 4 et un microcontrôleur RP2350 (la puce des Raspberry Pi Pico 2) — reliés d\'un côté par le réseau, de l\'autre par des trames inter-processeurs. Au cœur du robot : une boucle de contrôle temps réel qui calcule la démarche (gait) et la cinématique inverse, puis pilote les servomoteurs en PWM.',
        'Le projet a suivi une vraie démarche d\'ingénierie : état de l\'art, cahier des charges, dossier d\'architecture logicielle (SAD) et spécifications techniques tracées jusqu\'aux exigences. Le comportement est modélisé par machines à états — démarrage, nominal, déplacement, sécurité, erreur — avec un heartbeat et un watchdog entre les sous-systèmes. Le chien qui se promène en haut de ce site lui rend hommage.'
      ],
      en: [
        'A project commissioned by the company Kyber as part of EPITA\'s final-year project: replacing the control layer of the Nova SM3 quadruped robot so that it can be driven from the Kyber client, over a QUIC link on WiFi.',
        'The system is split into three subsystems — the client, a Raspberry Pi 4 and an RP2350 microcontroller (the chip behind the Raspberry Pi Pico 2) — connected by the network on one side and by inter-processor frames on the other. At the heart of the robot: a real-time control loop computing the gait and inverse kinematics, then driving the servos with PWM.',
        'The project followed a proper engineering process: state of the art, requirements specification, software architecture document (SAD) and technical specifications traced back to the requirements. Behaviour is modelled as state machines — start-up, nominal, motion, safety, error — with a heartbeat and a watchdog between subsystems. The dog walking at the top of this site is a tribute to it.'
      ]
    },
    highlights: {
      fr: [
        'Architecture en trois sous-systèmes : client ↔ Raspberry Pi 4 ↔ RP2350',
        'Liaison client ↔ robot en QUIC sur WiFi',
        'Boucle de contrôle temps réel : démarche (gait), cinématique inverse, PWM des servomoteurs',
        'Protocole de trames entre les deux processeurs, heartbeat et watchdog',
        'Machines à états : démarrage, nominal, déplacement, sécurité, erreur',
        'Livrables : état de l\'art, cahier des charges, dossier d\'architecture (SAD), spécifications techniques'
      ],
      en: [
        'Three-subsystem architecture: client ↔ Raspberry Pi 4 ↔ RP2350',
        'Client ↔ robot link over QUIC on WiFi',
        'Real-time control loop: gait, inverse kinematics, servo PWM',
        'Frame protocol between the two processors, heartbeat and watchdog',
        'State machines: start-up, nominal, motion, safety, error',
        'Deliverables: state of the art, requirements, software architecture document (SAD), technical specifications'
      ]
    },
    links: [],
    images: []
  },

  {
    id: 'motion-tracking',
    featured: true,
    cats: ['embedded', 'software'],
    ascii: 'motion',
    period: { fr: 'avr. → mai 2026', en: 'Apr. → May 2026' },
    context: { fr: 'Projet GAP · EPITA · en équipe', en: 'GAP project · EPITA · team project' },
    title: { fr: 'Motion tracking embarqué', en: 'Embedded motion tracking' },
    summary: {
      fr: 'Dérisquage d\'un capteur de mouvement sportif sur STM32 : fusion de capteurs par filtre de Kalman étendu à 200 Hz, puis classification des gestes en Python.',
      en: 'De-risking a sports motion sensor on STM32: sensor fusion with an extended Kalman filter at 200 Hz, then gesture classification in Python.'
    },
    tags: ['C', 'STM32F401RE', 'MPU6050', { fr: 'filtre de Kalman', en: 'Kalman filter' }, 'Python'],
    body: {
      fr: [
        'Un projet de dérisquage : avant de lancer la conception d\'un capteur de mouvement pour le sport, il fallait prouver que la brique la plus incertaine tenait la route — mesurer un geste en temps réel avec une simple centrale inertielle MPU6050 reliée à une carte STM32 Nucleo-F401RE.',
        'Côté firmware, en C : lecture de l\'IMU en I2C à 400 kHz, cadencée à 200 Hz par une interruption timer, puis un filtre de Kalman étendu à 5 états (roulis, tangage et les trois biais du gyroscope) calculé sur le FPU du Cortex-M4 avec CMSIS-DSP. Les mesures partent vers le PC en UART par DMA, à 460 800 bauds, sans jamais bloquer la boucle.',
        'Côté PC, en Python : enregistrement, visualisation, segmentation des gestes et classification par forêt aléatoire. En plus du périmètre demandé, j\'ai implémenté ce petit modèle de classification capable de reconnaître les mouvements effectués — hors sujet, mais apprécié par le professeur.',
        'Le résultat le plus utile est aussi un « non » : la précision de position demandée, 1 cm, est hors de portée d\'une IMU seule, car la double intégration de l\'accélération dérive en quelques dixièmes de seconde. Nous l\'avons chiffré, puis proposé des pistes : magnétomètre, meilleur capteur, fusion avec de l\'UWB ou de la vision.'
      ],
      en: [
        'A de-risking project: before designing a motion sensor for sports, we had to prove that the most uncertain building block held up — measuring a gesture in real time with a plain MPU6050 inertial unit wired to an STM32 Nucleo-F401RE board.',
        'On the firmware side, in C: the IMU is read over I2C at 400 kHz, paced at 200 Hz by a timer interrupt, then fed to a 5-state extended Kalman filter (roll, pitch and the three gyroscope biases) running on the Cortex-M4 FPU with CMSIS-DSP. Samples are streamed to the PC over UART with DMA, at 460,800 baud, without ever blocking the loop.',
        'On the PC side, in Python: recording, visualisation, gesture segmentation and random-forest classification. On top of the requested scope, I implemented this small classification model able to recognise the movements being performed — off-topic, but the professor liked it.',
        'The most useful result is also a "no": the requested 1 cm position accuracy is out of reach for an IMU alone, because double-integrating acceleration drifts within a few tenths of a second. We quantified it, then proposed ways forward: a magnetometer, a better sensor, fusion with UWB or vision.'
      ]
    },
    highlights: {
      fr: [
        'Filtre de Kalman étendu à 5 états, à 200 Hz sur Cortex-M4F (CMSIS-DSP)',
        'Orientation en roulis et tangage à ±1–2°, biais du gyroscope estimés automatiquement',
        'I2C à 400 kHz, interruption timer, UART en DMA à 460 800 bauds',
        'Chaîne Python : capture, visualisation, segmentation, forêt aléatoire (87 % en validation croisée)',
        'Protocole de test tracé, de la calibration à la classification',
        'Limite démontrée et chiffrée : pas de position au centimètre avec une IMU seule'
      ],
      en: [
        '5-state extended Kalman filter at 200 Hz on a Cortex-M4F (CMSIS-DSP)',
        'Roll and pitch within ±1–2°, gyroscope biases estimated automatically',
        'I2C at 400 kHz, timer interrupt, UART with DMA at 460,800 baud',
        'Python pipeline: capture, visualisation, segmentation, random forest (87% in cross-validation)',
        'Traceable test protocol, from calibration to classification',
        'A limit demonstrated with numbers: no centimetre-level position from an IMU alone'
      ]
    },
    links: [],
    images: []
  },

  {
    id: '42sh',
    featured: true,
    cats: ['software'],
    ascii: 'shell',
    period: { fr: 'janv. 2025', en: 'Jan. 2025' },
    context: { fr: 'Projet 42sh · EPITA', en: '42sh project · EPITA' },
    title: { fr: '42sh — shell POSIX', en: '42sh — POSIX shell' },
    summary: {
      fr: 'Un shell conforme à la norme POSIX, écrit en C : de l\'analyse de la ligne de commande à l\'exécution des processus.',
      en: 'A POSIX-compliant shell written in C: from parsing the command line to running the processes.'
    },
    tags: ['C', 'POSIX', 'Unix', { fr: 'processus', en: 'processes' }],
    body: {
      fr: [
        'Conception d\'un shell en C conforme à la norme POSIX : lire une ligne de commande, l\'analyser, puis l\'exécuter comme le ferait sh.',
        'Un projet qui oblige à comprendre en profondeur la grammaire du shell et les mécanismes Unix sous-jacents : création et contrôle des processus, descripteurs de fichiers, tubes, redirections et signaux.'
      ],
      en: [
        'Design of a POSIX-compliant shell in C: read a command line, parse it, then execute it the way sh would.',
        'A project that forces you to deeply understand the shell grammar and the underlying Unix mechanisms: process creation and control, file descriptors, pipes, redirections and signals.'
      ]
    },
    highlights: {
      fr: ['Analyse lexicale et syntaxique de la grammaire shell', 'Création et contrôle des processus', 'Tubes, redirections et gestion des signaux', 'Conformité à la norme POSIX'],
      en: ['Lexing and parsing of the shell grammar', 'Process creation and control', 'Pipes, redirections and signal handling', 'POSIX compliance']
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
        'Conception d\'un processeur mono-cœur en VHDL — chemin de données et unité de contrôle — accompagné de son banc de test pour vérifier son comportement en simulation.',
        'Le design a ensuite été synthétisé et testé sur une carte FPGA MAX10 : le passage de la simulation au vrai matériel, là où chaque signal compte. Pour quelqu\'un qui écrit surtout du logiciel, c\'est aussi la meilleure façon de comprendre ce qui se passe sous le code.'
      ],
      en: [
        'Design of a single-core processor in VHDL — datapath and control unit — together with its testbench to verify its behaviour in simulation.',
        'The design was then synthesised and tested on a MAX10 FPGA board: going from simulation to real hardware, where every signal counts. For someone who mostly writes software, it is also the best way to understand what happens underneath the code.'
      ]
    },
    highlights: {
      fr: [
        'Description matérielle du processeur en VHDL : chemin de données et unité de contrôle',
        'Banc de test (testbench) pour la vérification en simulation',
        'Synthèse et validation sur FPGA MAX10'
      ],
      en: [
        'Hardware description of the processor in VHDL: datapath and control unit',
        'Testbench for verification in simulation',
        'Synthesis and validation on a MAX10 FPGA'
      ]
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
        'Un exercice exigeant sur la gestion mémoire bas niveau — alignement, découpage et fusion des blocs, cas limites du contrat d\'interface — où la moindre erreur se paie en corruption silencieuse.'
      ],
      en: [
        'Re-implementing malloc, the C standard library\'s dynamic allocation function: get memory from the system, split it into blocks, and make it reusable once freed.',
        'A demanding low-level memory management exercise — alignment, block splitting and coalescing, edge cases of the interface contract — where the smallest mistake turns into silent corruption.'
      ]
    },
    highlights: {
      fr: ['Allocation dynamique bas niveau en C', 'Découpage et fusion des blocs, respect de l\'alignement', 'Remplacement de l\'allocateur de la libc'],
      en: ['Low-level dynamic allocation in C', 'Block splitting and coalescing, alignment', 'Drop-in replacement for the libc allocator']
    },
    links: [],
    images: []
  },

  {
    id: 'mini-console',
    cats: ['hardware', 'embedded'],
    ascii: 'console',
    period: { fr: 'fév. → juin 2026', en: 'Feb. → Jun. 2026' },
    context: { fr: 'Projet ELEC · EPITA', en: 'ELEC project · EPITA' },
    title: { fr: 'Mini-console de jeu — PCB & firmware', en: 'Handheld game console — PCB & firmware' },
    summary: {
      fr: 'Conception électronique complète d\'un prototype de mini-console autour d\'un ESP32-S3 : du besoin à la carte soudée qui fonctionne.',
      en: 'Full electronic design of a handheld console prototype built around an ESP32-S3: from the requirements to a soldered, working board.'
    },
    tags: ['KiCad', 'PCB', 'ESP32-S3', 'C++', { fr: 'soudure', en: 'soldering' }],
    body: {
      fr: [
        'Un projet d\'électronique de bout en bout : partir d\'un besoin, choisir les composants, puis dessiner le schéma et router les cartes sous KiCad. Le projet tient en deux PCB : la console et sa manette.',
        'La console s\'articule autour d\'un module ESP32-S3, avec une matrice de 7 × 7 LED adressables (WS2812B), deux afficheurs 7 segments pilotés par des décodeurs, et une alimentation régulée en 3,3 V depuis l\'USB ou une prise jack.',
        'Une fois les fichiers de fabrication générés (Gerber, perçage, nomenclature), la carte a été soudée puis programmée avec un firmware en C++, jusqu\'à obtenir un prototype fonctionnel.'
      ],
      en: [
        'An end-to-end electronics project: start from a need, pick the components, then draw the schematic and route the boards in KiCad. The project is made of two PCBs: the console and its controller.',
        'The console is built around an ESP32-S3 module, with a 7 × 7 matrix of addressable LEDs (WS2812B), two 7-segment displays driven by decoders, and a regulated 3.3 V supply fed from USB or a barrel jack.',
        'Once the manufacturing files were generated (Gerber, drill, bill of materials), the board was soldered and programmed with C++ firmware, all the way to a working prototype.'
      ]
    },
    highlights: {
      fr: [
        'Deux cartes : la console et la manette',
        'ESP32-S3, matrice 7 × 7 de LED WS2812B, afficheurs 7 segments, régulation 3,3 V',
        'Schéma et routage sous KiCad',
        'Fichiers de fabrication : Gerber, perçage, BOM',
        'Soudure et mise en route de la carte',
        'Firmware en C++'
      ],
      en: [
        'Two boards: the console and the controller',
        'ESP32-S3, 7 × 7 WS2812B LED matrix, 7-segment displays, 3.3 V regulation',
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
    id: 'rs485-article',
    cats: ['writing'],
    badge: { fr: 'article', en: 'article' },
    ascii: 'rs485',
    period: { fr: 'juil. 2026', en: 'Jul. 2026' },
    context: { fr: 'Article technique · blog GISTRE · en anglais', en: 'Technical article · GISTRE blog' },
    title: {
      fr: 'RS-485 en environnement bruité : pourquoi l\'UART ne suffit pas',
      en: 'RS-485 in noisy environments: why UART isn\'t enough'
    },
    summary: {
      fr: 'Un article technique tiré d\'un cas réel : le banc vibrant de mon stage chez Inpixal.',
      en: 'A technical article drawn from a real case: the vibration test bench from my internship at Inpixal.'
    },
    tags: ['RS-485', 'UART', { fr: 'signal différentiel', en: 'differential signalling' }, { fr: 'rédaction technique', en: 'technical writing' }],
    body: {
      fr: [
        'Article écrit pour le blog de la majeure GISTRE, à partir d\'un cas concret rencontré en stage : une Raspberry Pi qui pilote en RS-485 le moteur d\'un banc vibrant, dans un environnement électriquement bruité.',
        'Le point de départ : une liaison UART qui marche parfaitement sur le bureau, et qui perd des octets dès qu\'elle côtoie un moteur, une alimentation à découpage et quelques mètres de câble. L\'article explique pourquoi une liaison asymétrique ne tient pas, ce qu\'apporte la transmission différentielle, puis ce qu\'il faut côté matériel — transceiver, terminaison, polarisation, paire torsadée — et côté firmware.',
        'Côté firmware justement : le piège du contrôle de direction (basculer DE trop tôt tronque le dernier caractère), et la couche protocole minimale — adressage, CRC, timeout — qui explique pourquoi Modbus RTU existe.'
      ],
      en: [
        'An article written for the GISTRE major\'s blog, based on a concrete case from my internship: a Raspberry Pi driving the motor of a vibration test bench over RS-485, in an electrically noisy environment.',
        'The starting point: a UART link that works flawlessly on the desk, and drops bytes as soon as it sits next to a motor, a switching power supply and a few metres of cable. The article explains why a single-ended link doesn\'t hold up, what differential signalling brings, then what it takes in hardware — transceiver, termination, biasing, twisted pair — and in firmware.',
        'Speaking of firmware: the direction-control trap (releasing DE too early truncates the last character), and the minimal protocol layer — addressing, CRC, timeout — that explains why Modbus RTU exists.'
      ]
    },
    highlights: {
      fr: [
        'Signal différentiel contre liaison asymétrique, réjection du mode commun',
        'Comparaison RS-232 / RS-422 / RS-485',
        'Transceiver, terminaison et polarisation du bus',
        'Pièges firmware du contrôle de direction (DE/RE)',
        'Couche protocole minimale : adressage, CRC, timeout'
      ],
      en: [
        'Differential versus single-ended signalling, common-mode rejection',
        'RS-232 / RS-422 / RS-485 compared',
        'Transceiver, termination and bus biasing',
        'Firmware pitfalls of direction control (DE/RE)',
        'Minimal protocol layer: addressing, CRC, timeout'
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
    tags: ['Java', 'Spring', 'React', { fr: 'authentification', en: 'authentication' }],
    body: {
      fr: [
        'Conception d\'un progiciel de gestion intégré (ERP) sur un thème imposé : la pharmacie et la gestion des médicaments.',
        'L\'application couvre les finances, les stocks, l\'équipe et les bâtiments, avec un système d\'identification et de gestion des comptes. Le backend est en Java avec Spring, le frontend en React.'
      ],
      en: [
        'Design of an enterprise resource planning (ERP) application on an assigned theme: pharmacies and medicine management.',
        'The application covers finances, stock, staff and buildings, with a login and account management system. The backend is written in Java with Spring, the frontend in React.'
      ]
    },
    highlights: {
      fr: [
        'Modules : finances, stocks, équipe, bâtiments',
        'Identification et gestion des comptes',
        'Backend Java / Spring, frontend React'
      ],
      en: [
        'Modules: finances, stock, staff, buildings',
        'Login and account management',
        'Java / Spring backend, React frontend'
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
    id: 'ocr',
    cats: ['software'],
    ascii: 'ocr',
    period: { fr: 'sept. → déc. 2023', en: 'Sep. → Dec. 2023' },
    context: { fr: 'Projet OCR · EPITA · équipe de 4', en: 'OCR project · EPITA · team of 4' },
    title: { fr: 'OCR — résolveur de sudoku', en: 'OCR — sudoku solver' },
    summary: {
      fr: 'Photographier une grille de sudoku et la résoudre automatiquement : traitement d\'image, reconnaissance de caractères et réseau de neurones.',
      en: 'Take a picture of a sudoku grid and solve it automatically: image processing, character recognition and a neural network.'
    },
    tags: ['C', { fr: 'traitement d\'image', en: 'image processing' }, 'OCR', { fr: 'réseau de neurones', en: 'neural network' }],
    body: {
      fr: [
        'Une application écrite en C qui prend en entrée la photo d\'une grille de sudoku et renvoie la grille résolue. Projet de deuxième année à l\'EPITA, réalisé à quatre en quatre mois, en partant de zéro.',
        'La chaîne de traitement : prétraitement de l\'image, détection des lignes de la grille, redressement, reconnaissance des chiffres par un réseau de neurones, puis résolution.'
      ],
      en: [
        'An application written in C that takes a photo of a sudoku grid as input and returns the solved grid. A second-year project at EPITA, built by four students in four months, starting from scratch.',
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
  { id: 'software', label: { fr: 'logiciel', en: 'software' } },
  { id: 'embedded', label: { fr: 'embarqué', en: 'embedded' } },
  { id: 'hardware', label: { fr: 'matériel', en: 'hardware' } },
  { id: 'writing', label: { fr: 'écrits', en: 'writing' } }
];
