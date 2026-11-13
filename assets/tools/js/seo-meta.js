// SEO Meta Tag Generator. Runs entirely in the browser.
import { escapeHtml, clean, isHttpUrl, createTracker, wireOutputActions, setStatus } from './core.js';

export const LIMITS = {
  title: { min: 30, max: 60 },
  description: { min: 70, max: 160 }
};

const ROBOTS = ['', 'index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow'];

/** Validate raw field values. Returns { errors, values } with cleaned values. */
export function validateMeta(raw) {
  const values = {
    title: clean(raw.title),
    description: clean(raw.description),
    canonical: clean(raw.canonical),
    siteName: clean(raw.siteName),
    ogTitle: clean(raw.ogTitle),
    ogDescription: clean(raw.ogDescription),
    ogImage: clean(raw.ogImage),
    robots: ROBOTS.includes(raw.robots) ? raw.robots : ''
  };
  const errors = {};
  if (!values.title) errors.title = 'Enter a page title.';
  if (!values.description) errors.description = 'Enter a meta description.';
  if (values.canonical && !isHttpUrl(values.canonical)) {
    errors.canonical = 'Use a full URL that starts with https:// or http://.';
  }
  if (values.ogImage && !isHttpUrl(values.ogImage)) {
    errors.ogImage = 'Use a full image URL that starts with https:// or http://.';
  }
  return { errors, values };
}

/** Build the HTML snippet from already validated values. Every value is entity-escaped. */
export function buildMetaTags(v) {
  const e = escapeHtml;
  const ogTitle = v.ogTitle || v.title;
  const ogDescription = v.ogDescription || v.description;
  const lines = [
    '<!-- Primary meta tags -->',
    `<title>${e(v.title)}</title>`,
    `<meta name="description" content="${e(v.description)}">`
  ];
  if (v.canonical) lines.push(`<link rel="canonical" href="${e(v.canonical)}">`);
  if (v.robots) lines.push(`<meta name="robots" content="${e(v.robots)}">`);

  lines.push('', '<!-- Open Graph -->', '<meta property="og:type" content="website">');
  lines.push(`<meta property="og:title" content="${e(ogTitle)}">`);
  lines.push(`<meta property="og:description" content="${e(ogDescription)}">`);
  if (v.canonical) lines.push(`<meta property="og:url" content="${e(v.canonical)}">`);
  if (v.ogImage) lines.push(`<meta property="og:image" content="${e(v.ogImage)}">`);
  if (v.siteName) lines.push(`<meta property="og:site_name" content="${e(v.siteName)}">`);

  lines.push('', '<!-- Twitter / X -->');
  lines.push(`<meta name="twitter:card" content="${v.ogImage ? 'summary_large_image' : 'summary'}">`);
  lines.push(`<meta name="twitter:title" content="${e(ogTitle)}">`);
  lines.push(`<meta name="twitter:description" content="${e(ogDescription)}">`);
  if (v.ogImage) lines.push(`<meta name="twitter:image" content="${e(v.ogImage)}">`);

  return lines.join('\n') + '\n';
}

/** Describe a character count against a recommended range. */
export function lengthState(length, { min, max }) {
  if (length === 0) return { cls: '', note: `aim for ${min} to ${max}` };
  if (length < min) return { cls: 'warn', note: 'short' };
  if (length > max) return { cls: 'warn', note: 'may be cut off' };
  return { cls: 'good', note: 'good length' };
}

function init() {
  const form = document.getElementById('metaForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const fields = ['title', 'description', 'canonical', 'siteName', 'ogTitle', 'ogDescription', 'ogImage', 'robots'];
  const output = $('output');
  const empty = $('emptyState');
  const result = $('resultState');
  const copyBtn = $('copyBtn');
  const downloadBtn = $('downloadBtn');
  const statusEl = $('status');
  const tracker = createTracker('seo_meta_generator');
  const touched = new Set();
  let current = '';

  const read = () => Object.fromEntries(fields.map((f) => [f, $(f).value]));

  function updateCount(field) {
    const len = clean($(field).value).length;
    const state = lengthState(len, LIMITS[field]);
    const el = $(field + 'Count');
    el.textContent = `${len} characters, ${state.note}`;
    el.className = 'count' + (state.cls ? ' ' + state.cls : '');
  }

  function render() {
    const { errors, values } = validateMeta(read());
    updateCount('title');
    updateCount('description');

    fields.forEach((f) => {
      const errEl = $(f + 'Err');
      if (!errEl) return;
      // Required-field messages wait until the visitor has left the field; format errors show at once.
      const show = errors[f] && (touched.has(f) || $(f).value.trim() !== '');
      errEl.textContent = show ? errors[f] : '';
      $(f).setAttribute('aria-invalid', show ? 'true' : 'false');
    });

    const valid = Object.keys(errors).length === 0;
    current = valid ? buildMetaTags(values) : '';
    output.textContent = current;
    empty.hidden = valid;
    result.hidden = !valid;
    copyBtn.disabled = downloadBtn.disabled = !valid;

    if (valid) {
      $('serpTitle').textContent = values.title;
      $('serpDesc').textContent = values.description;
      $('serpUrl').textContent = values.canonical || 'https://example.com/your-page';
      tracker.generate();
    } else {
      const hasInput = fields.some((f) => f !== 'robots' && $(f).value.trim() !== '');
      empty.textContent = hasInput
        ? 'Fix the highlighted fields to generate your tags. A title and a description are required.'
        : 'Enter a page title and a meta description to generate your tags.';
    }
  }

  form.addEventListener('input', render);
  form.addEventListener('focusout', (event) => {
    if (event.target.id && fields.includes(event.target.id)) { touched.add(event.target.id); render(); }
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  $('resetBtn').addEventListener('click', () => {
    form.reset();
    touched.clear();
    render();
    setStatus(statusEl, 'Form cleared.', 'ok');
    $('title').focus();
  });

  $('exampleBtn').addEventListener('click', () => {
    $('title').value = 'Emergency Plumber in Austin, TX | Rivera Plumbing';
    $('description').value = 'Licensed Austin plumbers for leaks, clogged drains and water heater repair. Same-day appointments, upfront pricing and a 1-year workmanship warranty.';
    $('canonical').value = 'https://www.example.com/emergency-plumber-austin/';
    $('siteName').value = 'Rivera Plumbing';
    $('ogTitle').value = '';
    $('ogDescription').value = '';
    $('ogImage').value = 'https://www.example.com/images/austin-plumber-share.jpg';
    $('robots').value = 'index, follow';
    render();
  });

  wireOutputActions({
    copyBtn, downloadBtn, statusEl, tracker,
    getOutput: () => current,
    filename: 'meta-tags.html',
    mime: 'text/html'
  });

  render();
  tracker.open();
}

if (typeof document !== 'undefined') init();
