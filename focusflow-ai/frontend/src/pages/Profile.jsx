import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarDays,
  ShieldCheck,
  Flame
} from 'lucide-react';

const Profile = () => {
  const { apiFetch } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch('/api/user/profile');
        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError('Could not retrieve student profile stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatMemberDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-8 glass-panel rounded-3xl border border-cyber-danger/30 text-center max-w-lg mx-auto mt-12 bg-cyber-danger/5">
        <AlertTriangle className="w-12 h-12 text-cyber-danger mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white">Profile Loading Failed</h4>
        <p className="text-xs text-cyber-textMuted mt-1">{error}</p>
      </div>
    );
  }

  const { profile, stats } = profileData;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Student Badge Card */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-secondary/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Large Initials Badge */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyber-secondary to-cyber-primary flex items-center justify-center text-2xl font-black text-white uppercase neon-glow-cyan">
          {profile.name ? profile.name[0] : 'S'}
        </div>

        <div className="space-y-1.5 flex-1">
          <h3 className="text-2xl font-display font-black text-white tracking-tight">{profile.name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-cyber-textMuted">
            <span className="flex items-center">
              <Mail className="w-4 h-4 text-cyber-primary mr-1.5" />
              {profile.email}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 text-cyber-secondary mr-1.5" />
              Registered: {formatMemberDate(profile.memberSince)}
            </span>
            {stats.streak && stats.streak.streakCount > 0 && (
              <span className="flex items-center text-cyber-accent font-bold">
                <Flame className="w-4 h-4 text-cyber-accent mr-1 fill-current animate-pulse" />
                Streak: {stats.streak.streakCount} Days {stats.streak.warningActive ? '⏳ (Expiring!)' : '🔥 (Active)'}
              </span>
            )}
          </div>
        </div>


        {/* Focus flow indicator */}
        <div className="bg-black/40 border border-cyber-border p-4 rounded-2xl text-center min-w-[140px]">
          <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Core Rating</span>
          <span className="text-2xl font-display font-black text-cyber-primary block mt-1">{stats.productivityScore}%</span>
        </div>
      </div>

      {/* Main Grid statistics layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Task Management Stats */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-cyber-border pb-3 flex items-center">
            <CheckCircle2 className="w-4.5 h-4.5 text-cyber-primary mr-2" />
            Tasks Overview
          </h4>
          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Total Tasks Logged</span>
              <span className="font-bold text-white">{stats.tasks.total}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Completed Tasks</span>
              <span className="font-bold text-cyber-success">{stats.tasks.completed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Pending Tasks</span>
              <span className="font-bold text-cyber-warning">{stats.tasks.pending}</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">
                <span>Completion Rate</span>
                <span className="text-cyber-primary">{stats.tasks.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-primary rounded-full" style={{ width: `${stats.tasks.percentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Course stats */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-cyber-border pb-3 flex items-center">
            <CalendarDays className="w-4.5 h-4.5 text-cyber-secondary mr-2" />
            Class Attendance
          </h4>
          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Subjects Tracked</span>
              <span className="font-bold text-white">{stats.attendance.subjectsCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Average Attendance</span>
              <span className="font-bold text-white">{stats.attendance.averagePercentage}%</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">
                <span>Overall Rate</span>
                <span className={stats.attendance.averagePercentage >= 75 ? 'text-cyber-success' : 'text-cyber-danger'}>
                  {stats.attendance.averagePercentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${stats.attendance.averagePercentage >= 75 ? 'bg-cyber-success' : 'bg-cyber-danger'}`} 
                  style={{ width: `${stats.attendance.averagePercentage}%` }} 
                />
              </div>
            </div>
            <p className="text-[10px] text-cyber-textMuted leading-relaxed bg-black/25 p-2 rounded-xl border border-cyber-border-rgb/45">
              Bunk alerts show up automatically if any subject's attendance dips below 75%. Keep it green!
            </p>
          </div>
        </div>

        {/* Focus Tracking stats */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-cyber-border pb-3 flex items-center">
            <Clock className="w-4.5 h-4.5 text-cyber-accent mr-2" />
            Study Camera Summary
          </h4>
          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Total Study Sessions</span>
              <span className="font-bold text-white">{stats.focus.sessionsCount} sessions</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Total Focused Time</span>
              <span className="font-bold text-white">{stats.focus.totalHours} hrs</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyber-textMuted">Total Tab Switches</span>
              <span className="font-bold text-cyber-danger">{stats.focus.violationsCount} switches</span>
            </div>
            <div className="flex justify-between text-xs border-t border-cyber-border-rgb/40 pt-3">
              <span className="text-cyber-textMuted">Avg Tab Switches / Session</span>
              <span className="font-bold text-white">{stats.focus.avgViolations}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
