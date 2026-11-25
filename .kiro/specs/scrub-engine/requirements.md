# Requirements Document

## Introduction

**Feature Name:** Scrub Engine  
**Feature ID:** scrub-engine  
**Source:** BRIEF.md sections 7 (P0-1 to P0-3), 8.1 (Layers A and C), 8.2, 8.3, 8.5, 8.6  
**Package:** `packages/scrub-engine`  
**Type:** Pure TypeScript library. Deterministic given seed and detector outputs. Zero DOM, React, or network calls.

The scrub engine transforms raw user text into scrubbed text suitable for cloud AI, maintaining a session-local mapping to restore answers. It detects sensitive data via layered detectors (rules, then Nano), deduplicates overlapping findings, applies category policies, generates realistic and consistent stand-ins, and provides reverse restoration with case handling.

## Requirements

### R1: EMAIL detection

**Given** a string input  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching the RFC-lite regex `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` as EMAIL findings

**Details:**
- Each match becomes a Finding with `category: "EMAIL"`, `detector: "RULE"`, `confidence: 1.0`.
- Reject any match where the full token is longer than 254 characters (RFC max).
- Span markers: start and end (exclusive) are byte offsets in the input string.

### R2: PHONE detection

**Given** a string input containing potential phone numbers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify Indian mobile and international formats:
- Indian mobile: `(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}` (10 digits, mobile class 6–9)
- International: `\+\d{1,3}[\s-]?\d{6,14}` (country code + at least 6 digits)

**And** it MUST reject spans where the matched digits are part of a longer run of digits (e.g. "123456789012345" should not match a 10-digit substring within it; a true phone is delimited).

**Details:**
- Each valid match becomes a Finding with `category: "PHONE"`, `detector: "RULE"`, `confidence: 1.0`.
- Whitespace and hyphens are allowed and normalized during detection.

### R3: AADHAAR detection

**Given** a string containing potential Aadhaar numbers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching `\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b`  
**And** it MUST validate the matched string using the Verhoeff checksum algorithm  
**And** it MUST only return findings where the Verhoeff check passes

**Details:**
- Aadhaar format: 12 digits (4–4–4), starting with 2–9 (never 0 or 1).
- Whitespace between groups is optional in the pattern and must be stripped for validation.
- Each valid match becomes a Finding with `category: "AADHAAR"`, `detector: "RULE"`, `confidence: 1.0`.

### R4: PAN detection

**Given** a string containing potential PAN numbers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching `\b[A-Z]{5}[0-9]{4}[A-Z]\b`  
**And** it MAY apply extra confidence if the 4th character is in the set {P, C, H, A, B, G, J, L, F, T}

**Details:**
- PAN format: 10 characters, e.g., `ABCDE1234F`.
- Each match becomes a Finding with `category: "PAN"`, `detector: "RULE"`, `confidence: 1.0` (or 0.95 if 4th character is not in the preferred set).

### R5: IFSC detection

**Given** a string containing potential IFSC codes  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching `\b[A-Z]{4}0[A-Z0-9]{6}\b`

**Details:**
- IFSC format: 11 characters. First 4 are letters, 5th is always "0", remaining 6 are alphanumeric.
- Each match becomes a Finding with `category: "IFSC"`, `detector: "RULE"`, `confidence: 1.0`.

### R6: BANK_ACCOUNT detection

**Given** a string containing potential bank account numbers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify digit runs of 9 to 18 consecutive digits  
**And** it MUST only return findings where the account number is near (within 30 characters before or after) one of the keywords: "account", "a/c", "acct" (case-insensitive)

**Details:**
- Whitespace and hyphens within the digit run should be stripped for length validation.
- Each valid match becomes a Finding with `category: "BANK_ACCOUNT"`, `detector: "RULE"`, `confidence: 1.0`.

### R7: CARD detection

**Given** a string containing potential payment card numbers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify digit sequences of 13 to 19 digits (optionally separated by spaces or hyphens)  
**And** it MUST validate each candidate using the Luhn checksum algorithm  
**And** it MUST only return findings where the Luhn check passes

