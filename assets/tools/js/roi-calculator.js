// Automation ROI Calculator. Plain arithmetic on the visitor's own numbers, in the browser.
import { clean, createTracker, wireOutputActions, setStatus, CURRENCIES, formatMoney, toNumber } from './core.js';

const pos = (value) => Math.max(toNumber(value), 0);
const pct = (value) => Math.min(pos(value), 100) / 100;
const blank = (value) => String(value ?? '').trim() === '';

/**
 * Common tasks with a starting estimate of how much of each a workflow can take over.
 * These are judgement-based starting points, not measured statistics:
 *   90 = rule-based from start to finish (a trigger, then fixed steps)
 *   80 = rule-based, with a person handling the exceptions
 *   70 = mostly rule-based, but someone reviews or approves the result
 *   60 = the routine parts automate; the writing or decisions stay with a person
 *   50 = automation handles the common cases only
 */
export const TASK_PRESETS = [
  { group: 'Leads and sales', tasks: [
    ['Following up new leads', 80],
    ['Entering lead details into the CRM', 90],
    ['Moving deals and creating follow-up tasks', 80],
    ['Asking qualifying questions before a call', 60],
    ['Preparing quotes or proposals from a template', 60]
  ] },
  { group: 'Scheduling', tasks: [
    ['Booking and rescheduling appointments', 80],
    ['Sending appointment reminders', 90],
    ['Following up missed appointments', 80]
  ] },
  { group: 'Customer communication', tasks: [
    ['Answering common customer questions', 50],
    ['Sending onboarding emails and forms', 80],
    ['Requesting reviews and feedback', 90],
    ['Chasing documents or missing information', 70]
  ] },
  { group: 'Admin and data', tasks: [
    ['Copying data between tools', 90],
    ['Building weekly or monthly reports', 70],
    ['Creating invoices and payment reminders', 70],
    ['Updating spreadsheets from forms or emails', 80]
  ] },
  { group: 'Marketing', tasks: [
    ['Sending email nurture sequences', 60],
    ['Scheduling social media posts', 60]
  ] }
];

/**
 * hours saved per year = sum of (hours per week x people x share that can be automated) x working weeks
 * labour value         = hours saved x hourly cost
 * recovered revenue    = missed leads per month x share recoverable x close rate x average sale x 12
 * first-year cost      = setup cost + monthly cost x 12
 */
export function computeRoi(input) {
  const weeks = Math.min(Math.max(blank(input.weeksPerYear) ? 48 : toNumber(input.weeksPerYear), 1), 52);
  const tasks = (input.tasks || [])
    .map((task) => {
      const people = blank(task.people) ? 1 : pos(task.people);
      const share = blank(task.automatable) ? 1 : pct(task.automatable);
      return { name: clean(task.name) || 'Unnamed task', weeklyHours: pos(task.hours) * people, hoursSaved: pos(task.hours) * people * share * weeks };
    })
    .filter((task) => task.weeklyHours > 0);
  const hoursSaved = tasks.reduce((sum, task) => sum + task.hoursSaved, 0);
  const labourValue = hoursSaved * pos(input.hourlyCost);
  const recoveredRevenue = pos(input.missedLeads) * pct(input.recoverable) * pct(input.closeRate) * pos(input.averageSale) * 12;
  const benefit = labourValue + recoveredRevenue;
  const setup = pos(input.setupCost);
  const monthly = pos(input.monthlyCost);
  const cost = setup + monthly * 12;
  const net = benefit - cost;
  const monthlyNet = benefit / 12 - monthly;
  let paybackMonths = null;
  if (benefit > 0 && monthlyNet > 0) paybackMonths = setup / monthlyNet;
  return {
    weeks, tasks, hoursSaved, labourValue, recoveredRevenue, benefit, setup, monthly, cost, net,
    roiPercent: cost > 0 ? (net / cost) * 100 : null,
    paybackMonths,
    valid: benefit > 0
  };
}

