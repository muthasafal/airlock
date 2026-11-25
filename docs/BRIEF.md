# Airlock: Product and Technical Brief

This is the source of truth for what Airlock is and how it must be built. Steering docs and specs are derived from it. If a spec disagrees with this brief, the brief wins, unless the brief is updated in the same change.

---

## 1. One line

**Use any cloud AI without leaking secrets.** A private model on your own device (Gemini Nano in Chrome, via Firebase AI Logic hybrid inference) finds sensitive details and swaps them for realistic stand-ins before anything leaves. Only the cleaned text reaches the cloud model, and the answer is restored with your real details, locally.

Tagline for the site: *"Your secrets stay on this side of the door."*

## 2. The problem

- People paste confidential material into cloud chatbots every day: client names, salaries, medical details, contracts, source code containing API keys, students' personal data, internal project names.
- Companies respond in one of two ways:
  1. **They ban AI tools.** Productivity is lost, and people use them anyway on personal devices ("shadow AI").
  2. **They buy cloud DLP tools** (data loss prevention). These scan prompts by sending them to the vendor's own cloud first. **To protect your secret, you hand it to one more company.**
- Redaction tools that replace text with `[REDACTED]` wreck the cloud model's ability to reason. "Tell [REDACTED] that [REDACTED] owes [REDACTED]" produces useless answers.

## 3. The insight (why hybrid AI is the product, not a gimmick)

- **On-device model = the trust boundary.** Detecting, classifying, pseudonymizing and restoring all happen on the device. No server, ours included, ever sees raw sensitive values.
- **Cloud model = the capability.** The heavy reasoning runs on cleaned text that still reads naturally, because stand-ins are realistic and consistent.
- **The hybrid router** decides each step on-device: answer locally, clean and send to the cloud, or block outright.
- **Graceful degradation.** If the device has no on-device model, Airlock falls back to its deterministic rule detectors only, shows that protection is reduced, and requires explicit consent before any cloud call. This is the honest fallback, and it shows we understand the problem space.

## 4. Who it's for

| Persona | Example | What they need |
|---|---|---|
| Office worker | HR executive drafting a sensitive email | Rewrite help without exposing names, salaries or performance details |
| Professional | Lawyer, doctor, CA | Summaries of case notes, reports or financials without breaching confidentiality |
| Developer | Debugging code with keys in the logs | Paste logs into an AI safely |
| Student or NGO staff | Volunteer handling student applications | Help writing, with beneficiaries' data protected |
| Org admin | IT or compliance lead | Set policy (protected client names, codenames) and see that it works (counts only) |

## 5. Hackathons this project enters (constraints that shape the build)

| Hackathon | Deadline (PT) | Hard requirements we must meet |
|---|---|---|
| Firebase #BuildHybridAI | Nov 30, 2:00 PM | Firebase AI Logic hybrid inference **imported and actually called at runtime**. App Check enabled (a debug token is OK). Platform: Web (Chrome) with Gemini Nano. Public GitHub repo with an OSI license shown in the About section. Video of 3 minutes or less on YouTube, English, showing it working. Text description: how AI Logic is used, features, value proposition. Hosted URL strongly encouraged. Free to use. No production secrets or PII in the repo. Commits after the deadline aren't judged, so tag `firebase-submission`. Judging: Technical implementation (hybrid use), Design (a complete product, not a proof of concept), Potential impact (real problem, real audience), Quality of idea (creative, non-obvious). |
| Kiroween (Frankenstein category) | Dec 4, 2:00 PM | Built with Kiro during the submission period. `/.kiro` committed at the repo root (never gitignored). Public GitHub repo with an OSI license. Working app URL. Video under 3 minutes. A write-up on Kiro usage (specs, hooks, steering, custom agents, MCP, PBT, powers). Judging: Potential impact, Technological implementation (depth and variety of Kiro use), Design, Innovation, Presentation. |
| Slay Hacks | Dec 7, 2:00 PM | Overview, problem and solution, AI implementation details, working demo, screenshots, repo, video. Judging includes "AI Integration and Responsible Use" (15%). Technologies must be listed accurately. |
| Cognizant Open Agentic Web | Jan 11 | Not this repo. A later spin-off reuses Airlock's scrub engine as `airlock-gate` (see the hopemeals-agent repo). **Design the scrub engine as a standalone package from day one** so it can be reused. |

Honesty rule: the README and every submission say "Built with Kiro; reviewed with Claude Code."

---

## 6. Platform facts we must design around (from the Firebase docs, Nov 2026)

