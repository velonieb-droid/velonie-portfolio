// SMS Segment and Cost Calculator. Counts characters and segments the way SMS encoding works (GSM-7 and UCS-2).
import { createTracker, copyText, downloadText, setStatus, CURRENCIES, toNumber } from './core.js';

// GSM 03.38 basic character set (each counts as 1) and extension set (each counts as 2).
const GSM_BASIC = new Set('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ!"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà');
const GSM_EXT = new Set('^{}\\[~]|€\f');

export const LIMITS = { 'GSM-7': { single: 160, multi: 153 }, 'UCS-2': { single: 70, multi: 67 } };

// Characters that often arrive from word processors and phones and have a plain equivalent.
const REPLACEMENTS = {
  '‘': "'", '’': "'", '‚': "'", '′': "'", '“': '"', '”': '"', '„': '"', '″': '"',
  '–': '-', '—': '-', '−': '-', '…': '...', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
  '​': '', '‌': '', '‍': '', '﻿': '', '•': '-', '«': '"', '»': '"', '\t': ' '
};

const NAMES = { ' ': 'non-breaking space', '​': 'zero-width space', '‍': 'zero-width joiner', '﻿': 'byte order mark', '\t': 'tab', ' ': 'thin space', ' ': 'narrow space' };

export function describeChar(char) {
  const code = 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  return NAMES[char] ? `${NAMES[char]} (${code})` : `${char} (${code})`;
}

/** Replace typographic characters with plain ones. Emoji and non-Latin letters are left alone. */
export function plainText(text) {
  return Array.from(String(text ?? '')).map((char) => (char in REPLACEMENTS ? REPLACEMENTS[char] : char)).join('');
}

export function analyzeSms(text) {
  const chars = Array.from(String(text ?? '').replace(/\r\n/g, '\n'));
  const nonGsm = new Map();
  chars.forEach((char) => {
    if (!GSM_BASIC.has(char) && !GSM_EXT.has(char)) nonGsm.set(char, (nonGsm.get(char) || 0) + 1);
  });
  const encoding = nonGsm.size ? 'UCS-2' : 'GSM-7';
  const limit = LIMITS[encoding];
  // GSM-7: extension characters take two septets. UCS-2: characters outside the basic plane take two 16-bit units.
  const unitsOf = (char) => (encoding === 'GSM-7' ? (GSM_EXT.has(char) ? 2 : 1) : char.length);
  const units = chars.reduce((sum, char) => sum + unitsOf(char), 0);

  let segments = [];
  if (units > 0 && units <= limit.single) segments = [{ text: chars.join(''), units }];
  else if (units > limit.single) {
    // A two-unit character is never split across segments, so a segment can end one unit short.
    let current = { text: '', units: 0 };
    chars.forEach((char) => {
      const size = unitsOf(char);
      if (current.units + size > limit.multi) { segments.push(current); current = { text: '', units: 0 }; }
      current.text += char;
      current.units += size;
    });
    if (current.units) segments.push(current);
  }
  const perSegment = segments.length > 1 ? limit.multi : limit.single;
  const used = segments.length ? segments[segments.length - 1].units : 0;
  return {
    encoding, units, characters: chars.length, segments, segmentCount: segments.length, perSegment,
    remaining: segments.length ? perSegment - used : limit.single,
    doubleCount: encoding === 'GSM-7' ? chars.filter((char) => GSM_EXT.has(char)).length : 0,
    nonGsm: Array.from(nonGsm.entries()).map(([char, count]) => ({ char, count, fixable: char in REPLACEMENTS })),
    hasMergeFields: /\{\{[^{}]*\}\}/.test(String(text ?? ''))
  };
}

/** Cost of one send. rate is the visitor's own price per segment. */
export function campaignCost(segmentCount, recipients, rate) {
  const people = Math.max(Math.floor(toNumber(recipients)), 0);
  const totalSegments = segmentCount * people;
  return { recipients: people, totalSegments, cost: totalSegments * Math.max(toNumber(rate), 0) };
}

export function buildSmsReport(text, analysis, cost, currency) {
  const lines = [
    'SMS SEGMENT REPORT', '',
    `Encoding: ${analysis.encoding}`,
    `Length: ${analysis.units} ${analysis.encoding === 'GSM-7' ? 'GSM characters' : 'UCS-2 units'}`,
    `Segments per message: ${analysis.segmentCount}`
  ];
  if (cost.recipients > 0) {
    lines.push(`Recipients: ${cost.recipients.toLocaleString('en')}`, `Segments billed for the send: ${cost.totalSegments.toLocaleString('en')}`);
    if (cost.cost > 0) lines.push(`Estimated cost: ${currency} ${cost.cost.toFixed(2)} (at the rate you entered)`);
  }
  if (analysis.hasMergeFields) lines.push('Note: merge fields are counted as typed. Real length depends on each contact.');
  lines.push('', 'Message:', text);
  return lines.join('\n') + '\n';
}

