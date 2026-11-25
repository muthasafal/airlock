/**
 * Demo fixtures for chat and other pages.
 * Fictional people and organizations only, used to populate presentational components.
 */

export const DEMO_PEOPLE = [
  'Priya Shah',
  'Maya Iyer',
  'Arjun Kapoor',
  'Zara Khan',
  'Dev Patel',
];

export const DEMO_ORGS = [
  'Acme Corp',
  'Northwind Labs',
  'TechVision Inc',
  'DataFlow Systems',
  'CloudBridge Partners',
];

export const DEMO_EMAILS = [
  'priya@acmecorp.com',
  'maya@northwindlabs.com',
  'arjun.kapoor@techvision.example',
  'zara.khan@dataflow.example',
];

export const DEMO_PHONE = '+91 98765 43210';

export const DEMO_API_KEY = 'sk_live_d3f1n1t3ly_n0t_r34l_1a2b3c4d5e6f7g8h';

export const DEMO_CHAT_TURN = {
  original: 'Hi Maya at Northwind Labs, please send the Q3 invoice for client Acme Corp to my email maya.iyer@techvision.example.',
  scrubbed: 'Hi Zara at CloudBridge Partners, please send the Q3 invoice for client TechFlow Inc to my email zara.khan@dataflow.example.',
  answer: 'I have noted the request for the Q3 invoice. For Zara at CloudBridge Partners, the invoice for TechFlow Inc should be ready in 2 business days. I will send it to zara.khan@dataflow.example shortly.',
};

export const DEMO_RECEIPTS = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000),
    route: 'CLOUD_SCRUBBED' as const,
    outbound: 'Tell Maya at Northwind Labs that the budget is 150000.',
    findings: 2,
    categories: ['PERSON', 'ORG'],
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 7200000),
    route: 'LOCAL_ANSWER' as const,
    outbound: 'What is the weather in Delhi?',
    findings: 1,
    categories: ['LOCATION'],
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 86400000),
    route: 'BLOCK' as const,
    outbound: null,
    findings: 1,
    categories: ['API_KEY'],
  },
];

export const DEMO_ORG_STATS = [
  { date: '2026-11-21', person: 12, org: 8, credential: 2 },
  { date: '2026-11-22', person: 18, org: 5, credential: 4 },
  { date: '2026-11-23', person: 25, org: 11, credential: 1 },
  { date: '2026-11-24', person: 20, org: 9, credential: 3 },
  { date: '2026-11-25', person: 31, org: 14, credential: 2 },
];