**On-device on Web: Chrome desktop 139+ with Gemini Nano via the Prompt API.**
- Supported on-device: **single-turn** text, text plus image (JPEG/PNG, inline only), streaming, and **structured output** (JSON schema and enums).
- **About 9,216 tokens** per on-device request. Plan for about 3.5 characters per token, so roughly 6,000 tokens (about 20,000 characters) per chunk at most, leaving headroom for the prompt and output.
- **NOT supported on-device:** multi-turn chat, tools or function calling, audio, video, PDF.
  - Tools do **not** fall back automatically.
  - Under `PREFER_*` modes, unsupported media and multi-turn requests fall back to the cloud.
  - Under `ONLY_ON_DEVICE` they throw.

**SDK:** `firebase` JS SDK **v13+** (`firebase/ai`).
```ts
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });
// result.response.inferenceSource === "ON_DEVICE" | "IN_CLOUD"
```
- Modes: `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`.
- Hybrid config can pass on-device params (for example `onDeviceParams: { createOptions: { expectedInputs: [...] } }`) and in-cloud params (the model name). **Check the exact option names against the installed SDK typings before coding.**
- **Availability:** `LanguageModel.availability()` returns `"available" | "downloadable" | "downloading" | "unavailable"`. `model.initializeDeviceModel()` (or `LanguageModel.create()`) **must be called after a user gesture** to trigger a download. `PREFER_*` modes don't wait for a download; they fall back immediately.

**Cloud models (Gemini Developer API, no billing needed):**
- `gemini-3.5-flash-lite`: the default for Web hybrid.
- `gemini-3.8-flash`: for harder questions.
- **Keep model names in Remote Config; never hard-code them in more than one place.**

**App Check:**
- Enforced for AI Logic.
- In dev, set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` before `initializeAppCheck`, then register the token in the console.
- Production uses `ReCaptchaV3Provider` (or Enterprise).
- Never commit debug tokens.

**The developer machine is verified:** Chrome 158, RTX 5060 with 8 GB VRAM. `LanguageModel.availability()` returned `"available"` for both text and image input on 2026-11-25.

**Enabling it:** `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → Enabled. Document this for judges in the README.

---

## 7. Feature set

Priority **P0** must ship by Nov 30 for Firebase. **P1** ships by Dec 4 for Kiroween. **P2** is stretch.

### P0-1: Scrub engine (the core, a standalone package)
- Input: text. Output:
  - the scrubbed text
  - a list of findings (span, category, original, replacement, detector, confidence, action)
  - a session mapping.
- Detection runs in **layers** (section 8.1). Policy decides the action for each category (section 8.3).
- **Pure and deterministic, given the same session seed and the same detector outputs.** No DOM or React inside the package.

### P0-2: Realistic, consistent stand-ins
- "Priya Shah at Acme Corp, 98200 12345" becomes "Maya Iyer at Northwind Labs, 91234 56780".
- The same original always maps to the same stand-in **within a session, across messages**.
- Stand-ins keep the *shape* of the original: an Indian name stays an Indian name, an email stays an email, a phone keeps its format, and amounts keep a similar magnitude when generalised.
- A stand-in must never collide with any real value in the session, or with any other stand-in.

### P0-3: Restore
- Swap stand-ins in the model's answer back to the originals.
- Must handle:
  - case variants
  - possessives (`Maya's` → `Priya's`)
  - first-name-only and surname-only mentions (aliases created at scrub time)
  - titles ("Ms. Iyer")
  - stand-ins split across a streaming chunk boundary (buffer until a word boundary)
- Show restored spans highlighted, with a hover or tap that shows "restored on your device".

### P0-4: Encrypted local vault
- The session mapping is stored in IndexedDB, encrypted with AES-GCM using a **non-extractable** `CryptoKey` generated with WebCrypto and itself stored in IndexedDB.
- No mapping, original value or key ever goes to the network, Firestore, logs or analytics.
- A "Forget this session" button wipes it, and so does an automatic TTL (default 24 hours, configurable).

### P0-5: Hybrid router (section 8.4)
- Per request, it decides `LOCAL_ANSWER | CLOUD_SCRUBBED | BLOCK`, and shows the decision and the reason.

### P0-6: Airlock Chat (main screen)
- **Composer:** paste or type, with a **live redaction preview** (debounced 300 ms; rules run instantly, then Nano refines).
- **Each turn shows three things:**
  1. what you wrote, with sensitive spans highlighted
  2. what was sent, the stand-in version
  3. the answer, restored
- **Multi-turn chat in the cloud:**
  - Nano is single-turn, so the conversation history is kept client-side, and **only the scrubbed history** is sent to the cloud model (`ONLY_IN_CLOUD`, chat or `generateContent` with the history).
  - On-device detection runs per new message.
- **Streaming:** cloud answers stream, and the restore buffer handles chunk boundaries.

### P0-7: Receipt
- Every request gets a receipt that is stored locally and never uploaded. It contains:
  - timestamp
  - route decision and its reason
  - `inferenceSource` for each step (detection: ON_DEVICE; answer: ON_DEVICE or IN_CLOUD)
  - the exact outbound payload (the stand-in text only)
  - counts by category
  - detectors used
  - protection level (Full / Reduced)