**Details:**
- Strip separators (spaces, hyphens) before Luhn validation.
- Each valid match becomes a Finding with `category: "CARD"`, `detector: "RULE"`, `confidence: 1.0`.

### R8: UPI detection

**Given** a string containing potential UPI identifiers  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching `[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}`  
**And** it MUST reject any match that also matches the EMAIL pattern (to avoid false positives from email-like UPI)

**Details:**
- UPI format: `localpart@provider`, e.g., `user.name@paytm`, `merchant-id@upi`.
- Each valid match becomes a Finding with `category: "UPI"`, `detector: "RULE"`, `confidence: 1.0`.

### R9: API_KEY detection

**Given** a string containing potential API keys or credentials  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify any of the following:
1. Known prefixes (exact string match at the start of a token):
   - `sk-`, `sk-ant-`, `AKIA[0-9A-Z]{16}`, `AIza[0-9A-Za-z\-_]{35}`, `ghp_`, `gho_`, `github_pat_`, `xox[baprs]-`, `glpat-`, `rk_live_`, `sk_live_`
2. High-entropy strings: length ≥ 24, Shannon entropy ≥ 3.5, mixed character classes (uppercase, lowercase, digits, symbols), AND within 20 characters of one of the keywords: "key", "token", "secret", "password" (case-insensitive)

**Details:**
- For known prefixes, capture from the prefix to the next whitespace, comma, or end of line (token boundary).
- For entropy-based detection, calculate Shannon entropy over the character distribution. Require all three of: upper, lower, and (digit or symbol).
- Each valid match becomes a Finding with `category: "API_KEY"`, `detector: "RULE"`, `confidence: 1.0` (prefix) or `0.75` (entropy-based).

### R10: JWT detection

**Given** a string containing potential JWT tokens  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching the JWT pattern: `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`

**Details:**
- JWT format: three Base64URL-encoded parts separated by dots, starting with "eyJ" (header marker).
- Each match becomes a Finding with `category: "JWT"`, `detector: "RULE"`, `confidence: 1.0`.

### R11: PRIVATE_KEY detection

**Given** a string containing potential private keys  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings from `-----BEGIN [A-Z ]*PRIVATE KEY-----` up to and including the matching `-----END [A-Z ]*PRIVATE KEY-----`

**Details:**
- Capture the entire PEM block (including markers) as a single Finding.
- Examples: RSA, DSA, EC, OpenSSH private keys.
- Each match becomes a Finding with `category: "PRIVATE_KEY"`, `detector: "RULE"`, `confidence: 1.0`.

### R12: PASSWORD detection

**Given** a string containing password assignments  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all substrings matching the pattern `(password|passwd|pwd|pin)\s*[:=]\s*\S+` (case-insensitive on the keyword)  
**And** capture only the value part after the `:` or `=`

**Details:**
- Examples: `password: mysecret123`, `pwd=abc!@#`.
- The finding's `text` field should contain the value only (not the keyword or assignment).
- Each match becomes a Finding with `category: "PASSWORD"`, `detector: "RULE"`, `confidence: 1.0`.

### R13: IP_ADDRESS detection

**Given** a string containing IP addresses  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify:
1. IPv4: four octets (0–255 each) separated by dots: `(\d{1,3}\.){3}\d{1,3}` with octet validation
2. IPv6 (simplified): `[0-9a-fA-F:]{3,}:[0-9a-fA-F:]{3,}` (at least two groups of hex separated by colons)

**Details:**
- For IPv4, validate that each octet is in the range 0–255. Reject `0.0.0.0` and `255.255.255.255` (not useful for private data). Private ranges (10.*, 172.16–31.*, 192.168.*) are still findings (they may indicate internal infrastructure).
- Each valid match becomes a Finding with `category: "IP_ADDRESS"`, `detector: "RULE"`, `confidence: 1.0`.

### R14: URL_SECRET detection

