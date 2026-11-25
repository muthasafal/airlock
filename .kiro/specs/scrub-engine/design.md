# Design Document

## Overview

The scrub engine is a pure functional TypeScript library that transforms raw user text into scrubbed text suitable for cloud AI while maintaining a session-local mapping to restore answers. It detects sensitive data via layered detectors (15 rule-based detectors in Layer A, plus Nano in Layer B via nano-detector package), deduplicates overlapping findings via Layer C merge, applies category policies, generates realistic and consistent stand-ins, and provides reverse restoration with case handling and possessive support.

**Key properties:**
- Pure TypeScript: no DOM, React, or network calls
- Deterministic: given the same seed and detector outputs, identical output
- Stateful: maintains session mappings locally (not sent to cloud)
- Streaming-aware: handles chunk-by-chunk restoration with tail buffering

## Architecture

The scrub engine is a pure functional pipeline:

1. **Input:** raw text, detectors array, session mapping, policy
2. **Layer A detection:** 15 rule-based detectors (EMAIL, PHONE, AADHAAR, PAN, IFSC, BANK_ACCOUNT, CARD, UPI, API_KEY, JWT, PRIVATE_KEY, PASSWORD, IP_ADDRESS, URL_SECRET, ORG_TERM) run and return findings
3. **Layer B detection:** Nano results passed in from nano-detector package
4. **Layer C merge:** deduplicate overlapping findings, apply confidence filters, sort by position
5. **Policy resolution:** for each finding, determine its action (PSEUDONYMIZE, GENERALIZE, BLOCK, KEEP)
6. **Stand-in generation:** for PSEUDONYMIZE and GENERALIZE findings, generate replacements and store in mapping
7. **Output construction:** replace each finding's span in the text per its action
8. **Output:** scrubbed text, findings list, updated mapping, action log

**Restoration** is a separate pipeline:
1. Input: scrubbed text, session mapping, policy
2. Build reverse map from mapping (stand-in → original, plus aliases)
3. Find all stand-ins in scrubbed text using longest-first regex
4. Apply case/possessive handling and restore
5. Output: restored text, restored spans log

## Components and Interfaces

### Module Structure

```
packages/scrub-engine/
├── src/
│   ├── types.ts                 # Shared types
│   ├── checksums/
│   │   ├── luhn.ts              # Luhn check; luhnFail for generation
│   │   ├── verhoeff.ts          # Verhoeff check; verhoeffFail for generation
│   │   └── entropy.ts           # Shannon entropy
│   ├── detectors/ (15 files)    # R1–R15 detectors
│   ├── pools/                   # Pre-computed data: names, companies, cities, domains, projects
│   ├── merge.ts                 # Layer C: overlap resolution (R16–R17)
│   ├── policy.ts                # Policy resolution (R18–R20)
│   ├── stand-ins.ts             # Generation for PSEUDONYMIZE/GENERALIZE (R21–R29)
│   ├── generalize.ts            # R27–R28
│   ├── restore.ts               # Restoration with case/possessive handling (R32–R35)
│   ├── streaming-restore.ts     # StreamingRestoreBuffer (R35)
│   ├── scrub.ts                 # Main pipeline (R30–R31)
│   └── index.ts                 # Public exports
├── test/
│   ├── unit/
│   │   ├── detectors/ (15 test files)
│   │   ├── merge.test.ts
│   │   ├── policy.test.ts
│   │   ├── stand-ins.test.ts
│   │   ├── generalize.test.ts
│   │   ├── restore.test.ts
│   │   ├── streaming-restore.test.ts
│   │   └── scrub.test.ts
│   └── properties/ (9 PBT test files)
├── bin/
│   └── check-prompt.mjs         # CLI tool for checking prompts (hook integration)
```

### Public Interfaces

**Core types (src/types.ts):**
- `Finding`: `{ start, end, text, category, detector, confidence }`
- `Policy`: `{ rules: PolicyRule[] }`
- `SessionMapping`: `{ forward, reverse, aliases, originals, seed }`
- `ScrubResult`: `{ text, findings, mapping, actions }`
- `RestoreResult`: `{ text, restoredSpans }`
- `DetectorConfig`: `{ nanoMinConfidence, protectedTerms }`
- `ScrubInput`: `{ text, detectors, mapping, policy }`

