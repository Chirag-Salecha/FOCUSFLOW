import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Camera, Flame, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

const SessionHistory = () => {
  const { apiFetch } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const data = await apiFetch('/api/sessions/history');
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve session logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let res = '';
    if (hours > 0) res += `${hours}h `;
    if (minutes > 0) res += `${minutes}m `;
    if (seconds > 0 || res === '') res += `${seconds}s`;
    return res;
  };

  const formatTimestamp = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center px-2">
        <h3 className="font-display font-bold text-lg text-white">My Study Log History</h3>
        <span className="text-xs text-cyber-textMuted font-semibold uppercase">{history.length} logs recorded</span>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-dashed border-cyber-border-rgb/40">
          <History className="w-12 h-12 text-cyber-textMuted mx-auto mb-3 opacity-40 animate-pulse" />
          <h4 className="text-sm font-semibold text-cyber-text">No Historical Logs Found</h4>
          <p className="text-xs text-cyber-textMuted mt-1">Start a Study Cam session or set a Pomodoro timer to see your progress logged here!</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-cyber-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border bg-black/30">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted pl-6">Timer Mode</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted">Activity Name</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted">Duration</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted">Tab Switches</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted">Date & Time</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border-rgb/40">
                {history.map((session) => {
                  const isFocus = session.type === 'focus_session';
                  const isInterrupted = session.status === 'interrupted';
                  return (
                    <tr key={`${session.type}-${session.id}`} className="hover:bg-white/[0.02] transition-colors text-sm">
                      {/* Session Type */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center space-x-2.5">
                          {isFocus ? (
                            <div className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
                              <Camera className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-cyber-secondary/10 border border-cyber-secondary/20 text-cyber-secondary">
                              <Flame className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-display font-medium text-xs text-white">
                            {isFocus ? 'Study Cam' : 'Pomodoro'}
                          </span>
                        </div>
                      </td>

                      {/* Activity Name */}
                      <td className="p-4 font-semibold text-white truncate max-w-xs">{session.name}</td>

                      {/* Duration */}
                      <td className="p-4 text-cyber-textMuted tabular-nums">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyber-primary" />
                          <span>{formatDuration(session.duration_seconds)}</span>
                        </div>
                      </td>

                      {/* Disruptions */}
                      <td className="p-4">
                        {isFocus ? (
                          <span className={`font-semibold tabular-nums ${session.violations > 0 ? 'text-cyber-danger' : 'text-cyber-success'}`}>
                            {session.violations} {session.violations === 1 ? 'switch' : 'switches'}
                          </span>
                        ) : (
                          <span className="text-cyber-textMuted">—</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 text-cyber-textMuted tabular-nums">{formatTimestamp(session.created_at)}</td>

                      {/* Status */}
                      <td className="p-4 pr-6">
                        <div className="flex items-center space-x-1.5">
                          {isInterrupted ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-cyber-danger" />
                              <span className="text-xs font-bold text-cyber-danger uppercase tracking-wider">Interrupted</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-cyber-success" />
                              <span className="text-xs font-bold text-cyber-success uppercase tracking-wider">Completed</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionHistory;