**Given** a string containing URLs with sensitive query parameters  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all URLs containing query parameters: `token=`, `key=`, `sig=`, `auth=`, or `password=` (case-insensitive)  
**And** capture only the value part (from `=` to the next `&` or end of URL)

**Details:**
- Example: `https://api.example.com/endpoint?token=abc123&other=value` → capture `abc123`.
- The finding's `text` and span should refer to the value only.
- Each match becomes a Finding with `category: "URL_SECRET"`, `detector: "RULE"`, `confidence: 1.0`.

### R15: ORG_TERM detection

**Given** a string input and a list of protected terms from org policy (DetectorConfig.protectedTerms)  
**When** the scrub engine processes Layer A detection  
**Then** it MUST identify all case-insensitive whole-word matches of any protected term in the input

**Details:**
- Use Aho-Corasick or one combined regex from the term list for efficient multi-pattern matching.
- Whole-word means surrounded by word boundaries (or start/end of string).
- Each match becomes a Finding with `category: "ORG_TERM"`, `detector: "RULE"`, `confidence: 1.0`.
- If DetectorConfig.protectedTerms is empty or undefined, produce no ORG_TERM findings.

### R16: Overlap resolution by length

**Given** a list of findings from Layers A and B with overlapping spans  
**When** the scrub engine applies merge logic  
**Then** it MUST resolve each overlap by:
1. Preferring the longer span
2. If spans are equal length, preferring rule-based findings for structured types (EMAIL, PHONE, ID formats), and Nano findings for contextual types (PERSON, ORG)
3. Ordering by severity: CREDENTIAL > GOVERNMENT_ID > HEALTH > FINANCIAL_AMOUNT > LEGAL_MATTER > ORG > PERSON > EMAIL > PHONE > LOCATION

**Details:**
- Structured types (rule-based, non-contextual) are: EMAIL, PHONE, AADHAAR, PAN, IFSC, BANK_ACCOUNT, CARD, UPI, API_KEY, JWT, PRIVATE_KEY, PASSWORD, IP_ADDRESS, URL_SECRET, ORG_TERM.
- After resolution, sort the final list by start position.

### R17: Confidence filtering

**Given** findings from Nano with confidence scores  
**When** the scrub engine applies merge logic  
**Then** it MUST drop any Nano finding with `confidence < remoteConfig.nano_min_confidence` (default: 0.5)

**Details:**
- Rule-based findings always have confidence 1.0 and are never dropped.
- This filtering occurs after overlap resolution.

### R18: Policy default table

**Given** a category and no explicit policy override  
**When** the scrub engine resolves the action for that category  
**Then** it MUST use the following default action:

| Category | Default Action |
|---|---|
| PERSON, ORG, EMAIL, PHONE, LOCATION, ORG_TERM, INTERNAL_PROJECT, UPI | PSEUDONYMIZE |
| AADHAAR, PAN, CARD, BANK_ACCOUNT, IFSC, GOVERNMENT_ID | PSEUDONYMIZE |
| FINANCIAL_AMOUNT, HEALTH, LEGAL_MATTER, DATE_OF_BIRTH | GENERALIZE |
| API_KEY, JWT, PRIVATE_KEY, PASSWORD, CREDENTIAL, URL_SECRET | BLOCK |

### R19: Policy resolution order

**Given** a category and multiple policy sources (org, user, Remote Config, built-in)  
**When** the scrub engine resolves the action for a finding of that category  
**Then** it MUST apply this precedence (highest to lowest):
1. Org-level policy (PolicySources.orgPolicy)
2. User settings (PolicySources.userSettings)
3. Remote Config defaults (PolicySources.remoteConfig)
4. Built-in defaults (R18)

**Details:**
- The first (highest-priority) source that specifies an action for the category wins.
- If a source does not cover a category, move to the next lower source.

### R20: BLOCK action with placeholder

**Given** a finding with action BLOCK  
**When** the scrub engine applies the action during scrubbing  
**Then** it MUST replace the finding's span in the output text with a placeholder `‹secret-N›` where N is a 1-based counter of BLOCK findings in the output