- The UI is a "What left your device" diff: originals on the left, the sent text on the right.

### P0-8: Clipboard airlock (works with every AI product)
- Paste text in, click **Clean & copy**, and the cleaned text goes to the clipboard (`navigator.clipboard.writeText`).
- The user pastes it into any AI tool (ChatGPT, Claude, Gemini, anything), then pastes the AI's answer back into Airlock, clicks **Restore**, and gets real names back.
- Works on the same session mapping.

### P0-9: Protection status and onboarding
- On the first visit, check `LanguageModel.availability()`.
- **Status panel** (plain text, no badge pills): "On-device protection: ready", "downloading 43%", or "not available on this browser (reduced protection)".
- An **Enable** button (the user gesture) triggers `initializeDeviceModel()`, with a progress bar.
- If the browser isn't supported: a clear guide (Chrome desktop, flag, restart) plus rules-only mode with a consent toggle.

### P0-10: Firebase wiring
- **App Check** on every AI call.
- **Remote Config:** model names, thresholds, feature flags (section 9.3).
- **Auth** (Google) is optional for individuals and required for org mode.
- **Hosting:** security headers (section 11.3).

### P1-1: Org mode
- Sign in with Google, then create or join an org (invite code).
- The org admin sets:
  - protected terms: client names, project codenames, internal URLs, with a category and action for each
  - category policies, overriding the defaults
- Members' Airlock pulls the org policy (Firestore) and applies it **on-device**.
- **Stats are counts only:** each member's client sends increments like `{date, category: count}`. There is **never** any content and never any per-message rows.
- An admin dashboard shows counts over time, "41 secrets stopped this week", and the top categories.
- Firestore security rules enforce the schema, so content fields are rejected.

### P1-2: Leak benchmark (`/bench`)
- A deterministic generator produces N synthetic documents (emails, chat logs, code snippets, medical notes, contracts), seeded, with **planted ground-truth secrets** across all categories.
- It runs three configurations in the user's Chrome:
  1. no protection
  2. rules only
  3. rules + Nano (full Airlock)
- It reports for each category: recall, precision, leaked count, and average latency for each document.
- Results are saved as JSON and shown as a table, and the numbers go in the README and video.
- **Must run in a real Chrome with Nano**, so this is an in-app page, not a Node script.

### P1-3: Settings
- Session TTL, default action for each category, a toggle for showing stand-ins, export and delete of local data, and the language (English for now).

### P1-4: Legal and trust pages
- `/privacy`: exact data flows; what is stored where; that we never receive content.
- `/terms`
- `/how-it-works`: an architecture explainer with a diagram.

### P2-1: Screenshot airlock
- A user drops an image, then:
  1. Tesseract.js (in the browser) gets word boxes.
  2. Rules and Nano classify the OCR text spans.
  3. Optionally, Nano gets image input with structured output to flag non-text sensitive regions (faces, ID cards, signatures) as boxes. **It must be verified that Nano can return usable coordinates; if not, skip this sub-step.**
  4. The canvas blurs the sensitive boxes.
  5. The user downloads the image or sends it to the cloud with a question.

### P2-2: Chrome extension (MV3)
- Detects paste events and textarea submits on a user-configured list of AI websites, and offers "Airlock this" in place.
- **Verify Firebase AI Logic and App Check inside an extension before building.** If that doesn't work, the extension uses the Prompt API directly for detection and leaves the cloud call to the website the user is on.

### Out of scope (do not build)
- Audio or video, PDFs (stretch at best: text extraction only), mobile apps, multi-language detection beyond English and Indian formats, any server that receives content.

---

## 8. Core algorithms (precise)

### 8.1 Detection layers
Detectors run in this order. Each returns `Finding { start, end, text, category, detector, confidence }`.

