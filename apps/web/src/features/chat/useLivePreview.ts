import { useEffect, useState } from 'react';
import type { Finding } from '@airlock/scrub-engine';
import { previewFindings, refinePreview } from '../../lib/session';

export interface PreviewSegment {
  text: string;
  category?: Finding['category'];
}

/** Splits text into plain and sensitive segments for highlighting (rendered as text, never HTML). */
export function toSegments(text: string, findings: Finding[]): PreviewSegment[] {
  const out: PreviewSegment[] = [];
  let at = 0;
  for (const f of [...findings].sort((a, b) => a.start - b.start)) {
    if (f.start < at) continue;
    if (f.start > at) out.push({ text: text.slice(at, f.start) });
    out.push({ text: text.slice(f.start, f.end), category: f.category });
    at = f.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/**
 * Live redaction preview (BRIEF §P0-6): debounced 300 ms, rules run instantly, then Gemini Nano
 * refines on-device. Stale Nano results are ignored.
 */
export function useLivePreview(text: string): PreviewSegment[] {
  const [segments, setSegments] = useState<PreviewSegment[]>([]);
  useEffect(() => {
    if (!text.trim()) return;
    let cancelled = false;
    const rules = setTimeout(() => {
      if (!cancelled) setSegments(toSegments(text, previewFindings(text)));
    }, 300);
    const nano = setTimeout(() => {
      void refinePreview(text).then((f) => {
        if (!cancelled) setSegments(toSegments(text, f));
      });
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(rules);
      clearTimeout(nano);
    };
  }, [text]);
  return text.trim() ? segments : [];
}