**Details:**
- Example: first BLOCK → `‹secret-1›`, second BLOCK → `‹secret-2›`.
- The placeholder is exactly 11 characters for N < 10, 12 for N < 100, etc.
- Include these placeholders in the scrubbed text and in the receipt.

### R21: Shape preservation for PERSON

**Given** an original PERSON string and an empty or partial session mapping  
**When** the scrub engine generates a stand-in for the PERSON  
**Then** it MUST:
1. Detect the script/region (Indian vs Western) by checking if the surname is in the Indian surnames pool
2. Keep the number of name parts (e.g., "First Last" → two parts; "First Middle Last" → three parts)
3. Select first names and surnames from the matching region pool, ensuring each part is different from the original
4. Create aliases: if the original has a first and last name, generate separate first-only and last-only pseudonyms

**Details:**
- Pools: Indian first names (≥300), Indian surnames (≥300), Western first names (≥300), Western surnames (≥300), all gender-balanced.
- Aliases are stored in the mapping for use during restore.
- Example: "Priya Shah" (Indian, 2 parts) → "Maya Iyer" (stand-in), with aliases "Maya" (first-only) and "Iyer" (last-only).

### R22: Shape preservation for ORG

**Given** an original ORG string  
**When** the scrub engine generates a stand-in for the ORG  
**Then** it MUST:
1. Extract any suffix (e.g., "Pvt Ltd", "Inc", "Corp", "Labs") from the original
2. Generate a fictional company name from the company pool (≥300 names, verified not to be real famous brands)
3. Append the same suffix if the original had one

**Details:**
- Example: "Acme Corporation" → "Northwind Labs" (preserving the suffix pattern).

### R23: Shape preservation for EMAIL

**Given** an original EMAIL string  
**When** the scrub engine generates a stand-in for the EMAIL  
**Then** it MUST:
1. If the local part (before `@`) matches a PERSON already mapped in the session, reuse that person's stand-in
2. Otherwise, generate a new EMAIL as `firstname.lastname@fictional-domain.example`
3. Use `.example` TLDs (reserved, never real) from a small pool of domains (e.g., `northwind.example`, `acme.example`)

**Details:**
- Ensures logical consistency: if "priya.shah@example.com" is in the input and "Priya Shah" is a PERSON finding, the email's local part will be derived from the PERSON mapping.

### R24: Shape preservation for PHONE

**Given** an original PHONE string with a known format  
**When** the scrub engine generates a stand-in for the PHONE  
**Then** it MUST:
1. Preserve the same format and length
2. For Indian mobile numbers, generate digits where the last 5 digits are in the `0000x` block (e.g., `98765 00001`, `91234 00005`), making them obviously fictional
3. For international numbers, generate a valid-looking but non-conflicting digit sequence

**Details:**
- Example: `+91 98200 12345` (Indian, 10 digits) → `+91 87643 00007` (preserving format and length).
- The `.example` or `0000x` pattern ensures phonetic/format authenticity while remaining clearly fake.

### R25: Checksum-invalid fakes for structured IDs

**Given** an original AADHAAR, PAN, CARD, IFSC, or BANK_ACCOUNT  
**When** the scrub engine generates a stand-in  
**Then** it MUST generate a string that:
1. Matches the format and length of the original category
2. Fails validation (Verhoeff for Aadhaar, Luhn for card, etc.)
3. Is obviously fake when shown to a user (e.g., a Luhn-invalid card always fails payment, an Aadhaar-invalid number is never real)

**Details:**
- Example: original Luhn-valid card `4532 1234 5678 9010` → stand-in `4532 1234 5678 9011` (fails Luhn).
- Document in the README that stand-in IDs are non-functional.

### R26: APIs and credentials are not pseudonymized

**Given** a finding with category API_KEY, JWT, PRIVATE_KEY, PASSWORD, or CREDENTIAL  
**When** the scrub engine processes PSEUDONYMIZE action (by default or policy override)  
**Then** it MUST immediately escalate to BLOCK instead, replacing the span with `‹secret-N›`

