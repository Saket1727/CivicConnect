import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, AlertTriangle, ShieldCheck, Sparkles, User, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function AiChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **CivicConnect Health Advisor**. 

I can guide you on:
- 🩺 Understanding common symptoms & warning signs
- 🏥 Finding nearest emergency trauma centers
- 🩸 Blood bank & medicine availability guidance
- 📜 Government health schemes (PM-JAY, CGHS)

How can I help you today?`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'What should I do for severe chest pain?',
    'High fever for 3 days and body chills',
    'How do I find B+ blood in Delhi?',
    'What is Ayushman Bharat eligibility?',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        prompt: text,
      });

      if (res.data?.success) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: res.data.data.response,
            priority: res.data.data.priority,
            disclaimer: res.data.data.disclaimer,
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I apologize, but I am unable to connect to the knowledge engine right now. If you are experiencing an emergency, please immediately call **108** or **112**.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-gradient-to-tr from-health-800 to-health-600 hover:from-health-900 hover:to-health-700 text-white font-semibold px-4 py-3 rounded-full shadow-xl shadow-health-600/30 hover:scale-105 transition-all text-xs sm:text-sm"
        >
          <Bot className="w-5 h-5 text-sky-200" />
          <span className="hidden sm:inline">AI Health Advisor</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-health-900 via-health-800 to-health-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-200">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CivicConnect Health Advisor</h3>
                <p className="text-[10px] text-sky-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Evidence-Based Clinical Guidance
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-health-600 text-white flex-shrink-0 flex items-center justify-center text-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-health-700 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-200 whitespace-pre-wrap'
                  }`}
                >
                  {m.content}

                  {m.disclaimer && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                      {m.disclaimer}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-300 text-slate-700 flex-shrink-0 flex items-center justify-center text-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs pl-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-health-600" />
                <span>Health Advisor is analyzing your query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-health-50 hover:text-health-700 text-slate-600 border border-slate-200 transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, hospitals, blood..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-health-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-health-700 hover:bg-health-800 disabled:opacity-50 text-white p-2 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Notice */}
          <div className="px-3 py-1.5 bg-slate-100 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200">
            <span>⚠️ Informational guide only. Not a medical prescription.</span>
            <span className="font-bold text-red-600">SOS: 108</span>
          </div>

        </div>
      )}
    </>
  );
}
