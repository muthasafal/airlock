import React from 'react';
import './InfoPage.css';

export default function TermsPage(): React.JSX.Element {
  return (
    <div className="info-page">
      <h1>Terms of use</h1>

      <section>
        <h2>Acceptance</h2>
        <p>
          By using Airlock, you agree to these terms. If you don't agree, don't use the service.
        </p>
      </section>

      <section>
        <h2>License</h2>
        <p>
          Airlock is free and open source under the MIT License. You may use, copy, modify, and distribute it as permitted by the license.
        </p>
      </section>

      <section>
        <h2>Use restrictions</h2>
        <p>You may not:</p>
        <ul>
          <li>Use Airlock for illegal purposes</li>
          <li>Reverse engineer, decompile, or disassemble the software</li>
          <li>Use it to bypass security controls or access systems without permission</li>
          <li>Spam, probe, or deliberately interfere with our services</li>
        </ul>
      </section>

      <section>
        <h2>Disclaimer</h2>
        <p>
          Airlock is provided as is. We make no warranties about its fitness for any purpose. We are not liable for any loss of data, damage, or harm resulting from your use of Airlock.
        </p>
        <p>
          While we design Airlock for maximum protection, no system is perfect. We cannot guarantee that secrets will never leak. Always use good judgment with confidential material.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          Our total liability for any claim arising from these terms or your use of Airlock is zero. This includes direct, indirect, special, or consequential damages.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms anytime. Continued use of Airlock means you accept the new terms. We will post material changes prominently.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          We may terminate your access if you violate these terms. You can stop using Airlock anytime. All your local data remains yours.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the jurisdiction where Airlock is maintained, without regard to conflict of law principles.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these terms, please reach out through the GitHub repository.
        </p>
      </section>
    </div>
  );
}
