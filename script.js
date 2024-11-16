document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();  // Empêche le comportement par défaut de l'ancre
        const targetId = this.getAttribute('href').substring(1);  // Obtient l'ID cible
        document.getElementById(targetId).scrollIntoView({ 
            behavior: 'smooth'  // Active le défilement fluide
        });
    });
});

function getBackgroundColor(element) {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor; // Récupère la couleur de fond

    return backgroundColor;
}

PowerGlitch.glitch('.glitch', {
    "playMode": "hover",
    "createContainers": true,
    "hideOverflow": false,
    "timing": {
      "duration": 250
    },
    "glitchTimeSpan": {
      "start": 0,
      "end": 3
    },
    "shake": {
      "velocity": 10,
      "amplitudeX": 0.1,
      "amplitudeY": 0.1
    },
    "slice": {
      "count": 6,
      "velocity": 10,
      "minHeight": 0.02,
      "maxHeight": 0.15,
      "hueRotate": true
    },
    "pulse": false
  });