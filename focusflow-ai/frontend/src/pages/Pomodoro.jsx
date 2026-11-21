import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, RotateCcw, Flame, Sparkles, BellRing, Settings } from 'lucide-react';

const Pomodoro = () => {
  const { apiFetch } = useAuth();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [preset, setPreset] = useState(25);
  
  // Custom setter inputs
  const [customInput, setCustomInput] = useState('25');
  const [showSettings, setShowSettings] = useState(false);
  const [savedLog, setSavedLog] = useState(false);
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);

  // Play alarm sound using Web Audio API (so no external mp3 download dependencies are needed!)
  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play a triple chime
      const playChime = (time, freq) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        
        osc.start(time);
        osc.stop(time + 0.8);
      };

      const now = audioCtx.currentTime;
      playChime(now, 523.25); // C5
      playChime(now + 0.25, 659.25); // E5
      playChime(now + 0.5, 783.99); // G5
    } catch (e) {
      console.warn('Web Audio API not supported or blocked by browser policy:', e);
    }
  };

  // Timer Tick Core Logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished!
            setIsActive(false);
            clearInterval(intervalRef.current);
            playAlarmSound();
            logPomodoroSession();
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, minutes, seconds]);

  // Synchronize pomodoro timer state with Electron's desktop application blocker
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.sendTimerState(isActive);
    }
  }, [isActive]);

  // Log completed session
  const logPomodoroSession = async () => {
    setLoading(true);
    setSavedLog(false);
    try {
      await apiFetch('/api/pomodoros', {
        method: 'POST',
        body: JSON.stringify({ duration_minutes: preset })
      });
      setSavedLog(true);
    } catch (err) {
      console.error('Error saving pomodoro session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPause = () => {
    setIsActive(!isActive);
    setSavedLog(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinutes(preset);
    setSeconds(0);
    setSavedLog(false);
  };

  const selectPreset = (mins) => {
    setIsActive(false);
    setPreset(mins);
    setMinutes(mins);
    setSeconds(0);
    setSavedLog(false);
  };

  const applyCustomMinutes = (e) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0 && val <= 180) {
      selectPreset(val);
      setShowSettings(false);
    } else {
      alert('Please select a range between 1 and 180 minutes.');
    }
  };

  // Calculations for visual dashoffset
  const totalSecondsInPreset = preset * 60;
  const currentSecondsRemaining = (minutes * 60) + seconds;
  const percentageTimeElapsed = totalSecondsInPreset > 0 
    ? (totalSecondsInPreset - currentSecondsRemaining) / totalSecondsInPreset 
    : 0;

  const strokeDash = 2 * Math.PI * 90;
  const strokeDashoffset = strokeDash * percentageTimeElapsed;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
        <h3 className="text-xl font-display font-bold text-white flex items-center">
          <Sparkles className="w-5 h-5 text-cyber-primary mr-2" />
          Study Timer (Pomodoro)
        </h3>
        <p className="text-xs text-cyber-textMuted mt-1">
          Break your study sessions into focused intervals (usually 25 mins) followed by short breaks. Keeps your brain fresh!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Visual Timer circle */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="glass-panel rounded-3xl p-10 w-full max-w-md flex flex-col items-center relative">
            
            {savedLog && (
              <div className="absolute top-6 left-6 right-6 p-2 bg-cyber-success/15 border border-cyber-success/35 text-cyber-success text-[10px] uppercase font-bold text-center rounded-xl flex items-center justify-center space-x-1.5 animate-pulse">
                <BellRing className="w-3.5 h-3.5" />
                <span>Interval completed! Saved session.</span>
              </div>
            )}

            {/* Circular SVG Ring */}
            <div className="relative flex items-center justify-center my-6">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="90" className="stroke-slate-900" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="128" 
                  cy="128" 
                  r="90" 
                  className="stroke-cyber-secondary timer-circle transition-all duration-1000 ease-linear" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Digital Readout */}
              <div className="absolute text-center">
                <div className="text-5xl font-display font-black tracking-tight text-white tabular-nums">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-cyber-textMuted font-bold uppercase tracking-widest mt-1">
                  {isActive ? 'Locked In 🔒' : 'Timer Ready'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleReset}
                title="Reset Session"
                className="p-3.5 rounded-2xl border border-cyber-border hover:border-cyber-primary/40 text-cyber-textMuted hover:text-cyber-primary hover:bg-cyber-primary/5 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleStartPause}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center space-x-2 ${
                  isActive 
                    ? 'bg-black/50 border border-cyber-accent text-cyber-accent hover:bg-cyber-accent/15'
                    : 'bg-gradient-to-r from-cyber-secondary to-indigo-600 hover:brightness-110 text-white shadow-neon-purple'
                }`}
              >
                {isActive ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                <span>{isActive ? 'Pause' : 'Start Studying'}</span>
              </button>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                title="Custom Duration"
                className="p-3.5 rounded-2xl border border-cyber-border hover:border-cyber-primary/40 text-cyber-textMuted hover:text-cyber-primary hover:bg-cyber-primary/5 transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Configurations & Presets list */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preset Buttons */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white">Select Study Block</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => selectPreset(25)}
                className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  preset === 25 
                    ? 'bg-gradient-to-r from-cyber-secondary/15 to-transparent border-cyber-secondary text-white' 
                    : 'bg-black/30 border-cyber-border text-cyber-textMuted hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-bold block font-display">25 Minutes - Standard Block</span>
                  <span className="text-[10px] text-cyber-textMuted">Perfect for coding, writing, or reading.</span>
                </div>
                <Flame className="w-5 h-5 text-cyber-secondary" />
              </button>

              <button 
                onClick={() => selectPreset(50)}
                className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  preset === 50 
                    ? 'bg-gradient-to-r from-cyber-secondary/15 to-transparent border-cyber-secondary text-white' 
                    : 'bg-black/30 border-cyber-border text-cyber-textMuted hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-bold block font-display">50 Minutes - Deep Focus Block</span>
                  <span className="text-[10px] text-cyber-textMuted">For tough assignments, math prep, or code jams.</span>
                </div>
                <Flame className="w-5 h-5 text-cyber-secondary" />
              </button>

              <button 
                onClick={() => selectPreset(15)}
                className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  preset === 15 
                    ? 'bg-gradient-to-r from-cyber-secondary/15 to-transparent border-cyber-secondary text-white' 
                    : 'bg-black/30 border-cyber-border text-cyber-textMuted hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-bold block font-display">15 Minutes - Quick Sprint</span>
                  <span className="text-[10px] text-cyber-textMuted">Good for wrapping up tasks or quick revisions.</span>
                </div>
                <Flame className="w-5 h-5 text-cyber-secondary" />
              </button>
            </div>
          </div>

          {/* Custom Setter Form */}
          {showSettings && (
            <div className="glass-panel rounded-3xl p-6 space-y-4 animate-fade-in">
              <h3 className="font-display font-bold text-base text-white">Configure Custom Timer</h3>
              
              <form onSubmit={applyCustomMinutes} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      min="1"
                      max="180"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Minutes"
                      className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-cyber-textMuted font-bold">Mins</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyber-primary text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  Apply
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Pomodoro;
