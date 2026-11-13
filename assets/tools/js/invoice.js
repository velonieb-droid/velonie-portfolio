// Invoice Generator. Runs entirely in the browser: nothing is uploaded or stored.
import { clean, escapeHtml, createTracker, downloadText, setStatus, CURRENCIES, toNumber, formatMoney } from './core.js';

export { CURRENCIES, toNumber, formatMoney };

const MAX_LOGO_BYTES = 1_000_000;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const isBlankRow = (item) => !clean(item.description) && String(item.quantity ?? '').trim() === '' && String(item.price ?? '').trim() === '';

/** Line amounts and totals. Discount applies before tax. */
export function computeInvoice({ items, discountType, discountValue, taxRate }) {
  const lines = items.filter((item) => !isBlankRow(item)).map((item) => ({
    description: clean(item.description),
    quantity: toNumber(item.quantity),
    price: toNumber(item.price),
    amount: round2(toNumber(item.quantity) * toNumber(item.price))
  }));
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const rawDiscount = Math.max(toNumber(discountValue), 0);
  const discount = round2(discountType === 'percent' ? subtotal * Math.min(rawDiscount, 100) / 100 : Math.min(rawDiscount, subtotal));
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * Math.max(toNumber(taxRate), 0) / 100);
  return { lines, subtotal, discount, taxable, tax, total: round2(taxable + tax) };
}

export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!match) return '';
  const date = new Date(+match[1], +match[2] - 1, +match[3]);
  return date.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Returns { errors: {field: message}, rows: [{description, quantity, price}], valid }. */
export function validateInvoice(data) {
  const errors = {};
  if (!clean(data.fromName)) errors.fromName = 'Enter your business or personal name.';
  if (!clean(data.toName)) errors.toName = 'Enter the client name.';
  if (data.issueDate && data.dueDate && data.dueDate < data.issueDate) errors.dueDate = 'The due date is before the issue date.';
  if (toNumber(data.taxRate) < 0 || toNumber(data.taxRate) > 100) errors.taxRate = 'Enter a tax rate between 0 and 100.';
  if (toNumber(data.discountValue) < 0) errors.discountValue = 'The discount cannot be negative.';
  else if (data.discountType === 'percent' && toNumber(data.discountValue) > 100) errors.discountValue = 'A percentage discount cannot be more than 100.';

  let complete = 0;
  const rows = data.items.map((item) => {
    const row = { description: '', quantity: '', price: '' };
    if (isBlankRow(item)) return row;
    if (!clean(item.description)) row.description = 'Describe this item.';
    if (!(toNumber(item.quantity) > 0)) row.quantity = 'Quantity must be more than 0.';
    if (String(item.price ?? '').trim() === '' || toNumber(item.price) < 0) row.price = 'Enter a price of 0 or more.';
    if (!row.description && !row.quantity && !row.price) complete++;
    return row;
  });
  const rowErrors = rows.some((r) => r.description || r.quantity || r.price);
  if (!rowErrors && complete === 0) errors.items = 'Add at least one line item with a description, quantity and price.';
  return { errors, rows, valid: Object.keys(errors).length === 0 && !rowErrors };
}

