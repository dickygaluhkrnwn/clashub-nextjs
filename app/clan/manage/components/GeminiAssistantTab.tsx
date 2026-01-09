'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';
import {
  PaperPlaneIcon,
  RefreshCwIcon,
  UserIcon,
  IconSparkle,
  XIcon,
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

interface GeminiAssistantModalProps {
  clanId: string;
  clanName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// [PERBAIKAN] Upgrade Parser untuk mendukung Tabel Markdown
const SimpleMarkdownParser: React.FC<{ text: string }> = ({ text }) => {
  const processInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-coc-gold font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>');
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 1. Deteksi Tabel
    if (line.startsWith('|') && line.endsWith('|')) {
       if (i + 1 < lines.length && lines[i+1].trim().startsWith('|') && lines[i+1].includes('---')) {
          const tableHeader = line.slice(1, -1).split('|').map(c => c.trim());
          const tableRows: string[][] = [];
          
          i += 2; // Lewati header dan separator

          // Ambil baris-baris data tabel
          while (i < lines.length && lines[i].trim().startsWith('|')) {
             const row = lines[i].trim().slice(1, -1).split('|').map(c => c.trim());
             tableRows.push(row);
             i++;
          }

          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-[#0a0a0b] shadow-lg ring-1 ring-white/5">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-white/5 font-clash text-coc-gold text-xs uppercase tracking-wider">
                        <tr>
                            {tableHeader.map((h, idx) => (
                                <th key={idx} className="px-4 py-3 border-b border-white/10 whitespace-nowrap" dangerouslySetInnerHTML={{__html: processInline(h)}} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300 font-sans">
                        {tableRows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02] hover:bg-white/5 transition-colors'}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2.5 border-r border-white/5 last:border-r-0" dangerouslySetInnerHTML={{__html: processInline(cell)}} />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          );
          continue; 
       }
    }

    // 2. Deteksi List
    if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <li
          key={`list-${i}`}
          className="ml-4 list-disc marker:text-coc-gold pl-2 mb-1 text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processInline(line.substring(2)) }}
        />
      );
      i++;
      continue;
    }
    
    // Ordered List
    if (/^\d+\.\s/.test(line)) {
        elements.push(
            <li
                key={`ord-list-${i}`}
                className="ml-4 list-decimal marker:text-coc-gold/80 pl-2 mb-1 text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processInline(line.replace(/^\d+\.\s/, '')) }}
            />
        );
        i++;
        continue;
    }

    // 3. Paragraf Biasa / Heading
    if (line.startsWith('### ')) {
       elements.push(<h4 key={`h3-${i}`} className="text-lg font-clash text-coc-gold mt-6 mb-2 tracking-wide" dangerouslySetInnerHTML={{__html: processInline(line.substring(4))}} />);
    } else if (line.startsWith('## ')) {
       elements.push(<h3 key={`h2-${i}`} className="text-xl font-clash text-white mt-8 mb-3 tracking-wide border-b border-white/10 pb-2" dangerouslySetInnerHTML={{__html: processInline(line.substring(3))}} />);
    } else if (line !== '') {
       elements.push(
         <p
           key={`p-${i}`}
           className="mb-3 leading-relaxed text-gray-300 font-sans text-sm md:text-base"
           dangerouslySetInnerHTML={{ __html: processInline(line) }}
         />
       );
    } else {
        // Empty line spacer
        elements.push(<div key={`spacer-${i}`} className="h-2"></div>);
    }
    
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};

export const GeminiAssistantTab: React.FC<GeminiAssistantModalProps> = ({
  clanId,
  clanName,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPrompt.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = { role: 'user', parts: currentPrompt };
    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);
    const promptToSend = currentPrompt;
    setCurrentPrompt('');

    try {
      const response = await fetch(
        `/api/clan/manage/${clanId}/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: promptToSend,
            history: chatHistory,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.clanAI.errorFetch);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = { role: 'model', parts: data.response };

      setChatHistory([...newChatHistory, modelMessage]);
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      setError(err.message || t.clanAI.errorGeneric);
      setChatHistory([
        ...newChatHistory,
        {
          role: 'model',
          parts: `${t.clanAI.errorPrefix}${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-5xl bg-[#0a0a0b] md:border border-white/10 md:rounded-3xl shadow-2xl flex flex-col h-[100dvh] md:h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambience */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-coc-gold/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0b]/90 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-coc-gold to-orange-600 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] border border-white/10">
              <IconSparkle className="h-6 w-6 text-white animate-pulse-slow" />
            </div>
            <div>
              <h3 className="text-xl font-clash text-white tracking-wide">
                {clanName ? `Clan AI Assistant` : t.clanAI.title}
              </h3>
              <p className="text-[10px] text-coc-gold/80 font-mono uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coc-green opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-coc-green"></span>
                 </span>
                 Online • Gemini 1.5 Pro
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white rounded-full h-10 w-10 p-0 hover:bg-white/5 transition-all hover:rotate-90 duration-300"
            onClick={onClose}
          >
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden bg-black/20">
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto custom-scrollbar scroll-smooth"
          >
            {/* Welcome Message & Suggestions - FIXED FOR MOBILE */}
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-full text-center space-y-8 p-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative group shrink-0">
                      <div className="absolute inset-0 bg-coc-gold/20 blur-3xl rounded-full animate-pulse group-hover:bg-coc-gold/30 transition-all duration-700"></div>
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center border border-white/10 shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                        <IconSparkle className="w-10 h-10 md:w-12 md:h-12 text-coc-gold" />
                      </div>
                </div>
                
                <div className="max-w-lg space-y-3 shrink-0">
                  <h4 className="text-2xl md:text-4xl font-clash text-white tracking-wide">How can I help, Chief?</h4>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed font-sans max-w-md mx-auto">
                    {t.clanAI.welcomeMessage}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                  {[
                      { icon: "⚔️", text: "Analyze War Log", prompt: "Analyze our last war performance and suggest improvements." },
                      { icon: "🏰", text: "Attack Strategies", prompt: "What is the best attack strategy for TH13 currently?" },
                      { icon: "📈", text: "Promotion Advice", prompt: "Based on recent activity, who should be promoted?" },
                      { icon: "📢", text: "Recruitment Post", prompt: "Write a catchy recruitment message for our clan (Level 10+, Active War)." }
                  ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPrompt(item.prompt)}
                        className="flex flex-col items-start p-4 rounded-xl bg-[#15171e]/60 border border-white/5 hover:border-coc-gold/30 hover:bg-[#1f222b] transition-all duration-200 text-left group hover:-translate-y-1 hover:shadow-lg"
                      >
                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                        <span className="text-sm font-bold text-gray-200 group-hover:text-coc-gold transition-colors font-clash tracking-wide">{item.text}</span>
                        <span className="text-xs text-gray-500 mt-1 line-clamp-2">{item.prompt}</span>
                      </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`flex max-w-[90%] md:max-w-[80%] rounded-2xl p-5 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-coc-gold text-black rounded-tr-sm'
                      : 'bg-[#15171e] text-gray-100 border border-white/10 rounded-tl-sm'
                  }`}
                >
                    {msg.role === 'model' && (
                        <div className="mr-4 flex-shrink-0 mt-1">
                            <div className="p-1.5 bg-gradient-to-br from-coc-gold to-orange-600 rounded-lg shadow-inner">
                                <IconSparkle className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    )}
                    
                    <div className={msg.role === 'user' ? 'font-medium' : ''}>
                        {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.parts}</p>
                        ) : (
                            <SimpleMarkdownParser text={msg.parts} />
                        )}
                    </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
               <div className="flex justify-start w-full animate-pulse">
                  <div className="flex items-center gap-3 bg-[#15171e] px-5 py-4 rounded-2xl rounded-tl-sm border border-white/5">
                      <div className="p-1.5 bg-white/5 rounded-lg">
                        <IconSparkle className="h-4 w-4 text-coc-gold/50" />
                      </div>
                      <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-coc-gold/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-coc-gold/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-coc-gold/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                  </div>
               </div>
            )}
            
            {/* Error Message */}
            {error && (
                <div className="flex justify-center w-full animate-in fade-in">
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                        <XIcon className="h-4 w-4" />
                        {error}
                    </div>
                </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-[#0a0a0b] border-t border-white/10 z-20 flex-shrink-0">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-3 max-w-4xl mx-auto"
            >
              <div className="relative flex-grow group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-coc-gold/20 to-orange-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <input
                    type="text"
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    placeholder={t.clanAI.inputPlaceholder}
                    disabled={isLoading}
                    className="relative w-full bg-[#15171e] text-white placeholder-gray-500 border border-white/10 rounded-xl px-5 py-4 pr-14 focus:outline-none focus:border-coc-gold/50 focus:bg-[#1a1d26] transition-all shadow-inner font-sans text-base"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 rounded-lg border border-white/5">
                     <IconSparkle className="h-4 w-4 text-coc-gold/50" />
                  </div>
              </div>
              
              <Button
                type="submit"
                disabled={!currentPrompt.trim() || isLoading}
                className={`h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shrink-0 ${
                    !currentPrompt.trim() || isLoading 
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                    : 'bg-coc-gold hover:bg-coc-gold-dark text-black hover:scale-105 hover:shadow-coc-gold/20'
                }`}
              >
                {isLoading ? (
                  <RefreshCwIcon className="h-6 w-6 animate-spin" />
                ) : (
                  <PaperPlaneIcon className="h-6 w-6" />
                )}
              </Button>
            </form>
            <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
                AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GeminiAssistantTab;