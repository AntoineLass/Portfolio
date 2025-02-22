document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();  // Empêche le comportement par défaut de l'ancre
        const targetId = this.getAttribute('href').substring(1);  // Obtient l'ID cible
        document.getElementById(targetId).scrollIntoView({ 
            behavior: 'smooth'  // Active le défilement fluide
        });
    });
});

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

  var cursor = document.querySelector('.blob');

  document.addEventListener('mousemove', function(e){
    var x = e.clientX;
    var y = e.clientY;
    var tmp = e.clientX/5;
    cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`
    //cursor.style.backgroundImage = `linear-gradient(${tmp}deg,#1100ff 35%, #ff00f2 45%)`
  });


const swiper = new Swiper('.swiper-container', {
    initialSlide: 1,
    loop: false,
    slidesPerView: 1, // Affiche une seule slide à la fois
    spaceBetween: 80, // Espace entre les slides (en pixels)
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

  document.getElementById('contact-form').addEventListener('send', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page
    const form = e.target;

    // Envoie le formulaire
    fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            alert('Thank for your message ! I will get back to you really soon.');
            form.reset(); // Réinitialise le formulaire
        } else {
            alert('An error Occurs. Please try again later.');
        }
    }).catch(error => {
        alert('An error Occurs. Please try again later.');
    });
});