**Details:**
- These categories have too much entropy and context to pseudonymize safely. Never generate a stand-in.
- If policy explicitly sets PSEUDONYMIZE for these, treat it as BLOCK.

### R27: Generalization for FINANCIAL_AMOUNT

**Given** an original FINANCIAL_AMOUNT (e.g., "₹4.5 lakh", "$50,000", "2.5 million euros")  
**When** the scrub engine applies the default GENERALIZE action  
**Then** it MUST:
1. Extract the currency symbol or name
2. Keep the order of magnitude (thousands, lakhs, millions) the same or round to a nearby band
3. Output a phrase like "about ₹5 lakh" or "around $60,000"

**Details:**
- Or, if user policy is PSEUDONYMIZE, multiply by a session-constant random factor (e.g., 0.8–1.2) and return "approximately ₹3.6 lakh".

### R28: Generalization for HEALTH and LEGAL_MATTER

**Given** an original HEALTH or LEGAL_MATTER string (e.g., "diabetes", "custody dispute", "patent infringement")  
**When** the scrub engine applies GENERALIZE  
**Then** it MUST replace it with a generic phrase from a small mapping table (e.g., diabetes → "a chronic condition", custody dispute → "a family matter"), falling back to "a medical condition" or "a legal matter" if not in the table

**Details:**
- Pre-built table in the scrub engine source, not downloaded at runtime.

### R29: Collision check and re-draw

**Given** a generated stand-in for any category  
**When** the scrub engine adds it to the session mapping  
**Then** it MUST:
1. Verify that the stand-in does NOT appear (case-insensitive) anywhere in any original text in the session
2. Verify that the stand-in is unique among all stand-ins already in the mapping
3. If either check fails, re-draw a new stand-in and repeat, up to 20 times
4. If 20 re-draws fail, use a numbered fallback: `[Category]_[Index]` (e.g., `PERSON_42`, `ORG_17`)

**Details:**
- Prevents logic errors: a stand-in that happens to match a real value in the session could fool a user into thinking the secret wasn't scrubbed.

### R30: Scrub function signature and output

**Given** an input ScrubInput (text, detectors array, session mapping, policy)  
**When** the scrub engine executes the scrub function  
**Then** it MUST return a ScrubResult containing:
1. `.text`: the scrubbed text with all findings replaced per their actions
2. `.findings`: the merged list of findings (sorted by start position)
3. `.mapping`: the updated session mapping (with new pseudonyms and their reverses)
4. `.actions`: an array of { finding, action, replacement } objects, one per finding

**Details:**
- The scrubbed text must be consistent with the actions: every finding's span is replaced per the action.
- If a finding is KEEP, it remains unchanged in the scrubbed text.

### R31: Session determinism

**Given** the same input text, the same set of detectors with the same outputs, and the same session seed  
**When** the scrub engine executes scrub twice with these inputs  
**Then** both outputs MUST be identical (byte-for-byte), including text and all stand-ins

**Details:**
- The session seed initializes the PRNG used for stand-in generation.
- Detector outputs are fixed (e.g., the same set of Rule findings, plus the same set of Nano findings if Nano is deterministic).

### R32: Reverse mapping with aliases and case variants

**Given** a scrubbed text, a session mapping, and category policies  
**When** the scrub engine restores the text  
**Then** it MUST:
1. Build a reverse map: each stand-in (and its aliases) → original
2. Find all stand-in matches in the scrubbed text using a combined regex (longest keys first, word-boundary aware, case-insensitive)
3. Preserve the casing style of the original: if the stand-in is capitalized but the original was lowercase, adjust accordingly
4. Mark generalised categories (FINANCIAL_AMOUNT, HEALTH, LEGAL_MATTER, DATE_OF_BIRTH, etc.) in the UI as "generalised" (not reversible)

