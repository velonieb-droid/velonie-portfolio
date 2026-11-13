// AI Prompt Builder. Deterministic text assembly in the browser: no AI model or API is called.
import { createTracker, wireOutputActions, setStatus } from './core.js';
import { TEMPLATES, TONES } from './prompt-templates.js';

const FIELDS = ['role', 'objective', 'context', 'input', 'instructions', 'constraints', 'tone', 'format'];
const trim = (value) => String(value ?? '').trim();

/** Split a multi-line field into clean lines, removing any list markers the visitor typed. */
export function toLines(value) {
  return trim(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
}

/** Assemble the prompt. Returns '' when there is no objective, so nothing misleading is shown. */
export function buildPrompt(raw) {
  const v = Object.fromEntries(FIELDS.map((f) => [f, trim(raw[f])]));
  if (!v.objective) return '';
  const sections = [];
  if (v.role) {
    const role = v.role.replace(/^you are\s+/i, '').replace(/\.$/, '');
    sections.push(`# Role\nYou are ${role}.`);
  }
  sections.push(`# Objective\n${v.objective}`);
  if (v.context) sections.push(`# Context\n${v.context}`);
  if (v.input) sections.push(`# Input\n${v.input}`);
  const steps = toLines(v.instructions);
  if (steps.length) sections.push('# Instructions\n' + steps.map((line, i) => `${i + 1}. ${line}`).join('\n'));
  const limits = toLines(v.constraints);
  if (limits.length) sections.push('# Constraints\n' + limits.map((line) => `- ${line}`).join('\n'));
  if (v.tone) sections.push(`# Tone\n${v.tone}`);
  if (v.format) sections.push(`# Output format\n${v.format}`);
  return sections.join('\n\n') + '\n';
}

/** Rule-based quality checks. Each item is { ok, text }. */
export function promptTips(raw) {
  const v = Object.fromEntries(FIELDS.map((f) => [f, trim(raw[f])]));
  const all = FIELDS.map((f) => v[f]).join('\n');
  return [
    { ok: v.objective.length >= 25, text: 'State the objective as a specific task with a clear result.' },
    { ok: !!v.role, text: 'Give the assistant a role so it answers from the right expertise.' },
    { ok: v.context.length >= 20, text: 'Add context: who it is for, the business and the situation.' },
    { ok: toLines(v.instructions).length >= 2, text: 'Break the work into at least two instruction steps.' },
    { ok: toLines(v.constraints).length >= 1, text: 'Add constraints such as length limits or things to avoid.' },
    { ok: !!v.format, text: 'Describe the output format you want back.' },
    { ok: !/\[[^\]\n]+\]/.test(all), text: 'Replace every [placeholder] with your own details.' }
  ];
}

function init() {
  const form = document.getElementById('promptForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const output = $('output');
  const empty = $('emptyState');
  const result = $('resultState');
  const copyBtn = $('copyBtn');
  const downloadBtn = $('downloadBtn');
  const statusEl = $('status');
  const editedNote = $('editedNote');
  const templateSelect = $('template');
  const tracker = createTracker('ai_prompt_builder');
  let edited = false;

  // Build the template menu, grouped by category.
  const groups = new Map();
  TEMPLATES.forEach((t) => {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  });
  groups.forEach((list, category) => {
    const group = document.createElement('optgroup');
    group.label = category;
    list.forEach((t) => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.name;
      group.appendChild(option);
    });
    templateSelect.appendChild(group);
  });
  TONES.forEach((tone) => {
    const option = document.createElement('option');
    option.value = tone;
    $('toneList').appendChild(option);
  });

  const read = () => Object.fromEntries(FIELDS.map((f) => [f, $(f).value]));

  function renderTips(values) {
    const list = $('tips');
    list.replaceChildren();
    promptTips(values).forEach((tip) => {
      const li = document.createElement('li');
      if (tip.ok) li.className = 'done';
      li.textContent = tip.text;
      list.appendChild(li);
    });
  }

  function setAvailability(hasText) {
    copyBtn.disabled = downloadBtn.disabled = !hasText;
  }

  function render(force) {
    const values = read();
    renderTips(values);
    const prompt = buildPrompt(values);
    const hasObjective = !!prompt;
    $('objectiveErr').textContent = '';
    $('objective').setAttribute('aria-invalid', 'false');

    // Never overwrite text the visitor has edited by hand unless they ask for it.
    if (edited && !force) return;
    edited = false;
    editedNote.hidden = true;
    output.value = prompt;
    empty.hidden = hasObjective;
    result.hidden = !hasObjective;
    setAvailability(hasObjective);
    if (hasObjective) tracker.generate();
  }

  form.addEventListener('input', () => render(false));
  form.addEventListener('submit', (event) => event.preventDefault());
  $('objective').addEventListener('blur', () => {
    const others = FIELDS.some((f) => f !== 'objective' && trim($(f).value));
    if (!trim($('objective').value) && others) {
      $('objectiveErr').textContent = 'Enter the main objective to build the prompt.';
      $('objective').setAttribute('aria-invalid', 'true');
    }
  });

  output.addEventListener('input', () => {
    edited = true;
    editedNote.hidden = false;
    setAvailability(!!trim(output.value));
  });

  $('regenBtn').addEventListener('click', () => {
    render(true);
    setStatus(statusEl, 'Prompt rebuilt from the form.', 'ok');
  });

  templateSelect.addEventListener('change', () => {
    const template = TEMPLATES.find((t) => t.id === templateSelect.value);
    if (!template) return;
    const hasWork = edited || FIELDS.some((f) => trim($(f).value));
    if (hasWork && !window.confirm('Load this template? It replaces what is in the form now.')) {
      templateSelect.value = '';
      return;
    }
    FIELDS.forEach((f) => { $(f).value = template.fields[f] || ''; });
    render(true);
    setStatus(statusEl, 'Template loaded. Replace the [placeholders] with your details.', 'ok');
  });

  $('resetBtn').addEventListener('click', () => {
    form.reset();
    render(true);
    setStatus(statusEl, 'Form cleared.', 'ok');
    $('role').focus();
  });

  wireOutputActions({
    copyBtn, downloadBtn, statusEl, tracker,
    getOutput: () => (trim(output.value) ? output.value : ''),
    filename: 'ai-prompt.txt',
    mime: 'text/plain'
  });

  render(true);
  tracker.open();
}

if (typeof document !== 'undefined') init();
