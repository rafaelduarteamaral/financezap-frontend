import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaRobot, FaUser, FaTimes, FaCommentDots } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatIAPopupProps {
  isDark: boolean;
}

export function ChatIAPopup({ isDark }: ChatIAPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente do Zela!\n\nPosso ajudá-lo com:\n\n💰 **Finanças:**\n- Analisar seus gastos e receitas\n- Sugerir formas de economizar\n- Ajudar a criar metas financeiras\n- Explicar conceitos financeiros\n\n📱 **Sobre a Plataforma:**\n- Como usar as funcionalidades\n- Como registrar transações\n- Como usar agendamentos\n- Dúvidas sobre o portal\n\nComo posso ajudá-lo hoje? 😊'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Foca no input quando abre
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [messages, isOpen]);

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
    <>
      {/* Botão Flutuante */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isDark
            ? 'bg-primary-500 hover:bg-primary-600 text-white'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Abrir assistente financeiro"
      >
        <AnimatedIcon>
          <FaCommentDots size={24} />
        </AnimatedIcon>
      </motion.button>

      {/* Overlay (apenas no mobile) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />

            {/* Popup */}
            <motion.div
              initial={{ 
                x: '100%',
                opacity: 0
              }}
              animate={{ 
                x: 0,
                opacity: 1
              }}
              exit={{ 
                x: '100%',
                opacity: 0
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed z-50 ${
                // Mobile: tela cheia
                'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:rounded-xl'
              } ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-2xl border flex flex-col`}
            >
              {/* Header */}
              <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <AnimatedIcon>
                    <FaRobot className={isDark ? 'text-blue-400' : 'text-blue-600'} size={20} />
                  </AnimatedIcon>
                  Assistente Financeiro IA
                </h3>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Fechar"
                >
                  <FaTimes size={18} />
                </motion.button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                        {message.role === 'assistant' ? (
                          <div className="text-sm">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="ml-2">{children}</li>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                                code: ({ children }) => (
                                  <code className={`px-1 py-0.5 rounded text-xs ${
                                    isDark ? 'bg-slate-600 text-blue-300' : 'bg-slate-200 text-blue-700'
                                  }`}>
                                    {children}
                                  </code>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className={`border-l-4 pl-3 my-2 ${
                                    isDark ? 'border-slate-500 text-slate-300' : 'border-slate-400 text-slate-700'
                                  }`}>
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
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

              {/* Input */}
              <div className={`p-5 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

