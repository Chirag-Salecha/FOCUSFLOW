import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Zap, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('student@focusflow.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyber-secondary/10 blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-cyber-primary/10 blur-[100px] animate-pulse-slow pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-glass border border-cyber-border relative z-10">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-secondary to-cyber-primary items-center justify-center neon-glow-cyan mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white mb-2">FocusFlow <span className="text-cyber-primary font-medium">AI</span></h2>
          <p className="text-sm text-cyber-textMuted font-display">Student Productivity & Proctoring Hub</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center space-x-2 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-sm px-4 py-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-textMuted mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cyber-textMuted pointer-events-none">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary text-sm text-white placeholder-slate-500 outline-none transition-colors"
                placeholder="student@focusflow.ai"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyber-textMuted">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cyber-textMuted pointer-events-none">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary text-sm text-white placeholder-slate-500 outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cyber-textMuted hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyber-secondary via-indigo-600 to-cyber-primary hover:brightness-110 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-cyber-textMuted mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyber-primary hover:underline hover:text-cyber-primary/80 font-semibold transition-colors">
            Create Account
          </Link>
        </p>

        {/* Demo login tips */}
        <div className="mt-6 p-3 bg-white/5 border border-cyber-border rounded-xl text-[11px] text-cyber-textMuted leading-relaxed">
          <span className="text-cyber-primary font-bold">Quick Demo:</span> Sign in with email <code className="text-cyber-accent">student@focusflow.ai</code> and password <code className="text-cyber-accent">password123</code> (seeded sample). Make sure to edit <code className="text-slate-400">backend/.env</code> with database connection credentials if not default.
        </div>
      </div>
    </div>
  );
};

export default Login;
