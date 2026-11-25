import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Root app shell with navigation header, main content area, and footer.
 * Wraps all pages. Presentational only; logic in hooks.
 * BRIEF §10.1, design language (warm, rounded, pill buttons).
 */
export default function AppShell({ children }: AppShellProps): React.JSX.Element {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Chat', path: '/chat' },
    { label: 'Clipboard', path: '/clipboard' },
    { label: 'Receipts', path: '/receipts' },
    { label: 'Org', path: '/org' },
    { label: 'Benchmark', path: '/bench' },
    { label: 'How it works', path: '/how-it-works' },
  ];

  return (
    <div className="app-shell">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header with navigation */}
      <header className="app-header">
        <div className="app-header-container">
          <Link to="/" className="app-logo">
            <span className="app-logo-icon">🔐</span>
            <span className="app-logo-text">Airlock</span>
          </Link>

          <nav className="app-nav" aria-label="Main navigation">
            <ul className="app-nav-list">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`app-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link to="/settings" className="app-settings-link" title="Settings">
            ⚙️ Settings
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="app-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer-container">
          <div className="app-footer-section">
            <h3>Airlock</h3>
            <p>Your secrets stay on this side of the door.</p>
          </div>

          <div className="app-footer-links">
            <Link to="/how-it-works">How it works</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>

          <div className="app-footer-credit">
            <p>Built with <a href="https://kiro.dev" target="_blank" rel="noopener noreferrer">Kiro</a>; reviewed with Claude Code.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
