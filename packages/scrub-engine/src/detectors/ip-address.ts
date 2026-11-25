import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const V4 = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d]|\.\d)/g;
const V6 = /(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![0-9A-Fa-f:])/g;

/** IPv4 with octet validation (0-255) and simplified IPv6 (8 groups or "::" compression). BRIEF §8.1 IP_ADDRESS. */
export function detectIpAddress(text: string, _config?: DetectorConfig): Finding[] {
  const v4 = matchAll(text, V4, 'IP_ADDRESS', (v) =>
    v.split('.').every((o) => Number(o) <= 255 && !/^0\d/.test(o)),
  );
  const v6 = matchAll(text, V6, 'IP_ADDRESS', (v) => {
    const groups = v.split(':');
    const colons = groups.length - 1;
    const hexy = /[0-9a-f]/i.test(v);
    if (!hexy) return false;
    if (v.includes('::')) return colons >= 2 && (v.match(/::/g) ?? []).length === 1 && v.replace(/:/g, '').length >= 1;
    return colons === 7 && groups.every((g) => g.length >= 1);
  });
  return [...v4, ...v6];
}