**Layer A: Rules (instant, deterministic, always on).**
| Category | Pattern and validation |
|---|---|
| `EMAIL` | RFC-lite regex `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` |
| `PHONE` | Indian mobile: `(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}`. International `\+\d{1,3}[\s-]?\d{6,14}`. Reject runs that are part of longer digit strings. |
| `AADHAAR` | `\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b` **and** a valid Verhoeff checksum |
| `PAN` | `\b[A-Z]{5}[0-9]{4}[A-Z]\b` (4th character in `PCHABGJLFT` for extra confidence) |
| `IFSC` | `\b[A-Z]{4}0[A-Z0-9]{6}\b` |
| `BANK_ACCOUNT` | 9 to 18 digits near the keywords account, a/c, acct (within 30 characters) |
| `CARD` | 13 to 19 digits with optional separators **and** a Luhn check |
| `UPI` | `[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}` (not matching EMAIL TLDs) |
| `API_KEY` | Known prefixes: `sk-`, `sk-ant-`, `AKIA[0-9A-Z]{16}`, `AIza[0-9A-Za-z\-_]{35}`, `ghp_`/`gho_`/`github_pat_`, `xox[baprs]-`, `glpat-`, `rk_live_`/`sk_live_`. Plus high-entropy strings: length ≥ 24, Shannon entropy ≥ 3.5, mixed character classes, near the words key, token, secret or password. |
| `JWT` | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` |
| `PRIVATE_KEY` | `-----BEGIN [A-Z ]*PRIVATE KEY-----` up to the END marker |
| `PASSWORD` | `(password|passwd|pwd|pin)\s*[:=]\s*\S+`; capture the value only |
| `IP_ADDRESS` | IPv4 with octet validation; IPv6 (simplified) |
| `URL_SECRET` | URLs whose query has `token=`, `key=`, `sig=`, `auth=` or `password=` (scrub the value only) |
| `ORG_TERM` | Exact or case-insensitive whole-word matches against the org's protected terms list (Aho-Corasick or one combined regex) |

**Layer B: Gemini Nano (context-aware, on-device).**
- Runs with `InferenceMode.ONLY_ON_DEVICE` (never in the cloud, because this text is raw). Uses structured output:
```json
{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "category": { "type": "string", "enum": ["PERSON","ORG","LOCATION","HEALTH","FINANCIAL_AMOUNT","LEGAL_MATTER","INTERNAL_PROJECT","CREDENTIAL","GOVERNMENT_ID","DATE_OF_BIRTH","OTHER_SENSITIVE"] },
          "confidence": { "type": "number" }
        },
        "required": ["text","category","confidence"]
      }
    }
  },
  "required": ["findings"]
}
```
- **The prompt is a short, strict system instruction:** "You are a privacy filter. List every span that identifies a person, organisation, private place, health condition, money amount tied to a person or company, legal matter, internal project or credential. Copy each span exactly as written. Do not explain." Then the text.
- **Span resolution:** Nano returns text, not offsets. Locate each returned `text` in the source by exact search, falling back to case-insensitive search. Ignore hallucinated spans that aren't found. Expand to all occurrences.
- **Chunking:**
  - Split on paragraph boundaries into chunks of 4,000 characters or less, with 200 characters of overlap.
  - Process sequentially (Nano is single-session).
  - Merge findings.
  - Show progress for long inputs.
- **Timeouts:** 8 seconds per chunk. On timeout or error, keep the rule findings, mark the protection level for that message as Reduced, and tell the user.

**Layer C: merge.**
- Union all findings and sort by start position.
- **Overlaps:**
  - prefer the longer span
  - if the lengths are equal, rules beat Nano for structured types (EMAIL, PHONE, ID formats), and Nano beats rules for PERSON and ORG
  - a higher-severity category always wins (CREDENTIAL > GOVERNMENT_ID > HEALTH > ...)
- Drop findings below the confidence threshold from Remote Config (`nano_min_confidence`, default 0.5).

### 8.2 Stand-in generator
- A seeded PRNG per session (for example mulberry32, seeded from a random 32-bit value stored in the vault).
- Pools, shipped as JSON in the package:
  - Indian first names and surnames (≥ 300 each, gender-balanced)
  - Western first names and surnames (≥ 300 each)
  - company names (≥ 300 fictional, with a check that none are famous real brands)
  - cities, both Indian and global
  - project codenames (two words: adjective + noun)
- **Mapping rules:**
  - **PERSON:**
    - detect the script or region of the original by checking whether its surname is in the Indian list, and pick from the matching pool
    - keep the number of name parts the same
    - create aliases: first name → first name, surname → surname
  - **ORG:** pick a fictional company; keep a suffix (Pvt Ltd, Inc, Corp, Labs) if the original has one.
  - **EMAIL:** `firstname.lastname@` + a fictional domain from a pool (`northwind.example`, ...). Use `.example` TLDs, which are reserved and never real. If the local part matches a PERSON already mapped, reuse that stand-in.
  - **PHONE:** same format and length, with fictional digits. Indian numbers start with 9 and end in a `0000x` block (for example `98765 0000x`) so they read as obviously fictional. The README documents that stand-in phone numbers are fake.
  - **AADHAAR, PAN, CARD, IFSC, BANK_ACCOUNT, UPI:** generate format-valid-looking but **checksum-invalid** values, so they can never be real IDs, for example a Luhn-failing card. Document this.
  - **API_KEY, JWT, PRIVATE_KEY, PASSWORD:** never sent at all. The default action is **BLOCK**, or replace with `‹secret-1›` and warn.
  - **FINANCIAL_AMOUNT:** default **GENERALIZE**: keep the currency, round to the nearest band ("about ₹4.5 lakh" stays the same order of magnitude). Configurable to pseudonymize (scale by a session factor) or keep.
  - **HEALTH, LEGAL_MATTER:** default **GENERALIZE** ("diabetes" → "a chronic condition") using a small local mapping table, falling back to a generic phrase.
  - **LOCATION:** a pseudonym city in the same country.
  - **DATE_OF_BIRTH:** shift by a session-constant offset of ±N days.
  - **INTERNAL_PROJECT, ORG_TERM:** a codename from the pool.
- **Collision check:** a stand-in must not appear (case-insensitive) anywhere in the session's original texts, and must be unique among stand-ins. Re-draw on collision, up to 20 times; then use a numbered fallback.

### 8.3 Policy (what to do for each category)
- `Action = PSEUDONYMIZE | GENERALIZE | BLOCK | KEEP`.
- Defaults:
  | Category | Default action |
  |---|---|
  | PERSON, ORG, EMAIL, PHONE, LOCATION, ORG_TERM, INTERNAL_PROJECT, UPI | PSEUDONYMIZE |
  | AADHAAR, PAN, CARD, BANK_ACCOUNT, IFSC, GOVERNMENT_ID | PSEUDONYMIZE (checksum-invalid fakes) |
  | FINANCIAL_AMOUNT, HEALTH, LEGAL_MATTER, DATE_OF_BIRTH | GENERALIZE |
  | API_KEY, JWT, PRIVATE_KEY, PASSWORD, CREDENTIAL, URL_SECRET | BLOCK |
- Resolution order: **org policy > user settings > Remote Config defaults > built-in defaults.**
- **BLOCK** means the outbound text contains `‹secret-N›` and the UI shows "1 secret was withheld". If the user's request *needs* the secret (unlikely), say so.

### 8.4 Hybrid router
Inputs:
- device status (Nano available or not)
- the scrubbed text length
- findings
- a Nano task classification (structured enum)
- the user's override

Step 1, classify the task on-device (`ONLY_ON_DEVICE`, enum output, on the scrubbed text):
```
{ "task": "REWRITE|SUMMARIZE_SHORT|TRANSLATE_SHORT|QA_ON_TEXT|REASONING|CODE|CREATIVE_LONG|OTHER",
  "complexity": "LOW|MEDIUM|HIGH" }
