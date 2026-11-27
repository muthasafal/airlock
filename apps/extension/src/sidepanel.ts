/** Side panel: the restored answer, shown only to you (integrations R7.5). Rendered as text, never HTML. */
const out = document.querySelector('#out') as HTMLElement;
const meta = document.querySelector('#meta') as HTMLElement;
const copy = document.querySelector('#copy') as HTMLButtonElement;
let current = '';

function render(raw: string | undefined) {
  if (!raw) return;
  const { text, spans } = JSON.parse(raw) as { text: string; spans: Array<{ start: number; end: number; original: string; standIn: string }> };
  current = text;
  out.replaceChildren();
  let at = 0;
  for (const s of spans) {
    out.append(text.slice(at, s.start));
    const m = document.createElement('mark');
    m.textContent = text.slice(s.start, s.end);
    m.title = `Restored on your device (was ${s.standIn})`;
    out.append(m);
    at = s.end;
  }
  out.append(text.slice(at));
  meta.textContent = spans.length
    ? `${spans.length} real detail${spans.length === 1 ? '' : 's'} put back, on this device. The website never sees this.`
    : 'No Airlock stand-ins in that selection. Was it an answer to something you pasted with Airlock on?';
  copy.hidden = false;
}

chrome.storage.session.get('airlock-restored').then((r) => render(r['airlock-restored'] as string | undefined));
chrome.storage.session.onChanged.addListener((c) => {
  if (c['airlock-restored']) render(c['airlock-restored'].newValue as string);
});
copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(current);
  copy.textContent = 'Copied';
  setTimeout(() => (copy.textContent = 'Copy restored text'), 1500);
});
