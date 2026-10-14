// Shared behavior for the main Vouch SoCal pages.
// Pieces: mobile menu, cookie notice, scroll reveal, strip pause, FAQ accordion, audit form, old #hash links.
// Nothing here is required to read the site: content is only hidden when the inline <head> script adds the "js" class.
(function () {
  'use strict';
  window.__vouchReady = true;

  // ----- old single-page links such as vouchsocal.com/#pricing now go to their own page
  if (location.pathname === '/' || location.pathname === '/index') {
    const legacy = { '#problem': '/services', '#how': '/how-it-works', '#pricing': '/pricing', '#faq': '/faq', '#audit': '/audit' };
    if (legacy[location.hash]) location.replace(legacy[location.hash]);
  }

  // ----- mobile menu
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-open').classList.toggle('hidden', open);
      toggle.querySelector('.menu-close').classList.toggle('hidden', !open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    // Switching to the desktop layout closes the panel.
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
  }

  // ----- cookie notice
  (function () {
    const banner = document.getElementById('cookie-banner');
    const accept = document.getElementById('cookie-accept');
    if (!banner || !accept) return;
    let stored = null;
    try { stored = localStorage.getItem('vouch_cookie_consent'); } catch (e) { /* storage blocked: show the notice */ }
    if (!stored) banner.classList.remove('hidden');
    accept.addEventListener('click', () => {
      try { localStorage.setItem('vouch_cookie_consent', 'acknowledged'); } catch (e) { /* ignore */ }
      banner.classList.add('hidden');
    });
  })();

  // ----- scroll reveal
  const targets = document.querySelectorAll('.reveal, .bar-fill');
  if (targets.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      targets.forEach((el) => io.observe(el));
    } else {
      targets.forEach((el) => el.classList.add('is-visible'));
    }
  }

  // ----- pause the scrolling strip while it is off screen
  const track = document.querySelector('.marquee-track');
  if (track && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => track.classList.toggle('paused', !e.isIntersecting)).observe(track);
  }

  // ----- FAQ accordion
  document.querySelectorAll('.faq-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panel = btn.nextElementSibling;
      document.querySelectorAll('.faq-toggle').forEach((other) => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = null;
        }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      panel.style.maxHeight = !expanded ? panel.scrollHeight + 'px' : null;
    });
  });

  // ----- audit lead capture form (same fields, checks and Formspree endpoint as before)
  (function () {
    const form = document.getElementById('audit-form');
    if (!form) return;

    const submitBtn = document.getElementById('audit-submit');
    const formError = document.getElementById('audit-form-error');
    const thankYou = document.getElementById('audit-thankyou');
    const fields = ['name', 'business_name', 'category', 'address', 'phone', 'email', 'maps_link'];

    function setError(field, message) {
      const input = form.elements[field];
      const errorEl = document.getElementById('audit-error-' + field);
      input.setAttribute('aria-describedby', errorEl.id);
      if (message) {
        input.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      } else {
        input.classList.remove('is-error');
        input.removeAttribute('aria-invalid');
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }

    function validate() {
      let valid = true;
      const data = {};
      fields.forEach((f) => { data[f] = form.elements[f].value.trim(); });

      if (!data.name) { setError('name', 'Please enter your name.'); valid = false; }
      else setError('name', '');

      if (!data.business_name) { setError('business_name', 'Please enter your business name.'); valid = false; }
      else setError('business_name', '');

      if (!data.category) { setError('category', 'Please select a category.'); valid = false; }
      else setError('category', '');

      if (!data.address) { setError('address', 'Please enter your business address.'); valid = false; }
      else setError('address', '');

      const phoneDigits = data.phone.replace(/\D/g, '');
      if (!data.phone) { setError('phone', 'Please enter your phone number.'); valid = false; }
      else if (phoneDigits.length !== 10) { setError('phone', 'Enter a valid 10-digit US phone number.'); valid = false; }
      else setError('phone', '');

      if (!data.email) { setError('email', 'Please enter your email address.'); valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setError('email', 'Enter a valid email address.'); valid = false; }
      else setError('email', '');

      if (data.maps_link && !/^https?:\/\/.+/i.test(data.maps_link)) { setError('maps_link', 'Enter a valid URL starting with http:// or https://.'); valid = false; }
      else setError('maps_link', '');

      return { valid, data };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formError.classList.add('hidden');

      const { valid, data } = validate();
      if (!valid) {
        const first = form.querySelector('.is-error');
        if (first) first.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch('https://formspree.io/f/mrewovza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Formspree error');
          document.getElementById('audit-thankyou-email').textContent = data.email;
          document.getElementById('audit-thankyou-phone').textContent = data.phone;
          form.classList.add('hidden');
          thankYou.classList.remove('hidden');
          thankYou.setAttribute('tabindex', '-1');
          thankYou.focus();
        })
        .catch(() => {
          formError.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Get My Free Audit';
        });
    });
  })();
})();
