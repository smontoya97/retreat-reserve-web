/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { EmailLoggerTray } from './components/EmailLoggerTray';
import { BackendStatusBanner } from './components/BackendStatusBanner';

// Pages
import { Home } from './pages/Home';
import { CabinDetail } from './pages/CabinDetail';
import { AuthPage } from './pages/AuthPage';
import { Profile } from './pages/Profile';
import { Reservations } from './pages/Reservations';
import { Favorites } from './pages/Favorites';
import { AdminPanel } from './pages/AdminPanel';

const AppContent: React.FC = () => {
  const { currentView, backendStatus, backendMessage, reloadDatabase } = useApp();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <Home />;
      case 'detail':
        return <CabinDetail />;
      case 'login':
      case 'register':
        return <AuthPage />;
      case 'profile':
        return <Profile />;
      case 'reservations':
        return <Reservations />;
      case 'favorites':
        return <Favorites />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 24/7 Fixed header across all screens (Historial 1) */}
      <Header />

      <BackendStatusBanner
        status={backendStatus}
        message={backendMessage}
        onRetry={() => { void reloadDatabase(); }}
      />

      {/* Main container with branding background colors */}
      <main className="flex-grow bg-white min-h-[calc(100vh-200px)] animate-in fade-in duration-300">
        {renderCurrentView()}
      </main>

      {/* 100% wide footer with copyright parameters (Historial 7) */}
      <Footer />

      {/* Floating support tools */}
      <WhatsAppButton />
      <EmailLoggerTray />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