**Category enum:**
```typescript
type Category =
  | 'EMAIL' | 'PHONE' | 'AADHAAR' | 'PAN' | 'IFSC' | 'BANK_ACCOUNT' | 'CARD' | 'UPI'
  | 'API_KEY' | 'JWT' | 'PRIVATE_KEY' | 'PASSWORD' | 'IP_ADDRESS' | 'URL_SECRET' | 'ORG_TERM'
  | 'PERSON' | 'ORG' | 'LOCATION' | 'HEALTH' | 'FINANCIAL_AMOUNT' | 'LEGAL_MATTER'
  | 'INTERNAL_PROJECT' | 'CREDENTIAL' | 'GOVERNMENT_ID' | 'DATE_OF_BIRTH' | 'OTHER_SENSITIVE';
```

**Public functions:**
- `scrub(input: ScrubInput): ScrubResult`
- `restore(text: string, mapping: SessionMapping, policy?: Policy): RestoreResult`
- `createSessionMapping(seed: number): SessionMapping`
- `resolveAction(category: Category, sources: PolicySources): Action`
- All 15 detectors as `detect<Category>(text: string, config?: DetectorConfig): Finding[]`

## Data Models

### SessionMapping Structure

```typescript
{
  forward: Map<string, string>,   // original → stand-in
  reverse: Map<string, string>,   // stand-in → original
  aliases: Map<string, string>,   // "Maya" → "Priya" (first-only)
  originals: Set<string>,         // all originals seen (for collision check)
  seed: number                    // 32-bit seed for PRNG
}
```

### Finding Structure

```typescript
{
  start: number;                  // byte offset in input
  end: number;                    // byte offset (exclusive)
  text: string;                   // the detected substring
  category: Category;             // what was found
  detector: "RULE" | "NANO";      // which detector found it
  confidence: number;             // 0–1; always 1.0 for rules
}
```

### Policy Resolution

```typescript
interface PolicySources {
  orgPolicy?: Partial<Record<Category, Action>>;
  userSettings?: Partial<Record<Category, Action>>;
  remoteConfig?: Partial<Record<Category, Action>>;
  // Built-in defaults always apply as fallback
}

function resolveAction(
  category: Category,
  sources: PolicySources
): Action {
  return sources.orgPolicy?.[category] ??
         sources.userSettings?.[category] ??
         sources.remoteConfig?.[category] ??
         defaultActions[category];
}
```

### Stand-In Generation

The stand-in generator uses:
1. **PRNG:** Seeded mulberry32 (or equivalent) initialized from `SessionMapping.seed`
2. **Pools:** Pre-computed JSON files (names ≥300, companies ≥300, cities ≥50, domains ≥20, projects ≥100)
3. **Collision detection:** Set-based lookup of originals and existing stand-ins
4. **Re-draw loop:** Up to 20 attempts; then numbered fallback `[Category]_[Index]`

### Merge Algorithm

**Overlap resolution priority (R16):**
1. Longer span wins
2. If equal length: rules win for structured types (EMAIL, PHONE, IDs), Nano wins for contextual types (PERSON, ORG)
3. Severity order: CREDENTIAL > GOVERNMENT_ID > HEALTH > FINANCIAL_AMOUNT > LEGAL_MATTER > ORG > PERSON > EMAIL > PHONE > LOCATION

**Confidence filtering (R17):**
- Drop Nano findings with `confidence < remoteConfig.nano_min_confidence` (default 0.5)
- Rule findings always pass (confidence 1.0)

## Correctness Properties

Each property is a fast-check test with numRuns ≥ 1000. Arbitraries generate text with planted secrets of all 24 categories in random positions, formats, and lengths.

### Property 1: No Leak (P1)

**Validates:** Requirements R1–R15 (all detectors), R16–R17 (merge), R18–R20 (policy)

For any input containing planted secrets that the detectors find, the scrubbed payload MUST contain no original sensitive substring (case-insensitive) for every category whose action is not KEEP.

**Implementation:** `test/properties/no-leak.test.ts` — plant secrets, scrub, assert no substring appears in output.

### Property 2: Round Trip (P2)

**Validates:** Requirements R21–R29 (stand-in generation), R32–R35 (restore)

