---
inclusion: always
---
---
loadMode: always
---

# Privacy Invariants

These are MUST requirements. Every one becomes a property-based test and a manual review checkpoint.

## Core invariants (section 8.6 of BRIEF)

### 1. No leak

For any input containing planted secrets that the detectors find, the outbound payload MUST contain **none** of the original sensitive substrings (case-insensitive comparison) for every category whose action is not KEEP.

**Test**: Generate documents with known secrets in all categories. Run scrub. Assert no original secret appears in the scrubbed output.

### 2. Round trip

For findings with action PSEUDONYMIZE only, `restore(scrub(x).text, mapping)` MUST equal `x`.

**Test**: Generate text with names, emails, phones. Scrub, then restore. Assert equality.

### 3. Consistency

Within a session, equal original values MUST map to equal stand-ins across multiple scrub calls.

**Test**: Scrub text containing "Alice" twice in separate calls. Assert both map to the same stand-in.

### 4. Injectivity

Distinct original values MUST never share a stand-in.

**Test**: Scrub text with "Alice" and "Bob". Assert stand-ins are different.

### 5. Non-collision

No stand-in MAY equal (case-insensitively) any original substring present anywhere in the session.

**Test**: Scrub text. Assert no stand-in appears in the original input.

### 6. Fakes stay fake

- Generated card numbers MUST fail Luhn check
- Generated Aadhaar numbers MUST fail Verhoeff check
- Generated emails MUST use `.example` TLD
- Generated phone numbers MUST be clearly fictional (Indian: ends in `0000x` block)

**Test**: Generate stand-ins for each type. Assert validation fails.

### 7. Determinism

Given the same seed and the same detector outputs, scrub output MUST be identical.

**Test**: Scrub the same text twice with the same seed. Assert byte-for-byte equality.

### 8. Idempotence of detection

Scrubbing already-scrubbed text MUST create no new findings for the stand-ins it introduced.

**Test**: Scrub text. Scrub the output. Assert the second pass finds no new secrets in stand-ins from the first pass.

### 9. Streaming equivalence

Restoring a stream chunk-by-chunk MUST equal restoring the whole string, for any chunking.

**Test**: Restore text as one string. Restore the same text in random chunks. Assert results are equal.

## Security invariants

### 10. Network isolation

The scrub engine and nano-detector packages MUST NOT contain any network calls that could transmit:
- Raw text before scrubbing
- Findings or detected secrets
- Session mappings
- Encryption keys

**Enforcement**: Lint rule + test that scans source for `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`.

### 11. Vault isolation

Session mappings, original values and encryption keys MUST NOT be:
- Logged to console in production builds
- Sent to any analytics service
- Stored in Firestore or any cloud storage
- Included in error reports or diagnostics

**Enforcement**: Code review + test that production build contains no console.log in vault/scrub code.

### 12. Firestore content prohibition

Firestore writes in org mode MUST reject any field containing:
- User-generated text content
- Detected secrets or findings
- Original or scrubbed messages
- Anything other than counts, timestamps, and admin-entered policy terms

**Enforcement**: Firestore security rules + emulator tests that attempt to write prohibited data.

### 13. Stats are counts only

The stats increment operation MUST only accept:
- Numeric increments via `FieldValue.increment()`
- Known category keys from an allowed list
- No arbitrary keys, no string values

**Enforcement**: Firestore security rules validate `request.resource.data.diff(resource.data)` contains only numeric increments of known fields.

### 14. App Check enforcement

Every AI Logic call MUST include App Check token. Requests without valid App Check MUST fail.

**Enforcement**: Firebase console shows "Enforced". Manual test with App Check disabled must fail.

### 15. CSP enforcement

The hosted app MUST serve with Content Security Policy headers that:
- Disallow `unsafe-eval` (except `wasm-unsafe-eval` if Tesseract requires it)
- Restrict `connect-src` to Firebase and Google API endpoints only
- Disallow inline scripts without nonces
- Set `frame-ancestors 'none'`

**Enforcement**: Headers in `firebase.json`. Browser DevTools check on deployed site.

## Model output validation

### 16. Structured output validation

All JSON output from Nano MUST be validated with Zod schemas before use. Invalid output MUST be rejected, not used.

**Enforcement**: Wrap all model JSON parsing in Zod validation. Test with malformed JSON.

### 17. Hallucination filtering

Nano-detected spans that don't exist in the input text MUST be ignored, not used as findings.

**Enforcement**: Span resolution logic finds exact or case-insensitive matches only. Test with fabricated span text.

## Availability and fallback

### 18. Graceful degradation

When Nano is unavailable, the system MUST:
- Use rules-only detection
- Display "Reduced protection" status
- Require explicit consent before any cloud call
- Never silently send undetected secrets

**Enforcement**: Manual test with Nano mocked unavailable. Assert consent prompt appears.

### 19. Timeout handling

If Nano detection times out (8s per chunk), the system MUST:
- Keep rule-based findings
- Mark protection level as "Reduced"
- Inform the user
- Never send without detection

**Enforcement**: Test with mocked slow Nano. Assert status and findings behavior.