**Details:**
- Example: stand-in "Maya Iyer" with casing style "UPPERCASE" in the found text → restore as "PRIYA SHAH".
- Aliases: if "Maya" (first-only) appears alone, restore to "Priya" (first-only from the original).

### R33: Possessives and plural handling

**Given** a stand-in in the scrubbed text with possessive (`'s` or `s'`) or plural (`s`) suffix  
**When** the scrub engine restores the text  
**Then** it MUST:
1. Detect and strip the suffix from the stand-in token
2. Find the matching stand-in in the reverse map
3. Restore the original and re-apply the suffix

**Details:**
- Example: "Maya's answer" → "Priya's answer".
- Example: "the Mayas arrived" → "the Priyas arrived".

### R34: Title and generalized span handling

**Given** a stand-in that may be preceded by a title (Ms., Dr., Prof., etc.)  
**When** the scrub engine restores the text  
**Then** it MUST preserve the title with the restored original

**Details:**
- Example: "Ms. Iyer agreed" → "Ms. Shah agreed".

### R35: Streaming restoration with tail buffer

**Given** chunks of scrubbed text arriving as a stream (e.g., cloud model output)  
**When** the restore module processes each chunk  
**Then** it MUST:
1. Keep a tail buffer of up to `maxStandInLength` characters (longest stand-in in the mapping)
2. For each chunk, search for stand-ins in (previous buffer + new chunk)
3. Emit text up to the last complete word boundary that can't be the start of a stand-in
4. Buffer the rest for the next chunk
5. On flush (end of stream), restore and emit all remaining buffered text

**Details:**
- Prevents split stand-ins across chunk boundaries (e.g., a stream chunk ends in the middle of "Maya" so the restore matches fail).

### R36: Empty and null inputs

**Given** an empty string or null/undefined input  
**When** the scrub engine processes it  
**Then** it MUST return a ScrubResult with empty findings and the original text unchanged

### R37: Very long inputs

**Given** an input longer than 50,000 characters  
**When** the scrub engine processes it  
**Then** it MUST complete without throwing and return a valid ScrubResult (note: Layer B/Nano is handled by nano-detector package, which chunks)

### R38: Unicode and accents

**Given** text with accented characters, diacritics, or non-Latin scripts (e.g., Devanagari, Arabic)  
**When** the scrub engine applies pattern matching and restoration  
**Then** it MUST handle them correctly and preserve them in the output

### R39: Overlapping PSEUDONYMIZE and GENERALIZE in one session

**Given** a session with PSEUDONYMIZE findings for some categories and GENERALIZE for others  
**When** the scrub engine scrubs and then restores  
**Then** PSEUDONYMIZE findings must round-trip, and GENERALIZE findings must remain generalized (not restorable)

### R40: Session seed initialization

**Given** a new session with no prior mappings  
**When** the scrub engine initializes the session  
**Then** it MUST use a provided seed (or generate a random 32-bit seed) to initialize the session PRNG

**Details:**
- The seed is stored in the SessionMapping and used to re-initialize the PRNG for each stand-in generation, ensuring determinism.

## Glossary

- **Detector:** A function that identifies sensitive spans in text. Layer A detectors are rule-based (15 total). Layer B is Nano (handled by nano-detector package).
- **Finding:** A detected sensitive span with category, confidence, and detector type.
- **Merge:** Layer C: deduplicating overlapping findings and filtering by confidence.
- **Stand-in:** A realistic pseudonym generated to replace an original sensitive value in PSEUDONYMIZE action.
- **Generalize:** A vague phrase replacing an original value in GENERALIZE action (e.g., "a chronic condition" for a medical term).
- **Session mapping:** A bidirectional map (original ↔ stand-in) scoped to one user session, stored locally in the vault.
- **Policy:** Rules defining the action (PSEUDONYMIZE, GENERALIZE, BLOCK, KEEP) for each category.
- **Restoration:** Reversing PSEUDONYMIZE replacements by looking up stand-ins in the session mapping and restoring originals.
- **Streaming restoration:** Incremental restoration of chunks with a tail buffer to handle split stand-ins.