```

Step 2, decision table:
| Condition | Route |
|---|---|
| Any BLOCK finding the user hasn't overridden **and** the policy is `block_request_on_secret = true` | **BLOCK** (explain, offer "send without the secret") |
| Nano available **and** complexity LOW **and** task in {REWRITE, SUMMARIZE_SHORT, TRANSLATE_SHORT} **and** text ≤ `local_answer_max_chars` (Remote Config, default 3,000) | **LOCAL_ANSWER** on the **original** text (never leaves the device), with `ONLY_ON_DEVICE` |
| Otherwise | **CLOUD_SCRUBBED**: send the scrubbed text and scrubbed history with `ONLY_IN_CLOUD` |
| Nano unavailable | Rules-only scrub; **require consent** (a per-session toggle) before CLOUD_SCRUBBED; mark the protection as Reduced |

- The user can force "Answer on my device only" or "Use cloud" for each message.
- Every decision is recorded in the receipt with a plain-English reason.

### 8.5 Restore algorithm
1. Build a reverse map: stand-in → original, plus aliases and case variants.
2. Find matches with one combined regex, longest keys first, word-boundary aware, case-insensitive, preserving the original's casing style where sensible.
3. Possessives and plurals: handle `'s` and `s'` suffixes.
4. Generalised categories aren't reversible. Leave them, and mark them as "generalised" in the UI.
5. Streaming: keep a tail buffer of up to `maxStandInLength` characters, and only emit text up to the last word boundary that can't be the start of a stand-in.

### 8.6 Invariants (these become property-based tests)
1. **No leak:** for any input containing planted secrets that the detectors find, the outbound payload contains **none** of the original sensitive substrings, case-insensitively, for every category whose action isn't KEEP.
2. **Round trip:** for PSEUDONYMIZE-only findings, `restore(scrub(x).text, mapping) === x`.
3. **Consistency:** within a session, `scrub` maps equal originals to equal stand-ins across calls.
4. **Injectivity:** distinct originals never share a stand-in.
5. **Non-collision:** no stand-in equals (case-insensitively) any original substring in the session.
6. **Fakes stay fake:** generated card numbers fail Luhn, generated Aadhaar numbers fail Verhoeff, generated emails use `.example`.
7. **Determinism:** with the same seed and the same detector outputs, the output is the same.
8. **Idempotence of detection:** scrubbing an already-scrubbed text creates no new findings for the stand-ins it introduced.
9. **Streaming equivalence:** restoring a stream chunk by chunk equals restoring the whole string, for any chunking.

---

## 9. Firebase design

### 9.1 Products used
- AI Logic (hybrid)
- App Check
- Auth (Google provider)
- Firestore
- Remote Config
- Hosting
- **No Analytics on content.** If Analytics is used at all, page views only. Prefer none.

### 9.2 Firestore schema (org mode only; individuals use no Firestore)
```
orgs/{orgId}
  name: string
  createdBy: uid
  createdAt: timestamp
  inviteCodeHash: string           // sha256 of the invite code
  policy: { [category]: "PSEUDONYMIZE"|"GENERALIZE"|"BLOCK"|"KEEP" }
  protectedTerms: [{ term: string, category: string, action: string }]   // admin-entered, not user content
