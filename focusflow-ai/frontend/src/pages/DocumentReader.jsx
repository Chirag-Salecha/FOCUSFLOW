import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, CheckSquare, Sparkles, FileText, ChevronRight, Award, Upload } from 'lucide-react';

const DocumentReader = () => {
  const { apiFetch } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState('');
  
  const textContainerRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const canvasRefs = useRef([]);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Pre-loaded academic text documents for offline course reading
  const offlineBooks = {
    se: {
      title: "Software Engineering & Architecture Principles (SE)",
      content: `SOFTWARE ENGINEERING & ARCHITECTURE MANUAL
=====================================================

1. INTRODUCTION TO SOFTWARE DESIGN METHODOLOGY
Software engineering is a systematic, disciplined, and quantifiable approach to the development, operation, and maintenance of software. The core focus is on building high-quality software architectures that scale under heavy workloads while maintaining low maintenance complexities.

2. SOFTWARE PROCESS MODELS
- Waterfall Model: Linear, sequential process model. Highly predictable but inflexible to changes.
- Agile Scrum framework: Iterative, incremental cycle based on 2-4 week sprints, continuous customer feedback, and self-organizing cross-functional teams.
- DevOps & CI/CD: Automated integration pipelines compiling, testing, and deploying builds continuously.

3. ARCHITECTURAL DESIGN PATTERNS
- Model-View-Controller (MVC): Splits application concerns into Model (Database & schema models), View (User interface displays), and Controller (REST Endpoint routers). Used as the core architecture in FocusFlow AI.
- Microservices: Decouples functions into independent network-accessible micro-modules.
- Serverless: Code triggered purely by events on managed cloud layers (AWS Lambda, Google Cloud Functions).

4. DETAILED UML MODELING SPECIFICATIONS
Unified Modeling Language (UML) defines the standard blueprint representations for object-oriented designs:
- Use Case Diagrams: Map system boundaries, actor boundaries, and specific inclusion/extension arrows.
- Class Diagrams: Define attribute fields, parameters, operations methods, compositions (filled diamonds), aggregations (hollow diamonds), and multiplicity bounds (e.g. 1..*).
- Sequence Diagrams: Visual lifelines detailing asynchronous request routing, database pool query states, and return packages.

5. VERIFICATION & VALIDATION (V&V)
- Unit Testing: Isolation tests verifying single code modules (using frameworks like Jest or PyTest).
- Integration Testing: Verifies routing boundaries across service portals (Express APIs to MySQL DB).
- Usability reviews: Metrics testing screen comfort, input forms efficiency, and diagnostic score displays.

=====================================================
[CONGRATULATIONS! YOU HAVE SCROLLED TO THE BOTTOM AND COMPLETED SE PRINCIPLES MANUAL!]`
    },
    wt: {
      title: "Web Technologies & DOM APIs Manual (WT)",
      content: `WEB TECHNOLOGIES & DOM APIS REFERENCE MANUAL
=====================================================

1. CLIENT-SIDE WEB PORTALS AND RENDERING
Web browsers parse HTML layouts, CSS designs, and Javascript logic into a live Document Object Model (DOM). Modern single-page frameworks (React.js) render views dynamically using a virtual DOM representation, reducing layout shifts and repaint delays.

2. HTML5 NATIVE WEB APIS
Browser-native APIs allow web developers to build high-performance applications without binary packages:
- Geolocation API: captuers high-precision GPS coordinates (latitude, longitude, accuracy) via navigator.geolocation.getCurrentPosition().
- Page Visibility API: listens to visibilitychange events on the active viewport. Used to detect tab-switching during study timers.
- Web Audio API: synthesizes synth chimes directly using frequency oscillators (AudioContext), avoiding large audio asset weights.

3. CSS CUSTOM VARIABLES & RESPONSIVE LAYOUTS
CSS custom properties (--var) enable dynamic theme switching. By mapping colors, card opacity, and border styles to variables, changing the root element class (e.g., .light) updates the entire interface instantly.

4. CLIENT-SIDE DATA BUFFER STORAGE
- LocalStorage: Persistent key-value storage. Kept across window restarts.
- SessionStorage: Session-locked buffer cleared on window close.
- Cookies: HTTP-header sent state attributes (typically session tokens).

5. REST API ROUTING & COMMUNICATIONS
The client communicates with the server via HTTP request frameworks using fetch or Axios:
- GET: Request database resources.
- POST: Send raw payloads to trigger writes or actions.
- PUT/PATCH: Modify existing table resources.
- DELETE: Trigger remove queries.

=====================================================
[CONGRATULATIONS! YOU HAVE SCROLLED TO THE BOTTOM AND COMPLETED WT DOM APIS MANUAL!]`
    },
    db: {
      title: "MySQL Advanced Relational Queries & Database Design (DB)",
      content: `MYSQL DATABASE SCHEMAS & QUERIES DIRECTORY
=====================================================

1. RELATIONAL DATABASE DESIGN (RDBMS)
Relational databases store records inside tabular schemas, enforcing structures, unique keys, indexes, and constraints. MySQL implements standard storage engines (InnoDB) providing transactional ACID guarantees.

2. LOGICAL SCHEMA DEFINITIONS
FocusFlow AI database houses 5 related tables:
- users table: ID primary keys, emails (unique index), and hashed passwords.
- tasks table: user task logs linked to users via user_id foreign keys.
- attendance table: subject logs mapping presents and bunk counts.
- sessions table: camera timer log records capturing visibility tab switches.
- pomodoros table: study timer timestamps tracking completed Pomodoro runs.

3. REFERENTIAL INTEGRITY CONSTRAINTS
- Foreign Keys: Link records across tables, enforcing relational rules.
- ON DELETE CASCADE: Automatically removes dependent child records (such as a user's task checklist) when the parent record (the user profile) is deleted.

4. ADVANCED QUERY CONSTRAINTS
- JOIN operations: Consolidate records across tables on foreign key boundaries.
- GROUP BY & SUM: Aggregate daily study durations or tab switch counts.
- cursors & promises: Connection pool clients utilizing pool connections to run query statements asynchronously.

=====================================================
[CONGRATULATIONS! YOU HAVE SCROLLED TO THE BOTTOM AND COMPLETED MYSQL QUERIES MANUAL!]`
    }
  };

  const [activeDocKey, setActiveDocKey] = useState('se');
  const [docContent, setDocContent] = useState(offlineBooks.se.content);

  const fetchPendingTasks = async () => {
    try {
      const data = await apiFetch('/api/tasks');
      setTasks(data.filter(t => t.status === 'pending'));
    } catch (err) {
      console.error("Could not fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const handleDocChange = (e) => {
    const key = e.target.value;
    setActiveDocKey(key);
    setDocContent(offlineBooks[key].content);
    setIsPdfMode(false);
    setPdfUrl('');
    setProgress(0);
    setIsCompleted(false);
    setShowCelebration(false);
    setCompletedTaskTitle('');
    setNumPages(0);
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  };

  const handleScroll = (e) => {
    if (isCompleted) return;
    const target = e.target;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    const calculatedProgress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setProgress(calculatedProgress);

    if (calculatedProgress >= 98) {
      setIsCompleted(true);
      if (selectedTaskId) {
        handleCompleteTask(selectedTaskId);
      } else {
        setShowCelebration(true);
      }
    }
  };

  const handlePdfScroll = (e) => {
    if (isCompleted) return;
    const target = e.target;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    if (scrollHeight - clientHeight <= 0) return;
    
    const calculatedProgress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setProgress(calculatedProgress);

    if (calculatedProgress >= 98) {
      setIsCompleted(true);
      if (selectedTaskId) {
        handleCompleteTask(selectedTaskId);
      } else {
        setShowCelebration(true);
      }
    }
  };

  useEffect(() => {
    if (!pdfUrl) return;

    let active = true;
    const renderPdf = async () => {
      setPdfLoading(true);
      try {
        const pdfjs = window.pdfjsLib;
        if (!pdfjs) {
          throw new Error("PDF.js library not loaded yet.");
        }

        // Set worker
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        setNumPages(pdf.numPages);
        canvasRefs.current = [];

        // Render pages sequentially
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!active) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.3 }); // Sized for the screen width
          
          let canvas = canvasRefs.current[pageNum - 1];
          let retries = 0;
          while (!canvas && retries < 100) {
            await new Promise(r => setTimeout(r, 50));
            canvas = canvasRefs.current[pageNum - 1];
            retries++;
          }

          if (!canvas || !active) continue;
          
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.error("PDF rendering error:", err);
        setUploadError("Error loading/rendering PDF. Try another document or format.");
      } finally {
        if (active) {
          setPdfLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      active = false;
    };
  }, [pdfUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setProgress(0);
    setIsCompleted(false);
    setShowCelebration(false);
    setCompletedTaskTitle('');
    setNumPages(0);

    // If PDF, render natively in canvases via Blob URL
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const localUrl = URL.createObjectURL(file);
      setPdfUrl(localUrl);
      setIsPdfMode(true);
      setActiveDocKey('uploaded');
    } else {
      // For Word/TXT files, parse text on the backend
      setIsPdfMode(false);
      setPdfUrl('');
      setActiveDocKey('uploaded');
      setDocContent(`PARSING DOCUMENT CONTENT, PLEASE WAIT... ⏳\n\nFocusFlow is running offline text extraction on the backend for: ${file.name}`);
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      const token = localStorage.getItem('focusflow_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch('/api/tasks/parse-file', {
          method: 'POST',
          headers,
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to parse document');
        }

        const data = await response.json();
        
        const formattedContent = `DOCUMENT PREVIEW: ${file.name.toUpperCase()}
=====================================================
FILE NAME : ${file.name}
FILE SIZE : ${(file.size / 1024).toFixed(2)} KB
=====================================================

${data.text}

=====================================================
[CONGRATULATIONS! YOU HAVE SCROLLED TO THE BOTTOM AND COMPLETED READING ${file.name.toUpperCase()}!]`;

        setDocContent(formattedContent);
        setProgress(0);
        setIsCompleted(false);
        setShowCelebration(false);
        if (textContainerRef.current) {
          textContainerRef.current.scrollTop = 0;
        }
      } catch (err) {
        console.error(err);
        setUploadError(err.message || 'Could not parse document. Try another file format.');
        setDocContent(`ERROR PARSING DOCUMENT: ${file.name}\n\nReason: ${err.message || 'Unknown processing error.'}\n\nPlease try another plain text, PDF, or Word document.`);
      }
    }
  };

  const handleCompleteTask = async (taskId) => {
    const targetId = taskId || selectedTaskId;
    if (!targetId) return;

    // Find the task title before removing it from state
    const matchedTask = tasks.find(t => t.id === parseInt(targetId));
    const taskTitle = matchedTask ? matchedTask.title : 'Linked Task';

    try {
      await apiFetch(`/api/tasks/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });
      // Remove from select dropdown
      setCompletedTaskTitle(taskTitle);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== parseInt(targetId)));
      setSelectedTaskId('');
      setShowCelebration(true);
    } catch (err) {
      console.error(err);
      setError('Could not mark task as completed.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-cyber-text">
      
      {/* Module Header */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center">
              <BookOpen className="w-5 h-5 text-cyber-primary mr-2" />
              Document Completion Reader
            </h3>
            <p className="text-xs text-cyber-textMuted mt-1">Select a textbook or upload a text file. Reading the entire document automatically verifies task completion.</p>
          </div>
          
          <div className="flex items-center space-x-4 min-w-[200px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Reading Progress</span>
                <span className="text-cyber-primary">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-primary to-emerald-400 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-display font-black text-white">{progress}%</div>
          </div>
        </div>
      </div>

      {isPdfMode && pdfUrl ? (
        /* FULLSCREEN WORKSPACE FOR NATIVE PDF VIEW */
        <div className="fixed inset-0 z-50 bg-[#070b13] flex flex-col h-screen w-screen overflow-hidden animate-fade-in text-cyber-text font-sans">
          {/* Top Header Controls Bar */}
          <header className="h-16 border-b border-cyber-border bg-[#0a0f1d] px-6 flex items-center justify-between shadow-lg relative shrink-0">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent" />
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyber-secondary to-cyber-primary flex items-center justify-center neon-glow-cyan">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-cyber-primary uppercase tracking-wider">FocusFlow PDF Study Portal</span>
                <h3 className="font-display font-bold text-sm text-white truncate max-w-xl">
                  {activeDocKey === 'uploaded' ? 'Custom Uploaded PDF Document' : offlineBooks[activeDocKey].title}
                </h3>
              </div>
            </div>

            {/* Central progress visualizer */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-black/30 border border-cyber-border px-4 py-1.5 rounded-full">
                <span className="text-[10px] font-semibold text-cyber-textMuted uppercase tracking-wider">Study Progress:</span>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyber-primary to-emerald-400 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-white">{progress}%</span>
              </div>
              
              {selectedTaskId && (
                <div className="hidden lg:flex items-center space-x-2 bg-cyber-primary/10 border border-cyber-primary/20 px-3 py-1.5 rounded-xl">
                  <CheckSquare className="w-3.5 h-3.5 text-cyber-primary" />
                  <span className="text-[10px] text-cyber-text truncate max-w-[200px]">
                    Linked: <span className="font-bold text-white">{tasks.find(t => t.id === parseInt(selectedTaskId))?.title}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsPdfMode(false);
                  setPdfUrl('');
                  setProgress(0);
                  setIsCompleted(false);
                  setShowCelebration(false);
                }}
                className="px-4 py-2 bg-red-950/20 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 rounded-xl text-xs text-red-400 hover:text-white transition-all font-semibold shadow-inner"
              >
                Exit PDF Workspace
              </button>
            </div>
          </header>

          {/* Main 2-Column Split Workspace */}
          <main className="flex-1 flex overflow-hidden p-6 gap-6 bg-[#070b13]">
            {/* Left side: Full Height PDF Canvas List (With direct scroll tracking) */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#0e1322] border border-cyber-border/40 rounded-2xl overflow-hidden shadow-2xl relative">
              {pdfLoading && (
                <div className="absolute inset-0 bg-[#0e1322]/85 flex flex-col items-center justify-center z-20 space-y-4">
                  <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin neon-glow-cyan" />
                  <p className="text-xs text-cyber-textMuted font-mono">Rendering PDF page by page... ⏳</p>
                </div>
              )}
              
              <div 
                ref={pdfContainerRef}
                onScroll={handlePdfScroll}
                className="flex-1 overflow-y-auto bg-[#070b13] p-6 space-y-6 scrollbar-thin select-none relative z-10"
              >
                {numPages > 0 ? (
                  Array.from({ length: numPages }).map((_, idx) => (
                    <canvas 
                      key={idx} 
                      ref={el => canvasRefs.current[idx] = el}
                      className="mx-auto shadow-2xl bg-white rounded-lg border border-slate-800"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-cyber-textMuted font-mono py-12">
                    No pages loaded. Please select or upload a study PDF.
                  </div>
                )}
              </div>
            </section>

            {/* Right side: Study panel (25% width, min 340px) */}
            <aside className="w-80 lg:w-96 shrink-0 flex flex-col space-y-6 overflow-y-auto">
              
              {/* Task Status & Linker Info */}
              <div className="glass-panel p-5 rounded-2xl border border-cyber-border bg-[#0a0f1d] flex flex-col space-y-4 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-cyber-border pb-2 flex items-center">
                  <CheckSquare className="w-4 h-4 text-cyber-primary mr-1.5" />
                  Task Integration
                </h4>
                
                {completedTaskTitle && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-cyber-success text-[10px] rounded-xl text-center font-semibold animate-pulse">
                    ✅ Task "{completedTaskTitle}" completed successfully!
                  </div>
                )}

                {selectedTaskId ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-black/40 border border-cyber-border rounded-xl font-mono text-[10px] text-cyber-textMuted space-y-1">
                      <div className="text-white font-semibold text-xs mb-1 truncate">
                        {tasks.find(t => t.id === parseInt(selectedTaskId))?.title}
                      </div>
                      <div>Status: <span className="text-amber-500 font-bold">IN PROGRESS</span></div>
                      <div>Type: Academic Reading</div>
                    </div>
                    
                    {isCompleted ? (
                      <button
                        onClick={() => handleCompleteTask(selectedTaskId)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/40 border border-emerald-500/50 text-cyber-success hover:brightness-110 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20 neon-glow-green"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Complete Linked Task</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-cyber-primary/5 border border-cyber-primary/20 text-cyber-textMuted text-[10px] rounded-xl leading-normal text-center">
                        🔒 Mark task completed is locked. Complete the validation scroll checklist below to unlock.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-cyber-textMuted leading-relaxed">
                      Link this reading session to a pending homework task to mark it complete when you finish reading.
                    </p>
                    {tasks.length === 0 ? (
                      <div className="text-[10px] text-cyber-textMuted bg-white/5 p-3 rounded-xl">
                        No pending tasks found. Set up a task in your dashboard first!
                      </div>
                    ) : (
                      <select
                        value={selectedTaskId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedTaskId(val);
                          if (isCompleted && val) {
                            handleCompleteTask(val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-xs text-white outline-none transition-colors"
                      >
                        <option value="">-- Choose Task --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Scroll Compliance checklist (PDF scrolling drives progress) */}
              <div className="glass-panel p-5 rounded-2xl border border-cyber-border bg-[#0a0f1d] flex-1 flex flex-col shadow-md overflow-hidden min-h-[300px]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyber-primary flex items-center shrink-0 border-b border-cyber-border pb-2 mb-3">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Academic Compliance Checklist
                </h4>
                <p className="text-[10px] text-cyber-textMuted leading-relaxed mb-4 shrink-0">
                  Scroll the PDF document on the left to verify your reading session completion.
                </p>
                
                {/* Scrollable checklist box */}
                <div 
                  className="flex-1 bg-black/40 border border-cyber-border rounded-xl p-4 overflow-y-auto scrollbar-thin select-none"
                >
                  <div className="space-y-4 text-[10px] text-slate-300 font-mono">
                    <div className="flex items-start space-x-2">
                      <span className={`${isCompleted ? 'text-cyber-success' : 'text-cyber-primary'} font-bold shrink-0`}>
                        {isCompleted ? '[✓]' : '[ ]'}
                      </span>
                      <span>Review native PDF slides & details on the left.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-cyber-primary font-bold shrink-0">[100%]</span>
                      <span>Maintain proctor presence & focus limits.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-cyber-primary font-bold shrink-0">[DOM]</span>
                      <span>Verify completion of academic material.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-cyber-primary font-bold shrink-0">[SQL]</span>
                      <span>Commit reading progress check to local database.</span>
                    </div>
                    <div className="text-cyber-border font-bold py-2">-----------------------------------------------------</div>
                    <div className="leading-relaxed">
                      Scroll to the end of the PDF viewer to verify that you have completed reading the study material and that all focus duration rules have been met.
                    </div>
                    <div className="text-cyber-border font-bold">-----------------------------------------------------</div>
                    
                    {isCompleted ? (
                      <div className="text-cyber-success font-bold animate-pulse text-xs">
                        ✅ PDF SCROLL COMPLETE! TASK COMPLETED STATE UNLOCKED.
                      </div>
                    ) : (
                      <div className="text-amber-500 font-bold text-[10px] animate-pulse">
                        ⏳ SCROLL PDF TO COMPLY... ({progress}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </main>

          {/* Celebration overlay modal */}
          {showCelebration && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in z-50">
              <div className="glass-panel rounded-3xl p-8 max-w-sm text-center border-cyber-primary/40 space-y-5">
                <div className="w-16 h-16 bg-cyber-primary/20 border border-cyber-primary/40 rounded-full flex items-center justify-center mx-auto neon-glow-cyan animate-pulse">
                  <Award className="w-8 h-8 text-cyber-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyber-primary mr-1" />
                    Study Complete!
                  </h3>
                  <p className="text-xs text-cyber-textMuted mt-1">Excellent! You have successfully scrolled and read the entire study document.</p>
                </div>

                {completedTaskTitle ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-cyber-success bg-cyber-success/15 border border-cyber-success/30 px-3 py-2.5 rounded-xl font-semibold">
                      ✅ Linked task "{completedTaskTitle}" has been automatically marked as Completed!
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-cyber-accent bg-cyber-accent/10 border border-cyber-accent/20 px-3 py-2 rounded-xl">To integrate task completion, link a task in the right panel first!</p>
                )}

                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setCompletedTaskTitle('');
                  }}
                  className="text-xs text-cyber-textMuted hover:text-white underline font-medium pt-2 block mx-auto"
                >
                  Close & Keep Reading
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NORMAL SPLIT VIEW (For textbooks/uploads) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Selection Card */}
            <div className="glass-panel rounded-3xl p-5 space-y-4">
              <h4 className="font-display font-bold text-sm text-white">Select Study Material</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Preset Textbooks</label>
                  <select
                    value={activeDocKey === 'uploaded' ? 'se' : activeDocKey}
                    onChange={handleDocChange}
                    className="w-full px-3 py-2 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-xs text-white outline-none transition-colors"
                  >
                    <option value="se">Software Engineering Manual</option>
                    <option value="wt">Web Technologies DOM Manual</option>
                    <option value="db">MySQL Relational Query Guide</option>
                  </select>
                </div>

                <div className="border-t border-cyber-border pt-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-textMuted mb-1.5">Upload Study Document</label>
                  <div className="relative border border-dashed border-cyber-border rounded-xl p-3 text-center hover:bg-white/5 transition-colors cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-cyber-primary mx-auto mb-1 opacity-70" />
                    <p className="text-[10px] text-cyber-text">Drag or click to upload any file</p>
                  </div>
                  {uploadError && <p className="text-[10px] text-cyber-danger mt-1">{uploadError}</p>}
                </div>
              </div>
            </div>

            {/* Link Task Card */}
            <div className="glass-panel rounded-3xl p-5 space-y-4">
              <h4 className="font-display font-bold text-sm text-white">Link study to a Task</h4>
              <p className="text-[10px] text-cyber-textMuted">Link this reading session to one of your active homework tasks to mark it complete when you finish reading.</p>
              
              {loading ? (
                <div className="text-center py-2 text-xs text-cyber-textMuted">Loading active tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-xs text-cyber-textMuted bg-white/5 p-3 rounded-xl">No active tasks found in database. Create a task in "My Tasks" first!</div>
              ) : (
                <div className="space-y-3">
                  {completedTaskTitle && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-cyber-success text-[10px] rounded-xl text-center font-semibold mb-2">
                      ✅ Task "{completedTaskTitle}" completed!
                    </div>
                  )}
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTaskId(val);
                      if (isCompleted && val) {
                        handleCompleteTask(val);
                      }
                    }}
                    className="w-full px-3 py-2 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-xs text-white outline-none transition-colors"
                  >
                    <option value="">-- Choose Task --</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right Reader view */}
          <div className="lg:col-span-3">
            <div className="glass-panel rounded-3xl p-6 flex flex-col h-[520px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-cyber-border mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyber-primary" />
                  <h3 className="font-display font-bold text-sm text-white truncate max-w-lg">
                    {activeDocKey === 'uploaded' ? 'Custom Uploaded Document' : offlineBooks[activeDocKey].title}
                  </h3>
                </div>
                <div className="text-[10px] bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {activeDocKey === 'uploaded' ? 'User doc' : 'Preset'}
                </div>
              </div>

              {/* Document body text */}
              <div 
                ref={textContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-mono leading-relaxed text-slate-300 scrollbar-thin select-text whitespace-pre-wrap select-none"
              >
                {docContent}
              </div>

              {/* Scroll Indicator */}
              {!isCompleted && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 border border-cyber-border backdrop-blur-md px-4 py-1.5 rounded-full flex items-center space-x-2 text-[10px] font-bold text-cyber-primary uppercase tracking-widest animate-bounce">
                  <span>Scroll Down to Read</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </div>
              )}

              {/* Celebration overlay modal */}
              {showCelebration && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                  <div className="glass-panel rounded-3xl p-8 max-w-sm text-center border-cyber-primary/40 space-y-5">
                    <div className="w-16 h-16 bg-cyber-primary/20 border border-cyber-primary/40 rounded-full flex items-center justify-center mx-auto neon-glow-cyan animate-pulse">
                      <Award className="w-8 h-8 text-cyber-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-cyber-primary mr-1" />
                        Document Completed!
                      </h3>
                      <p className="text-xs text-cyber-textMuted mt-1">Excellent! You have successfully scrolled and read the entire study document.</p>
                    </div>

                    {completedTaskTitle ? (
                      <div className="space-y-3 pt-2">
                        <p className="text-xs text-cyber-success bg-cyber-success/15 border border-cyber-success/30 px-3 py-2.5 rounded-xl font-semibold">
                          ✅ Linked task "{completedTaskTitle}" has been automatically marked as Completed!
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-cyber-accent bg-cyber-accent/10 border border-cyber-accent/20 px-3 py-2 rounded-xl">To integrate task completion, link a task in the left control panel first!</p>
                    )}

                    <button
                      onClick={() => {
                        setShowCelebration(false);
                        setCompletedTaskTitle('');
                      }}
                      className="text-xs text-cyber-textMuted hover:text-white underline font-medium pt-2 block mx-auto"
                    >
                      Close & Keep Reading
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DocumentReader;
