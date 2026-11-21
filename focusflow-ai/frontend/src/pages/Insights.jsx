import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Info,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';

const AIInsights = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await apiFetch('/api/insights');
        setData(res);
      } catch (err) {
        console.error(err);
        setError('Could not retrieve productivity insights log.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 glass-panel rounded-3xl border border-cyber-danger/30 text-center max-w-lg mx-auto mt-12 bg-cyber-danger/5">
        <AlertTriangle className="w-12 h-12 text-cyber-danger mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white">Insights Retrieval Failed</h4>
        <p className="text-xs text-cyber-textMuted mt-1">{error || 'Make sure the database contains matching tables.'}</p>
      </div>
    );
  }

  const { focusScore, insights, metrics } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <h3 className="text-xl font-display font-bold text-white flex items-center">
            <BrainCircuit className="w-5 h-5 text-cyber-primary mr-2" />
            AI Study Helper
          </h3>
          <p className="text-xs text-cyber-textMuted leading-relaxed max-w-2xl">
            FocusFlow uses a rules-based heuristic algorithm to check your study habits, class attendance, and study-camera log, offering you custom tips to improve your grades!
          </p>
        </div>
        
        {/* Rating Meter */}
        <div className="flex items-center space-x-4 bg-black/40 border border-cyber-border-rgb/60 p-4 rounded-2xl min-w-[200px] justify-center">
          <div className="text-center">
            <span className="text-3xl font-display font-extrabold text-white">{focusScore}%</span>
            <span className="text-[9px] text-cyber-textMuted block font-bold uppercase tracking-wider mt-0.5">Focus Score</span>
          </div>
          <div className="w-[1px] h-8 bg-cyber-border" />
          <div className="text-xs font-semibold text-cyber-primary">
            {focusScore >= 80 ? '✓ Awesome Focus! 🔥' : focusScore >= 60 ? '⚡ Stable Flow' : '⚠️ Distracted!'}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg text-white px-2">AI Feedback & Tips</h3>

          {insights.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-cyber-border-rgb/40">
              <Info className="w-12 h-12 text-cyber-textMuted mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-cyber-text">Studying in progress...</h4>
              <p className="text-xs text-cyber-textMuted mt-1">Log some study sessions, complete tasks, or mark attendance to get custom study tips!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, idx) => {
                let cardStyle = "border-cyber-border bg-[#0f111a]/70 text-white";
                let iconColor = "text-cyber-primary";
                
                if (insight.type === 'success') {
                  cardStyle = "border-cyber-success/30 bg-cyber-success/5 text-white";
                  iconColor = "text-cyber-success";
                } else if (insight.type === 'warning') {
                  cardStyle = "border-cyber-warning/30 bg-cyber-warning/5 text-white";
                  iconColor = "text-cyber-warning";
                } else if (insight.type === 'danger') {
                  cardStyle = "border-cyber-danger/30 bg-cyber-danger/5 text-white";
                  iconColor = "text-cyber-danger";
                }

                return (
                  <div key={idx} className={`p-5 rounded-2xl border ${cardStyle} flex items-start space-x-4 transition-transform hover:-translate-x-1 duration-300`}>
                    <div className="mt-0.5">
                      {insight.type === 'danger' ? (
                        <AlertTriangle className={`w-5.5 h-5.5 ${iconColor}`} />
                      ) : (
                        <BrainCircuit className={`w-5.5 h-5.5 ${iconColor}`} />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold tracking-wide font-display">{insight.title}</h4>
                      <p className="text-xs text-cyber-textMuted leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quantitative Summary stats */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white px-2">My Numbers At A Glance</h3>
          
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            
            <div className="flex items-center justify-between p-3 bg-black/30 border border-cyber-border rounded-xl">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-primary" />
                <span className="text-xs text-cyber-text">Tasks Completed</span>
              </div>
              <span className="text-sm font-bold text-white">{metrics.taskCompletionRate}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/30 border border-cyber-border rounded-xl">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyber-secondary" />
                <span className="text-xs text-cyber-text">Avg Class Attendance</span>
              </div>
              <span className="text-sm font-bold text-white">{metrics.avgAttendance}%</span>
            </div>

            <div className="flex-1 flex items-center justify-between p-3 bg-black/30 border border-cyber-border rounded-xl">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyber-accent" />
                <span className="text-xs text-cyber-text">Tab Switches</span>
              </div>
              <span className="text-sm font-bold text-cyber-danger">{metrics.totalViolations}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/30 border border-cyber-border rounded-xl">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-cyber-success" />
                <span className="text-xs text-cyber-text">Pomodoros Completed</span>
              </div>
              <span className="text-sm font-bold text-white">{metrics.pomodoroCount}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AIInsights;
