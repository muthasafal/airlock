import React, { useState } from 'react';
import { ALL_CATEGORIES, DEFAULT_POLICY, type Action, type Category } from '@airlock/scrub-engine';

interface PolicyEditorProps {
  policy: Partial<Record<Category, Action>>;
  onSave: (policy: Partial<Record<Category, Action>>) => void;
}

const ACTIONS: Action[] = ['PSEUDONYMIZE', 'GENERALIZE', 'BLOCK', 'KEEP'];
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

/** Admin: the action for each category, overriding the defaults for every member. BRIEF §P1-1, §8.3. */
export default function PolicyEditor({ policy, onSave }: PolicyEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState(policy);
  return (
    <div className="create-join-form">
      <h3>Category policies</h3>
      <p>Members' devices apply these before anything leaves. Leave a category on its default to let members choose.</p>
      {ALL_CATEGORIES.map((c) => (
        <div key={c} className="create-join-actions">
          <label htmlFor={`org-${c}`}>{label(c)}</label>
          <select
            id={`org-${c}`}
            value={draft[c] ?? ''}
            onChange={(e) => {
              const next = { ...draft };
              if (e.target.value) next[c] = e.target.value as Action;
              else delete next[c];
              setDraft(next);
            }}
          >
            <option value="">Default ({label(DEFAULT_POLICY[c])})</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {label(a)}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="create-join-actions">
        <button className="create-join-submit" onClick={() => onSave(draft)}>
          Save policy
        </button>
      </div>
    </div>
  );
}
