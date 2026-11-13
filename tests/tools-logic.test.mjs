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
