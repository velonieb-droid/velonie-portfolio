const menu = document.querySelector('.menu');
const navigation = document.querySelector('#site-nav');
const inquiry = document.querySelector('#inquiry');
const form = document.querySelector('#inquiry-form');
const result = form?.querySelector('.result');

function setMenu(open, { restoreFocus = false } = {}) {
  if (!menu || !navigation) return;

  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

  if (restoreFocus) menu.focus();
}

menu?.addEventListener('click', () => {
  const isOpen = menu.getAttribute('aria-expanded') === 'true';
  setMenu(!isOpen);
});

navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    setMenu(false, { restoreFocus: true });
  }
});

document.querySelectorAll('[data-inquiry]').forEach((button) => {
  button.addEventListener('click', () => {
    const service = button.dataset.service;
    const select = form?.querySelector('[name="service"]');
    if (service && select) select.value = service;
    if (inquiry?.showModal) inquiry.showModal();
  });
});

form?.querySelector('.close')?.addEventListener('click', () => inquiry.close());

inquiry?.addEventListener('click', (event) => {
  if (event.target === inquiry) inquiry.close();
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  form.reset();
  result.textContent = 'Demo electrical inquiry received on this page only. No request was sent to a business or CRM.';
});

inquiry?.addEventListener('close', () => {
  if (result) result.textContent = '';
});


// Sticky header enhancement: add a subtle compact-state class after scrolling.
const siteHeader = document.querySelector('.header');
const updateHeaderState = () => {
  if (!siteHeader) return;
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
};
updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });
