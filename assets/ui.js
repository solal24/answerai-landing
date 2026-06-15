/* ============================================================
   AnswerAI — shared UI helpers (stars, scroll reveal)
   ============================================================ */
(function () {
  // ---- Stars: <span class="stars" data-stars="4"></span> (supports .5) ----
  function star(state) {
    // state: 'on' | 'off' | 'half'
    if (state === 'half') {
      return '<svg viewBox="0 0 24 24"><defs><linearGradient id="hg"><stop offset="50%" stop-color="var(--amber)"/><stop offset="50%" stop-color="#DfE2E8"/></linearGradient></defs><path fill="url(#hg)" d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 9.5l6.9-.6L12 2z"/></svg>';
    }
    const cls = state === 'on' ? 'on' : 'off';
    return '<svg viewBox="0 0 24 24"><path class="' + cls + '" d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 9.5l6.9-.6L12 2z"/></svg>';
  }
  function renderStars(el) {
    const val = parseFloat(el.getAttribute('data-stars')) || 0;
    let html = '';
    for (let n = 1; n <= 5; n++) {
      if (val >= n) html += star('on');
      else if (val >= n - 0.5) html += star('half');
      else html += star('off');
    }
    el.innerHTML = html;
  }
  function initStars(root) {
    (root || document).querySelectorAll('.stars[data-stars]').forEach(renderStars);
  }

  // ---- Scroll reveal ----
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach(e => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, idx) => {
        if (e.isIntersecting) {
          const sibs = [...e.target.parentElement.querySelectorAll(':scope > .reveal')];
          const order = sibs.indexOf(e.target);
          e.target.style.transitionDelay = (order > 0 ? Math.min(order, 4) * 70 : 0) + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));
  }

  window.AnswerUI = { initStars, renderStars };
  document.addEventListener('DOMContentLoaded', function () {
    initStars();
    initReveal();
  });
})();
