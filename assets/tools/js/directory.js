// Free Tools directory: search and category filter. Cards are plain HTML and work without this script.
(function () {
  const search = document.getElementById('toolSearch');
  const cards = Array.from(document.querySelectorAll('[data-tool]'));
  const chips = Array.from(document.querySelectorAll('.chip'));
  const none = document.getElementById('noResults');
  const count = document.getElementById('resultCount');
  if (!search || !cards.length) return;
  let category = 'all';

  function apply() {
    const term = search.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      const text = (card.textContent + ' ' + (card.dataset.keywords || '')).toLowerCase();
      const match = (category === 'all' || card.dataset.category === category) && (!term || text.includes(term));
      card.hidden = !match;
      if (match) shown++;
    });
    none.hidden = shown !== 0;
    count.textContent = `${shown} of ${cards.length} tools shown`;
  }

  search.addEventListener('input', apply);
  chips.forEach((chip) => chip.addEventListener('click', () => {
    category = chip.dataset.category;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    apply();
  }));
  document.getElementById('clearSearch').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.category === 'all')));
    apply();
    search.focus();
  });
  apply();
})();
