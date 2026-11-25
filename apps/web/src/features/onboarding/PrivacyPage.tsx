import React from 'react';
import './InfoPage.css';

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="info-page">
      <h1>Privacy policy</h1>

      <section>
        <h2>Our commitment</h2>
        <p>
          We never receive your sensitive data. The on-device model detects, classifies, and replaces secrets before anything leaves your device. All detection, scrubbing, and answer restoration happen locally.
        </p>
      </section>

      <section>
        <h2>What we see</h2>
        <ul>
          <li>Only the cleaned text (with secrets replaced)</li>
          <li>Your question, cleaned the same way (stand-ins in place of real details)</li>
          <li>Your email and name if you sign in</li>
          <li>Counts of secrets detected (in org mode only), never the content</li>
        </ul>
      </section>

      <section>
        <h2>What we don't see</h2>
        <ul>
          <li>Original secret values or names</li>
          <li>Session mappings or the reverse mapping</li>
          <li>Encryption keys</li>
          <li>Your browser history or device info</li>
          <li>Raw chat transcripts with real values</li>
        </ul>
      </section>

      <section>
        <h2>Local storage</h2>
        <p>
          Session mappings (mapping from original to stand-in) are stored in your browser's IndexedDB, encrypted with a non-extractable AES-GCM key. This key never leaves your device.
        </p>
        <p>
          Receipts (what left your device) are also stored locally. You can export or delete them anytime.
        </p>
      </section>

      <section>
        <h2>Org mode</h2>
        <p>
          If your org admin sets protected terms or policies, they are pulled to your device and applied locally. Stats sent to us are counts only, never content.
        </p>
      </section>

      <section>
        <h2>Firebase services</h2>
        <ul>
          <li><strong>AI Logic:</strong> Google's Gemini model (gemini-3.5-flash-lite by default) receives only cleaned text; Gemini Nano runs on your device</li>
          <li><strong>App Check:</strong> Protects our API from abuse</li>
          <li><strong>Auth:</strong> Optional for org mode; we store only your email and name</li>
          <li><strong>Firestore:</strong> Org policies and stats only, never content</li>
          <li><strong>Hosting:</strong> Serves the app with strict CSP headers</li>
        </ul>
      </section>

      <section>
        <h2>Deletion</h2>
        <p>
          You can delete your sessions and receipts anytime from Settings. If you sign out, we have no link to your sessions anymore.
        </p>
      </section>
    </div>
  );
}
