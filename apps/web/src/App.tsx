import React from 'react';
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import AppShell from './ui/components/AppShell';

// Pages
import LandingPage from './features/onboarding/LandingPage';
import ChatPage from './features/chat/ChatPage';
import ClipboardAirlock from './features/clipboard/ClipboardAirlock';
import ReceiptsPage from './features/receipts/ReceiptsPage';
import OrgPage from './features/org/OrgPage';
const BenchPage = React.lazy(() => import('./features/bench/BenchPage'));
import HowItWorksPage from './features/onboarding/HowItWorksPage';
import PrivacyPage from './features/onboarding/PrivacyPage';
import TermsPage from './features/onboarding/TermsPage';
import SettingsPage from './features/settings/SettingsPage';

/**
 * Main app routing. BRIEF §10.1 routes.
 * All 10 routes: /, /chat, /clipboard, /receipts, /org, /bench (lazy), /how-it-works, /privacy, /terms, /settings.
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/clipboard" element={<ClipboardAirlock />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/org" element={<OrgPage />} />
            <Route path="/bench" element={<BenchPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
