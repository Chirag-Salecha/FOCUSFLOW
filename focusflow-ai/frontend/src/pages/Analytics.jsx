import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { BarChart3, AlertTriangle, TrendingUp, ShieldAlert, Award } from 'lucide-react';

const Analytics = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const [insightsData, historyData, attendanceData] = await Promise.all([
          apiFetch('/api/insights'),
          apiFetch('/api/sessions/history'),
          apiFetch('/api/attendance')
        ]);
        setData(insightsData);
        setHistory(historyData);
        setAttendance(attendanceData);
      } catch (err) {
        console.error('Error fetching analytics details:', err);
        setError('Failed to fetch analytics records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
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
      <div className="p-8 glass-panel rounded-3xl border border-cyber-danger/30 text-center max-w-lg mx-auto mt-12">
        <ShieldAlert className="w-12 h-12 text-cyber-danger mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Analytics Not Initialized</h3>
        <p className="text-xs text-cyber-textMuted mb-4">Please run the seed script or log study/task logs first.</p>
      </div>
    );
  }

  const { focusScore, metrics } = data;

  // Process data for Weekly Productivity (Last 7 Days)
  const getWeeklyProductivityData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateStr: d.toDateString(),
        dayLabel: days[d.getDay()],
        studyMinutes: 0,
        violations: 0
      };
    }).reverse();

    // Map sessions history
    history.forEach(session => {
      const sessionDate = new Date(session.created_at).toDateString();
      const match = last7Days.find(day => day.dateStr === sessionDate);
      if (match) {
        match.studyMinutes += Math.round(session.duration_seconds / 60);
        match.violations += session.violations || 0;
      }
    });

    return last7Days;
  };

  const weeklyTrendData = getWeeklyProductivityData();

  // Process data for Attendance Chart
  const attendanceChartData = attendance.map(a => ({
    name: a.subject.length > 12 ? a.subject.substring(0, 10) + '..' : a.subject,
    percentage: a.percentage,
    present: a.present_count,
    absent: a.absent_count
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f111a] border border-cyber-border p-3.5 rounded-xl shadow-glass">
          <p className="text-xs font-bold text-white mb-1.5">{label}</p>
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-[11px] mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-cyber-textMuted">{p.name}:</span>
              <span className="font-semibold text-white">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-3xl p-5 text-center">
          <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Focus Level</span>
          <span className="text-3xl font-display font-black text-cyber-primary block mt-1.5">{focusScore}%</span>
        </div>
        <div className="glass-panel rounded-3xl p-5 text-center">
          <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Minutes Studied</span>
          <span className="text-3xl font-display font-black text-white block mt-1.5">{metrics.totalFocusTimeMinutes}m</span>
        </div>
        <div className="glass-panel rounded-3xl p-5 text-center">
          <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Tab Switches</span>
          <span className="text-3xl font-display font-black text-cyber-danger block mt-1.5">{metrics.totalViolations}</span>
        </div>
        <div className="glass-panel rounded-3xl p-5 text-center">
          <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Pomodoros Completed</span>
          <span className="text-3xl font-display font-black text-cyber-secondary block mt-1.5">{metrics.pomodoroCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Study Minutes Area Chart */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-white flex items-center">
              <TrendingUp className="w-4 h-4 text-cyber-primary mr-2" />
              Weekly Study Minutes
            </h3>
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-semibold">Activity Trend</span>
          </div>

          <div className="h-72 w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-cyber-textMuted">No weekly study records logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="studyMinutes" name="Minutes Focused" stroke="#00ffcc" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudy)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Focus Violations Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-white flex items-center">
              <AlertTriangle className="w-4 h-4 text-cyber-danger mr-2" />
              Weekly Distractions (Tab Switches)
            </h3>
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-semibold">Distraction Audit</span>
          </div>

          <div className="h-72 w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-cyber-textMuted">No disruptions logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="violations" name="Tab Switches" radius={[4, 4, 0, 0]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Course Attendance Levels Chart */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-white flex items-center">
              <Award className="w-4 h-4 text-cyber-secondary mr-2" />
              Class Attendance Rates
            </h3>
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-semibold">75% Minimum Attendance Threshold</span>
          </div>

          <div className="h-72 w-full">
            {attendance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-cyber-textMuted">No enrollment attendance ratios found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" />
                  <Bar dataKey="percentage" name="Attendance Rate %" radius={[4, 4, 0, 0]}>
                    {attendanceChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
