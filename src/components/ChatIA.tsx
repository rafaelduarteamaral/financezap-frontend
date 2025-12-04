import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatIAProps {
  isDark: boolean;
}

export function ChatIA({ isDark }: ChatIAProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente financeiro. Como posso ajudá-lo hoje? Posso responder perguntas sobre seus gastos, sugerir formas de economizar, ou ajudar a criar metas financeiras.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.enviarMensagemChat(userMessage);
      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.resposta }]);
      } else {
        throw new Error(response.error || 'Erro ao processar mensagem');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${error.message}. Por favor, tente novamente.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`rounded-xl shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className={`p-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <AnimatedIcon>
            <FaRobot className={isDark ? 'text-blue-400' : 'text-blue-600'} size={20} />
          </AnimatedIcon>
          Assistente Financeiro IA
        </h3>
      </div>

      <div className="h-96 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
                  <FaRobot className="text-white" size={14} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`}>
                  <FaUser className="text-white" size={14} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <FaRobot className="text-white" size={14} />
            </div>
            <div className={`rounded-lg px-4 py-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className="flex gap-1">
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'} animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'} animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'} animate-bounce`} style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-5 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre finanças..."
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              isDark
                ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
            } disabled:opacity-50`}
          />
          <motion.button
            onClick={handleSend}
            disabled={!inputMessage.trim() || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            <FaPaperPlane size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

