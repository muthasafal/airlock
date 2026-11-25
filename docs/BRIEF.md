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

[Rest of brief content continues...]
