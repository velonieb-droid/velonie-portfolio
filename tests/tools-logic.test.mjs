// Logic tests for the Free Tools. No dependencies.
// Run from the repository root:  node --test tests/tools-logic.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, isHttpUrl, clean } from '../assets/tools/js/core.js';
import { validateMeta, buildMetaTags, lengthState, LIMITS } from '../assets/tools/js/seo-meta.js';
import { validateFaq, buildFaqObject, serializeJsonLd, buildFaqOutput } from '../assets/tools/js/faq-schema.js';
import { buildPrompt, promptTips, toLines } from '../assets/tools/js/prompt-builder.js';
import { TEMPLATES } from '../assets/tools/js/prompt-templates.js';

test('escapeHtml encodes all five significant characters', () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  assert.equal(escapeHtml(null), '');
});

test('isHttpUrl accepts only absolute http(s) URLs', () => {
  assert.equal(isHttpUrl('https://example.com/a?b=1'), true);
  assert.equal(isHttpUrl('http://example.com'), true);
  for (const bad of ['example.com', '/path', 'javascript:alert(1)', 'data:text/html,x', 'ftp://example.com', '', 'https://']) {
    assert.equal(isHttpUrl(bad), false, bad);
  }
});

test('SEO: empty input is invalid and names the required fields', () => {
  const { errors } = validateMeta({});
  assert.ok(errors.title && errors.description);
  assert.equal(errors.canonical, undefined);
});

test('SEO: bad URLs are rejected, including javascript: URLs', () => {
  const { errors } = validateMeta({ title: 'T', description: 'D', canonical: 'example.com/page', ogImage: 'javascript:alert(1)' });
  assert.ok(errors.canonical && errors.ogImage);
});

test('SEO: minimal output has title, description and summary card only', () => {
  const { errors, values } = validateMeta({ title: '  My   Page ', description: 'About it' });
  assert.deepEqual(errors, {});
  const html = buildMetaTags(values);
  assert.match(html, /<title>My Page<\/title>/);
  assert.match(html, /<meta name="description" content="About it">/);
  assert.match(html, /<meta name="twitter:card" content="summary">/);
  for (const absent of ['rel="canonical"', 'name="robots"', 'og:url', 'og:image', 'og:site_name', 'twitter:image']) {
    assert.ok(!html.includes(absent), absent);
  }
});

test('SEO: full output includes every tag and falls back to the page title', () => {
  const { values } = validateMeta({
    title: 'Page', description: 'Desc', canonical: 'https://example.com/p/', siteName: 'Site',
    ogImage: 'https://example.com/i.jpg', robots: 'noindex, follow'
  });
  const html = buildMetaTags(values);
  for (const present of [
    '<link rel="canonical" href="https://example.com/p/">',
    '<meta name="robots" content="noindex, follow">',
    '<meta property="og:title" content="Page">',
    '<meta property="og:url" content="https://example.com/p/">',
    '<meta property="og:image" content="https://example.com/i.jpg">',
    '<meta property="og:site_name" content="Site">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:image" content="https://example.com/i.jpg">'
  ]) assert.ok(html.includes(present), present);
});

test('SEO: hostile input cannot break out of tags or attributes', () => {
  const { values } = validateMeta({
    title: '</title><script>alert(1)</script>',
    description: '"><img src=x onerror=alert(1)> & \'quotes\' ünïcödé 日本語 🚀',
    canonical: 'https://example.com/?a=1&b="2"'
  });
  const html = buildMetaTags(values);
  assert.ok(!/<script|<img|<\/title><|"">/.test(html), html);
  assert.ok(html.includes('&lt;/title&gt;&lt;script&gt;'));
  assert.ok(html.includes('ünïcödé 日本語 🚀'));
  // Only the tags we generate are present: every line is a comment, blank, or one known element.
  for (const line of html.trim().split('\n')) {
    assert.match(line, /^(|<!-- [\w /]+ -->|<title>[^<>]*<\/title>|<meta (name|property)="[\w:]+" content="[^"<>]*">|<link rel="canonical" href="[^"<>]*">)$/, line);
  }
});