export function roiProblem(input) {
  const hasHours = (input.tasks || []).some((task) => pos(task.hours) > 0);
  const hasLeads = pos(input.missedLeads) > 0;
  if (!hasHours && !hasLeads) return 'Add at least one task with hours per week, or fill in the missed leads section.';
  if (hasHours && !(pos(input.hourlyCost) > 0) && !hasLeads) return 'Enter an hourly cost so the saved time can be valued.';
  if (!hasHours && hasLeads && !(pos(input.recoverable) > 0 && pos(input.closeRate) > 0 && pos(input.averageSale) > 0)) return 'To value missed leads, enter the share you could recover, your close rate and the average sale.';
  return '';
}

const hours = (n) => `${Math.round(n).toLocaleString('en')} hours`;
export const paybackText = (months) => {
  if (months === null) return 'Not reached at these numbers';
  if (months <= 0) return 'Immediate (no setup cost)';
  if (months < 1) return 'Less than 1 month';
  return `${months.toFixed(1)} months`;
};

export function buildRoiSummary(result, currency) {
  const money = (n) => formatMoney(n, currency);
  const lines = ['AUTOMATION ROI ESTIMATE', '(Based on the numbers entered. An estimate, not a guarantee.)', ''];
  if (result.tasks.length) {
    lines.push('Time that could be automated per year:');
    result.tasks.forEach((task) => lines.push(`- ${task.name}: ${hours(task.hoursSaved)}`));
    lines.push(`Total: ${hours(result.hoursSaved)} (${result.weeks} working weeks)`, `Value of that time: ${money(result.labourValue)}`, '');
  }
  if (result.recoveredRevenue > 0) lines.push(`Revenue from leads that are currently missed: ${money(result.recoveredRevenue)} per year`, '');
  lines.push(
    `Total yearly benefit: ${money(result.benefit)}`,
    `First-year cost: ${money(result.cost)} (setup ${money(result.setup)} + ${money(result.monthly)} per month)`,
    `First-year net result: ${money(result.net)}`,
    `First-year ROI: ${result.roiPercent === null ? 'n/a (no cost entered)' : Math.round(result.roiPercent) + '%'}`,
    `Payback period: ${paybackText(result.paybackMonths)}`
  );
  return lines.join('\n') + '\n';
}

