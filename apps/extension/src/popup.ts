import type { StatusReply } from './sites';
import { AI_SITES } from './sites';

/** Popup: on/off for this site, Nano status, forget (integrations R7.7). */
const $ = (s: string) => document.querySelector(s) as HTMLElement;

async function main() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = tab?.url ? new URL(tab.url).hostname : '';
  const supported = AI_SITES.includes(host);
  const { 'airlock-disabled-sites': disabled = [] } = (await chrome.storage.local.get('airlock-disabled-sites')) as { 'airlock-disabled-sites'?: string[] };

  const toggle = $('#toggle') as HTMLInputElement;
  $('#site').textContent = supported ? host : 'this page';
  toggle.checked = supported && !disabled.includes(host);
  toggle.disabled = !supported;
  $('#site-note').textContent = supported
    ? 'Pastes into this site are cleaned on your device first.'
    : `Airlock works on ${AI_SITES.slice(0, 4).join(', ')} and a few more AI chats.`;
  toggle.addEventListener('change', async () => {
    const list = new Set(disabled);
    if (toggle.checked) list.delete(host);
    else list.add(host);
    await chrome.storage.local.set({ 'airlock-disabled-sites': [...list] });
  });

  const status = (await chrome.runtime.sendMessage({ type: 'status' })) as StatusReply;
  $('#nano').textContent =
    status.nano === 'available'
      ? 'Gemini Nano is ready on this device, so names and context are caught too.'
      : 'Gemini Nano is not available here, so Airlock uses rule checks only (emails, phones, IDs, cards, keys).';

  $('#forget').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'forget' });
    $('#forget-note').textContent = 'Forgotten. Earlier stand-ins can no longer be restored.';
  });
}

void main();
