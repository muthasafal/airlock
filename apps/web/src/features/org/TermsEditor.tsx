import React, { useState } from 'react';
import type { Action, Category } from '@airlock/scrub-engine';

type Term = { term: string; category: Category; action: Action };

interface TermsEditorProps {
  terms: Term[];
  onSave: (terms: Term[]) => void;
}

const CATEGORIES: Category[] = ['ORG_TERM', 'ORG', 'PERSON', 'INTERNAL_PROJECT', 'LOCATION', 'OTHER_SENSITIVE'];
const ACTIONS: Action[] = ['PSEUDONYMIZE', 'GENERALIZE', 'BLOCK'];
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

/** Admin: protected terms (client names, codenames, internal URLs), matched on every member's device. BRIEF §P1-1. */
export default function TermsEditor({ terms, onSave }: TermsEditorProps): React.JSX.Element {
  const [list, setList] = useState<Term[]>(terms);
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<Category>('ORG_TERM');
  const [action, setAction] = useState<Action>('PSEUDONYMIZE');

  return (
    <div className="create-join-form">
      <h3>Protected terms</h3>
      <p>Add client names, project codenames or internal URLs. Each one is caught whole-word, in any case.</p>
      <ul>
        {list.map((t, i) => (
          <li key={`${t.term}-${i}`}>
            {t.term}: {label(t.category)}, {label(t.action)}{' '}
            <button className="create-join-cancel" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${t.term}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <label htmlFor="term-text">Term:</label>
      <input id="term-text" type="text" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. Project Falcon" />
      <div className="create-join-actions">
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </select>
        <select aria-label="Action" value={action} onChange={(e) => setAction(e.target.value as Action)}>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {label(a)}
            </option>
          ))}
        </select>
        <button
          className="create-join-submit"
          disabled={!term.trim()}
          onClick={() => {
            setList([...list, { term: term.trim().slice(0, 120), category, action }]);
            setTerm('');
          }}
        >
          Add
        </button>
      </div>
      <div className="create-join-actions">
        <button className="create-join-submit" onClick={() => onSave(list)}>
          Save terms
        </button>
      </div>
    </div>
  );
}
