import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserPlus, LogIn, Lock, Mail, User, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    try {
      setSubmitting(true);
      await login(demoEmail, demoPass);
      onSuccess?.();
    } catch {
      // Handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 border border-teal-400/40">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">ScamQuest Investigator Access</h2>
        <p className="text-xs text-slate-400">
          Interactive cybersecurity awareness & branching scam simulations
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-rose-400 hover:text-white font-mono text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Quick Demo Personas Bar */}
      <div className="mb-6 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>One-Click Academic Evaluator Access</span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <button
            type="button"
            onClick={() => handleDemoLogin('alex.student@scamquest.edu', 'StudentPass123!')}
            className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-between border border-slate-800 hover:border-teal-500/40 transition-colors"
          >
            <div>
              <span className="font-semibold text-teal-300">Alex Rivera</span>
              <span className="text-[10px] text-slate-400 ml-2">(Student 1 - Has attempt history)</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400">&rarr;</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('sam.student@scamquest.edu', 'StudentPass123!')}
            className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-between border border-slate-800 hover:border-teal-500/40 transition-colors"
          >
            <div>
              <span className="font-semibold text-teal-300">Sam Chen</span>
              <span className="text-[10px] text-slate-400 ml-2">(Student 2 - Fresh learner)</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400">&rarr;</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('coordinator.sarah@scamquest.edu', 'CoordPass123!')}
            className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-between border border-slate-800 hover:border-teal-500/40 transition-colors"
          >
            <div>
              <span className="font-semibold text-teal-300">Sarah Jenkins</span>
              <span className="text-[10px] text-slate-400 ml-2">(Coordinator - Review Queue)</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400">&rarr;</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('admin@scamquest.edu', 'AdminPass123!')}
            className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-between border border-slate-800 hover:border-indigo-500/40 transition-colors"
          >
            <div>
              <span className="font-semibold text-indigo-300">Prof. Eleanor Vance</span>
              <span className="text-[10px] text-slate-400 ml-2">(Admin - Governance & Validator)</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">&rarr;</span>
          </button>
        </div>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">Or credentials</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {isRegister && (
          <div>
            <label className="text-slate-300 font-semibold text-xs block mb-1">Full Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-slate-300 font-semibold text-xs block mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@scamquest.edu"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-semibold text-xs block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white outline-none"
            />
          </div>
          {isRegister && (
            <p className="text-[10px] text-slate-400 mt-1">Minimum 8 characters. Enrolled with Student role.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-50 mt-4 flex items-center justify-center space-x-2"
        >
          {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          <span>{submitting ? 'Authenticating...' : isRegister ? 'Register Student Account' : 'Sign In'}</span>
        </button>
      </form>

      {/* Switch between login & register */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            clearError();
          }}
          className="text-xs text-teal-400 hover:text-teal-300 font-medium"
        >
          {isRegister ? 'Already registered? Sign in here' : 'Need an account? Register as student'}
        </button>
      </div>
    </div>
  );
};
