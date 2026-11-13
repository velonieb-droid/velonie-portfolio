// Page checker for the SEO Meta Tag Generator.
// Reads a page's HTML, reports problems and suggests a title, description and focus keywords.
// Everything is rule-based and built from the page's own words. No AI model or API is used.
import { clean, isHttpUrl, createTracker } from './core.js';
import { LIMITS } from './seo-meta.js';

const MAX_HTML = 3_000_000; // characters

const STOPWORDS = new Set(('a about above after again against all also am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further get got had has have having he her here hers herself him himself his how i if in into is it its itself just let like may me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself yourselves one two new use used using make made many much well see via per etc amp nbsp click here read learn page home menu skip content').split(' '));

const tokenize = (text) => String(text || '').toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
const usable = (word) => word.length >= 3 && !STOPWORDS.has(word) && !/^\d+$/.test(word);
const titleCase = (phrase) => phrase.replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

/** Rank single words and two-word phrases. Words in the title and headings count for more. */
export function keywordCandidates(data, limit = 8) {
  const score = new Map();
  const bodyCount = new Map();
  const bump = (map, key, by) => map.set(key, (map.get(key) || 0) + by);
  const add = (text, weight, isBody) => {
    String(text || '').split(/[.!?;:,|()[\]{}"“”\n\r\t–—·•/]+/).forEach((segment) => {
      const words = tokenize(segment);
      words.forEach((word, i) => {
        if (!usable(word)) return;
        bump(score, word, weight);
        if (isBody) bump(bodyCount, word, 1);
        const next = words[i + 1];
        if (next && usable(next) && next !== word) {
          const phrase = `${word} ${next}`;
          bump(score, phrase, weight * 1.8);
          if (isBody) bump(bodyCount, phrase, 1);
        }
      });
    });
  };
  add(data.text, 1, true);
  (data.h2 || []).forEach((h) => add(h, 2));
  add(data.description, 2);
  (data.h1 || []).forEach((h) => add(h, 4));
  add(data.title, 5);

  const inText = (haystack, phrase) => tokenize(haystack).join(' ').includes(phrase);
  const h1Text = (data.h1 || []).join(' . ');
  const ranked = Array.from(score.entries())
    .map(([phrase, value]) => ({ phrase, score: value, count: bodyCount.get(phrase) || 0, inTitle: inText(data.title, phrase), inH1: inText(h1Text, phrase) }))
    // Keep terms the page actually leans on: repeated in the text, or present in the title or main heading.
    .filter((k) => k.count >= 2 || k.inTitle || k.inH1)
    .sort((a, b) => b.score - a.score || a.phrase.localeCompare(b.phrase));

  const chosen = [];
  for (const item of ranked) {
    if (chosen.length >= limit) break;
    const isPhrase = item.phrase.includes(' ');
    // Skip a single word already covered by a chosen phrase, and a phrase made only of chosen words.
    if (!isPhrase && chosen.some((c) => c.phrase.split(' ').includes(item.phrase))) continue;
    if (isPhrase && item.phrase.split(' ').every((w) => chosen.some((c) => c.phrase === w))) continue;
    chosen.push(item);
  }
  return chosen;
}

function trimTo(text, max, min = 0) {
  const value = clean(text);
  if (value.length <= max) return value;
  const head = value.slice(0, max + 1);
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (sentenceEnd + 1 >= Math.max(min, 1)) return head.slice(0, sentenceEnd + 1);
  return head.slice(0, head.lastIndexOf(' ')).replace(/[\s,;:–—-]+$/, '');
}

const splitTitle = (title) => clean(title).split(/\s+[|–—·-]\s+/).filter(Boolean);

function brandOf(data) {
  if (clean(data.siteName)) return clean(data.siteName);
  const parts = splitTitle(data.title);
  if (parts.length >= 2 && parts[parts.length - 1].length <= 30) return parts[parts.length - 1];
  try {
    const label = new URL(data.url).hostname.replace(/^www\./, '').split('.')[0];
    return label ? titleCase(label.replace(/-/g, ' ')) : '';
  } catch {
    return '';
  }
}

