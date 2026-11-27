import React from 'react';
import { Link } from 'react-router-dom';
import GhostTip from '../../ui/Ghost/Ghost';

/** Custom 404: Airy got lost too, and points the way home. */
export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="not-found">
      <div>
        <h1>This room is empty</h1>
        <GhostTip
          mood="lost"
          action={
            <>
              <Link to="/" className="landing-hero-button">
                Take me home
              </Link>
              <Link to="/chat" className="landing-hero-button landing-hero-button--secondary">
                Open Airlock Chat
              </Link>
            </>
          }
        >
          I floated through a wall and ended up here too. Nothing lives on this page, but your secrets are still safe.
        </GhostTip>
      </div>
    </div>
  );
}
