import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Trash2, AlertTriangle, CheckCircle, Sparkles, BookOpen } from 'lucide-react';

const Attendance = () => {
  const { apiFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = async () => {
    try {
      const data = await apiFetch('/api/attendance');
      setRecords(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve attendance log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    setActionLoading(true);
    setError('');

    try {
      const newSub = await apiFetch('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ subject: subjectName })
      });

      setRecords([...records, newSub]);
      setSubjectName('');
    } catch (err) {
      setError(err.message || 'Error creating course subject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustAttendance = async (record, isPresent, amount) => {
    const nextPresent = isPresent ? Math.max(0, record.present_count + amount) : record.present_count;
    const nextAbsent = !isPresent ? Math.max(0, record.absent_count + amount) : record.absent_count;

    try {
      const updated = await apiFetch(`/api/attendance/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          present_count: nextPresent,
          absent_count: nextAbsent
        })
      });

      setRecords(records.map(r => r.id === record.id ? updated : r));
    } catch (err) {
      setError('Error adjusting class counters.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await apiFetch(`/api/attendance/${id}`, {
        method: 'DELETE'
      });
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      setError('Error deleting subject.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Overview Block */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-cyber-primary mr-2" />
              Bunk Manager & Attendance Tracker
            </h3>
            <p className="text-xs text-cyber-textMuted mt-1">
              Keep your attendance <strong className="text-cyber-primary">above 75%</strong> in all courses to stay safe from detentions and keep your study score strong!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Course Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 space-y-5 sticky top-28">
            <h3 className="font-display font-bold text-lg text-white">Track New Subject</h3>
            
            {error && (
              <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/35 text-cyber-danger text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Subject / Course Name</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-primary/20 to-cyber-primary/40 border border-cyber-primary/45 text-cyber-primary hover:brightness-110 font-semibold text-sm transition-all"
              >
                {actionLoading ? 'Registering...' : 'Track Subject'}
              </button>
            </form>
          </div>
        </div>

        {/* Subjects List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg text-white px-2">My Subjects & Attendance</h3>

          {records.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-cyber-border-rgb/40">
              <BookOpen className="w-12 h-12 text-cyber-textMuted mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-cyber-text">No Subjects Tracked</h4>
              <p className="text-xs text-cyber-textMuted mt-1">Add your subjects using the form on the left to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const total = record.present_count + record.absent_count;
                return (
                  <div key={record.id} className="glass-panel rounded-3xl p-6 hover:border-cyber-primary/20 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2.5">
                          <h4 className="font-display font-bold text-base text-white">{record.subject}</h4>
                          {record.percentage < 75 && total > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger uppercase tracking-wider animate-pulse">
                              Bunk Alert! ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-cyber-textMuted">
                          Attended <span className="text-white font-medium">{record.present_count}</span> of <span className="text-white font-medium">{total}</span> total sessions
                        </p>
                      </div>

                      {/* Right: Percentage & Controls */}
                      <div className="flex items-center space-x-6">
                        
                        {/* Attendance present/absent controls */}
                        <div className="flex items-center space-x-4 bg-black/40 border border-cyber-border-rgb/60 p-2 rounded-2xl">
                          {/* Present counter */}
                          <div className="text-center px-1">
                            <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Attended</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <button 
                                onClick={() => handleAdjustAttendance(record, true, -1)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyber-textMuted hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-bold text-cyber-success tabular-nums">{record.present_count}</span>
                              <button 
                                onClick={() => handleAdjustAttendance(record, true, 1)}
                                className="p-1 rounded-lg bg-cyber-success/20 hover:bg-cyber-success/30 text-cyber-success"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="w-[1px] h-8 bg-cyber-border" />

                          {/* Absent counter */}
                          <div className="text-center px-1">
                            <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Bunked</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <button 
                                onClick={() => handleAdjustAttendance(record, false, -1)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyber-textMuted hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-bold text-cyber-danger tabular-nums">{record.absent_count}</span>
                              <button 
                                onClick={() => handleAdjustAttendance(record, false, 1)}
                                className="p-1 rounded-lg bg-cyber-danger/20 hover:bg-cyber-danger/30 text-cyber-danger"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Attendance percentage indicator */}
                        <div className="text-center min-w-[70px]">
                          <span className={`text-2xl font-display font-black block ${
                            record.percentage >= 75 ? 'text-cyber-success' : 'text-cyber-danger'
                          }`}>
                            {record.percentage}%
                          </span>
                          <span className="text-[9px] font-semibold text-cyber-textMuted uppercase">Attendance</span>
                        </div>

                        {/* Delete course subject */}
                        <button
                          onClick={() => handleDeleteSubject(record.id)}
                          className="p-2 rounded-xl border border-cyber-border-rgb/40 hover:border-cyber-danger hover:bg-cyber-danger/10 text-cyber-textMuted hover:text-cyber-danger transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Class progress visual bar */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-4">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          record.percentage >= 75 
                            ? 'bg-gradient-to-r from-cyber-success to-emerald-400' 
                            : 'bg-gradient-to-r from-cyber-danger to-rose-400'
                        }`}
                        style={{ width: `${record.percentage}%` }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Attendance;
