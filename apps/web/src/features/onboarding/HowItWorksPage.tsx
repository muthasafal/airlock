import React from 'react';
import './HowItWorksPage.css';

export default function HowItWorksPage(): React.JSX.Element {
  return (
    <div className="how-it-works-page">
      <h1>How Airlock works</h1>

      <section className="how-section">
        <h2>The problem</h2>
        <p>
          Every day, people paste confidential material into cloud AI tools: client names, salaries, medical details, source code with API keys, internal project names. Once it leaves your laptop, you no longer control where it is stored, logged or reviewed.
        </p>
        <p>
          Companies can ban AI tools, but people use them anyway. Or they buy cloud DLP (data loss prevention) tools, which scan prompts by sending them to the vendor's own cloud first. To protect your secret, you hand it to one more company.
        </p>
      </section>

      <section className="how-section">
        <h2>The solution</h2>
        <p>
          Airlock runs a lightweight AI model on your device to find sensitive details and replace them with realistic stand-ins before anything leaves your computer. Only the cleaned text reaches the cloud model. The answer comes back with stand-ins, and Airlock restores your real details locally.
        </p>
        <p>
          Your device is the trust boundary. No server, ours included, ever sees raw sensitive values.
        </p>
      </section>

      <section className="how-section">
        <h2>Architecture</h2>
        <div className="how-diagram">
          <div className="how-step">
            <div className="how-step-num">1</div>
            <div className="how-step-title">Your message</div>
            <p>"Priya at Acme, call 98200 12345"</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-step-num">2</div>
            <div className="how-step-title">On-device detection</div>
            <p>Nano finds PERSON, ORG, FINANCIAL_AMOUNT</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-step-num">3</div>
            <div className="how-step-title">Replace</div>
            <p>"Maya at Northwind, call 98765 00003"</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-step-num">4</div>
            <div className="how-step-title">Cloud model</div>
            <p>Processes clean text normally</p>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="how-step-num">5</div>
            <div className="how-step-title">Restore</div>
            <p>Replace stand-ins back locally</p>
          </div>
        </div>
      </section>

      <section className="how-section">
        <h2>Key properties</h2>
        <ul className="how-list">
          <li><strong>Deterministic:</strong> Same secrets always map to the same stand-ins within a session.</li>
          <li><strong>Realistic:</strong> Names stay names, emails stay emails, amounts stay amounts. The cloud model reasons better.</li>
          <li><strong>Consistent:</strong> Aliases (first names, surnames) are tracked across messages.</li>
          <li><strong>Traceable:</strong> Receipts show exactly what left your device for every request.</li>
          <li><strong>Graceful:</strong> If your browser doesn't support on-device models, Airlock falls back to rules only with reduced protection clearly indicated.</li>
        </ul>
      </section>

      <section className="how-section">
        <h2>Technical details</h2>
        <p>
          Detection runs in two layers. Rules-based detectors find structured patterns (phone numbers, emails, API keys). Google's Gemini Nano (running on your device) finds contextual secrets (names, amounts, sensitive topics).
        </p>
        <p>
          Session mappings are encrypted in IndexedDB with non-extractable AES-GCM keys. No mapping, original value or key ever touches the network.
        </p>
      </section>
    </div>
  );
}