function init() {
  const form = document.getElementById('roiForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const list = $('taskList');
  const empty = $('emptyState');
  const result = $('resultState');
  const statusEl = $('status');
  const tracker = createTracker('automation_roi_calculator');
  const globals = ['hourlyCost', 'weeksPerYear', 'missedLeads', 'recoverable', 'closeRate', 'averageSale', 'setupCost', 'monthlyCost'];
  const blankTask = () => ({ name: '', hours: '', people: '1', automatable: '70' });
  let tasks = [blankTask()];
  let summary = '';

  CURRENCIES.forEach((code) => $('currency').appendChild(Object.assign(document.createElement('option'), { value: code, textContent: code })));

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const read = () => ({ ...Object.fromEntries(globals.map((f) => [f, $(f).value])), tasks });

  function renderTasks(focusIndex) {
    list.replaceChildren();
    tasks.forEach((task, index) => {
      const n = index + 1;
      const field = (key, label, type, attrs = {}) => {
        const wrap = el('label', 'mini');
        const control = el('input');
        control.type = type;
        control.value = task[key];
        control.dataset.key = key;
        Object.entries(attrs).forEach(([k, v]) => control.setAttribute(k, v));
        control.addEventListener('input', () => { tasks[index][key] = control.value; render(); });
        wrap.append(el('span', '', label), control);
        return { wrap, control };
      };
      const name = field('name', `Task ${n} name`, 'text', { placeholder: 'Pick a suggestion above or type your own', autocomplete: 'off' });
      const hoursField = field('hours', 'Hours per week', 'number', { min: '0', step: 'any', inputmode: 'decimal' });
      const people = field('people', 'People', 'number', { min: '0', step: '1', inputmode: 'numeric' });
      const share = field('automatable', '% automatable', 'number', { min: '0', max: '100', step: '1', inputmode: 'numeric' });
      const remove = el('button', 'btn icon', '✕');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove task ${n}`);
      remove.addEventListener('click', () => {
        tasks.splice(index, 1);
        if (!tasks.length) tasks.push(blankTask());
        renderTasks(Math.min(index, tasks.length - 1));
      });
      name.wrap.classList.add('wide');
      // Suggestions fill the task name and a starting percentage. Both stay editable.
      const pickWrap = el('label', 'mini wide');
      const pick = el('select');
      pick.dataset.key = 'preset';
      pick.appendChild(Object.assign(el('option', '', 'Choose a common task…'), { value: '' }));
      TASK_PRESETS.forEach(({ group, tasks: options }) => {
        const optgroup = el('optgroup');
        optgroup.label = group;
        options.forEach(([label, percent]) => optgroup.appendChild(Object.assign(el('option', '', `${label} (about ${percent}%)`), { value: label })));
        pick.appendChild(optgroup);
      });
      pick.addEventListener('change', () => {
        const found = TASK_PRESETS.flatMap((g) => g.tasks).find(([label]) => label === pick.value);
        if (!found) return;
        tasks[index].name = found[0];
        tasks[index].automatable = String(found[1]);
        name.control.value = found[0];
        share.control.value = String(found[1]);
        pick.value = '';
        render();
        hoursField.control.focus();
      });
      pickWrap.append(el('span', '', `Suggestions for task ${n}`), pick);
      const row = el('li', 'task-row');
      row.append(pickWrap, name.wrap, hoursField.wrap, people.wrap, share.wrap, remove);
      list.appendChild(row);
      if (focusIndex === index) name.control.focus();
    });
    render();
  }

  function render() {
    const input = read();
    const currency = $('currency').value;
    const money = (n) => formatMoney(n, currency);
    const r = computeRoi(input);
    const problem = roiProblem(input);
    const ok = r.valid && !problem;
    empty.hidden = ok;
    result.hidden = !ok;
    $('copyBtn').disabled = $('downloadBtn').disabled = !ok;
    summary = ok ? buildRoiSummary(r, currency) : '';
    if (!ok) { empty.textContent = problem || 'Enter your numbers to see the estimate.'; return; }

    $('outHours').textContent = Math.round(r.hoursSaved).toLocaleString('en');
    $('outHoursNote').textContent = `about ${(r.hoursSaved / r.weeks).toFixed(1)} hours a week`;
    $('outBenefit').textContent = money(r.benefit);
    $('outNet').textContent = money(r.net);
    $('outNet').className = r.net < 0 ? 'neg' : '';
    $('outRoi').textContent = r.roiPercent === null ? 'n/a' : `${Math.round(r.roiPercent).toLocaleString('en')}%`;
    $('outPayback').textContent = paybackText(r.paybackMonths);

    const top = Math.max(r.benefit, r.cost, 1);
    const bar = (id, value) => { $(id).style.width = `${Math.max((value / top) * 100, value > 0 ? 2 : 0)}%`; $(id + 'Val').textContent = money(value); };
    bar('barLabour', r.labourValue);
    bar('barRevenue', r.recoveredRevenue);
    bar('barCost', r.cost);
    $('rowRevenue').hidden = !(r.recoveredRevenue > 0);
    $('costNote').hidden = r.cost > 0;
    $('summary').textContent = summary;
    tracker.generate();
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => event.preventDefault());
  $('addTaskBtn').addEventListener('click', () => { tasks.push(blankTask()); renderTasks(tasks.length - 1); });

  $('resetBtn').addEventListener('click', () => {
    form.reset();
    tasks = [blankTask()];
    renderTasks();
    setStatus(statusEl, 'Calculator cleared.', 'ok');
  });

  $('exampleBtn').addEventListener('click', () => {
    form.reset();
    tasks = [
      { name: 'Following up new leads by hand', hours: '6', people: '1', automatable: '80' },
      { name: 'Booking and rescheduling appointments', hours: '4', people: '1', automatable: '70' },
      { name: 'Copying data between tools', hours: '3', people: '2', automatable: '90' }
    ];
    $('hourlyCost').value = '28';
    $('weeksPerYear').value = '48';
    $('missedLeads').value = '10';
    $('recoverable').value = '30';
    $('closeRate').value = '20';
    $('averageSale').value = '400';
    $('setupCost').value = '2500';
    $('monthlyCost').value = '150';
    renderTasks();
  });

  wireOutputActions({
    copyBtn: $('copyBtn'), downloadBtn: $('downloadBtn'), statusEl, tracker,
    getOutput: () => summary,
    filename: 'automation-roi-estimate.txt',
    mime: 'text/plain'
  });

  renderTasks();
  tracker.open();
}

if (typeof document !== 'undefined') init();
