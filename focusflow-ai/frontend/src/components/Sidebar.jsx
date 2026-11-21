import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Camera, 
  CalendarDays, 
  BarChart3, 
  Timer, 
  BrainCircuit, 
  History, 
  User, 
  LogOut,
  Zap,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'document-reader', label: 'Document Reader', icon: BookOpen },
    { id: 'focus-camera', label: 'Study Camera', icon: Camera },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'pomodoro', label: 'Pomodoro Timer', icon: Timer },
    { id: 'insights', label: 'AI Study Tips', icon: BrainCircuit },
    { id: 'history', label: 'Study Logs', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-black/40 border-r border-cyber-border h-screen flex flex-col fixed left-0 top-0 z-30 backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-6 border-b border-cyber-border flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyber-secondary to-cyber-primary flex items-center justify-center neon-glow-cyan">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyber-primary bg-clip-text text-transparent">
            FocusFlow <span className="text-cyber-primary text-sm font-semibold">AI</span>
          </h1>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-widest font-medium">Productivity Hub</p>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-left font-medium ${
                isActive 
                  ? 'bg-gradient-to-r from-cyber-primary/15 to-transparent text-cyber-primary border-l-2 border-cyber-primary pl-[14px]'
                  : 'text-cyber-textMuted hover:text-cyber-text hover:bg-white/5 pl-[16px]'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-115'}`} />
              <span className="text-sm font-display">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Quick Info & Logout */}
      <div className="p-4 border-t border-cyber-border bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-8 h-8 rounded-full bg-cyber-secondary/20 border border-cyber-secondary/40 flex items-center justify-center text-xs font-semibold text-cyber-primary uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-cyber-text truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-cyber-textMuted truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg border border-cyber-border hover:border-cyber-accent hover:bg-cyber-accent/10 text-cyber-textMuted hover:text-cyber-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