test('SEO: an unknown robots value is dropped', () => {
  assert.equal(validateMeta({ title: 'T', description: 'D', robots: '"><script>' }).values.robots, '');
});

test('SEO: length guidance', () => {
  assert.equal(lengthState(0, LIMITS.title).cls, '');
  assert.equal(lengthState(10, LIMITS.title).cls, 'warn');
  assert.equal(lengthState(45, LIMITS.title).cls, 'good');
  assert.equal(lengthState(80, LIMITS.title).cls, 'warn');
});

test('FAQ: empty and half-filled rows', () => {
  assert.equal(validateFaq([{ question: '', answer: '' }]).valid, false);
  const half = validateFaq([{ question: 'Q?', answer: '' }, { question: '', answer: 'A' }]);
  assert.equal(half.valid, false);
  assert.ok(half.rowErrors[0].answer && half.rowErrors[1].question);
  const ok = validateFaq([{ question: ' Q? ', answer: ' A ' }, { question: '', answer: '  ' }]);
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.complete, [{ question: 'Q?', answer: 'A' }]);
});

test('FAQ: output is valid FAQPage JSON and keeps order', () => {
  const pairs = [{ question: 'First?', answer: 'One' }, { question: 'Second?', answer: 'Two' }];
  const parsed = JSON.parse(buildFaqOutput(pairs, false));
  assert.equal(parsed['@context'], 'https://schema.org');
  assert.equal(parsed['@type'], 'FAQPage');
  assert.deepEqual(parsed.mainEntity.map((q) => q.name), ['First?', 'Second?']);
  assert.equal(parsed.mainEntity[0]['@type'], 'Question');
  assert.deepEqual(parsed.mainEntity[1].acceptedAnswer, { '@type': 'Answer', text: 'Two' });
});

test('FAQ: special characters round-trip and cannot close the script element', () => {
  const nasty = 'He said "hi" \\ back\nnew line </script><script>alert(1)</script> <!-- x --> ünï 日本語 🚀  ';
  const pairs = [{ question: nasty, answer: nasty }];
  const json = serializeJsonLd(buildFaqObject(pairs));
  assert.ok(!json.includes('<'), 'no raw < remains');
  assert.equal(JSON.parse(json).mainEntity[0].name, nasty);
  const wrapped = buildFaqOutput(pairs, true);
  assert.equal(wrapped.match(/<script/g).length, 1);
  assert.equal(wrapped.match(/<\/script>/g).length, 1);
  const inner = wrapped.replace(/^<script type="application\/ld\+json">\n/, '').replace(/\n<\/script>\n$/, '');
  assert.equal(JSON.parse(inner).mainEntity[0].acceptedAnswer.text, nasty);
});

test('Prompt: no objective means no output', () => {
  assert.equal(buildPrompt({}), '');
  assert.equal(buildPrompt({ role: 'a writer', context: 'x' }), '');
});

test('Prompt: sections appear in order and empty ones are omitted', () => {
  const prompt = buildPrompt({
    role: 'You are a marketing strategist.', objective: 'Write a plan.',
    instructions: '- step one\n2. step two\n\n* step three', constraints: 'short\nno jargon', format: 'A table'
  });
  assert.equal(prompt,
    '# Role\nYou are a marketing strategist.\n\n# Objective\nWrite a plan.\n\n' +
    '# Instructions\n1. step one\n2. step two\n3. step three\n\n# Constraints\n- short\n- no jargon\n\n# Output format\nA table\n');
  assert.equal(buildPrompt({ objective: 'Only this' }), '# Objective\nOnly this\n');
});

test('Prompt: is deterministic and keeps special characters as typed', () => {
  const raw = { objective: 'Explain <b>"this"</b> & that 🚀', input: '{"a": 1}' };
  assert.equal(buildPrompt(raw), buildPrompt(raw));
  assert.ok(buildPrompt(raw).includes('<b>"this"</b> & that 🚀'));
});

