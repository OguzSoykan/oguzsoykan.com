(function () {
  'use strict';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme:dark)');
  const themeBtn = document.querySelector('.theme-toggle');
  const langBtns = document.querySelectorAll('[data-language]');
  const status = document.getElementById('copy-status');
  let statusKind = '',
    statusTimer;
  function read(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function write(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function text(tr, en) {
    return root.dataset.lang === 'tr' ? tr : en;
  }
  function updateStatus() {
    status.textContent =
      statusKind === 'success'
        ? text('Adres kopyalandı.', 'Email copied.')
        : statusKind === 'fallback'
          ? text(
              'Adres seçildi. Ctrl/Cmd+C ile kopyalayabilirsin.',
              'Email selected. Press Ctrl/Cmd+C to copy.',
            )
          : '';
  }
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute(
      'aria-label',
      dark
        ? text('Açık temaya geç', 'Switch to light theme')
        : text('Koyu temaya geç', 'Switch to dark theme'),
    );
    document.querySelector('meta[name="theme-color"]').content = dark ? '#101310' : '#f3f3ef';
  }
  function updateDuration() {
    const now = new Date();
    let months = (now.getFullYear() - 2024) * 12 + now.getMonth() - 4;
    months = Math.max(0, months);
    const years = Math.floor(months / 12),
      rest = months % 12;
    let parts = [];
    if (years) parts.push(text(years + ' yıl', years + ' ' + (years === 1 ? 'year' : 'years')));
    if (rest) parts.push(text(rest + ' ay', rest + ' ' + (rest === 1 ? 'month' : 'months')));
    document.getElementById('work-duration').textContent =
      parts.join(' ') || text('0 ay', '0 months');
  }
  function setLanguage(lang, persist) {
    root.dataset.lang = lang;
    root.lang = lang;
    langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.language === lang)));
    if (persist) write('oguz-language', lang);
    syncTheme();
    updateDuration();
    updateStatus();
  }
  langBtns.forEach((b) => b.addEventListener('click', () => setLanguage(b.dataset.language, true)));
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    write('oguz-theme', root.dataset.theme);
    syncTheme();
  });
  const onSystemTheme = () => {
    if (!['light', 'dark'].includes(read('oguz-theme'))) {
      root.dataset.theme = mq.matches ? 'dark' : 'light';
      syncTheme();
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemTheme);
  else if (mq.addListener) mq.addListener(onSystemTheme);
  function makeTimeline() {
    const now = new Date();
    const firstYear = 2016;
    const start = new Date(firstYear, 0, 1),
      end = new Date(now.getFullYear() + 1, 0, 1);
    const range = end - start;
    const pct = (d) => Math.max(0, Math.min(100, ((d - start) / range) * 100));
    const hsStart = new Date(2016, 0, 1),
      hsEnd = new Date(2021, 0, 1),
      eduStart = new Date(2022, 8, 1),
      eduEnd = new Date(2026, 5, 30),
      workStart = new Date(2024, 4, 1);
    const t = document.querySelector('.timeline');
    t.style.setProperty('--hs-left', pct(hsStart) + '%');
    t.style.setProperty('--hs-width', pct(hsEnd) - pct(hsStart) + '%');
    t.style.setProperty('--edu-left', pct(eduStart) + '%');
    t.style.setProperty('--edu-width', pct(eduEnd) - pct(eduStart) + '%');
    t.style.setProperty('--work-left', pct(workStart) + '%');
    t.style.setProperty('--work-width', pct(now) - pct(workStart) + '%');
    t.style.setProperty('--today', pct(now) + '%');
    const axis = document.querySelector('.timeline-axis'),
      grid = document.querySelector('.timeline-grid');
    axis.replaceChildren();
    grid.replaceChildren();
    for (let y = firstYear; y <= end.getFullYear(); y++) {
      const label = document.createElement('span');
      label.textContent = String(y);
      label.style.left = pct(new Date(y, 0, 1)) + '%';
      if ((y - firstYear) % 2 && y !== end.getFullYear()) label.classList.add('year-minor');
      axis.appendChild(label);
      const tick = document.createElement('i');
      tick.style.left = label.style.left;
      grid.appendChild(tick);
    }
    document.getElementById('year').textContent = now.getFullYear();
  }
  document.getElementById('copy-email').addEventListener('click', async () => {
    clearTimeout(statusTimer);
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText('oguz.soykan03@gmail.com');
        copied = true;
      }
    } catch (e) {}
    if (!copied) {
      const address = document.getElementById('email-address');
      const range = document.createRange();
      range.selectNodeContents(address);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        copied = document.execCommand('copy');
      } catch (e) {}
      if (copied) selection.removeAllRanges();
    }
    statusKind = copied ? 'success' : 'fallback';
    updateStatus();
    statusTimer = setTimeout(() => {
      statusKind = '';
      updateStatus();
    }, 6000);
  });
  const sections = ['projects', 'experience', 'about', 'contact'].map((id) =>
    document.getElementById(id),
  );
  let ticking = false;
  function activeNav() {
    const threshold = window.innerHeight * 0.3;
    let active = '';
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= threshold) active = s.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5)
      active = 'contact';
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === active;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    ticking = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(activeNav);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', activeNav);
  setLanguage(root.dataset.lang, false);
  makeTimeline();
  activeNav();
  setInterval(() => {
    updateDuration();
    makeTimeline();
  }, 3600000);
})();

(function () {
  'use strict';
  const root = document.documentElement,
    reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const sceneTracks = Array.from(document.querySelectorAll('[data-scene]'));
  let pending = false;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  function update() {
    const height = window.innerHeight,
      mobile = window.innerWidth <= 760;
    const total = document.documentElement.scrollHeight - height;
    root.style.setProperty(
      '--page-progress',
      String(total > 0 ? clamp(window.scrollY / total) : 0),
    );
    sceneTracks.forEach((track) => {
      const sticky = track.querySelector('.scene-sticky');
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height * 1.2) return;
      const span = track.offsetHeight - sticky.offsetHeight;
      const p = reduce.matches
        ? 1
        : mobile
          ? clamp((height * 0.65 - rect.top) / Math.max(1, rect.height))
          : clamp((88 - rect.top) / Math.max(1, span));
      sticky.style.setProperty('--phase', p.toFixed(4));
      const step = Math.min(2, Math.floor(p * 3));
      track
        .querySelectorAll('[data-step]')
        .forEach((el, i) => el.classList.toggle('is-current', i === step));
      track.querySelector('.phase-number').textContent = String(step + 1).padStart(2, '0');
    });
    pending = false;
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if (reduce.addEventListener)
    reduce.addEventListener('change', () => {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
      root.classList.toggle('motion-ready', !reduce.matches);
      schedule();
    });
  if ('IntersectionObserver' in window && !reduce.matches) {
    root.classList.add('motion-ready');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -35px 0px' },
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }
  window.addEventListener('beforeprint', () => root.classList.remove('motion-ready'));
  update();
})();
