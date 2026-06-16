/* ============================================================
   AnswerAI — Dashboard shell (sidebar + topbar)
   Each page: <body data-page="dashboard" data-title="Vue d'ensemble"> ... </body>
   Renders into #shell-sidebar and #shell-topbar mount points or prepends.
   ============================================================ */
(function () {
  const NAV = [
    { id: "dashboard", label: "Vue d'ensemble", href: "Dashboard.html", icon: icoHome },
    { id: "avis",      label: "Avis récents",   href: "Avis.html",      icon: icoStar },
    { id: "gating",    label: "Review Gating",  href: "Gating.html",    icon: icoMega },
    { id: "rapports",  label: "Rapports",       href: "Rapports.html",  icon: icoChart },
    { id: "parametres",label: "Paramètres",     href: "Parametres.html",icon: icoGear },
  ];

  function icoHome(){return '<svg viewBox="0 0 24 24" fill="none"><path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
  function icoStar(){return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.7 5.8 6.3.6-4.8 4.2 1.5 6.2L12 16.9 6.3 19.8l1.5-6.2L3 9.4l6.3-.6L12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';}
  function icoMega(){return '<svg viewBox="0 0 24 24" fill="none"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
  function icoChart(){return '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4v16h16M8 15v2M12 11v6M16 7v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
  function icoGear(){return '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M19.4 13.5a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V21a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H8a1 1 0 0 0 .6-.9V3a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V8a1 1 0 0 0 .9.6H21a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';}

  function buildSidebar(active, estab) {
    const items = NAV.map(n => `
      <a class="sb-item ${n.id === active ? 'active' : ''}" href="${n.href}">
        ${n.icon()}<span class="label">${n.label}</span>
      </a>`).join('');
    const photo = estab.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&q=70&auto=format&fit=crop';
    return `
    <aside class="sidebar" id="sidebar">
      <div class="sb-brand">
        <span class="logo"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3z" fill="#fff"/></svg></span>
        <span class="label">AnswerAI</span>
        <button class="sb-toggle" id="sbToggle" title="Réduire">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <nav class="sb-nav">
        <div class="sb-section-lbl">Pilotage</div>
        ${items}
      </nav>
      <div class="sb-foot">
        <div class="sb-estab">
          <div class="ph" style="background-image:url('${photo}')"></div>
          <div class="meta">
            <div class="nm">${estab.name}</div>
            <div class="rt">
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#F59E0B" d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 9.5l6.9-.6L12 2z"/></svg>
              ${estab.rating}
            </div>
          </div>
        </div>
        <a class="sb-logout" href="/.netlify/functions/auth-logout">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="label">Déconnecter</span>
        </a>
      </div>
    </aside>`;
  }

  function buildTopbar(title, estab) {
    return `
    <header class="topbar">
      <button class="tb-icon" id="mobMenu" style="display:none" title="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <div class="tb-estab">
        <span class="tb-title nm">${estab.name}</span>
        <span class="tb-title">·</span>
        <span class="rt"><svg width="15" height="15" viewBox="0 0 24 24"><path fill="#F59E0B" d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 9.5l6.9-.6L12 2z"/></svg> ${estab.rating}</span>
      </div>
      <div class="tb-right">
        <div class="tb-avatar">${(estab.initial || 'A')}</div>
      </div>
    </header>`;
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const active = document.body.getAttribute('data-page');
    const title = document.body.getAttribute('data-title') || '';
    const app = document.querySelector('.app');
    const main = document.querySelector('.main');
    if (!app || !main) return;

    let estab = { name: 'Mon établissement', rating: '—' };
    try {
      const user = await window.AnswerAPI.get('me');
      if (!user.place_id) { window.location.href = '/Auth.html?step=2'; return; }
      estab = {
        name: user.establishment_name || 'Mon établissement',
        rating: user.rating ? user.rating + ' ★' : '—',
        initial: (user.name || 'A').charAt(0).toUpperCase(),
      };
      window.AnswerUser = user;
    } catch (e) {
      // AnswerAPI.get redirige déjà vers /Auth.html sur 401 ; ici on couvre les autres
      // erreurs (ex. panne base de données) qui sinon laissaient la page figée sans indice.
      console.error('shell.js: échec du chargement de /me', e);
      main.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; height:100%; padding:40px; text-align:center;">
          <p style="font-size:15px; color:var(--ink-2); font-weight:600;">Impossible de charger votre espace AnswerAI.</p>
          <p style="font-size:13.5px; color:var(--ink-4); max-width:420px;">${(e && e.message) || 'Une erreur est survenue.'}</p>
          <button class="btn btn-primary btn-sm" id="shellRetry">Réessayer</button>
        </div>`;
      const retryBtn = document.getElementById('shellRetry');
      if (retryBtn) retryBtn.addEventListener('click', () => window.location.reload());
      return;
    }

    app.insertAdjacentHTML('afterbegin', buildSidebar(active, estab));
    main.insertAdjacentHTML('afterbegin', buildTopbar(title, estab));

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sbToggle');
    if (localStorage.getItem('aa_sb_collapsed') === '1') sidebar.classList.add('collapsed');
    if (toggle) toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('aa_sb_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
    });
    const mob = document.getElementById('mobMenu');
    function syncMob(){ if (window.innerWidth <= 720) { mob.style.display='grid'; } else { mob.style.display='none'; sidebar.classList.remove('open'); } }
    if (mob) { mob.addEventListener('click', () => sidebar.classList.toggle('open')); window.addEventListener('resize', syncMob); syncMob(); }

    document.dispatchEvent(new CustomEvent('shell:ready', { detail: { estab } }));
  });
})();