function init() {
  const form = document.getElementById('smsForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const message = $('message');
  const empty = $('emptyState');
  const result = $('resultState');
  const statusEl = $('status');
  const tracker = createTracker('sms_segment_calculator');
  let report = '';

  CURRENCIES.forEach((code) => $('currency').appendChild(Object.assign(document.createElement('option'), { value: code, textContent: code })));

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function render() {
    const text = message.value;
    const a = analyzeSms(text);
    const has = a.segmentCount > 0;
    empty.hidden = has;
    result.hidden = !has;
    $('copyBtn').disabled = $('downloadBtn').disabled = !has;
    $('liveCount').textContent = has
      ? `${a.units} / ${a.perSegment * a.segmentCount} · ${a.segmentCount} segment${a.segmentCount === 1 ? '' : 's'} · ${a.remaining} left in this segment`
      : `0 / ${LIMITS['GSM-7'].single}`;
    if (!has) { report = ''; $('fixBtn').hidden = true; return; }

    const cost = campaignCost(a.segmentCount, $('recipients').value, $('rate').value);
    const currency = $('currency').value;
    $('outEncoding').textContent = a.encoding;
    $('outEncodingNote').textContent = a.encoding === 'GSM-7' ? 'Standard text: 160 per message, 153 when split' : 'Special characters: 70 per message, 67 when split';
    $('outLength').textContent = String(a.units);
    $('outLengthNote').textContent = a.encoding === 'GSM-7'
      ? (a.doubleCount ? `${a.doubleCount} character${a.doubleCount === 1 ? '' : 's'} count double: ^ { } [ ] \\ ~ | €` : 'characters')
      : (a.units !== a.characters ? `${a.characters} visible characters; emoji count as 2 or more` : 'characters');
    $('outSegments').textContent = String(a.segmentCount);
    $('outSegmentsNote').textContent = `billed per message, ${a.perSegment} per segment`;
    $('outCost').textContent = cost.recipients > 0 && cost.cost > 0 ? `${currency} ${cost.cost.toFixed(2)}` : '—';
    $('outCostNote').textContent = cost.recipients > 0
      ? `${cost.totalSegments.toLocaleString('en')} segments for ${cost.recipients.toLocaleString('en')} recipient${cost.recipients === 1 ? '' : 's'}${cost.cost > 0 ? '' : '. Enter your rate to see the cost'}`
      : 'Enter recipients and your rate';

    const notes = $('issues');
    notes.replaceChildren();
    const fixable = a.nonGsm.filter((n) => n.fixable);
    if (a.encoding === 'UCS-2') {
      const li = el('li', 'warn');
      li.append('These characters switch the whole message to UCS-2, which fits fewer characters per segment: ');
      a.nonGsm.forEach((n, i) => { li.append(el('code', '', describeChar(n.char)), ` ×${n.count}${i < a.nonGsm.length - 1 ? ', ' : ''}`); });
      notes.appendChild(li);
      const plain = analyzeSms(plainText(text));
      if (fixable.length && (plain.encoding !== a.encoding || plain.segmentCount < a.segmentCount)) {
        notes.appendChild(el('li', 'ok', `Replacing the typographic characters with plain ones would make this ${plain.segmentCount} segment${plain.segmentCount === 1 ? '' : 's'} (${plain.encoding}) instead of ${a.segmentCount}.`));
      } else if (!fixable.length) {
        notes.appendChild(el('li', 'warn', 'These are emoji or non-Latin letters, which have no plain equivalent. Remove them to return to standard text, or keep them and accept the shorter limit.'));
      }
    } else {
      notes.appendChild(el('li', 'ok', 'Every character is in the standard GSM-7 set.'));
    }
    if (a.segmentCount > 1) notes.appendChild(el('li', 'warn', `This message is sent as ${a.segmentCount} segments and billed as ${a.segmentCount} messages per recipient.`));
    if (a.hasMergeFields) notes.appendChild(el('li', 'warn', 'Merge fields such as {{contact.first_name}} are counted as typed. The real length depends on each contact, so leave some room.'));
    $('fixBtn').hidden = !fixable.length;

    const segs = $('segments');
    segs.replaceChildren();
    a.segments.forEach((segment, index) => {
      const li = el('li');
      li.append(el('span', 'seg-meta', `Segment ${index + 1} · ${segment.units} / ${a.perSegment}`), el('p', 'seg-text', segment.text));
      segs.appendChild(li);
    });

    report = buildSmsReport(text, a, cost, currency);
    tracker.generate();
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => event.preventDefault());

  $('fixBtn').addEventListener('click', () => {
    message.value = plainText(message.value);
    render();
    setStatus(statusEl, 'Typographic characters replaced with plain ones.', 'ok');
  });

  $('resetBtn').addEventListener('click', () => {
    form.reset();
    render();
    setStatus(statusEl, 'Calculator cleared.', 'ok');
    message.focus();
  });

  $('exampleBtn').addEventListener('click', () => {
    message.value = 'Hi {{contact.first_name}}, it’s Maria from Northside Dental — your cleaning is due. Reply YES to book this week… or call 555-0142. Reply STOP to opt out.';
    $('recipients').value = '2500';
    $('rate').value = '0.01';
    render();
  });

  // Copy gives the message itself; the download is the full report.
  $('copyBtn').addEventListener('click', async () => {
    if (!message.value) return;
    const ok = await copyText(message.value);
    setStatus(statusEl, ok ? 'Message copied to clipboard.' : 'Copy failed. Select the text and copy it manually.', ok ? 'ok' : 'bad');
    if (ok) tracker.copy();
  });
  $('downloadBtn').addEventListener('click', () => {
    if (!report) return;
    try {
      downloadText('sms-segment-report.txt', report, 'text/plain');
      setStatus(statusEl, 'Download started.', 'ok');
      tracker.download();
    } catch {
      setStatus(statusEl, 'Download failed in this browser. Use Copy instead.', 'bad');
    }
  });

  render();
  tracker.open();
}

if (typeof document !== 'undefined') init();