test('Prompt: toLines and tips', () => {
  assert.deepEqual(toLines(' a \n\n- b\n3) c '), ['a', 'b', 'c']);
  assert.equal(promptTips({}).filter((t) => t.ok).length, 1); // only "no placeholders" passes when empty
  const tips = promptTips({ objective: 'Write [x]' });
  assert.equal(tips.at(-1).ok, false);
});

test('Prompt: every template is complete, unique and builds a prompt', () => {
  const ids = new Set(TEMPLATES.map((t) => t.id));
  assert.equal(ids.size, TEMPLATES.length);
  const categories = new Set(TEMPLATES.map((t) => t.category));
  assert.equal(categories.size, 6);
  for (const t of TEMPLATES) {
    for (const f of ['role', 'objective', 'context', 'input', 'instructions', 'constraints', 'tone', 'format']) {
      assert.ok(clean(t.fields[f]), `${t.id}.${f}`);
    }
    assert.ok(buildPrompt(t.fields).startsWith('# Role\nYou are '), t.id);
  }
});

// ── Page checker (pure functions; HTML parsing itself is covered by browser QA) ──
const { keywordCandidates, recommendTitles, recommendDescriptions, pageFindings, analyzePage } = await import('../assets/tools/js/page-analyzer.js');

const samplePage = {
  url: 'https://www.riveraplumbing.example/emergency/',
  title: 'Home',
  description: '',
  canonical: '', robots: '', ogTitle: '', ogDescription: '', ogImage: '', siteName: '',
  h1: ['Emergency Plumber in Austin'],
  h2: ['Water heater repair', 'Drain cleaning'],
  paragraphs: [
    'Rivera Plumbing provides emergency plumber services across Austin, with licensed technicians available day and night. We fix leaks, clogged drains and broken water heaters.',
    'Our water heater repair team carries common parts, so most water heater repair visits are finished in one trip.'
  ],
  text: 'Rivera Plumbing provides emergency plumber services across Austin, with licensed technicians available day and night. We fix leaks, clogged drains and broken water heaters.\nOur water heater repair team carries common parts, so most water heater repair visits are finished in one trip.\nCall the emergency plumber line for a fast response.',
  wordCount: 55, images: 4, imagesMissingAlt: 3
};

test('Analyzer: keywords favour repeated phrases and heading terms, without stopwords', () => {
  const phrases = keywordCandidates(samplePage).map((k) => k.phrase);
  assert.ok(phrases.includes('emergency plumber'), phrases.join(', '));
  assert.ok(phrases.some((p) => p.includes('water heater')), phrases.join(', '));
  assert.ok(phrases.length <= 8);
  for (const p of phrases) for (const w of p.split(' ')) assert.ok(!['the', 'and', 'our', 'with'].includes(w), p);
  assert.equal(new Set(phrases).size, phrases.length);
});

test('Analyzer: findings flag short title, missing description, alt text and thin content', () => {
  const { findings } = analyzePage(samplePage);
  const text = findings.map((f) => `${f.level}:${f.text}`).join('\n');
  assert.match(text, /warn:The title tag is short \(4 characters\)/);
  assert.match(text, /bad:No meta description found/);
  assert.match(text, /ok:The page has one H1 heading/);
  assert.match(text, /warn:No canonical link found/);
  assert.match(text, /3 of 4 images have no alt attribute/);
  assert.match(text, /Only about 55 words/);
});

test('Analyzer: noindex is reported as a problem', () => {
  const f = pageFindings({ ...samplePage, robots: 'NOINDEX, follow' }, []);
  assert.ok(f.some((x) => x.level === 'bad' && /noindex/.test(x.text)));
});

