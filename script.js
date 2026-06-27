/* ============================================================
   FURIGANA. — landing page behaviour
   - intro: furigana settles, then a soft white-out into the page
   - self-diagnosis check list + quiet time / value calculation
   - scroll reveal
   - respects prefers-reduced-motion
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WEEKS = 48; // 年間換算の稼働週数

  /* ---- diagnosis data (on-hours sum to 11 → 528h/yr) ---- */
  var items = [
    { id: 'a', label: '「これ、どうしますか」の確認に応じている', hours: 5, on: true },
    { id: 'b', label: '自分のやり方を、その都度説明している', hours: 3, on: true },
    { id: 'c', label: '想定外・例外の判断を、自分が引き受けている', hours: 3, on: true },
    { id: 'd', label: '数字や在庫、現場の状況を確認している', hours: 3, on: false },
    { id: 'e', label: '採用や教育の場面で、自分が前に出ている', hours: 3, on: false },
    { id: 'f', label: '現場のトラブルの一次対応をしている', hours: 3, on: false }
  ];

  var rate = 10000; // 社長時間の仮単価（円/時間）

  /* ---------- persistence (restore the owner's own answers) ---------- */
  var STORE_KEY = 'furigana_check_v1';
  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved.rate === 'number') rate = saved.rate;
      if (saved && saved.items) {
        items.forEach(function (it) {
          var s = saved.items[it.id];
          if (!s) return;
          if (typeof s.on === 'boolean') it.on = s.on;
          if (typeof s.hours === 'number') it.hours = Math.max(0, Math.min(20, s.hours));
        });
      }
    } catch (e) { /* ignore */ }
  }
  function saveState() {
    try {
      var obj = { rate: rate, items: {} };
      items.forEach(function (it) { obj.items[it.id] = { on: it.on, hours: it.hours }; });
      window.localStorage.setItem(STORE_KEY, JSON.stringify(obj));
    } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function fmt(n) { return n.toLocaleString('ja-JP'); }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  /* ============================================================
     INTRO
     ============================================================ */
  function runIntro() {
    var intro = $('#intro');
    if (!intro) { litHeroRuby(); return; }

    var seen = false;
    try { seen = window.sessionStorage.getItem('furigana_seen') === '1'; } catch (e) {}

    if (reduce || seen) {
      // repeat visit (this session) or reduced motion: go straight to the page
      intro.parentNode.removeChild(intro);
      litHeroRuby();
      return;
    }
    try { window.sessionStorage.setItem('furigana_seen', '1'); } catch (e) {}

    // Frame 1: mark + furigana settle in
    requestAnimationFrame(function () {
      intro.classList.add('play');
    });

    // Frame 2: soft white-out
    setTimeout(function () { intro.classList.add('whiteout'); }, 1250);

    // Frame 3: fade the whole overlay away, revealing the page
    setTimeout(function () {
      intro.classList.add('done');
      litHeroRuby();
    }, 1750);

    // Frame 4: remove from DOM
    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 2350);
  }

  function litHeroRuby() {
    var hero = $('#heroRuby');
    if (!hero) return;
    if (reduce) { hero.classList.add('lit'); return; }
    setTimeout(function () { hero.classList.add('lit'); }, 200);
  }

  /* ============================================================
     CHECK LIST
     ============================================================ */
  function buildCheck() {
    var list = $('#checkList');
    if (!list) return;

    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'check-row';
      row.setAttribute('data-on', String(it.on));

      var box = document.createElement('button');
      box.type = 'button';
      box.className = 'check-box';
      box.setAttribute('aria-pressed', String(it.on));
      box.setAttribute('aria-label', it.label + ' を選ぶ');
      box.innerHTML = '<span></span>';
      box.addEventListener('click', function () {
        it.on = !it.on;
        box.setAttribute('aria-pressed', String(it.on));
        row.setAttribute('data-on', String(it.on));
        recalc();
      });

      var label = document.createElement('span');
      label.className = 'check-label';
      label.textContent = it.label;

      var stepper = document.createElement('div');
      stepper.className = 'stepper';

      var dec = document.createElement('button');
      dec.type = 'button';
      dec.className = 'step-btn';
      dec.setAttribute('aria-label', it.label + ' の時間を減らす');
      dec.textContent = '\u2212';

      var val = document.createElement('span');
      val.className = 'step-val';
      val.innerHTML = '<b>' + it.hours + '</b><em> h/週</em>';

      var inc = document.createElement('button');
      inc.type = 'button';
      inc.className = 'step-btn';
      inc.setAttribute('aria-label', it.label + ' の時間を増やす');
      inc.textContent = '\uFF0B';

      dec.addEventListener('click', function () {
        it.hours = Math.max(0, it.hours - 1);
        val.querySelector('b').textContent = it.hours;
        recalc();
      });
      inc.addEventListener('click', function () {
        it.hours = Math.min(20, it.hours + 1);
        val.querySelector('b').textContent = it.hours;
        recalc();
      });

      stepper.appendChild(dec);
      stepper.appendChild(val);
      stepper.appendChild(inc);

      row.appendChild(box);
      row.appendChild(label);
      row.appendChild(stepper);
      list.appendChild(row);
    });
  }

  /* ---------- rate input ---------- */
  function bindRate() {
    var input = $('#rateInput');
    if (!input) return;

    input.value = fmt(rate); // reflect restored value

    function read() {
      var v = parseInt(String(input.value).replace(/[^0-9]/g, ''), 10);
      rate = isNaN(v) ? 0 : Math.min(v, 1000000);
      recalc();
    }
    input.addEventListener('input', read);
    input.addEventListener('blur', function () {
      input.value = fmt(rate);
    });
  }

  /* ---------- recalc (quiet, no count-up; gentle settle on change) ---------- */
  var firstCalc = true;
  function recalc() {
    var weekly = 0, onCount = 0;
    items.forEach(function (it) {
      if (it.on) { weekly += it.hours; onCount += 1; }
    });
    var annual = weekly * WEEKS;
    var days = Math.round(annual / 8);
    var value = annual * rate;

    setText('weekly', weekly);
    setText('annual', fmt(annual));
    setText('days', fmt(days));
    setText('timeValue', fmt(value));

    var reflection;
    if (weekly === 0) reflection = '当てはまるものを、選んでみてください。';
    else if (onCount <= 2) reflection = 'いくつかは、言葉や仕組みに渡せるかもしれません。';
    else if (onCount <= 4) reflection = '多くの時間が、確認と判断に向いています。';
    else reflection = '一日の多くが、社長にしか進められない仕事で埋まっています。';
    setText('reflection', reflection);

    // A quiet settle — the value and the closing line dim, then return — so the
    // number that matters draws the eye for a moment. No count-up, no bounce.
    if (!firstCalc && !reduce) {
      settle(document.getElementById('timeValue'));
      settle(document.getElementById('reflection'));
    }
    firstCalc = false;
    saveState();
  }

  function settle(el) {
    if (!el) return;
    el.classList.add('dim');
    // force a reflow so the transition runs from the dimmed state
    void el.offsetWidth;
    requestAnimationFrame(function () { el.classList.remove('dim'); });
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  /* ============================================================
     SCROLL REVEAL — staggered, section by section
       • Each section's pieces are revealed as you reach them.
       • Inside a section head, the number → rule → label cascade.
       • Card / row / number groups appear one after another.
       • Fires once per element; reduced-motion shows everything at once.
       • Tunables: STEP (per-sibling gap) + CSS :root --rev-* vars.
     ============================================================ */
  var REVEAL_STEP = 80;   // ms between staggered siblings (within a group)
  var REVEAL_BASE = 60;   // ms gentle cascade between sibling blocks
  var REVEAL_BASE_CAP = 3;
  var REVEAL_GROUPS = '.timeline,.grid-cards,.effect-grid,.cases-scroll,.forward-grid,.offer';

  function reveal() {
    var observed = [];

    function markItem(el, delayMs) {
      el.classList.add('ri');
      el.style.setProperty('--d', delayMs + 'ms');
      if (el.matches('.tick, .band-rule')) el.classList.add('ri-rule');
    }
    // A group host is itself observed; its children are the staggered items.
    function markGroup(host, base) {
      var kids = host.children;
      for (var i = 0; i < kids.length; i++) markItem(kids[i], base + i * REVEAL_STEP);
      host.classList.add('ri-host');
      observed.push(host);
    }
    function markSolo(el, base) {
      markItem(el, base);
      observed.push(el);
    }

    document.querySelectorAll('[data-reveal]').forEach(function (root) {
      var content = root.querySelector(':scope > .wrap') || root;
      // band / offer: the reveal root itself is the group
      if (content.matches('.center') || content.matches(REVEAL_GROUPS)) {
        markGroup(content, 0);
        return;
      }
      var blocks = content.children, idx = 0;
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var base = Math.min(idx, REVEAL_BASE_CAP) * REVEAL_BASE;
        if (block.matches('.sec-head') || block.matches(REVEAL_GROUPS)) markGroup(block, base);
        else markSolo(block, base);
        idx++;
      }
    });

    function show(el) {
      el.classList.add('in');
      if (el.classList.contains('ri-host')) {
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) kids[i].classList.add('in');
      }
    }
    // Transition-free force-show — guards against a throttled animation timeline
    // freezing a transition at opacity:0. Never leaves content blank.
    function forceShow(el) {
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('in');
      if (el.classList.contains('ri-host')) {
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
          kids[i].style.transition = 'none';
          kids[i].style.opacity = '1';
          kids[i].style.transform = 'none';
          kids[i].classList.add('in');
        }
      }
    }

    if (reduce || !('IntersectionObserver' in window)) {
      observed.forEach(forceShow);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    function inView(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (vh <= 0) return false;
      return r.top < vh * 0.95 && r.bottom > 0;
    }

    // Reveal every block currently in view; observe the rest for scroll reveal.
    // Re-runnable: safe to call repeatedly (already-shown blocks are skipped).
    function revealInView() {
      observed.forEach(function (el) {
        if (el.classList.contains('in')) return;
        if (inView(el)) { show(el); io.unobserve(el); }
      });
    }

    observed.forEach(function (el) { io.observe(el); });
    revealInView();                                   // first pass (may see stale vh)
    requestAnimationFrame(revealInView);              // again after layout settles
    window.addEventListener('load', revealInView);    // again once fully loaded

    // Self-healing rescue: force-show any in-view block that is still invisible —
    // whether it was never shown (IO never fired) or its transition froze on a
    // throttled timeline. Below-fold blocks keep their scroll choreography.
    function rescueVisible() {
      observed.forEach(function (el) {
        if (!inView(el)) return;
        var probe = el.classList.contains('ri-host') ? (el.children[0] || el) : el;
        if (parseFloat(window.getComputedStyle(probe).opacity) < 0.99) {
          forceShow(el);
          io.unobserve(el);
        }
      });
    }
    setTimeout(rescueVisible, 1200);
    setTimeout(rescueVisible, 2400);

    var rescueTicking = false;
    function onScrollRescue() {
      revealInView();
      if (rescueTicking) return;
      rescueTicking = true;
      setTimeout(function () { rescueTicking = false; rescueVisible(); }, 400);
    }
    window.addEventListener('scroll', onScrollRescue, { passive: true });
    window.addEventListener('resize', revealInView, { passive: true });

    // Last-resort guarantee: the page can never stay blank. If nothing at all has
    // revealed a few seconds in, show everything outright.
    setTimeout(function () {
      if (document.querySelectorAll('.ri.in').length === 0) observed.forEach(forceShow);
    }, 2800);
  }

  /* ============================================================
     DEMO VIDEO — lazy: nothing loads until the user clicks the thumb.
     Set data-video="…mp4" on #demoFeature when a file is ready.
     ============================================================ */
  function bindDemo() {
    var btn = document.getElementById('demoFeature');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var src = btn.getAttribute('data-video');
      if (!src) return; // placeholder only — no source yet
      var v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('preload', 'metadata');
      v.className = 'demo-video';
      btn.replaceWith(v);
      v.play && v.play().catch(function () {});
    });
  }

  /* ============================================================
     READING PROGRESS RAIL + QUIET MOBILE CTA
       • A 2px copper rail on the right fills with scroll depth.
       • The mobile CTA slips up once the reader reaches the Person
         section, and tucks away again over the footer. Shown once
         it is relevant — never on first view, never salesy.
     ============================================================ */
  function bindScrollChrome() {
    var fill = document.getElementById('progressFill');
    var cta = document.getElementById('stickyCta');
    var ctaMain = document.getElementById('ctaMain');
    var ctaLink = cta && cta.querySelector('.sticky-cta-link');
    var person = document.querySelector('.person');
    var footer = document.querySelector('.site-footer');

    // keep the conversion URL in ONE place: mirror the main CTA's href
    if (ctaMain && ctaLink) ctaLink.setAttribute('href', ctaMain.getAttribute('href'));

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var vh = window.innerHeight || doc.clientHeight;
      var max = (document.body.scrollHeight || doc.scrollHeight) - vh;
      var y = window.pageYOffset || doc.scrollTop || 0;
      if (fill) fill.style.height = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';

      if (cta) {
        var start = person ? person.getBoundingClientRect().top + y - vh * 0.6 : Infinity;
        var end = footer ? footer.getBoundingClientRect().top + y - vh * 0.9 : Infinity;
        var show = y > start && y < end;
        cta.classList.toggle('show', show);
        if (ctaLink) ctaLink.setAttribute('tabindex', show ? '0' : '-1');
        cta.setAttribute('aria-hidden', show ? 'false' : 'true');
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    loadState();
    buildCheck();
    bindRate();
    recalc();
    bindDemo();
    bindScrollChrome();
    reveal();
    runIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
