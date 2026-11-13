// Shared utilities for the Free Tools pages.
// Pure helpers (no DOM access at import time) so the logic can also be tested in Node.

/** Escape text for safe use inside HTML text nodes and double-quoted attributes. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Collapse whitespace and trim; used for single-line fields. */
export function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** True only for absolute http(s) URLs. */
export function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
}

/** Currencies offered by the money tools. */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'SGD', 'PHP', 'INR', 'JPY', 'AED', 'CHF', 'MXN', 'ZAR'];

/** Parse a number typed by a visitor. Anything unreadable is 0. */
export const toNumber = (value) => {
  const n = parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Copy text to the clipboard. Resolves true on success, false on failure. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Download text as a file, generated in the browser. */
export function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Show a short status message in a polite live region. */
export function setStatus(el, message, kind) {
  if (!el) return;
  el.textContent = message;
  el.className = 'status' + (kind ? ' ' + kind : '');
  clearTimeout(el._timer);
  if (message) el._timer = setTimeout(() => { el.textContent = ''; el.className = 'status'; }, 4000);
}

/**
 * GA4 events. Only the tool identifier is sent; never anything the visitor typed.
 * Calls are skipped silently when gtag is blocked or missing.
 */
export function createTracker(toolId) {
  let generated = false;
  const send = (name, extra) => {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, { tool_id: toolId, ...extra });
    } catch {
      // analytics must never break a tool
    }
  };
  return {
    open: () => send('tool_open'),
    // Output updates on every keystroke, so count the first valid result once per page view.
    generate: () => { if (!generated) { generated = true; send('tool_generate'); } },
    // source is one of 'url', 'paste' or 'file'. The address or page content is never sent.
    analyze: (source) => send('tool_analyze', { analyze_source: source }),
    print: () => send('tool_print'),
    copy: () => send('tool_copy'),
    download: () => send('tool_download')
  };
}

/** Wire a copy button and a download button to a function that returns the current output. */
export function wireOutputActions({ copyBtn, downloadBtn, statusEl, getOutput, filename, mime, tracker }) {
  copyBtn.addEventListener('click', async () => {
    const text = getOutput();
    if (!text) return;
    const ok = await copyText(text);
    setStatus(statusEl, ok ? 'Copied to clipboard.' : 'Copy failed. Select the text and copy it manually.', ok ? 'ok' : 'bad');
    if (ok) tracker.copy();
  });
  downloadBtn.addEventListener('click', () => {
    const text = getOutput();
    if (!text) return;
    try {
      downloadText(typeof filename === 'function' ? filename() : filename, text, typeof mime === 'function' ? mime() : mime);
      setStatus(statusEl, 'Download started.', 'ok');
      tracker.download();
    } catch {
      setStatus(statusEl, 'Download failed in this browser. Use Copy instead.', 'bad');
    }
  });
}