orgs/{orgId}/members/{uid}
  role: "admin"|"member"
  joinedAt: timestamp
orgs/{orgId}/stats/{yyyy-mm-dd}
  counts: { [category]: number }   // only increments via FieldValue.increment
  requests: number
  routes: { LOCAL_ANSWER: number, CLOUD_SCRUBBED: number, BLOCK: number }
```

**Security rules (must have):**
- members read their org
- admins write the policy and terms
- members may **only increment** known numeric fields in `stats`, with no new keys outside the allowed category list (validate with `request.resource.data.diff(resource.data).affectedKeys()`)
- no strings in `stats`.

Write the rules tests with the Firestore emulator.

### 9.3 Remote Config parameters
| Key | Default | Purpose |
|---|---|---|
| `cloud_model` | `gemini-3.5-flash-lite` | default cloud model |
| `cloud_model_hard` | `gemini-3.8-flash` | used for REASONING/CODE with HIGH complexity |
| `nano_min_confidence` | `0.5` | drop low-confidence Nano findings |
| `local_answer_max_chars` | `3000` | max length for an on-device answer |
| `chunk_chars` | `4000` | Nano chunk size |
| `block_request_on_secret` | `true` | block vs withhold |
| `session_ttl_hours` | `24` | vault TTL |
| `feature_screenshot` | `false` | P2 flag |
| `feature_org_mode` | `true` | P1 flag |

### 9.4 App Check
- Initialise before any AI call.
- Dev: debug token. Prod: `ReCaptchaV3Provider(siteKey)`.
- AI Logic must show "Enforced" in the console.

---

## 10. UX and visual design

### 10.1 Pages
| Route | Purpose |
|---|---|
| `/` | Landing: the one-line pitch, the signature airlock animation playing a sample, a "Try it" button that goes to chat, how it works in three steps, the protection status. |
| `/chat` | Airlock Chat (P0-6) |
| `/clipboard` | Clipboard airlock (P0-8) |
| `/receipts` | Local history of receipts; export as JSON; clear |
| `/org` | Org mode: create or join, policy editor, terms, stats dashboard (admin) |
| `/bench` | Leak benchmark |
| `/how-it-works` | Architecture and the privacy explainer |
| `/privacy`, `/terms` | Legal |
| `/settings` | Settings |

### 10.2 Design language (the owner's taste; follow it strictly)
- **Rounded, warm and joyful, never corporate.**
  - Fonts: Baloo 2 for display, Nunito for body, with **one** handwritten aside in Caveat.
  - Pill buttons, card radii of 24 to 34px, soft wide tinted shadows, blobs and soft curves.
- **Light mode only.** A tinted ink colour on a pale ground, one action colour and one success colour.
  - **Not** a beige or cream reflex background; pick a deliberate palette, for example a cool pale mint or sky with deep ink.
- **Motion everywhere, done right:**
  - transform and opacity only
  - easing `cubic-bezier(0.16, 1, 0.3, 1)`
  - respect `prefers-reduced-motion`
- **Plain where it counts:**
  - statuses as plain text, never decorative pills, badges or "live" dots
  - no eyebrow labels, no big-number stat rows, no three identical icon cards, no gradient text, no frosted glass, no emoji icons, **no em dashes in any UI copy**
- **Copy:** warm, plain, first person ("we"), sentence case, a little playful, never alarmist. Credit people, not technology.
- **Accessibility:** WCAG 2.1 AA, 44px touch targets, visible focus, keyboard-operable everything, ARIA live regions for streaming answers and status changes.
- **Performance:** fast on a mid-range laptop. Lazy-load Tesseract and the benchmark page. Keep the initial JS small.

### 10.3 Signature idea: the airlock chamber
- An illustrated, animated two-door chamber sits beside the composer.
- **When you send:**
  1. your message slides into the chamber (inner door open)
  2. the inner door closes
  3. a soft mist sweeps across, and **each sensitive word visibly flips** into its stand-in (a per-word flip animation, coloured by category)
  4. the outer door opens, and the cleaned message drifts out toward a small cloud
- **When the answer returns,** it comes back through the outer door. Stand-ins flip back to real names *inside* the chamber, then the inner door opens and the answer lands in the chat.
- The door states reflect the router: LOCAL_ANSWER means the outer door never opens ("stayed on your device"). BLOCK means a gentle red lamp and the door stays shut.
- It's built in SVG + CSS/Framer Motion, not video. It **is the explanation of the product**, and it must stay legible at small sizes and in reduced motion (where it becomes a static step diagram with state text).

### 10.4 Copy samples (tone reference; no em dashes)
- Status: "On-device protection is ready. Your secrets stay on this laptop."
- Reduced: "This browser can't run the private model, so we're using our rule checks only. You'll be asked before anything is sent."
- Receipt header: "What left your device"
- Block: "We held back 1 secret (an API key). The rest went through."

---

## 11. Engineering

### 11.1 Repo structure (monorepo, npm workspaces)
```
airlock/
  .kiro/                     steering, specs, hooks, agents, settings/mcp.json (committed)
  docs/BRIEF.md              this file
  docs/KIRO_LOG.md           running log of how Kiro was used (for the write-up)
  packages/scrub-engine/     pure TS: detectors (rules), merge, policy, stand-ins, restore, vault interface, types
    src/ test/ (vitest + fast-check)
  packages/nano-detector/    the Firebase AI Logic wrapper: availability, init, structured detection, task classification, chunking
  apps/web/                  Vite + React 19 + TS app (routes in section 10.1)
    src/features/{chat,clipboard,receipts,org,bench,settings,onboarding}
    src/firebase/            init, appCheck, remoteConfig, auth, firestore
    src/ui/                  design tokens, components, AirlockChamber animation
  firebase.json  firestore.rules  firestore.indexes.json  .firebaserc
  LICENSE  README.md
