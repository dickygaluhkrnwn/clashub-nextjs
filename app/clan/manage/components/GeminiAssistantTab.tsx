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
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>');
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 1. Deteksi Tabel
    // Ciri: Baris dimulai dan diakhiri '|', dan baris berikutnya adalah separator '| --- |'
    if (line.startsWith('|') && line.endsWith('|')) {
       // Cek baris berikutnya untuk memastikan ini tabel (separator)
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
            <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-white/10 bg-black/20">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-white/5 font-clash text-coc-gold text-xs uppercase tracking-wider">
                        <tr>
                            {tableHeader.map((h, idx) => (
                                <th key={idx} className="px-4 py-2 border-b border-white/10 whitespace-nowrap" dangerouslySetInnerHTML={{__html: processInline(h)}} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                        {tableRows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/5'}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2" dangerouslySetInnerHTML={{__html: processInline(cell)}} />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          );
          continue; // Lanjut ke iterasi berikutnya
       }
    }

    // 2. Deteksi List
    if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <li
          key={`list-${i}`}
          className="ml-4 list-disc marker:text-coc-gold pl-1 mb-1"
          dangerouslySetInnerHTML={{ __html: processInline(line.substring(2)) }}
        />
      );
      i++;
      continue;
    }

    // 3. Paragraf Biasa / Heading
    if (line.startsWith('### ')) {
       elements.push(<h4 key={`h3-${i}`} className="text-lg font-clash text-coc-gold mt-4 mb-2" dangerouslySetInnerHTML={{__html: processInline(line.substring(4))}} />);
    } else if (line.startsWith('## ')) {
       elements.push(<h3 key={`h2-${i}`} className="text-xl font-clash text-white mt-5 mb-2" dangerouslySetInnerHTML={{__html: processInline(line.substring(3))}} />);
    } else if (line !== '') {
       elements.push(
         <p
           key={`p-${i}`}
           className="mb-2 leading-relaxed"
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
            prompt: currentPrompt,
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
    // [PERBAIKAN] Menggunakan z-[10000] agar di atas navbar mobile (biasanya z-50)
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        // [PERBAIKAN] Menggunakan h-[85dvh] untuk mobile viewport yang dinamis
        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[85dvh] md:h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambience */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-coc-gold/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-coc-gold to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
              <IconSparkle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-clash text-white tracking-wide">
                {clanName ? `${clanName}'s AI` : t.clanAI.title}
              </h3>
              <p className="text-xs text-gray-400 font-sans">Powered by Gemini</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white rounded-full h-10 w-10 p-0 hover:bg-white/5"
            onClick={onClose}
          >
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden bg-black/20">
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar scroll-smooth"
          >
            {/* Welcome Message & Suggestions */}
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                  <IconSparkle className="w-10 h-10 text-coc-gold animate-pulse-slow" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-2xl font-clash text-white mb-2">How can I help you?</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {t.clanAI.welcomeMessage}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  <button onClick={() => setCurrentPrompt("Analyze our last war performance")} className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-coc-gold/30 transition-all text-xs text-gray-300 hover:text-coc-gold">
                    ⚔️ Analyze War Log
                  </button>
                  <button onClick={() => setCurrentPrompt("Give me strategy for TH13 attack")} className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-coc-gold/30 transition-all text-xs text-gray-300 hover:text-coc-gold">
                    🏰 Attack Strategies
                  </button>
                  <button onClick={() => setCurrentPrompt("Who should be promoted?")} className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-coc-gold/30 transition-all text-xs text-gray-300 hover:text-coc-gold">
                    📈 Promotion Advice
                  </button>
                  <button onClick={() => setCurrentPrompt("Draft a recruitment message")} className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-coc-gold/30 transition-all text-xs text-gray-300 hover:text-coc-gold">
                    📢 Recruitment Help
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1 ${
                    msg.role === 'user'
                      ? 'bg-gray-800 border-gray-700 text-gray-300'
                      : 'bg-gradient-to-br from-coc-gold to-orange-500 border-coc-gold/50 text-white'
                  }`}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <IconSparkle className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-white/10 text-white rounded-tr-sm border border-white/5'
                        : 'bg-[#151515] text-gray-200 rounded-tl-sm border border-white/10'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <SimpleMarkdownParser text={msg.parts} />
                      </div>
                    ) : (
                      msg.parts
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start w-full">
                <div className="flex max-w-[85%] gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-coc-gold to-orange-500 border-coc-gold/50 text-white flex items-center justify-center mt-1">
                    <IconSparkle className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-[#151515] border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center my-4">
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                  <XIcon className="w-3 h-3" />
                  {error}
                </div>
              </div>
            )}

            <div className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-5 border-t border-white/5 bg-[#0a0a0a]">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  placeholder={
                    isLoading ? t.clanAI.thinking : t.clanAI.inputPlaceholder
                  }
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-coc-gold/50 focus:bg-white/10 transition-all shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || !currentPrompt.trim()}
                className={`rounded-xl aspect-square p-0 flex items-center justify-center transition-all ${currentPrompt.trim() ? 'shadow-[0_0_15px_rgba(255,215,0,0.3)] scale-100' : 'scale-95 opacity-80'}`}
                style={{ width: '52px', height: '52px' }}
              >
                {isLoading ? (
                  <RefreshCwIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PaperPlaneIcon className="w-5 h-5 -ml-0.5" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-gray-600 text-center mt-3">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GeminiAssistantTab;