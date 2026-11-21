import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquareCode, X, Send, BrainCircuit, Sparkles } from 'lucide-react';

const ChatDrawer = () => {
  const { apiFetch, user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with a friendly welcome message when the drawer opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: `Hey ${user?.name ? user.name.split(' ')[0] : 'Rohan'}! ⚡ I'm your AI Study Buddy. I've synced directly with your local database for this semester.

Feel free to ask me anything about your pending tasks, attendance safety, study hours, or how to get more work done!`,
          time: new Date()
        }
      ]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!token) return null; // Only show if logged in

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });

      // Add bot message
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.reply,
        time: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '⚠️ Companion link disrupted. Please verify that your backend API and database connection are active.',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (text) => {
    handleSendMessage(text);
  };

  // Helper to parse formatting (handles newlines and basic markdown bold **text**)
  const formatText = (text) => {
    return text.split('\n').map((line, lineIdx) => {
      // Parse bold syntax **something**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const parsedLine = parts.map((part, partIdx) => {
        // Odd index matches the captured group (bold text)
        if (partIdx % 2 === 1) {
          return <strong key={partIdx} className="text-cyber-primary font-bold">{part}</strong>;
        }
        return part;
      });
      return (
        <span key={lineIdx} className="block mt-1">
          {parsedLine}
        </span>
      );
    });
  };

  const quickPrompts = [
    { label: 'Check Attendance Status', query: 'Show my course attendance statistics' },
    { label: 'What to study next?', query: 'What tasks should I do next?' },
    { label: 'How to boost study level?', query: 'Give me ideas to boost my productivity score' }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-cyber-secondary to-cyber-primary hover:scale-110 transition-transform duration-300 flex items-center justify-center neon-glow-cyan shadow-glass group"
        title="Open AI Companion"
      >
        <BrainCircuit className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyber-accent animate-ping" />
      </button>

      {/* Sliding Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-black/60 border-l border-cyber-border shadow-2xl flex flex-col backdrop-blur-glass animate-slide-in">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-cyber-border flex items-center justify-between bg-black/30">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center text-cyber-primary">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white">FocusFlow Study Buddy</h3>
                <span className="text-[9px] text-cyber-success font-semibold flex items-center uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Connected to local DB
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg border border-cyber-border hover:border-white text-cyber-textMuted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isBot 
                      ? 'bg-white/5 border border-cyber-border text-cyber-text' 
                      : 'bg-gradient-to-r from-cyber-secondary/20 to-cyber-secondary/40 border border-cyber-secondary/40 text-white'
                  }`}>
                    {isBot ? formatText(msg.text) : msg.text}
                    <span className="block text-[8px] text-cyber-textMuted text-right mt-1.5">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Thinking status loader */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-cyber-border rounded-2xl p-4 flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-[bounce_1.4s_infinite_0s]" />
                    <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-[bounce_1.4s_infinite_0.2s]" />
                    <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-[bounce_1.4s_infinite_0.4s]" />
                  </div>
                  <span className="text-[10px] text-cyber-textMuted uppercase font-semibold">AI compiling metrics...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Templates */}
          {messages.length > 0 && !loading && (
            <div className="px-5 py-3 border-t border-cyber-border-rgb/40 bg-black/10 space-y-1.5">
              <span className="text-[8px] font-bold text-cyber-textMuted uppercase tracking-wider block">Recommended Queries:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuery(p.query)}
                    className="px-2.5 py-1.5 rounded-lg border border-cyber-border-rgb/50 hover:border-cyber-primary hover:bg-cyber-primary/5 text-[10px] text-cyber-textMuted hover:text-white transition-all text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Form */}
          <div className="p-4 border-t border-cyber-border bg-black/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tasks, attendance..."
                className="flex-1 px-4 py-2.5 bg-black/40 border border-cyber-border rounded-xl focus:border-cyber-primary text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-cyber-secondary to-cyber-primary text-white hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

export default ChatDrawer;