```

### 11.2 Libraries
`firebase` (v13+), `react`, `react-dom`, `react-router`, `framer-motion` (or `motion`), `idb`, `zod` (validating model JSON output), `fast-check`, `vitest`, `@playwright/test`, `tesseract.js` (P2, lazy). Avoid heavy UI kits; build components in-house to the design language.

### 11.3 Security
- No secrets in the repo. The Firebase web config is public by design, but App Check protects it.
- **Hosting headers in `firebase.json`:**
  - a strict CSP (`default-src 'self'`; `connect-src` limited to Firebase/Google API endpoints; no `unsafe-eval`; `wasm-unsafe-eval` only if Tesseract needs it)
  - `X-Content-Type-Options`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy`
  - `frame-ancestors 'none'`
- Never log raw text, mappings or findings to the console in production builds, and never send them to any network endpoint. **A lint rule or test asserts that the network layer only ever receives the scrubbed text.**
- Validate all model JSON with zod. Treat model output as untrusted (render as text, never as HTML).
- Source maps off in production. Dependencies audited.

### 11.4 Testing
| Kind | What |
|---|---|
| Unit (Vitest) | every rule detector (with positive and negative cases, including Verhoeff and Luhn), merge rules, policy resolution, stand-in generator, restore edge cases |
| Property (fast-check) | all invariants in section 8.6, with arbitraries that build documents with planted secrets of every category in random positions and formats |
| Firestore rules | emulator tests: members can only increment stats; no content fields |
| E2E (Playwright, Chrome channel) | chat happy path with the cloud mocked; clipboard flow; reduced-protection flow (Nano mocked unavailable); receipt correctness |
| Manual in real Chrome | Nano detection quality via `/bench` |

### 11.5 Definition of done (P0)
- [ ] The chat works end to end with real Nano detection and the real cloud answer, restored correctly.
- [ ] The receipt shows the exact outbound text and `inferenceSource` for each step.
- [ ] Reduced-protection mode works when Nano is unavailable.
- [ ] All property tests pass with 1,000+ runs each.
- [ ] Deployed to Firebase Hosting with App Check enforced.
- [ ] The README covers: what it is, value proposition, how AI Logic is used (with code pointers), setup (including the Chrome flag), the architecture diagram, privacy guarantees, benchmark results, the honest tooling line, and the license.

---

## 12. Kiro plan (the Kiroween judges score this)

The aim is to use Kiro deeply and visibly, and to log it in `docs/KIRO_LOG.md` as you go (date, what you asked, what Kiro did, what changed).

**Steering (`.kiro/steering/`)**
- `product.md` (always): a condensed version of sections 1 to 5.
- `tech.md` (always): stack, platform facts from section 6, library choices, commands.
- `structure.md` (always): section 11.1.
- `privacy-invariants.md` (always): section 8.6 plus the security rules from section 11.3, written as MUST statements.
- `design.md` (fileMatch: `apps/web/src/**/*.{tsx,css}`): section 10.
- `brief.md` (manual, `#brief`): `#[[file:docs/BRIEF.md]]`, so the full brief is pulled in only when needed, saving credits.

