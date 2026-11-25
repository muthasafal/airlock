import React from 'react';
import type { RouteOverride } from '../../lib/router';
import './RoutePicker.css';

interface RoutePickerProps {
  route: RouteOverride;
  onChange: (route: RouteOverride) => void;
}

/**
 * Override for route selection: let Airlock decide, or force device-only or cloud.
 * BRIEF §P0-5, §8.4.
 */
export default function RoutePicker({ route, onChange }: RoutePickerProps): React.JSX.Element {
  return (
    <div className="route-picker">
      <label htmlFor="route-select" className="route-picker-label">
        Answer on:
      </label>
      <select
        id="route-select"
        className="route-picker-select"
        value={route}
        onChange={(e) => onChange(e.target.value as RouteOverride)}
      >
        <option value="AUTO">Let Airlock decide</option>
        <option value="CLOUD_SCRUBBED">Cloud (cleaned text)</option>
        <option value="LOCAL_ANSWER">My device only</option>
      </select>
    </div>
  );
}
