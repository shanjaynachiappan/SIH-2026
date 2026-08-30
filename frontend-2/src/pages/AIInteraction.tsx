import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertTriangle, Zap, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { aiAssistantService } from '../services/aiAssistantService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: 'Current Mine Status', icon: Info, query: 'What is the current mine status?' },
  { label: 'Highest Risk Sensor', icon: AlertTriangle, query: 'Which sensor has the highest risk?' },
  { label: 'Explain Risk Zones', icon: Info, query: 'Explain the critical risk zones.' },
  { label: 'Latest Alerts', icon: AlertTriangle, query: 'What are the latest alerts?' },
  { label: 'Deformation Summary', icon: ActivityIcon, query: 'Give me a deformation summary.' },
  { label: 'Sensor Health', icon: Zap, query: 'Which sensors are offline or low battery?' },
];

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// Simple Markdown Formatter for rendering cards and bold text safely
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Bold text mapping
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Simple newlines to breaks
  formatted = formatted.replace(/\n/g, '<br/>');

  return (
    <div 
      className="text-sm leading-relaxed" 
      dangerouslySetInnerHTML={{ __html: formatted }} 
    />
  );
};

export const AIInteraction: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am MineGuard AI. I can help you analyze subsidence patterns, predict risks, or explain sensor anomalies. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check connection on mount
    aiAssistantService.checkConnection().then(setIsConnected);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (query: string = input) => {
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await aiAssistantService.askMineGuardAssistant(query);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error communicating with the model.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">MineGuard AI Assistant</h2>
            <p className="text-xs text-slate-500 font-medium">Local Qwen3 Analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Local Qwen3 • Connected
            </span>
          ) : (
            <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
              Fallback Mode (Ollama Offline)
            </span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx("flex items-start space-x-4", msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "")}>
            <div className={clsx(
              "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border",
              msg.role === 'user' ? "bg-slate-200 border-slate-300" : "bg-blue-100 border-blue-200"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-slate-600" /> : <Bot className="w-5 h-5 text-blue-600" />}
            </div>
            <div className={clsx(
              "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
            )}>
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <FormattedText text={msg.content} />
              )}
              <span className={clsx(
                "text-[10px] font-medium block mt-2",
                msg.role === 'user' ? "text-blue-200 text-right" : "text-slate-400"
              )}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border bg-blue-100 border-blue-200">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500">Analyzing context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/80 flex flex-wrap gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(prompt.query)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{prompt.label}</span>
            </button>
          )
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask MineGuard AI about sensors, trends, or risk analysis..."
            className="flex-1 bg-slate-100 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-sm flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
