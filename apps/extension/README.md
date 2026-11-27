# Airlock for Chrome

Paste into ChatGPT, Claude.ai, Gemini, Copilot, Perplexity or DeepSeek without leaking secrets. Airlock cleans what you paste on your device before the site sees it, and shows answers with your real details only in its own side panel.

## Install (unpacked)

1. From the repo root: `npm install`, then `npm run build -w apps/extension`.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose `apps/extension/dist`.
3. Pin Airlock from the puzzle-piece menu.

Needs Chrome 138 or later. Gemini Nano is used when Chrome offers the Prompt API (see `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`); otherwise it's rule checks only, and the notice says so.

## Use

- **Paste as usual.** A dark notice at the bottom right says what Airlock swapped. Click **Undo** if you really want to send the original.
- **Restore an answer.** Select the AI's answer, right-click and choose **Restore with Airlock**. The side panel shows it with your real details. Use **Copy restored text** to take it elsewhere.
- **Popup.** Turn Airlock on or off for the current site, see whether Gemini Nano is available, or forget this browser session.

## Privacy

- The raw paste is stopped before the site's own paste listeners run, and only the cleaned text is inserted.
- The mapping lives in `chrome.storage.session`: in memory only, gone when the browser closes.
- The extension makes no network requests of its own.
- Restored text is never written into the website's page, where the site's scripts could read it.

## Develop

- `npm run build -w apps/extension` bundles `src/` into `dist/` with esbuild.
- `npm run typecheck -w apps/extension`
- `cd apps/extension && npx playwright test` loads the extension into Microsoft Edge and checks the paste flow on a stand-in chatgpt.com page that is answered locally. Set `AIRLOCK_EXT_CHANNEL=chromium` to use Playwright's Chromium instead.
