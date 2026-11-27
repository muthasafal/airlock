import type { CleanReply } from './sites';

/**
 * Airlock content script on AI chat sites (integrations R7.2, R7.3). It catches a paste into
 * the page's message box in the capture phase, before the site's own listeners, stops the raw
 * text from reaching the site, and inserts the cleaned text instead. A small notice shows the
 * counts (never the values) and offers Undo.
 */

let enabled = true;
const host = location.hostname;
chrome.storage.local.get('airlock-disabled-sites').then((r) => {
  enabled = !((r['airlock-disabled-sites'] as string[] | undefined) ?? []).includes(host);
});
chrome.storage.onChanged.addListener((c, area) => {
  if (area === 'local' && c['airlock-disabled-sites']) enabled = !((c['airlock-disabled-sites'].newValue as string[]) ?? []).includes(host);
});

function isEditable(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  return el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === 'text') || el.isContentEditable;
}

function insert(target: HTMLElement, text: string) {
  target.focus();
  // execCommand keeps the site's editor (ProseMirror, Lexical, Quill, textarea) in sync with its own state.
  if (!document.execCommand('insertText', false, text)) {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }
}

let busy = false;

window.addEventListener(
  'paste',
  (e: ClipboardEvent) => {
    if (!enabled || busy || !e.isTrusted) return;
    const target = e.target;
    if (!isEditable(target)) return;
    const raw = e.clipboardData?.getData('text/plain') ?? '';
    if (raw.trim().length < 4) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    busy = true;
    const note = notice('Cleaning on your device...');
    chrome.runtime
      .sendMessage({ type: 'clean', text: raw })
      .then((r: CleanReply | null) => {
        if (!r) throw new Error('no reply');
        insert(target, r.text);
        if (r.changed === 0) {
          note.set('Nothing sensitive found. Pasted as is.', null);
          return;
        }
        const withheld = r.withheld ? `, held back ${r.withheld} secret${r.withheld === 1 ? '' : 's'}` : '';
        note.set(`Airlock swapped ${r.changed} detail${r.changed === 1 ? '' : 's'}${withheld}. ${r.detection === 'rules only' ? 'Rule checks only, so names may slip through.' : 'Checked with Gemini Nano on this device.'}`, () => {
          target.focus();
          document.execCommand('undo');
          insert(target, raw);
          note.set('Pasted the original. It will be sent as you wrote it.', null);
        });
      })
      .catch(() => note.set("Airlock couldn't clean this paste, so nothing was pasted. Try again.", null))
      .finally(() => {
        busy = false;
      });
  },
  { capture: true },
);

/** A small notice in a closed shadow root, so the page's styles and scripts can't reach into it. */
function notice(initial: string) {
  const hostEl = document.createElement('div');
  const root = hostEl.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .n{position:fixed;right:20px;bottom:20px;z-index:2147483647;max-width:360px;display:flex;gap:10px;align-items:center;
       background:#0b1530;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:12px 14px;border-radius:18px;
       box-shadow:0 18px 40px -16px rgba(11,21,48,.55)}
    .dot{width:10px;height:10px;min-width:10px;border-radius:99px;background:#22c55e}
    button{all:unset;cursor:pointer;background:#fff;color:#0b1530;padding:6px 12px;border-radius:99px;font-weight:800}
    button:focus-visible{outline:3px solid #22c55e}
  </style><div class="n" role="status" aria-live="polite"><span class="dot"></span><span class="t"></span></div>`;
  const box = root.querySelector('.n') as HTMLElement;
  const t = root.querySelector('.t') as HTMLElement;
  t.textContent = initial;
  document.documentElement.appendChild(hostEl);
  let timer = 0;
  return {
    set(text: string, onUndo: (() => void) | null) {
      t.textContent = text;
      box.querySelector('button')?.remove();
      if (onUndo) {
        const b = document.createElement('button');
        b.textContent = 'Undo';
        b.addEventListener('click', onUndo, { once: true });
        box.appendChild(b);
      }
      clearTimeout(timer);
      timer = window.setTimeout(() => hostEl.remove(), onUndo ? 9000 : 4000);
    },
  };
}
