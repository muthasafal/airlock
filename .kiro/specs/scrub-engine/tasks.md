# Implementation Plan: Scrub Engine

## Overview

This plan specifies the implementation of the scrub engine package, a pure TypeScript library for detecting and obfuscating sensitive data before sending to cloud AI. The package comprises 15 rule-based detectors (Layer A), merge logic (Layer C), policy resolution, stand-in generation with collision detection, restoration with case/possessive handling, and 9 property-based tests covering all privacy invariants.

The implementation is broken into 11 checkpoints progressing from core utilities, through detectors, merge/policy, stand-in generation, main scrub/restore functions, CLI tool, and comprehensive testing.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "1.4"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "2.12", "2.13", "2.14", "2.15"]
    },
    {
      "id": 2,
      "tasks": ["3.1", "4.1"]
    },
    {
      "id": 3,
      "tasks": ["5.1", "5.2"]
    },
    {
      "id": 4,
      "tasks": ["6.1"]
    },
    {
      "id": 5,
      "tasks": ["7.1", "7.2"]
    },
    {
      "id": 6,
      "tasks": ["8.1"]
    },
    {
      "id": 7,
      "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9"]
    },
    {
      "id": 8,
      "tasks": ["10.1", "10.2", "10.3", "10.4"]
    },
    {
      "id": 9,
      "tasks": ["11.1"]
    }
  ]
}
```

**Task details:**

| Task ID | Title | Checkpoint | Depends On |
|---------|-------|------------|-----------|
| 1.1 | Implement entropy.ts | 1 | — |
| 1.2 | Implement luhn.ts | 1 | — |
| 1.3 | Implement verhoeff.ts | 1 | — |
| 1.4 | Load and validate pools | 1 | — |
| 2.1–2.15 | Implement 15 Layer A detectors (R1–R15) | 2 | 1.1–1.4 |
| 3.1 | Implement merge.ts (R16–R17) | 3 | 1.1–1.4 |
| 4.1 | Implement policy.ts (R18–R20) | 4 | 1.1–1.4 |
| 5.1 | Implement stand-ins.ts (R21–R29) | 5 | 1.1–1.4, 2.1–2.9 |
| 5.2 | Implement generalize.ts (R27–R28) | 5 | 1.1–1.4 |
| 6.1 | Implement scrub.ts (R30–R31) | 6 | 2.1–2.15, 3.1, 4.1, 5.1, 5.2 |
| 7.1 | Implement restore.ts (R32–R35) | 7 | 1.1–1.4 |
| 7.2 | Implement streaming-restore.ts (R35) | 7 | 7.1 |
| 8.1 | Implement bin/check-prompt.mjs | 8 | 2.1–2.15 |
| 9.1–9.9 | PBT tests (P1–P9) | 9 | 6.1, 7.1, 7.2 |
| 10.1–10.4 | Integration & testing | 10 | All previous |
| 11.1 | JSDoc + documentation | 11 | All previous |

## Tasks

### Checkpoint 1: Core Types and Utilities

- [x] 1.1 Implement `checksums/entropy.ts`: Shannon entropy calculator (requirements R9)
  - Input: string
  - Output: number (0–8, where 0 is all same char, ~6 is high-entropy)
  - Formula: `Σ -p_i * log₂(p_i)` over character distribution
  - Test: entropy("aaaa") ≈ 0, entropy("aAbB12!@") ≥ 3.5

- [x] 1.2 Implement `checksums/luhn.ts`: Luhn checksum validation (R7, R25)
  - `luhnCheck(digits)`: boolean, returns true if Luhn passes
  - `luhnFail(digits)`: boolean, returns true if Luhn fails (helper for generation)
  - Test: Luhn('4532123456789010') = true, Luhn('4532123456789011') = false

- [x] 1.3 Implement `checksums/verhoeff.ts`: Verhoeff checksum validation (R3, R25)
  - `verhoeffCheck(digits)`: boolean, returns true if Verhoeff passes
  - `verhoeffFail(digits)`: boolean, returns true if Verhoeff fails (helper for generation)
  - Test: Valid Aadhaar, Invalid Aadhaar

- [x] 1.4 Load and validate pools (JSON data files or typed constants):
  - `pools/names.json`: Indian first names (≥300), Indian surnames (≥300), Western first names (≥300), Western surnames (≥300)
  - `pools/companies.json`: Fictional company names (≥300, verified not famous brands)
  - `pools/cities.json`: Indian and Western cities (≥50 each)
  - `pools/projects.json`: Two-word codenames (adjective + noun, ≥100)
  - `pools/domains.json`: Fictional `.example` domains (≥20, e.g., northwind.example, contoso.example)

---

## Checkpoint 2: Layer A Detectors (Rules)

Each detector test includes both positive and negative cases.

- [x] 2.1 Implement `detectors/email.ts` (R1)
  - Pattern: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
  - Reject if length > 254
  - **Unit test:** `test/unit/detectors/email.test.ts`
    - Positive: standard emails, plus dots and underscores in local part
    - Negative: missing TLD, invalid domain, no @

- [x] 2.2 Implement `detectors/phone.ts` (R2)
  - Indian mobile: `(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}`
  - International: `\+\d{1,3}[\s-]?\d{6,14}`
  - Reject if matched digits are part of longer runs
  - **Unit test:** `test/unit/detectors/phone.test.ts`
    - Positive: Indian with/without +91, international, with separators
    - Negative: 5-digit runs, entirely numeric strings, invalid class

- [x] 2.3 Implement `detectors/aadhaar.ts` (R3)
  - Pattern: `\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b`
  - Validate Verhoeff checksum
  - **Unit test:** `test/unit/detectors/aadhaar.test.ts`
    - Positive: valid Aadhaar with/without spaces
    - Negative: invalid Verhoeff, starts with 0–1

- [x] 2.4 Implement `detectors/pan.ts` (R4)
  - Pattern: `\b[A-Z]{5}[0-9]{4}[A-Z]\b`
  - **Unit test:** `test/unit/detectors/pan.test.ts`
    - Positive: standard PAN
    - Negative: lowercase, wrong length, digits in wrong place

- [x] 2.5 Implement `detectors/ifsc.ts` (R5)
  - Pattern: `\b[A-Z]{4}0[A-Z0-9]{6}\b`
  - **Unit test:** `test/unit/detectors/ifsc.test.ts`
    - Positive: standard IFSC
    - Negative: lowercase, 5th char not 0

- [x] 2.6 Implement `detectors/bank-account.ts` (R6)
  - Find digit runs (9–18 digits), check keyword proximity (account, a/c, acct within 30 chars)
  - **Unit test:** `test/unit/detectors/bank-account.test.ts`
    - Positive: "account: 123456789012345", "a/c 123456789"
    - Negative: orphaned 12-digit run, keyword too far

- [x] 2.7 Implement `detectors/card.ts` (R7)
  - Pattern: 13–19 digits (optional separators)
  - Validate Luhn checksum
  - **Unit test:** `test/unit/detectors/card.test.ts`
    - Positive: Luhn-valid card with/without separators
    - Negative: Luhn-invalid, too few/many digits

- [x] 2.8 Implement `detectors/upi.ts` (R8)
  - Pattern: `[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}`
  - Reject if matches EMAIL pattern
  - **Unit test:** `test/unit/detectors/upi.test.ts`
    - Positive: standard UPI handles (paytm, upi, etc.)
    - Negative: email-like UPI (should be EMAIL)

- [x] 2.9 Implement `detectors/api-key.ts` (R9)
  - Prefix matching: sk-, sk-ant-, AKIA, AIza, ghp_, gho_, github_pat_, xox, glpat-, rk_live_, sk_live_
  - Entropy matching: length ≥ 24, entropy ≥ 3.5, mixed case/digits/symbols, keyword proximity (key, token, secret, password)
  - **Unit test:** `test/unit/detectors/api-key.test.ts`
    - Positive: known prefixes, high-entropy near keywords
    - Negative: low entropy, no keyword

- [x] 2.10 Implement `detectors/jwt.ts` (R10)
  - Pattern: `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`
  - **Unit test:** `test/unit/detectors/jwt.test.ts`
    - Positive: standard JWT
    - Negative: missing part, non-Base64 chars

- [x] 2.11 Implement `detectors/private-key.ts` (R11)
  - Pattern: from `-----BEGIN ... PRIVATE KEY-----` to `-----END ... PRIVATE KEY-----`
  - **Unit test:** `test/unit/detectors/private-key.test.ts`
    - Positive: RSA, EC, OpenSSH keys
    - Negative: public key, no end marker

- [x] 2.12 Implement `detectors/password.ts` (R12)
  - Pattern: `(password|passwd|pwd|pin)\s*[:=]\s*\S+` (keyword case-insensitive, capture value only)
  - **Unit test:** `test/unit/detectors/password.test.ts`
    - Positive: "password: mysecret", "pwd=abc123"
    - Negative: "passwordless", no assignment

- [x] 2.13 Implement `detectors/ip-address.ts` (R13)
  - IPv4: octet validation (0–255), reject 0.0.0.0 and 255.255.255.255
  - IPv6 (simplified): `[0-9a-fA-F:]{3,}:[0-9a-fA-F:]{3,}`
  - **Unit test:** `test/unit/detectors/ip-address.test.ts`
    - Positive: valid IPv4 (including private), valid IPv6
    - Negative: invalid octets, malformed

- [x] 2.14 Implement `detectors/url-secret.ts` (R14)
  - Pattern: URLs with `token=`, `key=`, `sig=`, `auth=`, `password=` (case-insensitive)
  - Capture value only (from = to & or end)
  - **Unit test:** `test/unit/detectors/url-secret.test.ts`
    - Positive: "?token=abc123", "?key=secret&other=val"
    - Negative: no query param

- [x] 2.15 Implement `detectors/org-term.ts` (R15)
  - Multi-pattern matching (Aho-Corasick or combined regex)
  - Whole-word matching (word boundaries)
  - **Unit test:** `test/unit/detectors/org-term.test.ts`
    - Positive: exact match of admin-entered term
    - Negative: substring of term, different case

---

## Checkpoint 3: Layer C Merge

- [x] 3.1 Implement `merge.ts` (R16–R17)
  - Function: `merge(findings: Finding[], nanoMinConfidence: number): Finding[]`
  - Overlap resolution: prefer longer, then rules over Nano for structured types, then severity
  - Confidence filtering: drop Nano findings < nanoMinConfidence
  - **Unit test:** `test/unit/merge.test.ts`
    - Overlapping EMAIL and PERSON at same span
    - Overlapping EMAIL (different lengths)
    - Low-confidence Nano finding

---

## Checkpoint 4: Policy Resolution

- [x] 4.1 Implement `policy.ts` (R18–R20)
  - Function: `resolveAction(category, sources): Action`
  - Precedence: orgPolicy > userSettings > remoteConfig > defaults
  - Function: `applyPolicy(findings, policy): Array<{ finding, action, replacement }>`
  - BLOCK placeholders: replace with `‹secret-N›`
  - **Unit test:** `test/unit/policy.test.ts`
    - Policy resolution order
    - BLOCK placeholder numbering
    - Default actions table

---

## Checkpoint 5: Stand-In Generation

- [x] 5.1 Implement `stand-ins.ts` (R21–R29)
  - Function: `generateStandIn(original, category, mapping): string`
  - Implements: PERSON shape (R21), ORG shape (R22), EMAIL shape (R23), PHONE shape (R24), ID fakes (R25), collision check (R29)
  - Helper: `createAliases(person, mapping): void`
  - Helper: `collectOriginals(text): Set<string>` for collision checking
  - **Unit test:** `test/unit/stand-ins.test.ts`
    - PERSON shape preservation (name parts, aliases)
    - ORG shape preservation (suffix)
    - EMAIL consistency (reuse PERSON if applicable, .example TLD)
    - PHONE format preservation, 0000x for Indian
    - ID checksums invalid
    - Collision detection and re-draw
    - Numbered fallback after 20 re-draws

- [x] 5.2 Implement `generalize.ts` (R27–R28)
  - Function: `generateGeneralization(original, category): string`
  - FINANCIAL_AMOUNT: preserve currency, round magnitude
  - HEALTH/LEGAL_MATTER: use mapping table, fallback to generic phrase
  - **Unit test:** `test/unit/generalize.test.ts`
    - FINANCIAL_AMOUNT magnitude preservation
    - HEALTH mapping (diabetes → chronic condition)
    - LEGAL_MATTER fallback

---

## Checkpoint 6: Merge and Integration

- [x] 6.1 Implement `scrub.ts` (R30–R31)
  - Function: `scrub(scrubInput: ScrubInput): ScrubResult`
  - Pipeline: apply detectors → merge → policy → stand-in generation → build output
  - Determinism: use session seed to initialize PRNG
  - **Unit test:** `test/unit/scrub.test.ts`
    - Full scrub with all detectors
    - Determinism (same seed → same output)
    - Output structure (text, findings, mapping, actions)

---

## Checkpoint 7: Restoration

- [x] 7.1 Implement `restore.ts` (R32–R35)
  - Function: `restore(scrubbed, mapping, policy?): RestoreResult`
  - Reverse map construction
  - Longest-first regex matching
  - Case handling, possessives, aliases
  - Generalised span marking
  - **Unit test:** `test/unit/restore.test.ts`
    - Round-trip PERSON with aliases
    - Possessive handling (Maya's → Priya's)
    - Case preservation (MAYA → PRIYA, maya → priya)
    - Generalised HEALTH not restored
    - Titles (Dr. Iyer → Dr. Shah)

- [x] 7.2 Implement `streaming-restore.ts` (R35)
  - Class: `StreamingRestoreBuffer`
  - Method: `push(chunk: string): string` (emit text up to last word boundary)
  - Method: `flush(): string`
  - **Unit test:** `test/unit/streaming-restore.test.ts`
    - Split stand-in across chunks
    - Random chunk sizes
    - Multiple stand-ins

---

## Checkpoint 8: CLI Tool

- [x] 8.1 Implement `bin/check-prompt.mjs` (dogfooding hook)
  - Read `USER_PROMPT` environment variable
  - Run Layer A detectors only (no Nano, no network)
  - Check for CREDENTIAL, API_KEY, JWT, PRIVATE_KEY, PASSWORD
  - Exit with code 0 if none found, code 2 if found
  - Output: descriptive message on stderr if found
  - **Manual test:** `USER_PROMPT="my key is sk-abc123" node bin/check-prompt.mjs` → exit code 2

---

## Checkpoint 9: Property-Based Tests

Each property test numRuns ≥ 1000. Arbitraries:
- Random text with planted secrets
- Random session seeds (determinism)
- Random policy combinations
- Random detector subsets (merge deduplication)
- Random chunk boundaries (streaming)

- [x] 9.1 Implement `test/properties/no-leak.test.ts` (P1)
  - Arbitrary: fcPlantedSecrets (all 24 categories)
  - Assert: no original substring in scrubbed output

- [x] 9.2 Implement `test/properties/round-trip.test.ts` (P2)
  - Arbitrary: fcPersonTexts with names, emails, phones
  - Assert: restore(scrub(x)) === x (for PSEUDONYMIZE only)

- [x] 9.3 Implement `test/properties/consistency.test.ts` (P3)
  - Arbitrary: fcText with repeated values
  - Assert: same original → same stand-in in same session

- [x] 9.4 Implement `test/properties/injectivity.test.ts` (P4)
  - Arbitrary: fcDistinctTexts
  - Assert: distinct originals → distinct stand-ins

- [x] 9.5 Implement `test/properties/non-collision.test.ts` (P5)
  - Arbitrary: fcText with many values
  - Assert: no stand-in matches any original substring (case-insensitive)

- [x] 9.6 Implement `test/properties/fakes-stay-fake.test.ts` (P6)
  - Arbitrary: fcCards, fcAadhaar, fcEmails, fcPhones
  - Assert: generated IDs fail checksums, emails are .example, phones are 0000x

- [x] 9.7 Implement `test/properties/determinism.test.ts` (P7)
  - Arbitrary: fcText, fcSeed
  - Assert: scrub(x, seed1) === scrub(x, seed1) (byte-identical)

- [x] 9.8 Implement `test/properties/idempotence.test.ts` (P8)
  - Arbitrary: fcText
  - Assert: scrub(scrub(x)) finds no new secrets in stand-ins from first pass

- [x] 9.9 Implement `test/properties/streaming-equivalence.test.ts` (P9)
  - Arbitrary: fcText, fcChunkCount, fcSeed
  - Assert: restore_chunk_by_chunk(x) === restore_whole(x)

---

## Checkpoint 10: Integration and Testing

- [x] 10.1 Run all unit tests: `npm run test:unit -w packages/scrub-engine`
  - All detectors pass positive and negative cases
  - All 15 detectors, merge, policy, stand-ins, restore tested

- [x] 10.2 Run all property tests: `npm run test:props -w packages/scrub-engine`
  - All 9 invariants pass with numRuns ≥ 1000
  - No shrunk counterexamples in final commit

- [x] 10.3 Build and type-check: `npm run build -w packages/scrub-engine`
  - No TypeScript errors
  - Public exports: types, all detectors, scrub, restore, StandInGenerator, etc.

- [x] 10.4 Check CLI tool: `USER_PROMPT="test" node bin/check-prompt.mjs`
  - Exit code 0 for clean input
  - Exit code 2 for credentials

---

## Checkpoint 11: Documentation

- [x] 11.1 Add JSDoc comments to all public functions
  - Each detector: input/output, examples
  - scrub, restore: usage, determinism note
  - Policy resolution: precedence order

- [x] 11.2 Add TODO comments linking to BRIEF.md sections
  - E.g., "// BRIEF §8.1 Layer A: EMAIL detection"

---

## Summary of Requirements Coverage

| Requirement ID | Task | Category |
|---|---|---|
| R1–R15 | 2.1–2.15 | Detectors |
| R16–R17 | 3.1 | Merge |
| R18–R20 | 4.1 | Policy |
| R21–R29 | 5.1–5.2 | Stand-ins |
| R30–R31 | 6.1 | Scrub |
| R32–R35 | 7.1–7.2 | Restore |
| P1–P9 | 9.1–9.9 | Properties |

---

## Notes

### Implementation Guidelines

- **Pure TypeScript:** No DOM or React dependencies. Package is framework-agnostic.
- **PRNG:** Use a simple seeded PRNG like mulberry32. Initialize from `SessionMapping.seed`.
- **Pools:** Pre-compute JSON files or typed constants for names, companies, cities, domains, projects. No runtime data loading.
- **Testing:** Vitest + fast-check. Run with `vitest --run` in CI/CD. All PBT tests with numRuns ≥ 1000.
- **Determinism:** Same seed + same detector outputs → byte-identical text and mapping. This is a **hard requirement** for reproducibility and debuggability.
- **Performance:**
  - Detection: < 100 ms for 10,000 characters (all 15 detectors)
  - Stand-in generation: < 10 ms per finding
  - Restoration: < 50 ms for 10,000 characters
  - Memory: < 10 MB for session mapping with 10,000 original-stand-in pairs

### Testing Strategy

- **Unit tests:** Every detector (positive and negative cases), merge, policy, stand-ins, restore, streaming restore
- **Integration tests:** Full scrub + restore workflows
- **Property-based tests (fast-check):** 9 invariants (P1–P9), each with numRuns ≥ 1000, arbitraries that plant secrets of all 24 categories in random positions, formats, and lengths
- **Manual/E2E (Playwright):** Chat with real Nano, clipboard flow, reduced protection

### Traceability

- Each requirement (R1–R40) is traced to 1+ tasks
- Each property (P1–P9) is traced to 1+ test files in `test/properties/`
- JSDoc comments link back to BRIEF.md sections
- Task completion produces passing tests, not just code

### Definition of Done (Checkpoint 10)

- [x] All unit tests pass: `npm run test:unit -w packages/scrub-engine`
- [x] All property tests pass: `npm run test:props -w packages/scrub-engine` (each with ≥ 1000 runs, no shrunk counterexamples)
- [x] Build succeeds: `npm run build -w packages/scrub-engine` (no TypeScript errors)
- [x] No secrets in CLI tool: `USER_PROMPT="test" node bin/check-prompt.mjs` → exit 0; `USER_PROMPT="sk-abc123" node bin/check-prompt.mjs` → exit 2