// Styles for the invoice itself. Used in the live preview and embedded in the downloaded file.
export const INVOICE_CSS = `
.inv{--inv-accent:#0f9d58;box-sizing:border-box;width:100%;max-width:800px;margin:0 auto;padding:36px;background:#fff;color:#1f2933;font:14px/1.5 Arial,Helvetica,sans-serif;border-radius:6px;overflow-wrap:anywhere;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.inv *{box-sizing:border-box;margin:0;padding:0}
.inv-head{display:flex;justify-content:space-between;gap:24px;padding-bottom:20px;border-bottom:3px solid var(--inv-accent)}
.inv-logo{display:block;max-width:160px;max-height:70px;margin-bottom:10px;object-fit:contain}
.inv-name{font-size:17px;font-weight:700;color:#111827}
.inv-pre{white-space:pre-line;color:#4b5563;font-size:13px}
.inv-meta{text-align:right;flex:none;max-width:50%}
.inv-title{font-size:28px;font-weight:700;letter-spacing:.08em;color:var(--inv-accent)}
.inv-meta table{margin-left:auto;margin-top:8px;border-collapse:collapse;font-size:13px}
.inv-meta th{padding:1px 12px 1px 0;text-align:right;font-weight:400;color:#6b7280}
.inv-meta td{padding:1px 0;text-align:right;font-weight:700;color:#111827}
.inv-to{margin:22px 0}
.inv-label{margin-bottom:3px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b7280}
.inv-items{width:100%;border-collapse:collapse}
.inv-items th{padding:9px 10px;background:var(--inv-accent);color:#fff;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:.05em}
.inv-items td{padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top}
.inv-items th:first-child,.inv-items td:first-child{text-align:left;width:auto}
.inv-items th,.inv-items td:not(:first-child){white-space:nowrap;overflow-wrap:normal}
.inv-totals{width:290px;max-width:100%;margin:16px 0 0 auto;border-collapse:collapse}
.inv-totals th{padding:5px 10px;text-align:left;font-weight:400;color:#4b5563}
.inv-totals td{padding:5px 10px;text-align:right}
.inv-totals tr.inv-grand th,.inv-totals tr.inv-grand td{padding-top:10px;border-top:2px solid #111827;font-size:17px;font-weight:700;color:#111827}
.inv-notes{margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb}
@media (max-width:560px){.inv{padding:20px}.inv-head{flex-direction:column}.inv-meta{text-align:left;max-width:none}.inv-meta table{margin-left:0}.inv-meta th,.inv-meta td{text-align:left}}
`;