For findings with action PSEUDONYMIZE only, `restore(scrub(x).text, mapping) === x`.

**Implementation:** `test/properties/round-trip.test.ts` — scrub with PSEUDONYMIZE policy, restore, assert equality.

### Property 3: Consistency (P3)

**Validates:** Requirements R21–R24 (stand-in shape), R31 (determinism)

Within a session, equal original values MUST map to equal stand-ins across multiple scrub calls.

**Implementation:** `test/properties/consistency.test.ts` — scrub text with repeated values, assert all occurrences map to same stand-in.

### Property 4: Injectivity (P4)

**Validates:** Requirements R21–R24 (stand-in shape), R29 (collision check)

Distinct original values MUST never share a stand-in.

**Implementation:** `test/properties/injectivity.test.ts` — scrub with distinct values, assert all stand-ins are unique.

### Property 5: Non-Collision (P5)

**Validates:** Requirement R29 (collision check)

No stand-in MAY equal (case-insensitively) any original substring in the session.

**Implementation:** `test/properties/non-collision.test.ts` — scrub, collect originals and stand-ins, assert no case-insensitive intersection.

### Property 6: Fakes Stay Fake (P6)

**Validates:** Requirements R25 (checksum-invalid fakes), R21–R24 (shape preservation)

Generated IDs fail their checksums; emails use `.example`; Indian phone numbers end in `0000x`.

**Implementation:** `test/properties/fakes-stay-fake.test.ts` — plant IDs/emails/phones, scrub, validate stand-ins fail Luhn/Verhoeff, use .example, end in 0000x.

### Property 7: Determinism (P7)

**Validates:** Requirement R31 (session determinism)

Given the same seed and the same detector outputs, scrub output MUST be identical.

**Implementation:** `test/properties/determinism.test.ts` — scrub same input twice with same seed, assert byte-identical output.

### Property 8: Idempotence (P8)

**Validates:** Requirements R21–R29 (stand-in generation)

Scrubbing already-scrubbed text MUST create no new findings for stand-ins it introduced.

**Implementation:** `test/properties/idempotence.test.ts` — scrub, scrub output, assert no new secrets found in stand-ins.

### Property 9: Streaming Equivalence (P9)

**Validates:** Requirement R35 (streaming restoration with tail buffer)

Restoring chunk-by-chunk MUST equal restoring the whole string, for any chunking.

**Implementation:** `test/properties/streaming-equivalence.test.ts` — scrub, restore whole, restore with random chunks, assert identical.

## Error Handling

- **Empty/null inputs:** Return ScrubResult with empty findings and original text unchanged (R36)
- **Very long inputs:** Complete without throwing; return valid ScrubResult (R37)
- **Unicode/accents:** Handle correctly; preserve in output (R38)
- **Detector failures:** Return empty findings list (graceful degradation); do not throw
- **Mapping collisions:** Re-draw up to 20 times; fall back to numbered format (R29)
- **Stand-in generation failures:** Use `[Category]_[Index]` format after re-draw exhaustion

## Testing Strategy

**Unit tests:**
- Every detector: positive cases (valid detections), negative cases (must not match)
- Merge: overlap resolution, confidence filtering, sorting
- Policy: resolution order, default table, BLOCK placeholders
- Stand-ins: shape preservation (PERSON parts, ORG suffixes, EMAIL .example, PHONE 0000x), collision re-draw, fallback
- Restore: aliases, possessives, case variants, generalised spans, titles
- Streaming restore: chunk boundaries, various chunk sizes

**Property-based tests (fast-check, numRuns ≥ 1000):**
- 9 invariants (P1–P9) with arbitraries that plant secrets of all 24 categories

**Integration tests:**
- Full scrub + restore workflows with mixed policies and detector subsets

**Manual/E2E tests (Playwright):**
- Chat happy path with real Nano detection and cloud answer
- Clipboard flow
- Reduced-protection mode (Nano unavailable)

## Performance Targets

- **Detection:** < 100 ms for 10,000 characters (all 15 detectors)
- **Stand-in generation:** < 10 ms per finding
- **Restoration:** < 50 ms for 10,000 characters
- **Memory:** < 10 MB for session mapping with 10,000 original-stand-in pairs

