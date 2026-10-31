(function () {
  'use strict';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme:dark)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const themeBtn = document.querySelector('.theme-toggle');
  const langBtns = document.querySelectorAll('[data-language]');
  const status = document.getElementById('copy-status');
  const topbar = document.querySelector('.topbar');
  const WORK_START = new Date(2024, 4, 1);
  let statusKind = '';
  let statusTimer;

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, value);
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
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0c0e0c' : '#f6f6f2';
  }

  // Months since May 2024, shown as "1 yıl 6 ay" in the timeline and "1+" / "2+" in the stats.
  function updateDuration() {
    const now = new Date();
    const months = Math.max(
      0,
      (now.getFullYear() - WORK_START.getFullYear()) * 12 + now.getMonth() - WORK_START.getMonth(),
    );
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(text(years + ' yıl', years + ' ' + (years === 1 ? 'year' : 'years')));
    if (rest) parts.push(text(rest + ' ay', rest + ' ' + (rest === 1 ? 'month' : 'months')));
    document.getElementById('work-duration').textContent =
      parts.join(' ') || text('0 ay', '0 months');
    document.getElementById('work-duration-short').textContent = Math.max(1, years) + '+';
    document.getElementById('year').textContent = String(now.getFullYear());
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
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('email-address'));
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

  // Active section in the nav and a hairline under the header once the page scrolls.
  const sections = ['work', 'experience', 'about', 'contact'].map((id) =>
    document.getElementById(id),
  );
  let ticking = false;
  function onScroll() {
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
    topbar.classList.toggle('scrolled', window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', onScroll);

  // Gentle reveal; content stays visible without IntersectionObserver or with reduced motion.
  const revealables = document.querySelectorAll(
    '.section-head, .featured-inner, .project, .timeline li, .skill, .contact-inner',
  );
  revealables.forEach((el) => el.classList.add('reveal'));
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
    revealables.forEach((el) => observer.observe(el));
  }
  window.addEventListener('beforeprint', () => root.classList.remove('motion-ready'));

  setLanguage(root.dataset.lang, false);
  onScroll();
  setInterval(updateDuration, 3600000);
})();