/** Wrap the rendered invoice markup in a standalone HTML document. */
export function buildInvoiceDocument(invoiceMarkup, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${INVOICE_CSS}
body{margin:0;padding:24px;background:#f3f4f6}
@media print{body{padding:0;background:#fff}.inv{border-radius:0}}
</style>
</head>
<body>
${invoiceMarkup}
</body>
</html>
`;
}

function init() {
  const form = document.getElementById('invoiceForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const list = $('itemList');
  const paper = $('invoicePaper');
  const empty = $('emptyState');
  const result = $('resultState');
  const printBtn = $('printBtn');
  const downloadBtn = $('downloadBtn');
  const statusEl = $('status');
  const tracker = createTracker('invoice_generator');
  const fields = ['fromName', 'fromDetails', 'toName', 'toDetails', 'number', 'issueDate', 'dueDate', 'currency', 'discountType', 'discountValue', 'taxLabel', 'taxRate', 'notes', 'accent'];
  const touched = new Set();
  let items = [{ description: '', quantity: '1', price: '' }];
  let logo = '';

  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: INVOICE_CSS }));
  CURRENCIES.forEach((code) => $('currency').appendChild(Object.assign(document.createElement('option'), { value: code, textContent: code })));

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const read = () => ({ ...Object.fromEntries(fields.map((f) => [f, $(f).value])), items });

  function renderItems(focusIndex) {
    list.replaceChildren();
    items.forEach((item, index) => {
      const n = index + 1;
      const input = (key, type, label, attrs = {}) => {
        const control = el('input');
        control.type = type;
        control.value = item[key];
        control.setAttribute('aria-label', `${label}, item ${n}`);
        control.dataset.key = key;
        Object.entries(attrs).forEach(([k, v]) => control.setAttribute(k, v));
        control.addEventListener('input', () => { items[index][key] = control.value; render(); });
        control.addEventListener('blur', () => { touched.add('items'); render(); });
        return control;
      };
      const description = input('description', 'text', 'Description', { placeholder: 'Service or product', autocomplete: 'off' });
      const quantity = input('quantity', 'number', 'Quantity', { min: '0', step: 'any', inputmode: 'decimal', placeholder: 'Qty' });
      const price = input('price', 'number', 'Unit price', { min: '0', step: 'any', inputmode: 'decimal', placeholder: 'Price' });
      const button = (label, text, disabled, handler) => {
        const b = el('button', 'btn icon', text);
        b.type = 'button';
        b.setAttribute('aria-label', `${label} item ${n}`);
        b.disabled = disabled;
        b.addEventListener('click', handler);
        return b;
      };
      const row = el('li', 'item-row');
      const numbers = el('div', 'item-numbers');
      const tools = el('div', 'faq-tools');
      tools.append(
        button('Move up', '↑', index === 0, () => { [items[index - 1], items[index]] = [items[index], items[index - 1]]; renderItems(index - 1); }),
        button('Move down', '↓', index === items.length - 1, () => { [items[index + 1], items[index]] = [items[index], items[index + 1]]; renderItems(index + 1); }),
        button('Remove', '✕', false, () => {
          items.splice(index, 1);
          if (!items.length) items.push({ description: '', quantity: '1', price: '' });
          renderItems(Math.min(index, items.length - 1));
        })
      );
      numbers.append(quantity, price, el('span', 'item-amount'), tools);
      row.append(description, numbers, el('p', 'err'));
      list.appendChild(row);
      if (focusIndex === index) description.focus();
    });
    render();
  }

  function buildPaper(data, totals) {
    const money = (n) => formatMoney(n, data.currency);
    const inv = el('div', 'inv');
    if (/^#[0-9a-f]{6}$/i.test(data.accent)) inv.style.setProperty('--inv-accent', data.accent);

    const head = el('div', 'inv-head');
    const from = el('div', 'inv-from');
    if (logo) {
      const img = el('img', 'inv-logo');
      img.src = logo;
      img.alt = `${clean(data.fromName)} logo`;
      from.appendChild(img);
    }
    from.append(el('p', 'inv-name', clean(data.fromName)), el('p', 'inv-pre', data.fromDetails.trim()));
    const meta = el('div', 'inv-meta');
    meta.appendChild(el('p', 'inv-title', 'INVOICE'));
    const metaTable = el('table');
    [['Invoice no.', clean(data.number)], ['Issue date', formatDate(data.issueDate)], ['Due date', formatDate(data.dueDate)]].forEach(([label, value]) => {
      if (!value) return;
      const tr = el('tr');
      tr.append(el('th', '', label), el('td', '', value));
      metaTable.appendChild(tr);
    });
    meta.appendChild(metaTable);
    head.append(from, meta);

    const to = el('div', 'inv-to');
    to.append(el('p', 'inv-label', 'Bill to'), el('p', 'inv-name', clean(data.toName)), el('p', 'inv-pre', data.toDetails.trim()));

    const table = el('table', 'inv-items');
    const headRow = el('tr');
    ['Description', 'Qty', 'Unit price', 'Amount'].forEach((h) => { const th = el('th', '', h); th.scope = 'col'; headRow.appendChild(th); });
    table.appendChild(el('thead')).appendChild(headRow);
    const body = table.appendChild(el('tbody'));
    totals.lines.forEach((line) => {
      const tr = el('tr');
      tr.append(el('td', '', line.description), el('td', '', String(line.quantity)), el('td', '', money(line.price)), el('td', '', money(line.amount)));
      body.appendChild(tr);
    });

    const sums = el('table', 'inv-totals');
    const sumRow = (label, value, className) => {
      const tr = el('tr', className);
      const th = el('th', '', label);
      th.scope = 'row';
      tr.append(th, el('td', '', value));
      sums.appendChild(tr);
    };
    sumRow('Subtotal', money(totals.subtotal));
    if (totals.discount > 0) sumRow(data.discountType === 'percent' ? `Discount (${toNumber(data.discountValue)}%)` : 'Discount', '-' + money(totals.discount));
    if (toNumber(data.taxRate) > 0) sumRow(`${clean(data.taxLabel) || 'Tax'} (${toNumber(data.taxRate)}%)`, money(totals.tax));
    sumRow('Total due', money(totals.total), 'inv-grand');

    inv.append(head, to, table, sums);
    if (data.notes.trim()) {
      const notes = el('div', 'inv-notes');
      notes.append(el('p', 'inv-label', 'Notes and payment terms'), el('p', 'inv-pre', data.notes.trim()));
      inv.appendChild(notes);
    }
    return inv;
  }

  function render() {
    const data = read();
    const { errors, rows, valid } = validateInvoice(data);
    const totals = computeInvoice(data);

    ['fromName', 'toName', 'dueDate', 'taxRate', 'discountValue'].forEach((f) => {
      const show = errors[f] && (touched.has(f) || ['dueDate', 'taxRate', 'discountValue'].includes(f));
      $(f + 'Err').textContent = show ? errors[f] : '';
      $(f).setAttribute('aria-invalid', show ? 'true' : 'false');
    });
    Array.from(list.children).forEach((row, index) => {
      const messages = [rows[index].description, rows[index].quantity, rows[index].price].filter(Boolean);
      row.querySelector('.err').textContent = touched.has('items') ? messages.join(' ') : '';
      row.querySelectorAll('input').forEach((control) => control.setAttribute('aria-invalid', touched.has('items') && rows[index][control.dataset.key] ? 'true' : 'false'));
      const line = items[index];
      row.querySelector('.item-amount').textContent = isBlankRow(line) ? '' : formatMoney(round2(toNumber(line.quantity) * toNumber(line.price)), data.currency);
    });
    $('itemsErr').textContent = touched.has('items') && errors.items ? errors.items : '';

    paper.replaceChildren();
    if (valid) paper.appendChild(buildPaper(data, totals));
    empty.hidden = valid;
    result.hidden = !valid;
    printBtn.disabled = downloadBtn.disabled = !valid;
    if (valid) tracker.generate();
    else {
      const started = clean(data.fromName) || clean(data.toName) || items.some((i) => !isBlankRow({ ...i, quantity: i.quantity === '1' ? '' : i.quantity }));
      empty.textContent = started
        ? 'Almost there. The invoice appears once it has your name, the client name and at least one complete line item, with no highlighted errors.'
        : 'Fill in your details, the client and at least one line item to see the invoice.';
    }
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('focusout', (event) => { if (event.target.id) { touched.add(event.target.id); render(); } });
  form.addEventListener('submit', (event) => event.preventDefault());

  $('addItemBtn').addEventListener('click', () => {
    items.push({ description: '', quantity: '1', price: '' });
    renderItems(items.length - 1);
  });

  $('logo').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    $('logoErr').textContent = '';
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) { $('logoErr').textContent = 'Use a PNG, JPG, WebP or GIF image.'; event.target.value = ''; return; }
    if (file.size > MAX_LOGO_BYTES) { $('logoErr').textContent = 'That image is over 1 MB. Use a smaller file.'; event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { logo = String(reader.result); $('removeLogo').hidden = false; render(); };
    reader.onerror = () => { $('logoErr').textContent = 'That image could not be read.'; };
    reader.readAsDataURL(file);
  });
  $('removeLogo').addEventListener('click', () => { logo = ''; $('logo').value = ''; $('removeLogo').hidden = true; render(); });

  function reset() {
    form.reset();
    touched.clear();
    logo = '';
    $('removeLogo').hidden = true;
    $('logoErr').textContent = '';
    $('issueDate').value = today();
    items = [{ description: '', quantity: '1', price: '' }];
    renderItems();
  }
  $('resetBtn').addEventListener('click', () => { reset(); setStatus(statusEl, 'Invoice cleared.', 'ok'); $('fromName').focus(); });

  $('exampleBtn').addEventListener('click', () => {
    reset();
    $('fromName').value = 'Northside Web Studio';
    $('fromDetails').value = '128 Harbor Street\nPortland, OR 97201\nhello@northside.example';
    $('toName').value = 'Rivera Plumbing LLC';
    $('toDetails').value = 'Attn: Accounts Payable\n45 Lakeview Road\nAustin, TX 78701';
    $('number').value = 'INV-1042';
    $('dueDate').value = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    $('taxLabel').value = 'Sales tax';
    $('taxRate').value = '8.25';
    $('discountType').value = 'percent';
    $('discountValue').value = '10';
    $('notes').value = 'Payment due within 14 days by bank transfer.\nThank you for your business.';
    items = [
      { description: 'CRM pipeline setup', quantity: '1', price: '650' },
      { description: 'Automation workflow build', quantity: '3', price: '180' },
      { description: 'Training session (hours)', quantity: '2', price: '75' }
    ];
    renderItems();
  });

  printBtn.addEventListener('click', () => {
    if (printBtn.disabled) return;
    tracker.print();
    window.print();
  });

  downloadBtn.addEventListener('click', () => {
    if (downloadBtn.disabled || !paper.firstElementChild) return;
    const number = clean($('number').value);
    const name = (number || 'invoice').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice';
    try {
      downloadText(`${name}.html`, buildInvoiceDocument(paper.firstElementChild.outerHTML, number ? `Invoice ${number}` : 'Invoice'), 'text/html');
      setStatus(statusEl, 'Download started. Open the file in any browser to view or print it.', 'ok');
      tracker.download();
    } catch {
      setStatus(statusEl, 'Download failed in this browser. Use Save as PDF instead.', 'bad');
    }
  });

  $('issueDate').value = today();
  renderItems();
  tracker.open();
}

if (typeof document !== 'undefined') init();
