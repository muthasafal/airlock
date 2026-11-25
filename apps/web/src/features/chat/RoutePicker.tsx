import React from 'react';
import './RoutePicker.css';

interface RoutePickerProps {
  route: 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED';
  onChange: (route: 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED') => void;
}

/**
 * Override button for route selection.
 * User can choose: device-only or cloud.
 * BRIEF §P0-5.
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
        onChange={(e) => onChange(e.target.value as 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED')}
      >
        <option value="CLOUD_SCRUBBED">Cloud (cleaned text)</option>
        <option value="LOCAL_ANSWER">My device only</option>
      </select>
    </div>
  );
}
