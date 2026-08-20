/* ============================================================
   FURIGANA. Corporate Site — main.js
   01. FAQアコーディオン 02. フェードイン 03. ヘッダー影
   04. スムーズスクロール補正 05. ハンバーガーメニュー
   ============================================================ */

(function () {
  var questions = document.querySelectorAll('.faq-question');
  questions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = this.getAttribute('aria-expanded') === 'true';
      var answer = document.getElementById(this.getAttribute('aria-controls'));
      this.setAttribute('aria-expanded', String(!isOpen));
      if (answer) { answer.classList.toggle('is-open', !isOpen); }
    });
  });
})();

(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll(
    '.section-heading, .section-label, .phenomena-list, .structure-note, .pillar, .works-grid .work-card, .service-card, .process-list li, .profile-grid, .faq-item, .statement-text, .contact-body'
  );
  targets = Array.prototype.filter.call(targets, function (el) { return !el.closest('.hero'); });
  targets.forEach(function (el) { el.classList.add('fade-in'); });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  [
    { selector: '.phenomena-list li', delay: 0.05 },
    { selector: '.works-grid .work-card', delay: 0.08 },
    { selector: '.service-grid .service-card', delay: 0.08 },
    { selector: '.process-list li', delay: 0.06 },
    { selector: '.faq-list .faq-item', delay: 0.04 }
  ].forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, i) {
      el.style.transitionDelay = (i * group.delay) + 's';
    });
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -48px 0px', threshold: 0.06 });

  targets.forEach(function (el) { observer.observe(el); });
})();

(function () {
  var header = document.querySelector('.site-header');
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash = this.getAttribute('href');
      if (!hash || hash === '#') { return; }
      var target = document.querySelector(hash);
      if (!target) { return; }
      e.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();

(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) { return; }

  function openMenu() {
    toggle.classList.add('is-open');
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
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
    toggle.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  menu.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
})();
