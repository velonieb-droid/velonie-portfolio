// FAQ Schema Generator. Runs entirely in the browser.
import { createTracker, wireOutputActions, setStatus } from './core.js';

const trim = (value) => String(value ?? '').trim();

/**
 * Check each row. Rows that are completely empty are ignored.
 * Returns { rowErrors: [{question, answer}], complete: [{question, answer}], message }.
 */
export function validateFaq(items) {
  const rowErrors = [];
  const complete = [];
  items.forEach((item) => {
    const question = trim(item.question);
    const answer = trim(item.answer);
    const err = { question: '', answer: '' };
    if (question && !answer) err.answer = 'Add an answer for this question.';
    if (!question && answer) err.question = 'Add the question this answer belongs to.';
    if (question && answer) complete.push({ question, answer });
    rowErrors.push(err);
  });
  const hasErrors = rowErrors.some((e) => e.question || e.answer);
  let message = '';
  if (hasErrors) message = 'Complete or remove the highlighted items to generate the schema.';
  else if (complete.length === 0) message = 'Add at least one question and its answer to generate the schema.';
  return { rowErrors, complete, valid: !hasErrors && complete.length > 0, message };
}

/** Build the Schema.org FAQPage object. */
export function buildFaqObject(pairs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

/**
 * Serialize with JSON.stringify, then escape "<" as <.
 * The result is still valid JSON, and text such as </script> or <!-- can no longer
 * end or confuse the surrounding HTML script element.
 */
export function serializeJsonLd(object) {
  return JSON.stringify(object, null, 2).replace(/</g, '\\u003c');
}

export function buildFaqOutput(pairs, wrap) {
  const json = serializeJsonLd(buildFaqObject(pairs));
  return wrap ? `<script type="application/ld+json">\n${json}\n</script>\n` : json + '\n';
}

function init() {
  const list = document.getElementById('faqList');
  if (!list) return;
  const $ = (id) => document.getElementById(id);
  const output = $('output');
  const empty = $('emptyState');
  const result = $('resultState');
  const copyBtn = $('copyBtn');
  const downloadBtn = $('downloadBtn');
  const statusEl = $('status');
  const wrap = $('wrapScript');
  const tracker = createTracker('faq_schema_generator');
  let items = [{ question: '', answer: '' }];
  let uid = 0;
  let current = '';

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else node.setAttribute(key, value);
    });
    children.forEach((child) => node.appendChild(child));
    return node;
  }

  // Rebuild the list. All visitor text goes in through .value / textContent, never innerHTML.
  function renderList(focus) {
    list.replaceChildren();
    items.forEach((item, index) => {
      const id = ++uid;
      const n = index + 1;
      const question = el('input', { type: 'text', id: `q${id}`, autocomplete: 'off', 'aria-describedby': `q${id}e`, placeholder: 'What do customers ask?' });
      question.value = item.question;
      const answer = el('textarea', { id: `a${id}`, rows: '3', 'aria-describedby': `a${id}e`, placeholder: 'Write the full answer in plain text.' });
      answer.value = item.answer;
      question.addEventListener('input', () => { items[index].question = question.value; renderOutput(); });
      answer.addEventListener('input', () => { items[index].answer = answer.value; renderOutput(); });

      const button = (label, text, disabled, handler) => {
        const b = el('button', { type: 'button', class: 'btn icon', 'aria-label': `${label} question ${n}`, text });
        b.disabled = disabled;
        b.addEventListener('click', handler);
        return b;
      };
      const up = button('Move up', '↑', index === 0, () => move(index, -1));
      const down = button('Move down', '↓', index === items.length - 1, () => move(index, 1));
      const remove = button('Remove', '✕', false, () => removeItem(index));

      const row = el('li', { class: 'faq-item', 'data-index': String(index) }, [
        el('div', { class: 'faq-item-head' }, [
          el('strong', { text: `Question ${n}` }),
          el('div', { class: 'faq-tools' }, [up, down, remove])
        ]),
        el('div', { class: 'field' }, [
          el('div', { class: 'field-row' }, [el('label', { for: `q${id}`, text: 'Question' })]),
          question,
          el('p', { class: 'err', id: `q${id}e`, 'data-err': 'question' })
        ]),
        el('div', { class: 'field' }, [
          el('div', { class: 'field-row' }, [el('label', { for: `a${id}`, text: 'Answer' })]),
          answer,
          el('p', { class: 'err', id: `a${id}e`, 'data-err': 'answer' })
        ])
      ]);
      list.appendChild(row);
      if (focus && focus.index === index) {
        const target = focus.control === 'up' ? up : focus.control === 'down' ? down : question;
        (target.disabled ? question : target).focus();
      }
    });
    renderOutput();
  }

  function renderOutput() {
    const { rowErrors, complete, valid, message } = validateFaq(items);
    Array.from(list.children).forEach((row, index) => {
      ['question', 'answer'].forEach((key) => {
        const errEl = row.querySelector(`[data-err="${key}"]`);
        const control = row.querySelector(key === 'question' ? 'input' : 'textarea');
        errEl.textContent = rowErrors[index][key];
        control.setAttribute('aria-invalid', rowErrors[index][key] ? 'true' : 'false');
      });
    });
    current = valid ? buildFaqOutput(complete, wrap.checked) : '';
    output.textContent = current;
    empty.hidden = valid;
    result.hidden = !valid;
    if (!valid) empty.textContent = message;
    copyBtn.disabled = downloadBtn.disabled = !valid;
    $('itemCount').textContent = valid ? `${complete.length} question${complete.length === 1 ? '' : 's'} in the schema` : '';
    if (valid) tracker.generate();
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    renderList({ index: target, control: delta < 0 ? 'up' : 'down' });
  }

  function removeItem(index) {
    items.splice(index, 1);
    if (items.length === 0) items.push({ question: '', answer: '' });
    renderList({ index: Math.min(index, items.length - 1) });
    setStatus(statusEl, 'Item removed.', 'ok');
  }

  $('addBtn').addEventListener('click', () => {
    items.push({ question: '', answer: '' });
    renderList({ index: items.length - 1 });
  });

  $('resetBtn').addEventListener('click', () => {
    items = [{ question: '', answer: '' }];
    wrap.checked = true;
    renderList({ index: 0 });
    setStatus(statusEl, 'All items cleared.', 'ok');
  });

  $('exampleBtn').addEventListener('click', () => {
    items = [
      { question: 'How long does a CRM setup take?', answer: 'Most small-business CRM setups take one to two weeks, depending on the number of pipelines, forms and automations involved.' },
      { question: 'Do you offer support after launch?', answer: 'Yes. Every build includes a 14-day support window for fixes and small adjustments.' }
    ];
    renderList();
  });

  wrap.addEventListener('change', renderOutput);

  wireOutputActions({
    copyBtn, downloadBtn, statusEl, tracker,
    getOutput: () => current,
    filename: () => (wrap.checked ? 'faq-schema.html' : 'faq-schema.json'),
    mime: () => (wrap.checked ? 'text/html' : 'application/ld+json')
  });

  renderList();
  tracker.open();
}

if (typeof document !== 'undefined') init();
