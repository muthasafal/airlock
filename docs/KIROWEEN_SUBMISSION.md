# Kiroween submission: Airlock

Paste-ready text for the Devpost page (category: Frankenstein). The deadline is Fri, Dec 4, 2:00 PM PT (Sat, Dec 5, 3:30 AM IST).

---

## Tagline (one line)

Use any cloud AI without leaking secrets: a private model on your laptop swaps names, numbers and keys for realistic stand-ins before anything leaves.

## The 30-second version (put this first)

**What it does.** You paste a confidential email, a contract or some logs into Airlock. Gemini Nano, running on your own laptop, finds the names, emails, phone numbers, ID numbers, amounts and API keys, and swaps them for realistic stand-ins ("Priya Shah at Acme" becomes "Maya Iyer at Northwind"). Only that clean version goes to the cloud AI. The answer comes back about Maya, and Airlock turns her back into Priya on your laptop.

**Who it is for.** Anyone who handles other people's details and still wants AI help: HR teams, lawyers, doctors, teachers, NGO volunteers, and developers with keys in their logs.

**Why it matters.** Today companies either ban AI tools, and people use them anyway on their phones, or they buy "data loss prevention" that checks your prompt by sending it to yet another company's cloud. Airlock makes your own device the checkpoint, so nobody, us included, ever sees the real values.

## What makes it different

- **The cloud still reasons well.** Stand-ins read naturally and stay consistent across a conversation, unlike `[REDACTED]`.
- **Secrets never leave.** API keys, tokens and passwords become `‹secret-1›`, and Airy, our little ghost guide, tells you what was held back.
- **Fakes stay fake.** Stand-in cards fail the Luhn check, Aadhaar numbers fail Verhoeff, and emails use reserved `.example` domains.
- **Proof, not promises.** Every message gets a local receipt showing exactly what left your device and where each step ran (on-device or in the cloud).
- **It works with any AI.** The clipboard airlock cleans text for ChatGPT, Claude, Gemini or anything else, then restores the answer you paste back.
- **It outlives the hackathon.** The scrub engine is a standalone open-source package (Apache-2.0) that other tools can reuse.

## How we used Kiro

Airlock was built spec first in Kiro. Everything is in the public repo's [`/.kiro`](https://github.com/muthasafal/airlock/tree/main/.kiro) folder.

- **Steering.**
  - Six steering docs cover product, tech, structure and design.
  - `privacy-invariants.md` turns the brief's privacy rules into numbered MUST statements, and every change is checked against it. It made the biggest difference: it kept every generated file honest about where raw text may go.
  - The full brief is a manual steering doc (`#brief`), so it only loads when needed.
- **Specs.**
  - `architecture-skeleton`: Kiro laid out every planned file of the app as typed, wired stubs, each with a doc comment citing the brief, before any feature logic was written. Then it designed and built the whole frontend.
  - `scrub-engine`: EARS requirements (R1 to R38), a design with nine numbered correctness properties traced back to the requirements, and tasks.
  - Compared with vibe coding, the skeleton meant every later feature had a home, and nothing was orphaned.
- **Property-based testing.** The nine properties run 1,000 times each with fast-check:
  - no leak;
  - round trip;
  - consistency;
  - injectivity;
  - non-collision;
  - fakes stay fake;
  - determinism;
  - idempotence;
  - streaming equivalence.

  Property 8 failed and shrank to `"the 5593 3936 4224 0007 . the type 2 diabetes ."`. A 16-digit card number was partly matched as an Aadhaar number, and its last four digits leaked. We fixed the detector and the merge step, and the properties now pass.
- **Hooks.**
  - The **secret guard** runs Airlock's own detector on every prompt sent to Kiro, and blocks the prompt (exit code 2) if it contains a real-looking key, password or ID. Airlock protects its own builder.
  - Plus test-on-save, property tests after every spec task, a privacy review when the agent stops, and a manual docs-sync hook.
