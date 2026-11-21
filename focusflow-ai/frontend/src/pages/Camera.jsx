import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Eye,
  CheckCircle2
} from 'lucide-react';

const FocusCamera = () => {
  const { apiFetch } = useAuth();
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warningType, setWarningType] = useState(''); // 'tab-switch', 'absence', 'unauthorized-device', 'multiple-people', or ''
  const [absenceSeconds, setAbsenceSeconds] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // AI-powered proctoring states
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [unauthorizedObject, setUnauthorizedObject] = useState('');
  const [activeDetections, setActiveDetections] = useState([]);

  const timerRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null); // Hidden fallback skin tone canvas
  const visibleCanvasRef = useRef(null); // Visible overlay canvas
  const predictionsRef = useRef([]);
  const requestRef = useRef(null);

  // Sync state refs to prevent stale closures in requestAnimationFrame loop
  const sessionActiveRef = useRef(sessionActive);
  const warningTypeRef = useRef(warningType);

  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useEffect(() => {
    warningTypeRef.current = warningType;
  }, [warningType]);

  // Piercing buzzer audio signal via browser AudioContext APIs
  const playBuzzer = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio Context failed:", e);
    }
  };

  // Tab switching detector
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionActive && !warningType) {
        setViolations(prev => prev + 1);
        setWarningType('tab-switch');
        playBuzzer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionActive, warningType]);

  // 1. Load COCO-SSD model on mount
  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      let retries = 5;
      while (retries > 0) {
        if (window.cocoSsd) {
          try {
            console.log("Loading coco-ssd model...");
            const loadedModel = await window.cocoSsd.load();
            if (active) {
              setModel(loadedModel);
              setModelLoading(false);
              console.log("coco-ssd model loaded successfully.");
            }
            return;
          } catch (err) {
            console.error("Error loading COCO-SSD model:", err);
            if (active) {
              setModelError("Failed to load AI model: " + err.message);
              setModelLoading(false);
            }
            return;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
      if (active) {
        setModelError("AI detection engine not loaded (Check CDN connections).");
        setModelLoading(false);
      }
    };

    loadModel();
    return () => {
      active = false;
    };
  }, []);

  // Helper: Draw scanner overlay elements on canvas
  const drawScannerOverlay = (ctx, width, height) => {
    // A. Futuristic grid overlay (semi-transparent)
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // B. Neon Corner brackets
    const borderOffset = 20;
    const bracketSize = 25;
    const isViolationActive = warningTypeRef.current && warningTypeRef.current !== 'tab-switch';
    ctx.strokeStyle = isViolationActive ? 'rgba(255, 51, 102, 0.6)' : 'rgba(0, 255, 204, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isViolationActive ? '#ff3366' : '#00ffcc';
    ctx.shadowBlur = 6;

    // Bottom Right (mirrored mapping, let's just make regular corner strokes)
    // Top Left
    ctx.beginPath();
    ctx.moveTo(borderOffset + bracketSize, borderOffset);
    ctx.lineTo(borderOffset, borderOffset);
    ctx.lineTo(borderOffset, borderOffset + bracketSize);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(width - borderOffset - bracketSize, borderOffset);
    ctx.lineTo(width - borderOffset, borderOffset);
    ctx.lineTo(width - borderOffset, borderOffset + bracketSize);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(borderOffset + bracketSize, height - borderOffset);
    ctx.lineTo(borderOffset, height - borderOffset);
    ctx.lineTo(borderOffset, height - borderOffset + bracketSize);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(width - borderOffset - bracketSize, height - borderOffset);
    ctx.lineTo(width - borderOffset, height - borderOffset);
    ctx.lineTo(width - borderOffset, height - borderOffset + bracketSize);
    ctx.stroke();

    // C. Scanner beam line
    const scannerY = (Date.now() % 4000) / 4000 * height;
    ctx.strokeStyle = isViolationActive ? 'rgba(255, 51, 102, 0.2)' : 'rgba(0, 255, 204, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scannerY);
    ctx.lineTo(width, scannerY);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // 2. High-performance canvas drawing loop at 30 FPS
  const animate = () => {
    if (!sessionActiveRef.current || warningTypeRef.current) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = visibleCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const width = canvas.width;
          const height = canvas.height;

          // Clear
          ctx.clearRect(0, 0, width, height);

          // Draw webcam frame mirrored
          ctx.save();
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, width, height);
          ctx.restore();

          // Render scanlines and grid reticles
          drawScannerOverlay(ctx, width, height);

          // Draw high-contrast bounding boxes & labels
          const predictions = predictionsRef.current || [];
          predictions.forEach(pred => {
            const [x, y, w, h] = pred.bbox;
            const mirroredX = width - x - w;

            let strokeColor = '#00ffcc'; // neon cyan
            let labelText = `${pred.class} (${Math.round(pred.score * 100)}%)`;

            if (['cell phone', 'laptop', 'tv'].includes(pred.class)) {
              strokeColor = '#ff3366'; // neon red
              labelText = `⚠️ UNAUTHORIZED: ${labelText}`;
            } else if (pred.class === 'person') {
              strokeColor = '#3b82f6'; // neon blue
            }

            // Box stroke
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 8;
            ctx.strokeRect(mirroredX, y, w, h);
            ctx.shadowBlur = 0;

            // Box label text
            ctx.fillStyle = strokeColor;
            ctx.font = 'bold 11px Outfit, Inter, sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect(mirroredX, y > 20 ? y - 20 : y, textWidth + 10, 20);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, mirroredX + 5, y > 20 ? y - 6 : y + 14);
          });
        }
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  // 3. Register/Deregister Animation Frame loop
  useEffect(() => {
    if (sessionActive && !warningType) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [sessionActive, warningType]);

  // 4. AI-Proctoring predictions interval loop (Runs every 1.5s)
  useEffect(() => {
    let predictionInterval = null;

    if (sessionActive && !warningType && model) {
      predictionInterval = setInterval(async () => {
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const preds = await model.detect(video);
            predictionsRef.current = preds;
            setActiveDetections(preds);

            let unauthorizedDetected = false;
            let detectedObject = '';
            let personCount = 0;

            const unauthorizedClasses = ['cell phone', 'laptop', 'tv'];

            preds.forEach(pred => {
              if (unauthorizedClasses.includes(pred.class) && pred.score > 0.45) {
                unauthorizedDetected = true;
                detectedObject = pred.class;
              }
              if (pred.class === 'person' && pred.score > 0.45) {
                personCount++;
              }
            });

            if (unauthorizedDetected) {
              setViolations(prev => prev + 1);
              setUnauthorizedObject(detectedObject);
              setWarningType('unauthorized-device');
              playBuzzer();
            } else if (personCount > 1) {
              setViolations(prev => prev + 1);
              setWarningType('multiple-people');
              playBuzzer();
            } else if (personCount === 0) {
              // Person absent: check consecutive counts
              setAbsenceSeconds(prev => {
                const nextAbsence = prev + 1.5;
                if (nextAbsence >= 5) {
                  setViolations(v => v + 1);
                  setWarningType('absence');
                  playBuzzer();
                  return 0;
                }
                return nextAbsence;
              });
            } else {
              setAbsenceSeconds(0);
            }
          } catch (err) {
            console.error("AI detection error:", err);
          }
        }
      }, 1500);
    } else {
      predictionsRef.current = [];
      setActiveDetections([]);
    }

    return () => {
      if (predictionInterval) clearInterval(predictionInterval);
    };
  }, [sessionActive, warningType, model]);

  // 5. Fallback skin-tone verification presence check (Runs only when AI model is NOT loaded)
  useEffect(() => {
    let fallbackInterval = null;

    if (sessionActive && !warningType && !model) {
      fallbackInterval = setInterval(() => {
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            let skinPixels = 0;
            const totalPixels = data.length / 4;
            
            for (let i = 0; i < data.length; i += 8) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              if (r > 95 && g > 40 && b > 20 && (r - g) > 15 && (r - b) > 15) {
                skinPixels++;
              }
            }
            
            const analyzedPixels = totalPixels / 2;
            const skinPercentage = (skinPixels / analyzedPixels) * 100;
            
            if (skinPercentage < 1.5) {
              setAbsenceSeconds(prev => {
                const nextAbsence = prev + 1;
                if (nextAbsence >= 5) {
                  setViolations(v => v + 1);
                  setWarningType('absence');
                  playBuzzer();
                  return 0;
                }
                return nextAbsence;
              });
            } else {
              setAbsenceSeconds(0);
            }
          } catch (err) {
            console.error("Error reading fallback canvas image data:", err);
          }
        }
      }, 1000);
    } else {
      if (fallbackInterval) clearInterval(fallbackInterval);
    }

    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [sessionActive, warningType, model]);

  // Keep ticking while session is active AND warning is closed
  useEffect(() => {
    if (sessionActive && !warningType) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [sessionActive, warningType]);

  // Synchronize timer active status with Electron's desktop application blocker
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.sendTimerState(sessionActive);
    }
  }, [sessionActive]);

  const handleStartSession = () => {
    if (!sessionName.trim()) {
      alert('Please enter a session study name first.');
      return;
    }
    setSeconds(0);
    setViolations(0);
    setWarningType('');
    setAbsenceSeconds(0);
    setSessionSaved(false);
    setPermissionError(false);
    setSessionActive(true);
  };

  const handleResumeSession = () => {
    setWarningType('');
    setAbsenceSeconds(0);
    setUnauthorizedObject('');
    setActiveDetections([]);
    predictionsRef.current = [];
  };

  const handleRestartSession = () => {
    setSeconds(0);
    setViolations(0);
    setWarningType('');
    setAbsenceSeconds(0);
    setUnauthorizedObject('');
    setActiveDetections([]);
    predictionsRef.current = [];
    setSessionSaved(false);
    setSessionActive(true);
  };

  const handleStopSession = async (status = 'completed') => {
    if (!sessionActive) return;
    setSessionActive(false);
    clearInterval(timerRef.current);
    setLoading(true);

    try {
      await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: sessionName,
          duration_seconds: seconds,
          violations,
          status
        })
      });
      setSessionSaved(true);
    } catch (err) {
      console.error('Error saving study session:', err);
      alert('Error saving session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  const handleUserMediaError = () => {
    setPermissionError(true);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Warning Overlay Modal */}
      {warningType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-cyber-danger/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-cyber-danger/10 border border-cyber-danger/30 flex items-center justify-center mx-auto text-cyber-danger animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-extrabold text-white">
                {warningType === 'tab-switch' && 'Oops! Focus Check! 😅'}
                {warningType === 'absence' && 'Student Absent! 🔍'}
                {warningType === 'unauthorized-device' && 'Unauthorized Device! ⚠️'}
                {warningType === 'multiple-people' && 'Multiple People! 👥'}
              </h3>
              <p className="text-sm text-cyber-textMuted leading-relaxed">
                {warningType === 'tab-switch' && "You switched tabs or minimized the browser. We've paused the timer. Let's get back to work!"}
                {warningType === 'absence' && "No student presence detected in front of the webcam. We have paused the timer to comply with academic integrity."}
                {warningType === 'unauthorized-device' && `An unauthorized device (${unauthorizedObject || 'electronic device'}) was detected in view. Please put it away to comply with academic integrity.`}
                {warningType === 'multiple-people' && "More than one person is visible in front of the webcam. Please ensure only you are visible to comply with academic integrity."}
              </p>
            </div>

            <div className="bg-black/40 border border-cyber-border rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyber-textMuted">Violations</span>
                <span className="text-xl font-display font-bold text-cyber-danger block mt-1">{violations}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyber-textMuted">Paused At</span>
                <span className="text-xl font-display font-bold text-cyber-primary block mt-1">{formatTime(seconds)}</span>
              </div>
            </div>

            <button 
              onClick={handleResumeSession}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyber-primary/20 to-cyber-primary/40 border border-cyber-primary/45 text-cyber-primary font-bold text-sm hover:brightness-110 transition-all"
            >
              Resume Study Session
            </button>
          </div>
        </div>
      )}

      {/* Main proctoring interface layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Webcam feed */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-display font-bold text-white flex items-center">
              <Activity className="w-5 h-5 text-cyber-primary mr-2" />
              My Study Cam
            </h3>
            <div className="flex items-center space-x-2">
              {sessionActive && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  absenceSeconds > 0
                    ? 'bg-cyber-danger/10 border-cyber-danger/35 text-cyber-danger animate-pulse'
                    : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${absenceSeconds > 0 ? 'bg-cyber-danger' : 'bg-emerald-400'}`} />
                  {absenceSeconds > 0 ? `Absent Warning (${Math.max(0, 5 - Math.ceil(absenceSeconds))}s)` : 'Student Present'}
                </span>
              )}
              {/* AI Proctor Shield Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                modelLoading
                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-400 animate-pulse'
                  : modelError
                    ? 'bg-cyber-danger/10 border-cyber-danger/35 text-cyber-danger'
                    : 'bg-cyber-primary/10 border-cyber-primary/35 text-cyber-primary'
              }`}>
                <Activity className="w-3.5 h-3.5 mr-1 text-cyber-primary" />
                {modelLoading ? 'AI Booting' : modelError ? 'AI Offline' : 'AI Active'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                sessionActive 
                  ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary' 
                  : 'bg-white/5 border-cyber-border text-cyber-textMuted'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sessionActive ? 'bg-cyber-primary animate-ping' : 'bg-cyber-textMuted'}`} />
                {sessionActive ? 'Active' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/60 border border-cyber-border flex items-center justify-center">
            {sessionActive ? (
              permissionError ? (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-12 h-12 text-cyber-textMuted mx-auto opacity-40" />
                  <h4 className="text-sm font-semibold text-white">Camera Access Denied</h4>
                  <p className="text-xs text-cyber-textMuted max-w-xs leading-relaxed">Please enable camera permission in your web browser settings to support local focus tracking.</p>
                  <button 
                    onClick={handleRestartSession}
                    className="px-4 py-2 bg-white/5 border border-cyber-border rounded-xl text-xs text-white"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Keep Webcam mounted but hidden visually so it captures and drives the canvas drawing loop at full resolution */}
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width={640}
                    height={480}
                    onUserMediaError={handleUserMediaError}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }}
                  />
                  {/* Visible rendering canvas */}
                  <canvas 
                    ref={visibleCanvasRef} 
                    className="w-full h-full object-cover" 
                  />
                  {/* Downsampling analysis canvas (hidden fallback) */}
                  <canvas 
                    ref={canvasRef} 
                    width={80} 
                    height={60} 
                    className="hidden" 
                  />
                  
                  {/* Cyber Scanner Overlay Status Header */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-cyber-primary/30 rounded-xl px-3 py-1.5 flex items-center space-x-2 pointer-events-none">
                    <div className={`w-2 h-2 rounded-full ${model ? 'bg-cyber-primary animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                      {model ? 'AI PROC-SHIELD ACTIVE' : 'AI PROC-SHIELD STARTING'}
                    </span>
                  </div>

                  {/* Active detection overlay indicators */}
                  {activeDetections.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col space-y-1 items-end pointer-events-none">
                      {activeDetections.map((pred, idx) => (
                        <span 
                          key={idx} 
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md transition-all ${
                            ['cell phone', 'laptop', 'tv'].includes(pred.class)
                              ? 'bg-cyber-danger/20 border-cyber-danger text-cyber-danger animate-pulse'
                              : 'bg-black/60 border-cyber-border text-cyber-primary'
                          }`}
                        >
                          {pred.class.toUpperCase()}: {Math.round(pred.score * 100)}%
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-cyber-border flex items-center justify-center mx-auto text-cyber-textMuted">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Study Cam Offline</h4>
                  <p className="text-xs text-cyber-textMuted max-w-xs leading-relaxed">
                    Start a study session to turn on your webcam feed. Your video is processed 100% locally in your browser using TensorFlow.js and is never uploaded anywhere.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Control Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <h3 className="font-display font-bold text-lg text-white">Timer & Tab Switches</h3>

            {sessionSaved && (
              <div className="p-3 bg-cyber-success/15 border border-cyber-success/35 text-cyber-success text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Session saved successfully in history!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">What are you studying?</label>
                <input
                  type="text"
                  disabled={sessionActive}
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Preparing Operating System slides"
                  className="w-full px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-sm text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 border border-cyber-border p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Duration</span>
                  <span className="text-3xl font-display font-black text-white block mt-1.5 tabular-nums">
                    {formatTime(seconds)}
                  </span>
                </div>
                <div className="bg-black/30 border border-cyber-border p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-cyber-textMuted uppercase block">Violations</span>
                  <span className={`text-3xl font-display font-black block mt-1.5 ${violations > 0 ? 'text-cyber-danger' : 'text-cyber-primary'}`}>
                    {violations}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {!sessionActive ? (
                <button
                  disabled={modelLoading}
                  onClick={handleStartSession}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyber-primary/20 to-cyber-primary/45 border border-cyber-primary/50 text-cyber-primary font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modelLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
                      <span>Initializing AI Proctoring...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Study Timer</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStopSession('completed')}
                    disabled={loading}
                    className="py-3 rounded-xl bg-gradient-to-r from-cyber-success/20 to-cyber-success/40 border border-cyber-success/45 text-cyber-success font-semibold text-xs transition-all hover:brightness-110 flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Session</span>
                  </button>
                  <button
                    onClick={() => handleStopSession('interrupted')}
                    disabled={loading}
                    className="py-3 rounded-xl bg-gradient-to-r from-cyber-danger/20 to-cyber-danger/40 border border-cyber-danger/45 text-cyber-danger font-semibold text-xs transition-all hover:brightness-110 flex items-center justify-center space-x-1.5"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Timer</span>
                  </button>
                </div>
              )}

              {sessionActive && (
                <button
                  onClick={handleRestartSession}
                  className="w-full py-2.5 rounded-xl border border-cyber-border text-xs text-cyber-textMuted hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Session</span>
                </button>
              )}
            </div>
          </div>

          {/* System status description */}
          <div className="mt-4 p-4 bg-white/5 border border-cyber-border rounded-3xl flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-cyber-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-white">How it works 💡</span>
              <p className="text-[11px] text-cyber-textMuted leading-relaxed">
                We check if you leave this page, switch tabs, or use unauthorized objects (like mobile phones) while the study timer is active. Maintaining focus ensures high academic compliance!
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FocusCamera;