test('Analyzer: title suggestions come from the H1 and stay within 60 characters', () => {
  const titles = recommendTitles(samplePage, keywordCandidates(samplePage));
  assert.ok(titles.length >= 1 && titles.length <= 3);
  assert.equal(titles[0].text, 'Emergency Plumber in Austin | Riveraplumbing');
  for (const t of titles) assert.ok(t.text.length <= 60 && t.note, t.text);
  const long = recommendTitles({ ...samplePage, title: 'A very long page title that keeps going well past the sixty character guide | Rivera Plumbing', h1: [] }, []);
  assert.ok(long.length >= 1);
  for (const t of long) assert.ok(t.text.length <= 60, t.text);
});

test('Analyzer: a good existing title and description are kept as the first option', () => {
  const good = { ...samplePage, title: 'Emergency Plumber in Austin, TX | Rivera Plumbing', description: 'Licensed Austin plumbers for leaks, clogged drains and water heater repair. Same-day appointments and upfront pricing.' };
  assert.equal(recommendTitles(good, [])[0].text, good.title);
  assert.equal(recommendDescriptions(good, [])[0].text, good.description);
});

test('Analyzer: description suggestions use page text and stay within 160 characters', () => {
  const descs = recommendDescriptions(samplePage, keywordCandidates(samplePage));
  assert.ok(descs.length >= 1);
  for (const d of descs) {
    assert.ok(d.text.length >= 50 && d.text.length <= 160, `${d.text.length}: ${d.text}`);
    assert.ok(samplePage.text.includes(d.text.slice(0, 40)), 'taken from the page, not invented');
  }
});

test('Analyzer: an empty page produces no suggestions and does not throw', () => {
  const empty = { url: '', title: '', description: '', h1: [], h2: [], paragraphs: [], text: '', wordCount: 0, images: 0, imagesMissingAlt: 0 };
  const r = analyzePage(empty);
  assert.deepEqual([r.keywords.length, r.titles.length, r.descriptions.length], [0, 0, 0]);
  assert.ok(r.findings.some((f) => f.level === 'bad'));
});

// ── Invoice Generator ──
const { computeInvoice, validateInvoice, formatMoney, formatDate, buildInvoiceDocument } = await import('../assets/tools/js/invoice.js');

test('Invoice: totals with percentage discount and tax', () => {
  const t = computeInvoice({ items: [{ description: 'A', quantity: '1', price: '650' }, { description: 'B', quantity: '3', price: '180' }, { description: 'C', quantity: '2', price: '75' }, { description: '', quantity: '', price: '' }], discountType: 'percent', discountValue: '10', taxRate: '8.25' });
  assert.equal(t.lines.length, 3);
  assert.deepEqual([t.subtotal, t.discount, t.taxable, t.tax, t.total], [1340, 134, 1206, 99.5, 1305.5]);
});

test('Invoice: fixed discount is capped at the subtotal; rounding to cents', () => {
  const capped = computeInvoice({ items: [{ description: 'A', quantity: '1', price: '50' }], discountType: 'fixed', discountValue: '80', taxRate: '20' });
  assert.deepEqual([capped.discount, capped.tax, capped.total], [50, 0, 0]);
  const cents = computeInvoice({ items: [{ description: 'A', quantity: '3', price: '0.1' }, { description: 'B', quantity: '1.5', price: '19.99' }], discountType: 'fixed', discountValue: '', taxRate: '7.5' });
  assert.deepEqual([cents.lines[0].amount, cents.lines[1].amount, cents.subtotal, cents.tax, cents.total], [0.3, 29.99, 30.29, 2.27, 32.56]);
});

