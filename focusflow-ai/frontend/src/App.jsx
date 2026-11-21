import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Camera from './pages/Camera';
import Attendance from './pages/Attendance';
import Analytics from './pages/Analytics';
import Pomodoro from './pages/Pomodoro';
import Insights from './pages/Insights';
import History from './pages/History';
import Profile from './pages/Profile';
import DocumentReader from './pages/DocumentReader';
import Chat from './components/Chat';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main Layout Wrapper for Dashboard Modules
const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lockedApp, setLockedApp] = useState('');

  // Listen to Electron IPC signals for restricted process alerts
  useEffect(() => {
    if (window.electronAPI) {
      const removeListener = window.electronAPI.onAppBlocked((appName) => {
        setLockedApp(appName);
      });
      return () => removeListener();
    }
  }, []);

  const handleForceClose = () => {
    if (window.electronAPI && lockedApp) {
      window.electronAPI.requestKillApp(lockedApp);
    }
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'tasks': return <Tasks />;
      case 'document-reader': return <DocumentReader />;
      case 'focus-camera': return <Camera />;
      case 'attendance': return <Attendance />;
      case 'analytics': return <Analytics />;
      case 'pomodoro': return <Pomodoro />;
      case 'insights': return <Insights />;
      case 'history': return <History />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      {/* Locked Overlay Modal for desktop app blocker */}
      {lockedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-[9999] p-6 animate-fade-in">
          <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-cyber-accent/30 text-center space-y-6 shadow-neon-purple">
            <div className="w-16 h-16 rounded-full bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center mx-auto text-cyber-accent animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-extrabold text-white">Study Mode Locked! 🔒</h3>
              <p className="text-sm text-cyber-textMuted leading-relaxed">
                You have a restricted application running: <span className="text-cyber-accent font-bold font-mono">{lockedApp}</span>.
              </p>
              <p className="text-xs text-cyber-textMuted leading-relaxed">
                Please close <span className="text-white font-semibold">{lockedApp}</span> to unlock FocusFlow AI and resume your study session. Desktop application tracking is required for academic integrity.
              </p>
            </div>
            
            <div className="text-[10px] bg-black/40 border border-cyber-border p-3.5 rounded-xl font-mono text-cyber-textMuted text-left space-y-1">
              <div className="text-cyber-accent font-semibold">&gt; COMPLIANCE SCAN: FAILED</div>
              <div>&gt; BLOCKED PROCESS: {lockedApp.toUpperCase()}.EXE</div>
              <div>&gt; TIMERS: PAUSED</div>
            </div>
            
            <button
              onClick={handleForceClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-accent/20 to-cyber-accent/40 border border-cyber-accent/45 text-cyber-accent font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center space-x-2"
            >
              <span>Force Close {lockedApp}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Navigation Navbar */}
        <Navbar activeTab={activeTab} />
        
        {/* Module Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Floating AI Chat Companion Drawer */}
      <Chat />
    </div>
  );
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure application routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
