/* ============================================================
   FURIGANA. Landing Page — script.js

   目次
   ────────────────────────────────────────
   01. FAQ アコーディオン
   02. スクロール フェードイン
   03. ヘッダー スクロール影
   04. アンカーリンク スムーズスクロール補正
   ────────────────────────────────────────
   ============================================================ */


/* ============================================================
   01. FAQ アコーディオン
   ============================================================ */
(function () {
  var questions = document.querySelectorAll('.faq-question');

  questions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen   = this.getAttribute('aria-expanded') === 'true';
      var answerId = this.getAttribute('aria-controls');
      var answer   = document.getElementById(answerId);

      /* 他のFAQをすべて閉じる */
      questions.forEach(function (otherBtn) {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          var otherId  = otherBtn.getAttribute('aria-controls');
          var otherAns = document.getElementById(otherId);
          if (otherAns) { otherAns.hidden = true; }
        }
      });

      /* クリックした項目を開閉 */
      this.setAttribute('aria-expanded', String(!isOpen));
      if (answer) { answer.hidden = isOpen; }
    });
  });
})();


/* ============================================================
   02. スクロール フェードイン (IntersectionObserver)
   ============================================================ */
(function () {
  /* アクセシビリティ: 動き軽減設定がONの場合はスキップ */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* フェードイン対象のセレクター一覧 */
  var selectors = [
    '.section-heading',
    '.section-label',
    '.pain-list',
    '.pain-resolve',
    '.what-intro',
    '.what-flow',
    '.what-goal',
    '.service-card',
    '.service-result',
    '.outcome-list',
    '.outcome-note',
    '.steps-lead',
    '.how-block-meta',
    '.how-steps',
    '.case-item',
    '.flow-lead',
    '.flow-step',
    '.set-lead',
    '.set-values',
    '.deliverables-lead',
    '.deliverables-col',
    '.deliverables-closing',
    '.guide-item',
    '.pricing-lead',
    '.pricing-row',
    '.monitor-lead',
    '.monitor-slots',
    '.monitor-conditions',
    '.cta-accent',
    '.profile-inner',
    '.faq-item',
    '.final-cta-heading',
    '.final-cta-body',
  ].join(', ');

  var targets = document.querySelectorAll(selectors);

  /* Hero内の要素は対象外 (最初から表示) */
  targets = Array.prototype.filter.call(targets, function (el) {
    return !el.closest('.hero');
  });

  targets.forEach(function (el) {
    el.classList.add('fade-in');
  });

  /* 動き軽減 or IntersectionObserver非対応の場合はすべて即時表示 */
  if (prefersReduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  /* グループ要素にスタッガー遅延を付与 */
  [
    { selector: '.service-cards .service-card',          delay: 0.12 },
    { selector: '.case-grid .case-item',                 delay: 0.10 },
    { selector: '.guide-grid .guide-item',               delay: 0.08 },
    { selector: '.deliverables-grid .deliverables-col',  delay: 0.10 },
    { selector: '.flow-steps .flow-step',                delay: 0.12 },
    { selector: '.pricing-table .pricing-row',           delay: 0.06 },
    { selector: '.faq-list .faq-item',                   delay: 0.05 },
  ].forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, i) {
      el.style.transitionDelay = (i * group.delay) + 's';
    });
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); /* 一度見えたら監視解除 */
        }
      });
    },
    {
      rootMargin: '0px 0px -48px 0px',
      threshold: 0.06,
    }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();


/* ============================================================
   03. ヘッダー スクロール影
   ============================================================ */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) { return; }

  function onScroll() {
    if (window.scrollY > 32) {
      header.style.boxShadow = '0 2px 24px rgba(0,0,0,0.08)';
    } else {
      header.style.boxShadow = 'none';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); /* 初期状態を反映 */
})();


/* ============================================================
   04. アンカーリンク スムーズスクロール補正
       (固定ヘッダーの高さ分をオフセット)
   ============================================================ */
(function () {
  var header = document.querySelector('.site-header');

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash   = this.getAttribute('href');
      if (!hash || hash === '#') { return; }

      var target = document.querySelector(hash);
      if (!target) { return; }

      e.preventDefault();

      /* スマホは固定ヘッダーなしなのでオフセット不要 */
      var headerFixed = header && window.getComputedStyle(header).position === 'fixed';
      var headerH  = headerFixed ? header.offsetHeight : 0;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerH;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   05. ハンバーガーメニュー トグル
   ============================================================ */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu   = document.querySelector('.mobile-menu');
  if (!toggle || !menu) { return; }

  function openMenu() {
    toggle.classList.add('is-open');
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var firstLink = menu.querySelector('a');
    if (firstLink) { firstLink.focus(); }
  }

  function closeMenu() {
    toggle.classList.remove('is-open');
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function () {
    if (toggle.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
  });

  /* メニュー内リンクをタップしたら閉じる */
  menu.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', function () { closeMenu(); });
  });

  /* Escキーで閉じる */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });

  /* PC幅にリサイズされたら閉じる */
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && toggle.classList.contains('is-open')) { closeMenu(); }
  }, { passive: true });
})();