/** Up to three title options, each at most 60 characters. */
export function recommendTitles(data, keywords) {
  const max = LIMITS.title.max;
  const brand = brandOf(data);
  const fit = (main) => {
    const base = clean(main);
    if (!base) return '';
    const withBrand = brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${base} | ${brand}` : base;
    if (withBrand.length <= max) return withBrand;
    return base.length <= max ? base : trimTo(base, max);
  };
  const options = [];
  const push = (text, note) => {
    if (text && !options.some((o) => o.text.toLowerCase() === text.toLowerCase())) options.push({ text, note });
  };
  const current = clean(data.title);
  const h1 = clean((data.h1 || [])[0]);
  const top = keywords[0] && keywords[0].phrase;

  if (current.length >= LIMITS.title.min && current.length <= max) push(current, 'Your current title. It is already a good length.');
  if (h1) push(fit(h1), 'Built from the main heading (H1) of the page.');
  if (current.length > max) push(fit(splitTitle(current)[0]), 'Your current title, shortened to fit.');
  if (top && brand && !(h1 || current).toLowerCase().includes(top)) push(fit(titleCase(top)), `Leads with the most prominent phrase on the page, "${top}".`);
  if (!options.length && current) push(fit(current), 'Your current title.');
  return options.slice(0, 3);
}

/** Up to three description options, each at most 160 characters. */
export function recommendDescriptions(data, keywords) {
  const { min, max } = LIMITS.description;
  const target = max - 5;
  const options = [];
  const push = (text, note) => {
    const value = clean(text);
    if (value.length >= 50 && !options.some((o) => o.text.toLowerCase() === value.toLowerCase())) options.push({ text: value, note });
  };
  const current = clean(data.description);
  if (current.length >= min && current.length <= max) push(current, 'Your current description. It is already a good length.');
  if (current.length > max) push(trimTo(current, target, min), 'Your current description, shortened to fit.');

  const paragraphs = (data.paragraphs || []).map(clean).filter((p) => p.length >= 60);
  if (paragraphs.length) push(trimTo(paragraphs[0], target, min), 'Built from the opening text of the page.');

  const top = keywords[0] && keywords[0].phrase;
  if (top) {
    const sentences = paragraphs.join(' ').match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [];
    const hit = sentences.map(clean).find((s) => s.length >= min && s.toLowerCase().includes(top));
    if (hit) push(trimTo(hit, target, min), `Built from a sentence on the page that mentions "${top}".`);
  }
  return options.slice(0, 3);
}

/** Checks on the page as it is now. level: ok | warn | bad. */
export function pageFindings(data, keywords) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  const title = clean(data.title);
  const description = clean(data.description);
  const range = (label, value, { min, max }) => {
    if (!value) add('bad', `No ${label} found.`);
    else if (value.length < min) add('warn', `The ${label} is short (${value.length} characters). Aim for ${min} to ${max}.`);
    else if (value.length > max) add('warn', `The ${label} is long (${value.length} characters) and may be cut off. Aim for ${min} to ${max}.`);
    else add('ok', `The ${label} is a good length (${value.length} characters).`);
  };
  range('title tag', title, LIMITS.title);
  range('meta description', description, LIMITS.description);

  const h1Count = (data.h1 || []).length;
  if (h1Count === 0) add('warn', 'No H1 heading found. A page normally has one main heading.');
  else if (h1Count > 1) add('warn', `${h1Count} H1 headings found. One main heading is usually clearer.`);
  else add('ok', 'The page has one H1 heading.');

  if (data.canonical) add('ok', 'A canonical link is set.');
  else add('warn', 'No canonical link found.');

  if (/noindex/i.test(data.robots || '')) add('bad', 'The robots tag says noindex, so search engines are asked not to index this page.');
  if (!data.ogTitle || !data.ogImage) add('warn', `Social sharing tags are incomplete (missing ${[!data.ogTitle && 'og:title', !data.ogImage && 'og:image'].filter(Boolean).join(' and ')}).`);
  else add('ok', 'Open Graph title and image are set.');

  if (data.imagesMissingAlt > 0) add('warn', `${data.imagesMissingAlt} of ${data.images} images have no alt attribute.`);
  if (data.wordCount < 150) add('warn', `Only about ${data.wordCount} words of readable text were found, so keyword suggestions are limited. Pages built mostly by JavaScript may show little text in their source.`);

  const top = keywords[0];
  if (top && title && !top.inTitle) add('warn', `The most prominent phrase in the text, "${top.phrase}", is not in the title.`);
  return out;
}

/** Read the parts of an HTML document that matter here. Uses DOMParser, which does not run scripts or load images. */
export function extractPage(html, url = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = (selector) => clean(doc.querySelector(selector)?.getAttribute('content'));
  const texts = (selector, root = doc) => Array.from(root.querySelectorAll(selector)).map((el) => clean(el.textContent)).filter(Boolean);
  const source = doc.querySelector('main, [role="main"], article') || doc.body;
  const content = source ? source.cloneNode(true) : doc.createElement('div');
  content.querySelectorAll('script, style, noscript, template, svg, iframe, nav, header, footer, form, aside').forEach((el) => el.remove());
  // Separate block-level text so words from neighbouring elements do not run together.
  content.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, div, br, td, th, section').forEach((el) => el.append('\n'));
  const text = (content.textContent || '').replace(/[ \t\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  const images = Array.from(doc.querySelectorAll('img'));
  let canonical = clean(doc.querySelector('link[rel~="canonical"]')?.getAttribute('href'));
  if (canonical && url) { try { canonical = new URL(canonical, url).href; } catch { /* keep as written */ } }
  return {
    url,
    title: clean(doc.querySelector('title')?.textContent),
    description: meta('meta[name="description" i]'),
    canonical,
    robots: meta('meta[name="robots" i]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: meta('meta[property="og:image"]'),
    siteName: meta('meta[property="og:site_name"]'),
    h1: texts('h1'),
    h2: texts('h2'),
    paragraphs: texts('p', content),
    text,
    wordCount: tokenize(text).length,
    images: images.length,
    imagesMissingAlt: images.filter((img) => !img.hasAttribute('alt')).length
  };
}

export function analyzePage(data) {
  const keywords = keywordCandidates(data);
  return {
    data,
    keywords,
    findings: pageFindings(data, keywords),
    titles: recommendTitles(data, keywords),
    descriptions: recommendDescriptions(data, keywords)
  };
}

function init() {
  const form = document.getElementById('analyzeForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const statusEl = $('anStatus');
  const results = $('anResults');
  const tracker = createTracker('seo_meta_generator');
  let last = null;

  const say = (message, kind) => { statusEl.textContent = message; statusEl.className = 'status' + (kind ? ' ' + kind : ''); };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // Put a value into the generator form and let the generator re-render.
  const fill = (id, value) => {
    const field = $(id);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };

  function suggestionList(listEl, options, fieldId, emptyText) {
    listEl.replaceChildren();
    if (!options.length) { listEl.appendChild(el('li', 'hint', emptyText)); return; }
    options.forEach((option) => {
      const li = el('li');
      const body = el('div');
      body.appendChild(el('p', 'suggest-text', option.text));
      body.appendChild(el('p', 'hint', `${option.text.length} characters. ${option.note}`));
      const use = el('button', 'btn sm', 'Use this');
      use.type = 'button';
      use.addEventListener('click', () => {
        fill(fieldId, option.text);
        say(`Added to the ${fieldId === 'title' ? 'page title' : 'meta description'} field below. Edit it to suit the page.`, 'ok');
      });
      li.append(body, use);
      listEl.appendChild(li);
    });
  }

  function show(html, url, source) {
    if (!html.trim()) { say('There is no HTML to check yet.', 'bad'); return; }
    if (html.length > MAX_HTML) { say('That page is too large to check here (over 3 MB of HTML).', 'bad'); return; }
    const data = extractPage(html, url);
    if (!data.title && !data.h1.length && data.wordCount === 0) {
      results.hidden = true;
      say('No title, headings or readable text were found. Check that you pasted the full HTML source of the page.', 'bad');
      return;
    }
    last = analyzePage(data);

    const findings = $('anFindings');
    findings.replaceChildren();
    last.findings.forEach((f) => findings.appendChild(el('li', f.level, f.text)));

    const current = $('anCurrent');
    current.replaceChildren();
    [['Title', data.title], ['Description', data.description], ['Main heading (H1)', data.h1[0]]].forEach(([label, value]) => {
      current.appendChild(el('dt', '', label));
      current.appendChild(el('dd', value ? '' : 'missing', value || 'Not found'));
    });

    const keywords = $('anKeywords');
    keywords.replaceChildren();
    if (!last.keywords.length) keywords.appendChild(el('li', 'hint', 'Not enough readable text to suggest keywords.'));
    last.keywords.forEach((k) => {
      const where = [k.count ? `${k.count}× in text` : '', k.inTitle ? 'in title' : '', k.inH1 ? 'in H1' : ''].filter(Boolean).join(', ');
      const li = el('li', 'kw');
      li.append(el('strong', '', k.phrase), el('span', '', where));
      keywords.appendChild(li);
    });

    suggestionList($('anTitles'), last.titles, 'title', 'No title suggestion could be built. Add a main heading to the page or write the title by hand.');
    suggestionList($('anDescs'), last.descriptions, 'description', 'No description suggestion could be built because the page has little paragraph text.');

    results.hidden = false;
    say(`Checked: about ${data.wordCount} words of text read${url ? ' from ' + url : ''}.`, 'ok');
    tracker.analyze(source);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = $('pageUrl').value.trim();
    const errEl = $('pageUrlErr');
    errEl.textContent = '';
    $('pageUrl').setAttribute('aria-invalid', 'false');
    if (!isHttpUrl(url)) {
      errEl.textContent = 'Enter a full page address that starts with https:// or http://.';
      $('pageUrl').setAttribute('aria-invalid', 'true');
      return;
    }
    const button = $('checkBtn');
    button.disabled = true;
    say('Requesting the page…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', redirect: 'follow' });
      if (!response.ok) throw new Error('status');
      const type = response.headers.get('content-type') || '';
      if (type && !/html|xml|text\/plain/i.test(type)) throw new Error('type');
      show(await response.text(), response.url || url, 'url');
    } catch (error) {
      results.hidden = true;
      $('pasteBox').open = true;
      say(error && error.message === 'type'
        ? 'That address did not return an HTML page.'
        : 'This page could not be read directly. Most websites do not allow other sites to read their pages from a browser. Paste the HTML source or upload the saved page below instead.', 'bad');
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  });

  $('analyzeHtmlBtn').addEventListener('click', () => {
    const url = $('pageUrl').value.trim();
    show($('pageHtml').value, isHttpUrl(url) ? url : '', 'paste');
  });

  $('pageFile').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > MAX_HTML) { say('That file is too large to check here (over 3 MB).', 'bad'); return; }
    try {
      const url = $('pageUrl').value.trim();
      show(await file.text(), isHttpUrl(url) ? url : '', 'file');
    } catch {
      say('That file could not be read.', 'bad');
    }
  });

  $('fillCurrent').addEventListener('click', () => {
    if (!last) return;
    const d = last.data;
    fill('title', d.title);
    fill('description', d.description);
    fill('canonical', isHttpUrl(d.canonical) ? d.canonical : (isHttpUrl(d.url) ? d.url : ''));
    fill('siteName', d.siteName);
    fill('ogTitle', d.ogTitle && d.ogTitle !== d.title ? d.ogTitle : '');
    fill('ogDescription', d.ogDescription && d.ogDescription !== d.description ? d.ogDescription : '');
    fill('ogImage', isHttpUrl(d.ogImage) ? d.ogImage : '');
    say('The page\'s current tags were copied into the form below.', 'ok');
  });

  $('anClear').addEventListener('click', () => {
    form.reset();
    $('pageHtml').value = '';
    $('pageFile').value = '';
    $('pageUrlErr').textContent = '';
    results.hidden = true;
    last = null;
    say('');
  });
}

if (typeof document !== 'undefined') init();
