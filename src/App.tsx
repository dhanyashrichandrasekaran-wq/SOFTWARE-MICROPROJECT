/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { ScenarioLibrary } from './components/ScenarioLibrary';
import { InvestigationRoom } from './components/InvestigationRoom';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { ShieldAlert, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type NavigationTab = 'dashboard' | 'library' | 'admin' | 'investigation';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | undefined>(undefined);

  const handleStartScenario = (scenarioId: string, attemptId?: string) => {
    setActiveScenarioId(scenarioId);
    setActiveAttemptId(attemptId);
    setCurrentTab('investigation');
  };

  const handleExitInvestigation = () => {
    setActiveScenarioId(null);
    setActiveAttemptId(undefined);
    setCurrentTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-3"
        >
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Initializing ScamQuest security sandbox...</p>
        </motion.div>
      </div>
    );
  }

  // Unauthenticated landing state
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-teal-500/30 selection:text-teal-200 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <Navbar currentTab="dashboard" onSelectTab={() => {}} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
          {/* Hero Pitch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Student Scam Reporting & Verification Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              ScamQuest: Report, Review & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-400">Practise Digital Safety</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              An interactive training and reporting platform designed for college students. Submit suspicious messages, receive guidance and warning indicators, request coordinator review, and practise branching scam awareness scenarios.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300 pt-2 max-w-md mx-auto lg:mx-0">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                <span>6 Seeded Scenarios</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Alternate Outcome Replay</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic Scoring</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center space-x-2 shadow-lg backdrop-blur-sm">
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Secure SQLite Backend</span>
              </div>
            </div>
          </motion.div>

          {/* Auth Card with Fast Demo Persona Switcher */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-1/2 w-full max-w-md"
          >
            <AuthModal onSuccess={() => setCurrentTab('dashboard')} />
          </motion.div>
        </main>

        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400 font-mono relative z-10">
          ScamQuest Platform &bull; Secure SQLite & Express Architecture &bull; Student Scam Awareness & Training
        </footer>
      </div>
    );
  }

  // Authenticated application state
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (currentTab === 'investigation') {
            setActiveScenarioId(null);
            setActiveAttemptId(undefined);
          }
          setCurrentTab(tab);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab + (activeScenarioId || '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {currentTab === 'dashboard' && (
              <StudentDashboard
                onStartScenario={handleStartScenario}
                onBrowseScenarios={() => setCurrentTab('library')}
              />
            )}

            {currentTab === 'library' && (
              <ScenarioLibrary onSelectScenario={handleStartScenario} />
            )}

            {currentTab === 'investigation' && activeScenarioId && (
              <InvestigationRoom
                scenarioId={activeScenarioId}
                initialAttemptId={activeAttemptId}
                onExit={handleExitInvestigation}
              />
            )}

            {currentTab === 'admin' && user.role === 'admin' && (
              <AdminDashboard
                onPreviewScenario={(scenId) => handleStartScenario(scenId)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-900/80 py-4 text-center text-[11px] text-slate-400 font-mono relative z-10">
        ScamQuest Platform &bull; Logged in as <span className="text-teal-400 font-semibold">{user.name}</span> ({user.role}) &bull; Persistent SQLite Database
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
