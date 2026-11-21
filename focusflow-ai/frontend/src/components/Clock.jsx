import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' });
  };

  return (
    <div className="flex items-center space-x-3 text-sm font-medium border border-cyber-border px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
      <Clock className="w-4 h-4 text-cyber-primary animate-pulse" />
      <span className="text-cyber-text font-semibold tabular-nums">{formatTime(time)}</span>
      <span className="text-cyber-textMuted text-xs">|</span>
      <span className="text-cyber-textMuted text-xs uppercase tracking-wider">{formatDate(time)}</span>
    </div>
  );
};

export default LiveClock;
