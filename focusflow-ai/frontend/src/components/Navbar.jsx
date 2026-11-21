import React, { useState, useEffect } from 'react';
import LiveClock from './Clock';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Flame, Sun, Moon } from 'lucide-react';

const Navbar = ({ activeTab }) => {
  const { user, apiFetch, theme, toggleTheme } = useAuth();
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const data = await apiFetch('/api/insights');
        if (data && data.streak) {
          setStreak(data.streak);
        }
      } catch (err) {
        console.warn('Could not retrieve streak in navbar:', err);
      }
    };
    fetchStreak();
  }, [activeTab]);

  const getModuleTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'tasks': return 'My Tasks';
      case 'focus-camera': return 'Study Camera Tracker';
      case 'attendance': return 'Attendance Tracker';
      case 'analytics': return 'Performance Analytics';
      case 'pomodoro': return 'Pomodoro Timer';
      case 'insights': return 'AI Study Insights';
      case 'history': return 'Study Logs';
      case 'profile': return 'My Profile';
      default: return 'FocusFlow';
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="h-20 border-b border-cyber-border bg-black/20 flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md">
      {/* Title / Greeting */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="font-display font-bold text-xl tracking-tight text-white">{getModuleTitle()}</h2>
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-primary" />
        </div>
        <p className="text-xs text-cyber-textMuted mt-0.5">
          Hey {user?.name ? user.name.split(' ')[0] : 'Rohan'}! Hope you are having a productive day.
        </p>
      </div>

      {/* Clock & Action Items */}
      <div className="flex items-center space-x-4">
        {streak && streak.streakCount > 0 && (
          <div 
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-display cursor-default transition-all duration-300 ${
              streak.warningActive
                ? 'border-cyber-warning bg-cyber-warning/10 text-cyber-warning animate-pulse'
                : 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent neon-glow-pink'
            }`}
            title={
              streak.warningActive 
                ? "Streak expires tonight! Complete a study block to save it." 
                : "Active Daily Study Streak! Keep it up."
            }
          >
            <Flame className={`w-4 h-4 fill-current ${streak.warningActive ? 'text-cyber-warning' : 'text-cyber-accent animate-bounce'}`} />
            <span>{streak.streakCount} Day Streak</span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-cyber-border hover:border-cyber-primary/45 hover:bg-cyber-primary/10 text-cyber-textMuted hover:text-cyber-primary transition-all flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        <LiveClock />
      </div>
    </header>
  );
};

export default Navbar;

