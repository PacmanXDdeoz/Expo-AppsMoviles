
  (function () {
    'use strict';

    var deck = document.getElementById('deck');
    var slides = Array.prototype.slice.call(deck.children);
    var pager = document.getElementById('pager');
    var counter = document.getElementById('counter');
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var progressBar = document.getElementById('progressBar');
    var current = 0;

    /* Devuelve el markup de un icono del sprite SVG (heredan el color del texto) */
    function ic(id) {
      return '<svg class="ic" aria-hidden="true"><use href="#' + id + '"></use></svg>';
    }

    /* ---------- Navegación ---------- */

    // Construye los puntos de progreso dinámicamente
    slides.forEach(function (s, i) {
      s.setAttribute('aria-label', 'Diapositiva ' + (i + 1) + ' de ' + slides.length);
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'dot';
      d.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
      d.addEventListener('click', function () { goTo(i); });
      pager.appendChild(d);
    });
    var dots = Array.prototype.slice.call(pager.children);

    function render(i) {
      slides.forEach(function (s, idx) {
        s.classList.toggle('active', idx === i);
        s.setAttribute('aria-hidden', idx === i ? 'false' : 'true');
        s.inert = idx !== i;
        if (idx !== i) s.scrollTop = 0;
      });
      dots.forEach(function (d, idx) {
        d.classList.toggle('active', idx === i);
        if (idx === i) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); }
      });
      counter.textContent = (i + 1) + ' / ' + slides.length;
      progressBar.style.width = (((i + 1) / slides.length) * 100) + '%';
      var accent = (getComputedStyle(slides[i]).getPropertyValue('--accent') || '#D85A30').trim();
      document.documentElement.style.setProperty('--accent', accent);
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
    }

    function goTo(i) {
      if (i < 0 || i >= slides.length || i === current) return;
      current = i;
      deck.style.transform = 'translateX(-' + (i * 100) + '%)';
      render(i);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    /* ---------- Teclado (← → Espacio Home End) ---------- */

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var isTyping = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === 'Escape') { closeCardOverlay(); hideTip(); return; }
      if (isTyping) return;
      // Deja que los botones gestionen su propia tecla Espacio
      if (t && t.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Spacebar')) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault(); next(); break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault(); prev(); break;
        case ' ':
          e.preventDefault(); next(); break;
        case 'f':
        case 'F':
          // Tecla F → pantalla completa (sin modificar Ctrl/Cmd/Alt para no
          // robar atajos del navegador, p. ej. Ctrl+F buscar).
          if (!e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleFs(); }
          break;
        case 'Home':
          e.preventDefault(); goTo(0); break;
        case 'End':
          e.preventDefault(); goTo(slides.length - 1); break;
      }
    });

    /* ---------- Pantalla completa (botón y tecla F) ---------- */

    var fsBtn = document.getElementById('fsBtn');

    function fsSupported() {
      return !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    }

    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function toggleFs() {
      if (!fsSupported()) return;
      if (isFullscreen()) {
        if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
      } else {
        var el = document.documentElement;
        if (el.requestFullscreen) { el.requestFullscreen(); } else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      }
    }

    function syncFsBtn() {
      var on = isFullscreen();
      fsBtn.classList.toggle('fs-on', on);
      fsBtn.setAttribute('aria-pressed', String(on));
      fsBtn.setAttribute('aria-label', on ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)');
    }

    fsBtn.addEventListener('click', toggleFs);
    document.addEventListener('fullscreenchange', syncFsBtn);
    document.addEventListener('webkitfullscreenchange', syncFsBtn);
    syncFsBtn();

    /* ---------- Gestos táctiles (swipe horizontal) ---------- */

    var x0 = null, y0 = null;
    deck.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });

    deck.addEventListener('touchmove', function (e) {
      if (x0 === null) return;
      var dx = e.touches[0].clientX - x0;
      var dy = e.touches[0].clientY - y0;
      // Solo bloquea el gesto cuando es claramente horizontal, así el scroll
      // vertical del texto en móvil sigue funcionando.
      if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) e.preventDefault();
    }, { passive: false });

    deck.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        if (dx < 0) { next(); } else { prev(); }
      }
      x0 = y0 = null;
    });

    /* ---------- Slide 1 y 4: badges que reaccionan ---------- */

    document.querySelectorAll('.s1 .badge.wiggle, .s4 .badge.wiggle').forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.remove('pop');
        void b.offsetWidth; // reinicia la animación
        b.classList.add('pop');
        b.addEventListener('animationend', function handler() {
          b.classList.remove('pop');
          b.removeEventListener('animationend', handler);
        });
      });
    });

    /* ---------- Slide 2: mockup UI interactivo ---------- */

    var search = document.getElementById('mockSearch');
    var cats = Array.prototype.slice.call(document.querySelectorAll('.mock .cat'));
    var cartBtn = document.getElementById('cartBtn');
    var cartCount = document.getElementById('cartCount');
    var count = 3;

    function applyFilter(q) {
      var needle = (q || '').trim().toLowerCase();
      cats.forEach(function (c) {
        var match = !needle || (c.getAttribute('data-filter') || '').indexOf(needle) !== -1;
        c.style.display = match ? '' : 'none';
      });
    }

    search.addEventListener('input', function () {
      cats.forEach(function (c) { c.classList.remove('active'); });
      applyFilter(search.value);
    });

    cats.forEach(function (c) {
      c.addEventListener('click', function () {
        var wasActive = c.classList.contains('active');
        cats.forEach(function (x) { x.classList.remove('active'); });
        if (wasActive) {
          search.value = '';
          applyFilter('');
        } else {
          c.classList.add('active');
          search.value = c.getAttribute('data-filter');
          applyFilter(search.value);
        }
      });
    });

    cartBtn.addEventListener('click', function () {
      count += 1;
      cartCount.textContent = count + ' en el carrito';
      cartBtn.classList.remove('pop');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('pop');
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth;
      cartCount.classList.add('bump');
    });

    /* ---------- Slide 3: tarjetas Antes / Ahora ---------- */

    var cardOverlay = document.getElementById('cardOverlay');
    var overlayTag = document.getElementById('overlayTag');
    var overlayText = document.getElementById('overlayText');
    var cardInfo = {
      antes: {
        tag: 'Antes',
        text: 'El producto se impone: el usuario debe aprender, adaptarse y memorizar. Si no entiende cómo funciona, simplemente abandona.'
      },
      ahora: {
        tag: 'Ahora',
        text: 'El producto se adapta: el diseño parte de las necesidades, limitaciones y contexto reales de las personas.'
      }
    };

    function openCardOverlay(topic) {
      var info = cardInfo[topic];
      if (!info) return;
      overlayTag.textContent = info.tag;
      overlayText.textContent = info.text;
      cardOverlay.classList.add('open');
      cardOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeCardOverlay() {
      cardOverlay.classList.remove('open');
      cardOverlay.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.s3 .card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (cardOverlay.classList.contains('open')) {
          closeCardOverlay();
        } else {
          openCardOverlay(card.getAttribute('data-topic'));
        }
      });
    });
    cardOverlay.addEventListener('click', closeCardOverlay);

    /* ---------- Slide 3: ciclo Investigar → Iterar con tooltip ---------- */

    var tip = document.getElementById('tip');
    var tipTitle = document.getElementById('tipTitle');
    var tipText = document.getElementById('tipText');
    var currentStep = null;
    var stepInfo = {
      investigar: { icon: 'i-search', title: 'Investigar', text: 'Entender al usuario real: entrevistas, encuestas, analítica y datos para descubrir necesidades y dolores concretos.' },
      disenar: { icon: 'i-pencil', title: 'Diseñar', text: 'Generar ideas y prototipos de baja fidelidad: bocetos, wireframes y flujos para validar conceptos antes de invertir.' },
      probar: { icon: 'i-flask', title: 'Probar', text: 'Probar con personas reales: detectar fricciones, errores y puntos de abandono antes de lanzar.' },
      iterar: { icon: 'i-refresh', title: 'Iterar', text: 'Mejorar en ciclos cortos: cada iteración acerca el producto a las expectativas del usuario.' }
    };

    function showTip(key) {
      var info = stepInfo[key];
      if (!info) return;
      tipTitle.innerHTML = ic(info.icon) + ' ' + info.title;
      tipText.textContent = info.text;
      tip.classList.add('show');
      tip.setAttribute('aria-hidden', 'false');
    }

    function hideTip() {
      tip.classList.remove('show');
      tip.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.s3 .step').forEach(function (step) {
      step.addEventListener('click', function () {
        var key = step.getAttribute('data-step');
        if (tip.classList.contains('show') && currentStep === key) {
          hideTip();
          currentStep = null;
        } else {
          showTip(key);
          currentStep = key;
        }
      });
    });

    // Cierra el tooltip al hacer clic fuera de él
    document.addEventListener('click', function (e) {
      if (tip.classList.contains('show') && !e.target.closest('.step') && !e.target.closest('.tip')) {
        hideTip();
        currentStep = null;
      }
    });

    /* ---------- Slide 5: Doble Diamante interactivo ---------- */

    var statusBadge = document.getElementById('statusBadge');
    var ddPaths = Array.prototype.slice.call(document.querySelectorAll('.dd-svg .phase'));
    var ddChips = Array.prototype.slice.call(document.querySelectorAll('.phase-chip'));
    var phaseInfo = {
      descubrir:   { label: 'Descubrir',    mode: 'divergente',  icon: 'i-diverge' },
      definir:     { label: 'Definir',      mode: 'convergente', icon: 'i-target' },
      desarrollar: { label: 'Desarrollar',  mode: 'divergente',  icon: 'i-diverge' },
      entregar:    { label: 'Entregar',     mode: 'convergente', icon: 'i-target' }
    };
    var pinnedPhase = null;

    function setPhaseStatus(key, pin) {
      var info = phaseInfo[key];
      if (!info) return;
      statusBadge.innerHTML = info.label + ' · Pensamiento ' + info.mode + ' ' + ic(info.icon);
      statusBadge.classList.add('show');
      ddPaths.forEach(function (p) {
        var on = p.getAttribute('data-phase') === key;
        p.classList.toggle('active', pin && on);
        p.classList.toggle('hl', !pin && on);
        p.classList.toggle('dim', pin && !on);
      });
      ddChips.forEach(function (c) {
        var on = c.getAttribute('data-phase') === key;
        c.classList.toggle('active', pin && on);
        c.classList.toggle('hl', !pin && on);
        c.classList.toggle('dim', pin && !on);
      });
    }

    function clearPhaseHover() {
      ddPaths.forEach(function (p) { p.classList.remove('hl'); });
      ddChips.forEach(function (c) { c.classList.remove('hl'); });
    }

    function pinPhase(key) {
      pinnedPhase = key;
      setPhaseStatus(key, true);
    }

    function unpinPhase() {
      pinnedPhase = null;
      ddPaths.forEach(function (p) { p.classList.remove('active', 'dim'); });
      ddChips.forEach(function (c) { c.classList.remove('active', 'dim'); });
      statusBadge.classList.remove('show');
    }

    function bindPhaseElement(el) {
      var key = el.getAttribute('data-phase');
      el.addEventListener('mouseenter', function () { setPhaseStatus(key, false); });
      el.addEventListener('mouseleave', clearPhaseHover);
      el.addEventListener('focus', function () { setPhaseStatus(key, false); });
      el.addEventListener('blur', clearPhaseHover);
      el.addEventListener('click', function () {
        if (pinnedPhase === key) { unpinPhase(); } else { pinPhase(key); }
      });
    }
    ddPaths.forEach(bindPhaseElement);
    ddChips.forEach(bindPhaseElement);

    /* ---------- Slide 6: herramientas interactivas ---------- */

    function popit(el) {
      el.classList.remove('popit');
      void el.offsetWidth;
      el.classList.add('popit');
    }

    var personaBtn = document.getElementById('personaBtn');
    var personaFace = document.getElementById('personaFace');
    var personaName = document.getElementById('personaName');
    var personaReadout = document.getElementById('personaReadout');
    var personaIcons = {
      maria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9.4" r="3.4"/><circle cx="12" cy="3.9" r="1.7"/><path d="M4.7 20.3c1.4-3.4 4.1-5.1 7.3-5.1s5.9 1.7 7.3 5.1"/></svg>',
      carlos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9.4" r="3.4"/><path d="M8.6 9.4a3.4 3.4 0 0 1 6.8 0"/><path d="M4.7 20.3c1.4-3.4 4.1-5.1 7.3-5.1s5.9 1.7 7.3 5.1"/></svg>',
      lucia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.9 7.6C7.2 12.6 9.7 16.8 12 19c2.3-2.2 4.8-6.4 3.1-11.4"/><circle cx="12" cy="9.4" r="3.4"/><path d="M4.7 20.3c1.4-3.4 4.1-5.1 7.3-5.1s5.9 1.7 7.3 5.1"/></svg>'
    };
    var personas = [
      { icon: personaIcons.maria,  color: '#FAC775', name: 'María · 32',  tag: 'Compra desde el móvil · clic para cambiar' },
      { icon: personaIcons.carlos, color: '#5DCAA5', name: 'Carlos · 45', tag: 'Prioriza el envío rápido · clic para cambiar' },
      { icon: personaIcons.lucia,  color: '#F0997B', name: 'Lucía · 24',  tag: 'Siempre busca ofertas · clic para cambiar' }
    ];
    var pIdx = 0;

    personaBtn.addEventListener('click', function () {
      pIdx = (pIdx + 1) % personas.length;
      var p = personas[pIdx];
      personaFace.innerHTML = p.icon;
      personaFace.style.color = p.color;
      personaName.textContent = p.name;
      personaReadout.textContent = p.tag;
      popit(personaFace);
    });

    var journeyRow = document.getElementById('journeyRow');
    var journeyReadout = document.getElementById('journeyReadout');
    var journeyFaces = ['ok', 'ok', 'pain', 'ok', 'ok'];
    var journeyIcons = { ok: 'i-smile', pain: 'i-frown' };

    function journeyFace(pain) {
      return ic(journeyIcons[pain ? 'pain' : 'ok']);
    }

    function journeyLabel(i, pain) {
      return 'Paso ' + (i + 1) + (pain ? ' · punto de dolor' : ' · sin dolor');
    }

    function updateJourneyReadout() {
      var painCount = journeyRow.querySelectorAll('.jstep.pain').length;
      journeyReadout.innerHTML = painCount + ' de ' + journeyFaces.length + ' pasos son puntos de dolor ' + ic('i-frown');
    }

    journeyFaces.forEach(function (type, i) {
      var pain = type === 'pain';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'jstep' + (pain ? ' pain' : '');
      b.innerHTML = journeyFace(pain);
      b.setAttribute('aria-label', journeyLabel(i, pain));
      b.addEventListener('click', function () {
        pain = b.classList.toggle('pain');
        b.innerHTML = journeyFace(pain);
        b.setAttribute('aria-label', journeyLabel(i, pain));
        popit(b);
        updateJourneyReadout();
      });
      journeyRow.appendChild(b);
    });
    updateJourneyReadout();

    var sortRow = document.getElementById('sortRow');
    var sortReadout = document.getElementById('sortReadout');
    ['Ofertas', 'Cuenta', 'Pedidos', 'Ayuda'].forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'scard';
      b.textContent = name;
      b.addEventListener('click', function () {
        sortRow.prepend(b);
        popit(b);
        sortReadout.textContent = 'Reordenando: «' + name + '» al inicio';
      });
      sortRow.appendChild(b);
    });

    /* ---------- Slide 7: balanza documentación vs. valor ---------- */

    var scaleBeam = document.querySelector('.scale-beam');
    var scaleSvg = document.querySelector('.scale-svg');
    var scaleSides = Array.prototype.slice.call(document.querySelectorAll('.scale-side'));
    var pinnedSide = null;

    function setScale(side, pin) {
      scaleBeam.classList.toggle('tip-docs', side === 'docs');
      scaleBeam.classList.toggle('tip-valor', side === 'valor');
      scaleSides.forEach(function (c) {
        var on = c.getAttribute('data-side') === side;
        c.classList.toggle('active', pin && on);
        c.classList.toggle('hl', !pin && on);
        c.classList.toggle('dim', pin && !on);
      });
    }

    function clearScaleHover() {
      scaleSides.forEach(function (c) { c.classList.remove('hl'); });
    }

    scaleSvg.addEventListener('mouseenter', function () { setScale('valor', false); });
    scaleSvg.addEventListener('mouseleave', clearScaleHover);

    scaleSides.forEach(function (c) {
      var side = c.getAttribute('data-side');
      c.addEventListener('mouseenter', function () { setScale(side, false); });
      c.addEventListener('mouseleave', clearScaleHover);
      c.addEventListener('focus', function () { setScale(side, false); });
      c.addEventListener('blur', clearScaleHover);
      c.addEventListener('click', function () {
        if (pinnedSide === side) {
          pinnedSide = null;
          scaleBeam.classList.remove('tip-docs', 'tip-valor');
          scaleSides.forEach(function (x) { x.classList.remove('active', 'dim'); });
        } else {
          pinnedSide = side;
          setScale(side, true);
        }
      });
    });

    /* ---------- Slide 8: bucle Construir → Medir → Aprender ---------- */

    var loopNodes = Array.prototype.slice.call(document.querySelectorAll('.loop-node'));
    var loopDetail = document.getElementById('loopDetail');
    var loopInfo = {
      construir: 'Construir — crea la versión más simple y ponla en manos del usuario lo antes posible.',
      medir: 'Medir — recoge datos reales de uso y feedback para saber qué funciona y qué no.',
      aprender: 'Aprender — sintetiza lo aprendido y decide: pivotar, perseverar o iterar de nuevo.'
    };
    var loopIcons = { construir: 'i-tool', medir: 'i-chart', aprender: 'i-bulb' };
    var pinnedLoop = null;

    function swapDetail(el, html) {
      el.classList.remove('swap');
      void el.offsetWidth;
      el.innerHTML = html;
      el.classList.add('swap');
    }

    loopNodes.forEach(function (n) {
      var key = n.getAttribute('data-phase');
      n.addEventListener('mouseenter', function () {
        loopNodes.forEach(function (x) { x.classList.toggle('hl', x === n); });
      });
      n.addEventListener('mouseleave', function () {
        loopNodes.forEach(function (x) { x.classList.remove('hl'); });
      });
      n.addEventListener('focus', function () {
        loopNodes.forEach(function (x) { x.classList.toggle('hl', x === n); });
      });
      n.addEventListener('blur', function () {
        loopNodes.forEach(function (x) { x.classList.remove('hl'); });
      });
      n.addEventListener('click', function () {
        if (pinnedLoop === key) {
          pinnedLoop = null;
          loopNodes.forEach(function (x) { x.classList.remove('active', 'dim'); });
          swapDetail(loopDetail, 'Clic en una fase para ver su micro-explicación');
        } else {
          pinnedLoop = key;
          loopNodes.forEach(function (x) {
            x.classList.toggle('active', x === n);
            x.classList.toggle('dim', x !== n);
          });
          swapDetail(loopDetail, ic(loopIcons[key]) + ' ' + loopInfo[key]);
        }
      });
    });

    /* ---------- Slide 9: hipótesis con variables intercambiables ---------- */

    var varX = document.getElementById('varX');
    var varY = document.getElementById('varY');
    var hypoReadout = document.getElementById('hypoReadout');
    var optsX = ['un checkout en un solo paso', 'un buscador con autocompletado', 'un onboarding en 3 pasos'];
    var optsY = ['aumentar la conversión un 15%', 'reducir el abandono un 20%', 'duplicar los registros semanales'];
    var xIdx = 0, yIdx = 0;

    function updateHypo() {
      hypoReadout.classList.remove('swap');
      void hypoReadout.offsetWidth;
      hypoReadout.innerHTML = ic('i-flask') + ' Hipótesis simulada: «Creemos que ' + varX.textContent + ' logrará ' + varY.textContent + '»';
      hypoReadout.classList.add('swap');
    }

    varX.addEventListener('click', function () {
      xIdx = (xIdx + 1) % optsX.length;
      varX.textContent = optsX[xIdx];
      popit(varX);
      updateHypo();
    });
    varY.addEventListener('click', function () {
      yIdx = (yIdx + 1) % optsY.length;
      varY.textContent = optsY[yIdx];
      popit(varY);
      updateHypo();
    });

    /* ---------- Slide 10: MVP vs. incompleto ---------- */

    var mvpOpts = Array.prototype.slice.call(document.querySelectorAll('.mvp-opt'));
    var mvpStages = Array.prototype.slice.call(document.querySelectorAll('.mvp-stage'));
    mvpOpts.forEach(function (o) {
      o.addEventListener('click', function () {
        var view = o.getAttribute('data-view');
        mvpOpts.forEach(function (x) { x.classList.toggle('active', x === o); });
        mvpStages.forEach(function (s) { s.classList.toggle('show', s.getAttribute('data-view') === view); });
      });
    });

    /* ---------- Slide 11: engranajes síncronos + simulación de Sprint ---------- */

    var gearA = document.getElementById('gearA');
    var gearB = document.getElementById('gearB');
    var sprintCells = Array.prototype.slice.call(document.querySelectorAll('.sprint-cell'));
    var sprintReadout = document.getElementById('sprintReadout');
    var sprintNext = document.getElementById('sprintNext');
    var sprintIdx = 0;

    function pulseGears() {
      gearA.classList.remove('pulse'); void gearA.offsetWidth; gearA.classList.add('pulse');
      gearB.classList.remove('pulse'); void gearB.offsetWidth; gearB.classList.add('pulse');
    }

    function setSprint(i) {
      sprintIdx = i;
      sprintCells.forEach(function (c, idx) { c.classList.toggle('active', idx === i); });
      swapDetail(sprintReadout, 'Sprint ' + (i + 1) + ' activo · diseñar hoy, validar mañana ' + ic('i-refresh'));
      pulseGears();
    }

    sprintCells.forEach(function (c, i) {
      c.addEventListener('click', function () { setSprint(i); });
    });
    sprintNext.addEventListener('click', function () {
      setSprint((sprintIdx + 1) % sprintCells.length);
    });

    /* ---------- Slide 12: Design Sprint y Pruebas de Usabilidad ---------- */

    var dayNodes = Array.prototype.slice.call(document.querySelectorAll('.day'));
    var pinnedDay = null;

    dayNodes.forEach(function (d) {
      var key = d.getAttribute('data-day');
      d.addEventListener('mouseenter', function () {
        dayNodes.forEach(function (x) { x.classList.toggle('hl', x === d); });
      });
      d.addEventListener('mouseleave', function () {
        dayNodes.forEach(function (x) { x.classList.remove('hl'); });
      });
      d.addEventListener('focus', function () {
        dayNodes.forEach(function (x) { x.classList.toggle('hl', x === d); });
      });
      d.addEventListener('blur', function () {
        dayNodes.forEach(function (x) { x.classList.remove('hl'); });
      });
      d.addEventListener('click', function () {
        if (pinnedDay === key) {
          pinnedDay = null;
          dayNodes.forEach(function (x) { x.classList.remove('active'); });
        } else {
          pinnedDay = key;
          dayNodes.forEach(function (x) { x.classList.toggle('active', x === d); });
        }
      });
    });

    var protoOpts = Array.prototype.slice.call(document.querySelectorAll('.proto-opt'));
    var protoViews = Array.prototype.slice.call(document.querySelectorAll('.proto-view'));
    var protoCaption = document.getElementById('protoCaption');
    var protoInfo = {
      baja: 'Papel, lápiz y Balsamiq — valida flujos e ideas rápido, sin gastar recursos.',
      alta: 'Figma y Prototipie — testea la interacción visual real, microcopia y usabilidad.'
    };

    protoOpts.forEach(function (o) {
      o.addEventListener('click', function () {
        var mode = o.getAttribute('data-mode');
        protoOpts.forEach(function (x) { x.classList.toggle('active', x === o); });
        protoViews.forEach(function (v) { v.classList.toggle('show', v.getAttribute('data-mode') === mode); });
        swapDetail(protoCaption, protoInfo[mode]);
      });
    });

    var vChips = Array.prototype.slice.call(document.querySelectorAll('.v-chip'));
    vChips.forEach(function (c) {
      c.addEventListener('click', function () {
        c.classList.toggle('active');
      });
    });

    /* ---------- Slide 14: Design System (estados del botón) ---------- */

    var dsStates = Array.prototype.slice.call(document.querySelectorAll('.ds-state'));
    var dsBtn = document.getElementById('dsBtn');
    dsStates.forEach(function (s) {
      s.addEventListener('click', function () {
        var state = s.getAttribute('data-state');
        dsStates.forEach(function (x) { x.classList.toggle('active', x === s); });
        dsBtn.classList.remove('state-hover', 'state-active', 'state-disabled');
        if (state !== 'normal') dsBtn.classList.add('state-' + state);
      });
    });

    /* ---------- Slide 15: Marco HEART (dashboard en vivo) ---------- */

    var heartLetters = Array.prototype.slice.call(document.querySelectorAll('.heart-letter'));
    var heartChart = document.getElementById('heartChart');
    var heartTitle = document.getElementById('heartTitle');
    var heartDesc = document.getElementById('heartDesc');
    var heartKpis = document.getElementById('heartKpis');
    var heartData = {
      h: { title: 'H · Happiness', desc: 'Satisfacción y percepción del usuario (CSAT, SUS).', bars: [62, 68, 71, 75, 80, 84, 88], kpis: ['SUS 82/100', 'CSAT 88%'] },
      e: { title: 'E · Engagement', desc: 'Frecuencia e intensidad de uso de la función.', bars: [30, 42, 55, 68, 80, 95], kpis: ['4.2 sesiones/semana', '+212% actividad'] },
      a: { title: 'A · Adoption', desc: 'Nuevos usuarios que prueban la función.', bars: [18, 26, 38, 52, 66, 78], kpis: ['78% activaron la función'] },
      r: { title: 'R · Retention', desc: 'Usuarios activos que regresan con el tiempo.', bars: [91, 87, 82, 79, 76, 74], kpis: ['74% regresan al mes'] },
      t: { title: 'T · Task Success', desc: 'Eficiencia y baja tasa de errores.', bars: [70, 78, 84, 88, 91, 93], kpis: ['93% éxito de tarea', 'Errores −41%'] }
    };

    function renderHeart(metric) {
      var d = heartData[metric];
      if (!d) return;
      heartTitle.textContent = d.title;
      heartDesc.textContent = d.desc;
      heartChart.innerHTML = '';
      d.bars.forEach(function (h, i) {
        var b = document.createElement('div');
        b.className = 'bar';
        b.style.height = h + '%';
        b.style.animationDelay = (i * 70) + 'ms';
        heartChart.appendChild(b);
      });
      heartKpis.innerHTML = '';
      d.kpis.forEach(function (k) {
        var s = document.createElement('span');
        s.className = 'heart-kpi';
        s.textContent = k;
        heartKpis.appendChild(s);
      });
    }

    heartLetters.forEach(function (l) {
      l.addEventListener('click', function () {
        var metric = l.getAttribute('data-metric');
        heartLetters.forEach(function (x) { x.classList.toggle('active', x === l); });
        renderHeart(metric);
      });
    });
    renderHeart('h');

    /* ---------- Estado inicial ---------- */

    render(0);
  })();
  