- **Custom agents.** `leak-auditor` is an adversarial reviewer that loads `privacy-invariants.md` and hunts for data-egress paths. `copy-editor` checks the UI copy against our voice rules.
- **MCP.** Firebase, Playwright and GitHub servers in `.kiro/settings/mcp.json`, with no tokens in the file.

**Honesty note:** Kiro's free monthly credits ran out partway through. Claude Code then implemented the remaining logic inside Kiro's stubs, following Kiro's design documents. The whole split is logged in `docs/KIRO_LOG.md`.

## Built with

Kiro, Firebase AI Logic (hybrid inference), Gemini Nano (Chrome built-in AI), Gemini API, Firebase App Check, Firebase Remote Config, Firebase Authentication, Cloud Firestore, Firebase Hosting, React, TypeScript, Vite, framer-motion, fast-check, Vitest, Playwright, Claude Code.

## Links

- Repo (public, Apache-2.0): https://github.com/muthasafal/airlock
- App: https://airlock-app.web.app (after deploy)
- Video: (YouTube link, public, under 3:00)

---

## Video script (2:40, short clips, no live typing, no waiting)

Record each line as its own clip. Paste text (don't type it), and cut out every loading wait. Add on-screen text in the editor. Use no music unless you own it, and keep third-party logos off screen. Start already set up; don't film setup.

| Time | Shot | On-screen text |
|---|---|---|
| 0:00 to 0:12 | Paste a fictional HR email into /chat and press Send. The chamber flips "Priya" to "Maya", and the answer comes back with "Priya" highlighted. | "The cloud never saw Priya." |
| 0:12 to 0:25 | Voice-over over the landing page's "What the cloud actually sees" cards: "Every day people paste secrets into AI. Airlock keeps them on your laptop." | "Without Airlock / With Airlock" |
| 0:25 to 0:50 | Open the receipt: originals on the left, the sent text on the right, `detection: ON_DEVICE`, `answer: IN_CLOUD`. | "Proof of what left your device" |
| 0:50 to 1:05 | Paste a message containing a fake API key. Airy pops up: "Boo! That looked like a secret". Click "Send without the secret". | "Secrets never leave. Not even as fakes." |
| 1:05 to 1:20 | Wi-Fi off, then ask for a short rewrite: "Stayed on your device", and the outer door never opens. | "Small jobs never leave the laptop" |
| 1:20 to 1:40 | Clipboard airlock: Clean and copy, paste into another AI tool (blur its logo), paste the answer back, Restore. | "Works with any AI" |
| 1:40 to 2:20 | **Kiro on screen:** the `scrub-engine` spec's requirements.md and its design.md correctness properties, then the PBT counterexample in the terminal. Then the secret-guard hook blocking a fake key typed into Kiro chat, then the `.kiro` folder tree. | "Built spec first with Kiro" |
| 2:20 to 2:40 | The /bench table (rules vs rules + Nano), the README architecture diagram, and the repo link. | "Open source. Built with Kiro and Firebase AI Logic." |

## Before you submit

- [ ] Repo is public; the Apache-2.0 license shows in About; `/.kiro` is committed (it is, and it's not in .gitignore).
- [ ] No keys in the repo. Checked 2026-11-27: no API key, App Check token or reCAPTCHA key in any tracked file or in git history. `.env.local` is gitignored.
- [ ] Hosted URL works in Chrome.
- [ ] The video is public on YouTube and under 3:00.
- [ ] "Kiro" is in Built With, and the description names the Kiro features (above).
- [ ] Blog post and social post starting `#KiroweenHackathon26` (BRIEF §14).
- [ ] Tag `kiroween-submission`.
- [ ] Kiro credits: credit requests close **Tue, Dec 1, 12:00 PM PT**. If you want Kiro to do more work (and show more Kiro), request credits on the Devpost Credits tab now.
