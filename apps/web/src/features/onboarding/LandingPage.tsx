import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AirlockChamber from '../../ui/AirlockChamber/AirlockChamber';
import ProtectionStatus from './ProtectionStatus';
import { useProtectionStatus } from './useProtectionStatus';
import type { ChamberState } from '../../ui/AirlockChamber';
import './LandingPage.css';

/**
 * Landing page: pitch, chamber animation sample, how-it-works steps, Try it link, status.
 * BRIEF §10.1 /.
 */
const SAMPLE_CYCLE: ChamberState[] = ['idle', 'scrubbing', 'sending', 'restoring', 'idle', 'scrubbing', 'local'];

export default function LandingPage(): React.JSX.Element {
  const status = useProtectionStatus();
  // The chamber plays a sample on a loop: clean, send, restore, then a local answer.
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((i) => (i + 1) % SAMPLE_CYCLE.length), 1800);
    return () => clearInterval(t);
  }, []);
  const statusText =
    status.level === 'full'
      ? 'Full on-device protection is ready in your browser. Detection, cleaning and restoring all happen locally.'
      : status.level === 'reduced'
        ? 'Your browser can run the private model. Enable it once and detection runs fully on this device.'
        : 'This browser cannot run the private model yet. Airlock still works with rule checks, and asks before sending anything.';

  return (
    <div className="landing-page">
      {/* Hero section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Your secrets stay <span className="hl-blue">on this side of the door</span>
          </h1>
          <p className="landing-hero-subtitle">
            Use any cloud AI without leaking confidential data. Sensitive details are detected and replaced before anything leaves your device.
          </p>
          <div className="landing-hero-cta">
            <Link to="/chat" className="landing-hero-button">
              Try Airlock Chat
            </Link>
            <Link to="/clipboard" className="landing-hero-button landing-hero-button--secondary">
              Or clean text in clipboard
            </Link>
          </div>
          <p className="aside-note">nothing leaves until it's clean</p>
        </div>

        <div className="landing-hero-chamber">
          <AirlockChamber state={SAMPLE_CYCLE[step]} progress={50} />
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how-it-works">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-icon" aria-hidden="true">1</div>
            <h3>Paste confidential material</h3>
            <p>Names, emails, API keys, medical details, anything sensitive. Airlock sees what you're sending.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon" aria-hidden="true">2</div>
            <h3>On-device detection</h3>
            <p>Your device finds sensitive details and swaps them for realistic stand-ins. Nothing leaves unclean.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon" aria-hidden="true">3</div>
            <h3>Cloud AI reasons on clean text</h3>
            <p>The model gets natural, readable text with consistent replacements. Answers are better because stand-ins stay in context.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon" aria-hidden="true">4</div>
            <h3>Answer restored locally</h3>
            <p>Stand-ins in the reply are swapped back to your real details before you see it. All on your device.</p>
          </div>
        </div>
      </section>

      {/* Protection status and CTA */}
      <section className="landing-protection">
        <h2 className="landing-section-title">Get started</h2>
        <div className="landing-protection-content">
          <ProtectionStatus
            level={status.level}
            availability={status.availability}
            downloadProgress={status.initProgress ?? 0}
            enabling={status.initProgress !== null}
            firebaseConfigured={status.firebaseConfigured}
            onEnable={status.startInit}
            stalled={status.stalled}
          />
          <div className="landing-protection-action">
            <p className="landing-protection-text">{statusText}</p>
          </div>
        </div>
      </section>

      {/* Learn more */}
      <section className="landing-learn-more">
        <h2 className="landing-section-title">Learn more</h2>
        <div className="landing-links">
          <Link to="/how-it-works" className="landing-learn-link">
            See the architecture
          </Link>
          <Link to="/privacy" className="landing-learn-link">
            Privacy promise
          </Link>
          <Link to="/terms" className="landing-learn-link">
            Terms of use
          </Link>
        </div>
      </section>
    </div>
  );
}
