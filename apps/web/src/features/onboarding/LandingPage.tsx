import React from 'react';
import { Link } from 'react-router-dom';
import AirlockChamber from '../../ui/AirlockChamber/AirlockChamber';
import ProtectionStatus from './ProtectionStatus';
import EnableNanoButton from './EnableNanoButton';
import './LandingPage.css';

/**
 * Landing page: pitch, chamber animation sample, how-it-works steps, Try it link, status.
 * BRIEF §10.1 /.
 */
export default function LandingPage(): React.JSX.Element {
  return (
    <div className="landing-page">
      {/* Hero section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">Your secrets stay on this side of the door</h1>
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
        </div>

        <div className="landing-hero-chamber">
          <AirlockChamber state="scrubbing" progress={50} />
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how-it-works">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-icon">📝</div>
            <h3>Paste confidential material</h3>
            <p>Names, emails, API keys, medical details, anything sensitive. Airlock sees what you're sending.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon">✨</div>
            <h3>On-device detection</h3>
            <p>Your device finds sensitive details and swaps them for realistic stand-ins. Nothing leaves unclean.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon">🤖</div>
            <h3>Cloud AI reasons on clean text</h3>
            <p>The model gets natural, readable text with consistent replacements. Answers are better because stand-ins stay in context.</p>
          </div>

          <div className="landing-step">
            <div className="landing-step-icon">✅</div>
            <h3>Answer restored locally</h3>
            <p>Stand-ins in the reply are swapped back to your real details before you see it. All on your device.</p>
          </div>
        </div>
      </section>

      {/* Protection status and CTA */}
      <section className="landing-protection">
        <h2 className="landing-section-title">Get started</h2>
        <div className="landing-protection-content">
          <ProtectionStatus level="full" />
          <div className="landing-protection-action">
            <p className="landing-protection-text">
              Full on-device protection is ready in your browser. All detection, scrubbing, and answer restoration happen locally.
            </p>
            <EnableNanoButton onClick={() => alert('TODO: initializeDeviceModel()')} />
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
