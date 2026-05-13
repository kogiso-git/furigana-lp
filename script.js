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
  /* フェードイン対象のセレクター一覧 */
  var selectors = [
    '.section-heading',
    '.section-label',
    '.pain-list',
    '.pain-resolve',
    '.proof-strip',
    '.what-intro',
    '.what-flow',
    '.what-goal',
    '.service-card',
    '.outcome-list',
    '.outcome-note',
    '.step',
    '.case-item',
    '.pricing-row',
    '.pricing-lead',
    '.profile-inner',
    '.section-sns',
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

  /* IntersectionObserver が使えない場合はすべて表示 */
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

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
      rootMargin: '0px 0px -56px 0px',
      threshold: 0.08,
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

      var headerH  = header ? header.offsetHeight : 60;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerH;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();
