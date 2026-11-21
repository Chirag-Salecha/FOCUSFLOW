import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Calendar, CheckSquare, Square, AlertCircle, Sparkles } from 'lucide-react';

const Tasks = () => {
  const { apiFetch } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      const data = await apiFetch('/api/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          due_date: dueDate || null
        })
      });

      setTasks([response, ...tasks]);
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      setError(err.message || 'Error creating task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      setError('Could not update task state.');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      setError('Could not delete task.');
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Task Completion Progress Meter */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-cyber-primary mr-2" />
              Tasks & Homework Progress
            </h3>
            <p className="text-xs text-cyber-textMuted mt-1">Finish your assignments and coding labs to raise your Focus Level and unlock tips from your AI Buddy!</p>
          </div>
          <div className="flex items-center space-x-6 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-cyber-text">{completedTasks} of {totalTasks} completed</span>
                <span className="text-cyber-primary">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-primary to-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <div className="text-4xl font-display font-black text-white">{completionRate}<span className="text-cyber-primary text-lg">%</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Task Form Panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 space-y-5 sticky top-28">
            <h3 className="font-display font-bold text-lg text-white">Add a New Task</h3>
            
            {error && (
              <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/35 text-cyber-danger text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Revise CPU scheduling"
                  className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Description (Optional)</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write task specifications..."
                  className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white outline-none transition-colors scheme-dark"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-primary/20 to-cyber-primary/40 border border-cyber-primary/45 text-cyber-primary hover:brightness-110 font-semibold text-sm transition-all"
              >
                {actionLoading ? 'Creating...' : 'Track Task'}
              </button>
            </form>
          </div>
        </div>

        {/* Task List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg text-white px-2">My To-Do List</h3>
          
          {tasks.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-cyber-border-rgb/40">
              <CheckSquare className="w-12 h-12 text-cyber-textMuted mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-cyber-text">No Tasks Recorded</h4>
              <p className="text-xs text-cyber-textMuted mt-1">Add your homework, lab preps, or exam dates using the form on the left!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                      isCompleted 
                        ? 'bg-black/20 border-cyber-border-rgb/20 opacity-60' 
                        : 'glass-panel hover:border-cyber-primary/20 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
                      <button 
                        onClick={() => handleToggleStatus(task)}
                        className={`p-1 rounded-lg border transition-colors ${
                          isCompleted 
                            ? 'border-cyber-primary bg-cyber-primary/10 text-cyber-primary' 
                            : 'border-cyber-border hover:border-cyber-primary text-cyber-textMuted'
                        }`}
                      >
                        {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div className="min-w-0">
                        <h4 className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-cyber-textMuted' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-cyber-textMuted mt-0.5 truncate max-w-md">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center space-x-1.5 text-[10px] text-cyber-textMuted mt-1.5">
                            <Calendar className="w-3.5 h-3.5 text-cyber-primary" />
                            <span>Due {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-xl border border-cyber-border-rgb/40 hover:border-cyber-danger hover:bg-cyber-danger/10 text-cyber-textMuted hover:text-cyber-danger transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
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

export default Tasks;
