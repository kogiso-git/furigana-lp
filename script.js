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

  /* ---------- helpers ---------- */
  function fmt(n) { return n.toLocaleString('ja-JP'); }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  /* ============================================================
     INTRO
     ============================================================ */
  function runIntro() {
    var intro = $('#intro');
    if (!intro) { litHeroRuby(); return; }

    if (reduce) {
      intro.parentNode.removeChild(intro);
      litHeroRuby();
      return;
    }

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

  /* ---------- recalc (quiet, no count-up) ---------- */
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
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  function reveal() {
    var els = document.querySelectorAll('[data-reveal]');

    // Transition-free force-show. A running CSS transition can stay frozen at
    // opacity:0 if the document animation timeline is throttled, so the
    // guaranteed-visible path never relies on a transition.
    function forceShow(e) {
      e.style.transition = 'none';
      e.style.opacity = '1';
      e.style.transform = 'none';
    }

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(forceShow);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('shown');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.94 && r.bottom > 0) e.classList.add('shown');
      else io.observe(e);
    });

    // Safety net: if an in-view element that was told to show is still invisible,
    // the animation timeline is throttled — force every element visible WITHOUT a
    // transition so content can never stay blank. Below-fold elements that reveal
    // normally are left to the observer.
    setTimeout(function () {
      var stuck = false;
      els.forEach(function (e) {
        var r = e.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var inView = r.top < vh && r.bottom > 0;
        if (inView && e.classList.contains('shown') &&
            parseFloat(window.getComputedStyle(e).opacity) < 0.99) {
          stuck = true;
        }
      });
      if (stuck) els.forEach(forceShow);
    }, 1600);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildCheck();
    bindRate();
    recalc();
    reveal();
    runIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
