/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Terminal,
  LayoutDashboard,
  Layers,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'library' | 'admin' | 'investigation';
  onSelectTab: (tab: 'dashboard' | 'library' | 'admin') => void;
  isReplayActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isReplayActive }) => {
  const { user, logout, login } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const switchPersona = async (email: string, pass: string) => {
    setShowPersonaMenu(false);
    setSwitchError(null);
    try {
      await login(email, pass);
      onSelectTab('dashboard');
    } catch (err: any) {
      console.error('Failed to switch persona:', err);
      setSwitchError(err?.message || 'Login failed');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-teal-500/20 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/40">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-lg text-white">ScamQuest</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">Student Scam Reporting & Verification Guidance</p>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('library')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  currentTab === 'library'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Scenarios</span>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Admin Hub</span>
                </button>
              )}
            </nav>
          )}

          {/* User Status / Persona Switcher / Logout */}
          {user ? (
            <div className="flex items-center space-x-3">
              {isReplayActive && (
                <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>Practice Replay Active</span>
                </span>
              )}

              {/* Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="flex items-center space-x-2 text-left bg-slate-900 border border-slate-700/80 hover:border-teal-500/50 rounded-lg px-2.5 py-1.5 transition-colors focus:ring-2 focus:ring-teal-500/50 outline-none"
                  title="Switch Demo Persona"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[110px]">{user.name}</p>
                    <p className="text-[10px] text-teal-400 uppercase font-mono tracking-wider">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showPersonaMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs">
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase font-mono border-b border-slate-800">
                      Quick Demo Switcher
                    </p>

                    {switchError && (
                      <div className="p-2 my-1 text-[11px] rounded bg-rose-950/60 border border-rose-500/40 text-rose-300">
                        {switchError}
                      </div>
                    )}

                    <button
                      onClick={() => switchPersona('alex.student@scamquest.edu', 'StudentPass123!')}
                      className="w-full text-left px-2.5 py-2 mt-1 rounded hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-teal-300">Alex Rivera</p>
                        <p className="text-[10px] text-slate-400">Student 1 (With attempt history)</p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-400">Switch</span>
                    </button>

                    <button
                      onClick={() => switchPersona('sam.student@scamquest.edu', 'StudentPass123!')}
                      className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-teal-300">Sam Chen</p>
                        <p className="text-[10px] text-slate-400">Student 2 (Fresh learner)</p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-400">Switch</span>
                    </button>

                    <button
                      onClick={() => switchPersona('coordinator.sarah@scamquest.edu', 'CoordPass123!')}
                      className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-teal-300">Sarah Jenkins</p>
                        <p className="text-[10px] text-slate-400">Review Coordinator</p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-400">Switch</span>
                    </button>

                    <button
                      onClick={() => switchPersona('admin@scamquest.edu', 'AdminPass123!')}
                      className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-indigo-300">Prof. Eleanor Vance</p>
                        <p className="text-[10px] text-slate-400">Security Administrator</p>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400">Switch</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => logout()}
                className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs font-mono text-teal-400 flex items-center space-x-1.5 bg-teal-500/10 border border-teal-500/30 px-3 py-1.5 rounded-lg">
              <UserCheck className="w-4 h-4" />
              <span>Sign In Below</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
