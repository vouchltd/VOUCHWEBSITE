// Pilot form: inline validation, JSON submit to Formspree, inline thank-you.
// No alert popups. Errors sit next to the field they belong to.

const form = document.getElementById('pilot-form');
const formArea = document.getElementById('form-area');
const thanks = document.getElementById('thanks');
const formError = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const email = form ? form.dataset.email : '';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rules = {
  name: (v) => (v.trim() ? '' : 'Enter your name.'),
  agency: (v) => (v.trim() ? '' : 'Enter your agency name.'),
  role: (v) => (v.trim() ? '' : 'Enter your role.'),
  locations: (v) => {
    const n = Number(v);
    return v.trim() && Number.isInteger(n) && n >= 1 ? '' : 'Enter a whole number, 1 or more.';
  },
  email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.'),
};

function check(field) {
  const input = form.elements[field];
  const msg = rules[field](input.value);
  document.getElementById(`${field}-err`).textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

if (form) {
  for (const field of Object.keys(rules)) {
    form.elements[field].addEventListener('blur', () => check(field));
    // Once a field shows an error, clear it as soon as the value is fixed.
    form.elements[field].addEventListener('input', () => {
      if (form.elements[field].getAttribute('aria-invalid') === 'true') check(field);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    const results = Object.keys(rules).map((f) => [f, check(f)]);
    const firstBad = results.find(([, ok]) => !ok);
    if (firstBad) {
      form.elements[firstBad[0]].focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      formArea.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch {
      formError.innerHTML =
        `That did not send. Try again, or email us at <a href="mailto:${email}">${email}</a>.`;
      formError.focus();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Start a free pilot';
    }
  });
}
