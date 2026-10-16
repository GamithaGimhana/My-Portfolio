(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  function closeMenu() {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  const mobileQuery = window.matchMedia('(max-width: 640px)');
  mobileQuery.addEventListener('change', () => closeMenu());

  const filterBar = document.querySelector('.filters');
  if (filterBar) {
    filterBar.hidden = false;
    const filters = [...filterBar.querySelectorAll('[data-filter]')];
    const cards = [...document.querySelectorAll('.project-card')];
    filters.forEach(button => button.addEventListener('click', () => {
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      let visible = 0;
      cards.forEach(card => {
        const matches = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
        card.hidden = !matches;
        if (matches) { card.classList.add('is-visible'); visible++; }
      });
      document.querySelector('.filter-result').textContent = `${visible} project${visible === 1 ? '' : 's'}`;
    }));
  }

  const profile = JSON.parse(document.querySelector('#profile-data').textContent);

  const form = document.querySelector('#contact-form');
  if (form) {
    form.hidden = false;
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const subject = `${fields.get('topic')} — ${String(fields.get('name')).trim()}`;
      const body = `Hi Gamitha,\n\n${String(fields.get('message')).trim()}\n\nBest,\n${String(fields.get('name')).trim()}\n${String(fields.get('email')).trim()}`;
      document.querySelector('#form-status').textContent = 'Your email app should open with a draft. Review it and press Send there. If it doesn’t open, email me directly using the address alongside this form.';
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
  const copyButton = document.querySelector('[data-copy-email]');
  if (copyButton) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(profile.email);
        copyButton.textContent = 'Copied';
        document.querySelector('#copy-status').textContent = 'Email address copied.';
        setTimeout(() => { copyButton.textContent = 'Copy'; }, 2200);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('#contact-address'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const status = document.querySelector('#copy-status');
        status.className = 'form-help';
        status.textContent = 'Email address selected. Use your device’s Copy command.';
      }
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const targets = [...document.querySelectorAll('.reveal')];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08, rootMargin: '0px 0px 35px 0px' });
    targets.forEach(target => {
      if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add('is-visible');
      else observer.observe(target);
    });
    document.documentElement.classList.add('motion-ready');
    reducedMotion.addEventListener('change', event => {
      if (event.matches) { targets.forEach(target => target.classList.add('is-visible')); observer.disconnect(); }
    });
  }
})();