**Specs (`.kiro/specs/`), in build order:**
1. `scrub-engine`: rules, merge, policy, stand-ins, restore (section 8), with PBT for section 8.6.
2. `nano-detector`: AI Logic wrapper, availability and init UX, structured detection, chunking, task classification.
3. `hybrid-router`: section 8.4 plus receipts.
4. `vault`: encrypted IndexedDB, TTL, forget.
5. `airlock-chat`: UI, streaming, the restore buffer, the chamber animation.
6. `clipboard-airlock`
7. `firebase-platform`: App Check, Remote Config, Hosting headers, Auth.
8. `org-mode`: Firestore schema, rules and their tests, admin UI.
9. `leak-benchmark`
10. (P2) `screenshot-airlock`, `chrome-extension`.

**Hooks (`.kiro/hooks/*.json`); confirm the exact trigger names in the Kiro hook editor**
- **Secret guard (dogfooding)**, on prompt submit:
  - runs `node packages/scrub-engine/bin/check-prompt.mjs`, which reads `USER_PROMPT` from the environment
  - exits with code 2 if a credential or ID is found
  - so Airlock's own detector stops you pasting secrets into Kiro
- **Test on save** (file save, matcher `packages/.*\.ts$`): `npx vitest related --run`.
- **PBT after task** (post task execution): `npm run test:props -w packages/scrub-engine`.
- **Privacy review on stop** (agent stop, type agent): "Review the diff for any code path that could send raw text, findings or mappings to the network, console or storage other than the vault. Report file:line."
- **Docs sync** (manual): update README sections from the specs.

**Custom agents (`.kiro/agents/`)**
- `leak-auditor`: read-only tools; its prompt is to hunt for egress paths and invariant violations; it loads `privacy-invariants.md`.
- `copy-editor`: checks UI copy against the voice rules (no em dashes, sentence case, warm tone).

**MCP (`.kiro/settings/mcp.json`)**
- **Firebase MCP server:** project, App Check, Remote Config and rules setup.
- **Playwright MCP:** let Kiro drive Chrome to check flows.
- **GitHub MCP:** issues and PRs.

**Property-based testing:** use Kiro's Correctness / PBT flow on the `scrub-engine` spec so the properties trace back to EARS requirements.

**Write-up material to capture:**
- screenshots of the specs
- the hook firing (the secret guard blocking a real key)
- the leak-auditor findings
- a PBT counterexample that was shrunk and then fixed
- how spec-driven work compared to vibe coding

---

## 13. Demo video plan (3 minutes or less; reuse for all three hackathons)
| Time | Shot |
|---|---|
| 0:00–0:15 | Hook: "Every day, people paste secrets into AI. Companies either ban it, or send your secrets to yet another cloud to check them." |
| 0:15–1:20 | Paste a realistic HR email (fictional people) into Airlock Chat: the chamber animation, stand-ins flipping, the cloud answer streaming back with real names restored; open the receipt "What left your device". |
| 1:20–1:45 | Turn Wi-Fi off: detection still works (on-device). A short rewrite request is answered fully on the device; the outer door never opens. |
| 1:45–2:10 | Clipboard airlock with another AI tool's text (no third-party logos on screen; blur or use a neutral window). |
| 2:10–2:35 | Org mode: the admin adds "Project Falcon" as a protected term; a member's message is caught; the counts-only dashboard. |
| 2:35–3:00 | Benchmark table (rules vs rules + Nano), the architecture diagram, "Built with Kiro and Firebase AI Logic", the close. |

Use fictional data only. Show `inferenceSource` labels on screen. No copyrighted music. Your own voice-over.

---

## 14. Submission checklists

**Firebase (Nov 30)**
- [ ] Repo is public, with the Apache-2.0 license shown in About
- [ ] AI Logic is imported and called
- [ ] App Check is on
- [ ] Hosted URL
- [ ] YouTube video of 3 minutes or less
- [ ] Description covers: how AI Logic is used, features, value proposition
- [ ] Platform: Web
- [ ] Tag `firebase-submission`

**Kiroween (Dec 4)**
- [ ] `/.kiro` is committed
- [ ] Category: Frankenstein, plus the student prize details (LinkedIn, student email, year/class, school)
- [ ] Working URL
- [ ] Video under 3 minutes
- [ ] Kiro write-up
- [ ] Blog post (says it was written for Kiroween 2026), plus the social post starting with `#KiroweenHackathon26`
- [ ] Tag `kiroween-submission`

**Slay (Dec 7)**
- [ ] Overview, problem/solution, the AI used and why (stress responsible AI), demo link, screenshots, repo, video, accurate tech list (Kiro, Claude Code, Firebase AI Logic, Gemini Nano, Gemini cloud)
