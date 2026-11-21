import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  AlertOctagon, 
  ChevronRight, 
  Play, 
  Plus, 
  Camera, 
  Video, 
  ShieldAlert 
} from 'lucide-react';

const DashboardHome = ({ setActiveTab }) => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const insightsData = await apiFetch('/api/insights');
        setData(insightsData);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError(err.message || 'Failed to fetch dashboard data. Please make sure MySQL seed runs.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
          <p className="text-sm text-cyber-textMuted tracking-wider font-display">Connecting database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 glass-panel rounded-3xl border border-cyber-danger/30 bg-cyber-danger/5 max-w-2xl mx-auto mt-12 text-center">
        <ShieldAlert className="w-12 h-12 text-cyber-danger mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Database Connection Error</h3>
        <p className="text-sm text-cyber-textMuted mb-6">{error}</p>
        <div className="p-4 bg-black/40 border border-cyber-border rounded-xl text-left text-xs text-cyber-textMuted leading-relaxed mb-6 font-mono">
          1. Edit database credentials in backend/.env<br />
          2. Run "npm run seed" inside focusflow-ai/backend<br />
          3. Restart backend server using "npm run dev"
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 rounded-xl bg-cyber-primary text-black font-semibold hover:brightness-110 transition-all text-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { focusScore, insights, metrics } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Focus Score Card */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyber-textMuted">Focus Score</p>
              <h3 className="text-3xl font-display font-black text-white mt-1">Focus Level</h3>
            </div>
            <div className={`p-2 rounded-xl bg-white/5 border border-cyber-border text-cyber-primary`}>
              <BrainCircuit className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center space-x-6 my-4">
            <div className="relative flex items-center justify-center">
              {/* Score text */}
              <div className="absolute text-center">
                <span className="text-3xl font-display font-extrabold text-white tracking-tighter">{focusScore}</span>
                <span className="text-[10px] block text-cyber-textMuted font-medium uppercase">Score</span>
              </div>
              {/* Circle Gauge SVG */}
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  className="stroke-cyber-primary transition-all duration-1000 ease-out" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - focusScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs text-cyber-textMuted leading-relaxed">
                {focusScore >= 80 ? (
                  <span className="text-cyber-primary font-bold">Crushing it! 🔥</span>
                ) : focusScore >= 60 ? (
                  <span className="text-cyber-warning font-bold">Doing okay, keep going! ⚡</span>
                ) : (
                  <span className="text-cyber-danger font-bold">Distracted alert! ⚠️</span>
                )}{' '}
                Updates dynamically based on tasks you finish, Pomodoro blocks, and tab switches.
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-secondary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyber-textMuted">Task Progress</p>
              <h3 className="text-3xl font-display font-black text-white mt-1">Tasks Done</h3>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-cyber-border text-cyber-secondary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-semibold text-cyber-text">{metrics.completedTasks} of {metrics.totalTasks} cleared</span>
              <span className="text-2xl font-display font-black text-white">{metrics.taskCompletionRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-secondary to-indigo-500 rounded-full transition-all duration-700" 
                style={{ width: `${metrics.taskCompletionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Course Attendance Card */}
        <div className="glass-panel-interactive rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyber-textMuted">Bunk Tracker</p>
              <h3 className="text-3xl font-display font-black text-white mt-1">Class Attendance</h3>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-cyber-border text-cyber-accent">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-semibold text-cyber-text">Average Rate</span>
              <span className="text-2xl font-display font-black text-white">{metrics.avgAttendance}%</span>
            </div>
            {metrics.lowAttendanceCount > 0 ? (
              <div className="flex items-center space-x-1 text-xs text-cyber-danger bg-cyber-danger/10 border border-cyber-danger/20 p-2 rounded-xl">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{metrics.lowAttendanceCount} class(es) below the 75% limit! 😱</span>
              </div>
            ) : (
              <div className="text-xs text-cyber-success font-medium">✓ All classes safely above the 75% requirement.</div>
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: AI Insights & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI insights summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-display font-bold text-white flex items-center">
              <BrainCircuit className="w-5 h-5 text-cyber-primary mr-2" />
              AI Study Tips
            </h3>
            <button 
              onClick={() => setActiveTab('insights')} 
              className="text-xs font-semibold text-cyber-primary flex items-center hover:underline"
            >
              See all tips <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, idx) => {
              let alertStyle = "border-cyber-border-rgb/40 bg-white/5 text-cyber-text";
              if (insight.type === 'success') alertStyle = "border-cyber-success/30 bg-cyber-success/5 text-white";
              if (insight.type === 'warning') alertStyle = "border-cyber-warning/30 bg-cyber-warning/5 text-white";
              if (insight.type === 'danger') alertStyle = "border-cyber-danger/30 bg-cyber-danger/5 text-white";

              return (
                <div key={idx} className={`p-4 rounded-2xl border ${alertStyle} flex items-start space-x-3 transition-transform hover:-translate-x-1 duration-300`}>
                  <div className="mt-0.5">
                    {insight.type === 'danger' ? (
                      <AlertOctagon className="w-5 h-5 text-cyber-danger" />
                    ) : (
                      <BrainCircuit className={`w-5 h-5 ${insight.type === 'success' ? 'text-cyber-success' : 'text-cyber-warning'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold tracking-wide font-display">{insight.title}</h4>
                    <p className="text-xs text-cyber-textMuted mt-1 leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Focus Shortcuts & Live Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-bold text-white px-2">Quick Actions</h3>
          
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            
            {/* Quick Actions */}
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('focus-camera')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyber-primary/20 to-cyber-primary/5 hover:from-cyber-primary/30 hover:to-cyber-primary/10 border border-cyber-primary/35 text-cyber-primary text-sm font-bold transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Camera className="w-5 h-5 animate-pulse" />
                  <span>Start Study Cam</span>
                </div>
                <Play className="w-4 h-4 fill-current" />
              </button>

              <button 
                onClick={() => setActiveTab('pomodoro')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyber-secondary/20 to-cyber-secondary/5 hover:from-cyber-secondary/30 hover:to-cyber-secondary/10 border border-cyber-secondary/35 text-cyber-secondary text-sm font-bold transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5" />
                  <span>Launch Pomodoro</span>
                </div>
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-4 border-t border-cyber-border grid grid-cols-2 gap-4">
              <div className="bg-black/30 border border-cyber-border p-3.5 rounded-2xl">
                <span className="text-[10px] font-semibold text-cyber-textMuted uppercase block">Tab Switches</span>
                <span className="text-2xl font-display font-bold text-cyber-danger mt-1 block">{metrics.totalViolations}</span>
                <span className="text-[9px] text-cyber-textMuted">Distractions</span>
              </div>
              <div className="bg-black/30 border border-cyber-border p-3.5 rounded-2xl">
                <span className="text-[10px] font-semibold text-cyber-textMuted uppercase block">Study Time</span>
                <span className="text-2xl font-display font-bold text-cyber-primary mt-1 block">{metrics.totalFocusTimeMinutes}m</span>
                <span className="text-[9px] text-cyber-textMuted">Total focused</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardHome;
