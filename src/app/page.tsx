"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  {
    label: "⏱️ Tempo médio de estudo",
    prompt: "Qual o tempo médio de estudo para passar em um concurso de nível médio vs elite?"
  },
  {
    label: "🔄 Ciclo de estudos",
    prompt: "Como funciona e como posso montar um ciclo de estudos eficiente?"
  },
  {
    label: "💼 Carreiras públicas",
    prompt: "Quais as principais carreiras de concursos públicos e suas remunerações?"
  },
  {
    label: "🧠 Técnicas de Revisão",
    prompt: "Como funciona o método de repetição espaçada e o uso de flashcards?"
  }
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, setMessages } = useChat({
    api: '/api/chat',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  // Helper para extrair o texto limpo de uma UIMessage
  const getMessageText = (msg: any): string => {
    if (!msg) return '';
    if (typeof msg.content === 'string' && msg.content) {
      return msg.content;
    }
    if (Array.isArray(msg.parts)) {
      return msg.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return '';
  };

  // Copia o texto para a área de transferência
  const handleCopyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Restaura o histórico de mensagens do localStorage após montagem
  useEffect(() => {
    const saved = localStorage.getItem('rag_concurseiro_chat_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao restaurar histórico de mensagens:', e);
      }
    }
  }, [setMessages]);

  // Salva no localStorage sempre que as mensagens mudam
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('rag_concurseiro_chat_messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('rag_concurseiro_chat_messages');
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Background Decorativo com Gradações Sombreadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-950/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-between p-2 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-full h-full text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Concurseiro IA
            </h1>
            <p className="text-xs text-slate-400">RAG MVP de Concursos Públicos</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 text-xs font-medium text-slate-300 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Novo Chat</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">Banco de Dados Ativo</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6 overflow-hidden relative z-10">
        
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.83l1.207-4.52a8.933 8.933 0 0 1-1.147-3.37C4.4 7.443 8.43 3.75 13.4 3.75s9 3.693 9 8.25Z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Como posso acelerar sua aprovação?
              </h2>
              <p className="text-slate-400 max-w-md mb-8 text-sm md:text-base">
                Tire dúvidas sobre planos de estudos, carreiras fiscais, administrativas ou policiais, técnicas de revisão e mais.
              </p>

              {/* Sugestões de Perguntas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(sug.prompt)}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 text-left transition-all duration-200 group active:scale-[0.98]"
                  >
                    <p className="font-semibold text-slate-200 text-sm mb-1 group-hover:text-indigo-400 transition-colors">
                      {sug.label}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {sug.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-900/80 border border-slate-850 text-slate-200 rounded-bl-none prose prose-invert max-w-none text-sm md:text-base'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/50">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">C</span>
                          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Concurseiro IA</span>
                        </div>
                        <button
                          onClick={() => handleCopyToClipboard(getMessageText(message), message.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copiar resposta"
                        >
                          {copiedId === message.id ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                              <span>Copiado!</span>
                            </span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.309V19.5L6.75 7.309Zm12.452 2.378a2.25 2.25 0 0 1-.413 2.133l-1.014 1.014a2.25 2.25 0 0 1-1.59.659h-5.83a2.25 2.25 0 0 1-2.25-2.25v-5.83a2.25 2.25 0 0 1 2.25-2.25h5.83a2.25 2.25 0 0 1 2.25 2.25v5.83c0 .597-.237 1.17-.659 1.59l-1.014 1.014a2.25 2.25 0 0 1-2.133.413Z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      <div className="markdown-content">
                        <ReactMarkdown>
                          {message.parts ? (
                            message.parts
                              .filter((part: any) => part.type === 'text')
                              .map((part: any) => part.text)
                              .join('')
                          ) : (
                            message.content || ''
                          )}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 border border-slate-850 text-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative mt-auto">
          <div className="flex items-center rounded-2xl bg-slate-900/60 border border-slate-800/90 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 p-2 shadow-2xl transition-all duration-200 backdrop-blur-sm">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Digite sua dúvida sobre estudos ou concursos..."
              rows={1}
              className="flex-1 max-h-32 bg-transparent border-0 outline-none text-slate-100 text-sm px-3 py-2 resize-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:scale-100 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Desenvolvido como MVP de RAG Concurseiro. Respostas geradas por IA com base na documentação local.
          </p>
        </form>
      </main>
    </div>
  );
}
