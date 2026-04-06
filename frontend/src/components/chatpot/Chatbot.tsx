import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2,
  Maximize2,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { api } from '../../lib/api';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
};

type SuggestedQuestion = {
  text: string;
  icon: string;
};

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { text: "How to post a listing?", icon: "📋" },
  { text: "What are subscription plans?", icon: "💰" },
  { text: "Image requirements?", icon: "📸" },
  { text: "How long for approval?", icon: "⏰" },
  { text: "Contact support", icon: "📞" },
  { text: "Pricing and fees", icon: "💵" },
];

export default function Chatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load session ID from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat_session_id');
    if (stored) {
      setSessionId(stored);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to UI
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat/', 
        { message },
        { headers: sessionId ? { 'X-Session-ID': sessionId } : {} }
      );

      // Save session ID
      if (response.data.session_id && !sessionId) {
        setSessionId(response.data.session_id);
        localStorage.setItem('chat_session_id', response.data.session_id);
      }

      // Add assistant response
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chatbot.error_message') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await api.delete('/chatbot/chat/clear/', {
          headers: { 'X-Session-ID': sessionId }
        });
      } catch (error) {
        console.error('Clear chat error:', error);
      }
    }
    setMessages([]);
    localStorage.removeItem('chat_session_id');
    setSessionId(null);
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: t('chatbot.welcome_message')
    }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  // Welcome message on first open
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('chatbot.welcome_message')
      }]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-14 w-72' : 'h-[500px] w-[400px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-white" />
          <span className="font-semibold text-white">Market Hub Assistant</span>
          <span className="rounded-full bg-green-400 px-1.5 py-0.5 text-[10px] font-medium text-green-900">
            Online
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-white/80 hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-white/80 hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot size={48} className="text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  {t('chatbot.welcome_message')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.role === 'assistant' && (
                          <Bot size={16} className="mt-0.5 text-indigo-500" />
                        )}
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        {msg.role === 'user' && (
                          <User size={16} className="mt-0.5 text-white/70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.1s' }}></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length < 3 && (
            <div className="border-t border-slate-100 bg-white p-3">
              <p className="mb-2 text-xs text-slate-500">{t('chatbot.suggested')}</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q.text)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-200"
                  >
                    <span className="mr-1">{q.icon}</span>
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="mx-3 mb-2 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
            >
              <Trash2 size={12} />
              {t('chatbot.clear_chat')}
            </button>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('chatbot.input_placeholder')}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}