test('Invoice: validation of required fields, rows, dates and rates', () => {
  const base = { fromName: 'Me', toName: 'Client', issueDate: '2026-11-14', dueDate: '', taxRate: '', discountType: 'percent', discountValue: '', items: [{ description: 'Work', quantity: '1', price: '100' }] };
  assert.equal(validateInvoice(base).valid, true);
  assert.ok(validateInvoice({ ...base, fromName: ' ' }).errors.fromName);
  assert.ok(validateInvoice({ ...base, toName: '' }).errors.toName);
  assert.ok(validateInvoice({ ...base, dueDate: '2026-11-01' }).errors.dueDate);
  assert.ok(validateInvoice({ ...base, taxRate: '140' }).errors.taxRate);
  assert.ok(validateInvoice({ ...base, discountValue: '120' }).errors.discountValue);
  assert.ok(validateInvoice({ ...base, items: [{ description: '', quantity: '', price: '' }] }).errors.items);
  const partial = validateInvoice({ ...base, items: [{ description: 'Work', quantity: '0', price: '' }] });
  assert.equal(partial.valid, false);
  assert.ok(partial.rows[0].quantity && partial.rows[0].price);
  assert.equal(validateInvoice({ ...base, items: [{ description: 'Free item', quantity: '1', price: '0' }] }).valid, true);
});

test('Invoice: money, dates and the downloaded document', () => {
  assert.equal(formatMoney(1305.5, 'USD'), '$1,305.50');
  assert.equal(formatMoney(1200, 'JPY'), '¥1,200');
  assert.equal(formatDate('2026-11-14'), 'Nov 14, 2026');
  assert.equal(formatDate('not a date'), '');
  const doc = buildInvoiceDocument('<div class="inv">x</div>', 'Invoice </title><script>alert(1)</script>');
  assert.ok(doc.startsWith('<!DOCTYPE html>') && doc.includes('<div class="inv">x</div>'));
  assert.ok(doc.includes('<title>Invoice &lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>'));
  assert.equal((doc.match(/<script/g) || []).length, 0);
});

// ── Automation ROI Calculator ──
const { computeRoi, roiProblem, buildRoiSummary, paybackText } = await import('../assets/tools/js/roi-calculator.js');

