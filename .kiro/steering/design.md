---
inclusion: fileMatch
fileMatchPattern: "apps/web/src/**/*.{tsx,ts,css}"
---
---
loadMode: fileMatch
fileMatch: apps/web/src/**/*.{tsx,css}
---

# Design Language

This steering applies to all UI components and styles in the web app.

## Philosophy

Rounded, warm and joyful. Never corporate. Light mode only.

## Typography

- **Display**: Baloo 2 (headings, big type)
- **Body**: Nunito (all body text, UI labels)
- **Accent**: Caveat (one handwritten aside, sparingly)

## Color

Pick a deliberate palette with a tinted ink on a pale ground. NOT beige or cream.

Example direction: cool pale mint or sky background with deep ink.

- One action color (buttons, links)
- One success color (confirmations, restored text highlights)
- Semantic colors for categories (subtle, not alarming)

## Shape and spacing

- **Buttons**: Pill shaped
- **Cards**: Border radius 24-34px
- **Shadows**: Soft, wide, tinted (not harsh black)
- **Spacing**: Generous, comfortable

## Motion

**Transform and opacity only** for performance.

- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
- **Duration**: 200-400ms for most transitions
- **MUST respect**: `prefers-reduced-motion` (disable animations when set)

Motion is everywhere but never gratuitous. It explains state changes and guides attention.

## Status display

**Plain text, never decorative.**

- ✅ "On-device protection is ready"
- ❌ Not: status badge pills, "live" dots, eyebrow labels

## What to avoid

- Big-number stat rows with identical layouts
- Three identical icon cards in a row
- Gradient text
- Frosted glass or backdrop blur
- Emoji as functional icons
- Em dashes in UI copy (use commas or periods)
- Badge pills for statuses
- Corporate blue and grey schemes

## Copy voice

- Warm, plain, first person ("we")
- Sentence case, not Title Case
- A little playful, never alarmist
- Credit people, not technology
- Short sentences
- Example: "We held back 1 secret (an API key). The rest went through."

## Accessibility (WCAG 2.1 AA)

- **Touch targets**: 44px minimum
- **Focus indicators**: Visible, clear
- **Keyboard**: Everything operable without mouse
- **ARIA live regions**: For streaming answers and status changes
- **Color contrast**: AA compliant for all text
- **Alt text**: Descriptive, not decorative

## Signature element: The airlock chamber

An illustrated, animated two-door chamber shows the scrubbing process:

1. Message enters (inner door opens)
2. Inner door closes
3. Mist sweeps across, **each sensitive word flips** to its stand-in (per-word animation, colored by category)
4. Outer door opens, cleaned message drifts toward a small cloud

On return:
- Answer comes through outer door
- Stand-ins flip back inside the chamber
- Inner door opens, answer appears in chat

**Door states reflect router decision:**
- `LOCAL_ANSWER`: Outer door never opens ("stayed on your device")
- `BLOCK`: Gentle red lamp, door stays shut
- `CLOUD_SCRUBBED`: Full animation

Built in **SVG + CSS/Framer Motion**, not video. Must be legible at small sizes. In reduced-motion mode, becomes a static step diagram with state text.

## Performance

- Fast on mid-range laptop
- Lazy-load heavy dependencies (Tesseract, benchmark page)
- Keep initial JS bundle small
- Code-split routes