test('ROI: worked example matches hand calculation', () => {
  const input = {
    tasks: [{ name: 'Follow-up', hours: '6', people: '1', automatable: '80' }, { name: 'Booking', hours: '4', people: '1', automatable: '70' }, { name: 'Data entry', hours: '3', people: '2', automatable: '90' }],
    hourlyCost: '28', weeksPerYear: '48', missedLeads: '10', recoverable: '30', closeRate: '20', averageSale: '400', setupCost: '2500', monthlyCost: '150'
  };
  const r = computeRoi(input);
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} vs ${b}`);
  close(r.hoursSaved, (4.8 + 2.8 + 5.4) * 48);          // 624 hours
  close(r.labourValue, 624 * 28);                        // 17,472
  close(r.recoveredRevenue, 10 * 0.3 * 0.2 * 400 * 12);  // 2,880
  close(r.benefit, 20352);
  close(r.cost, 2500 + 1800);
  close(r.net, 16052);
  close(r.roiPercent, (16052 / 4300) * 100);
  close(r.paybackMonths, 2500 / (20352 / 12 - 150));
  assert.equal(roiProblem(input), '');
  const summary = buildRoiSummary(r, 'USD');
  assert.ok(summary.includes('Total: 624 hours') && summary.includes('$20,352.00') && summary.includes('not a guarantee'));
});

test('ROI: empty and incomplete input give a clear message, not numbers', () => {
  const empty = { tasks: [{ name: '', hours: '', people: '1', automatable: '70' }] };
  assert.equal(computeRoi(empty).valid, false);
  assert.match(roiProblem(empty), /Add at least one task/);
  assert.match(roiProblem({ tasks: [{ hours: '5' }], hourlyCost: '' }), /hourly cost/);
  assert.match(roiProblem({ tasks: [], missedLeads: '5' }), /close rate/);
});

test('ROI: no cost means no ROI figure; costs above benefit never pay back', () => {
  const free = computeRoi({ tasks: [{ hours: '2', people: '', automatable: '' }], hourlyCost: '20', weeksPerYear: '' });
  assert.equal(free.hoursSaved, 96);
  assert.equal(free.roiPercent, null);
  assert.equal(paybackText(free.paybackMonths), 'Immediate (no setup cost)');
  const bad = computeRoi({ tasks: [{ hours: '1' }], hourlyCost: '10', setupCost: '5000', monthlyCost: '500' });
  assert.ok(bad.net < 0 && bad.paybackMonths === null);
  assert.equal(paybackText(null), 'Not reached at these numbers');
  assert.equal(computeRoi({ tasks: [{ hours: '-5' }], hourlyCost: '-3' }).valid, false);
});

// ── SMS Segment and Cost Calculator ──
const { analyzeSms, plainText, campaignCost, describeChar, buildSmsReport } = await import('../assets/tools/js/sms-calculator.js');

test('SMS: GSM-7 boundaries at 160 and 153', () => {
  assert.equal(analyzeSms('').segmentCount, 0);
  const a160 = analyzeSms('a'.repeat(160));
  assert.deepEqual([a160.encoding, a160.segmentCount, a160.remaining], ['GSM-7', 1, 0]);
  const a161 = analyzeSms('a'.repeat(161));
  assert.deepEqual([a161.segmentCount, a161.perSegment, a161.segments[0].units, a161.segments[1].units], [2, 153, 153, 8]);
  assert.equal(analyzeSms('a'.repeat(306)).segmentCount, 2);
  assert.equal(analyzeSms('a'.repeat(307)).segmentCount, 3);
});

test('SMS: extension characters count double and are not split across segments', () => {
  const euro = analyzeSms('€'.repeat(80));
  assert.deepEqual([euro.encoding, euro.units, euro.segmentCount], ['GSM-7', 160, 1]);
  const split = analyzeSms('a'.repeat(152) + '€' + 'a'.repeat(10));
  assert.equal(split.segmentCount, 2);
  assert.equal(split.segments[0].units, 152);
  assert.ok(split.segments[1].text.startsWith('€'));
  assert.equal(analyzeSms('[test] {x}').doubleCount, 4);
});

test('SMS: one non-GSM character switches to UCS-2 with 70 and 67 limits', () => {
  const curly = analyzeSms('It’s ready');
  assert.equal(curly.encoding, 'UCS-2');
  assert.deepEqual(curly.nonGsm, [{ char: '’', count: 1, fixable: true }]);
  assert.equal(analyzeSms('я'.repeat(70)).segmentCount, 1);
  const u71 = analyzeSms('я'.repeat(71));
  assert.deepEqual([u71.segmentCount, u71.perSegment], [2, 67]);
  const emoji = analyzeSms('😀'.repeat(36));
  assert.deepEqual([emoji.units, emoji.characters, emoji.segmentCount], [72, 36, 2]);
  assert.equal(emoji.segments[0].units, 66, 'surrogate pair not split');
  assert.equal(emoji.nonGsm[0].fixable, false);
  assert.equal(analyzeSms('a'.repeat(150) + '😀').segmentCount, 3);
});

test('SMS: plainText replaces typographic characters and restores GSM-7', () => {
  const messy = 'Hi – it’s “here”… ok now​';
  assert.equal(plainText(messy), 'Hi - it\'s "here"... ok now');
  assert.equal(analyzeSms(plainText(messy)).encoding, 'GSM-7');
  assert.equal(plainText('Olá 😀'), 'Olá 😀');
  assert.equal(describeChar('’'), '’ (U+2019)');
  assert.equal(describeChar(' '), 'non-breaking space (U+00A0)');
});

test('SMS: campaign cost, merge fields and line endings', () => {
  assert.deepEqual(campaignCost(2, '2500', '0.01'), { recipients: 2500, totalSegments: 5000, cost: 50 });
  assert.deepEqual(campaignCost(3, '', ''), { recipients: 0, totalSegments: 0, cost: 0 });
  assert.equal(campaignCost(1, '-5', '-1').cost, 0);
  assert.equal(analyzeSms('Hi {{contact.first_name}}').hasMergeFields, true);
  assert.equal(analyzeSms('a\r\nb').units, 3);
  const a = analyzeSms('Hello');
  assert.ok(buildSmsReport('Hello', a, campaignCost(1, '10', '0.02'), 'USD').includes('Estimated cost: USD 0.20'));
});
