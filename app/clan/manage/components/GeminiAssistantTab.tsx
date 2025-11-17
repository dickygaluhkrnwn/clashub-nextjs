'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import {
  PaperPlaneIcon,
  RefreshCwIcon,
  UserIcon,
  IconSparkle,
  XIcon, // [FASE 2] Tambahan ikon untuk tombol close
} from '@/app/components/icons';

// Tipe untuk setiap pesan dalam histori chat
interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

// [FASE 2] Interface props diubah untuk modal
interface GeminiAssistantModalProps {
  clanId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Komponen untuk parsing Markdown sederhana dari jawaban AI.
 * [PERUBAHAN FASE 1]: Menggunakan dangerouslySetInnerHTML untuk merender HTML
 */
const SimpleMarkdownParser: React.FC<{ text: string }> = ({ text }) => {
  const formatText = (inputText: string) => {
    return inputText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .split('\n')
      .map((line, index) => {
        if (line.trim().startsWith('* ')) {
          return (
            <li
              key={index}
              className="ml-5 list-disc"
              // PERUBAHAN FASE 1: Render HTML di dalam list item
              dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }}
            />
          );
        }
        if (line.trim().startsWith('- ')) {
          return (
            <li
              key={index}
              className="ml-5 list-disc"
              // PERUBAHAN FASE 1: Render HTML di dalam list item
              dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }}
            />
          );
        }
        return (
          <span
            key={index}
            // PERUBAHAN FASE 1: Render HTML dan tambahkan <br />
            dangerouslySetInnerHTML={{ __html: line + '<br />' }}
          />
        ); // Tambahkan <br /> untuk baris baru
      });
  };

  // Bungkus <li> dalam <ul> jika ada
  const formattedLines = formatText(text);
  const listItems = formattedLines.filter(
    (item) => (item as React.ReactElement).type === 'li',
  );
  const otherItems = formattedLines.filter(
    (item) => (item as React.ReactElement).type !== 'li',
  );

  if (listItems.length > 0) {
    return (
      <>
        {otherItems.filter(
          (item, i) =>
            formattedLines.indexOf(item) <
            formattedLines.indexOf(listItems[0]),
        )}
        <ul className="my-2">{listItems}</ul>
        {otherItems.filter(
          (item, i) =>
            formattedLines.indexOf(item) >
            formattedLines.indexOf(listItems[listItems.length - 1]),
        )}
      </>
    );
  }

  return <>{formattedLines}</>;
};

/**
 * [FASE 2] Komponen Asisten AI (Gemini) - Sekarang sebagai Modal
 * Menyediakan antarmuka chat untuk berinteraksi dengan API AI.
 */
export const GeminiAssistantTab: React.FC<GeminiAssistantModalProps> = ({
  clanId,
  isOpen,
  onClose,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Fungsi untuk menangani pengiriman form
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
        throw new Error(errorData.error || 'Gagal mengambil respons dari AI');
      }

      const data = await response.json();
      const modelMessage: ChatMessage = { role: 'model', parts: data.response };

      setChatHistory([...newChatHistory, modelMessage]);
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setChatHistory([
        ...newChatHistory,
        {
          role: 'model',
          parts: `Maaf, terjadi kesalahan: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // [FASE 2] Jangan render apapun jika modal tidak terbuka
  if (!isOpen) return null;

  return (
    // [FASE 2] Latar belakang overlay modal
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose} // Tutup jika klik di luar
    >
      {/* [FASE 2] Konten Modal, meniru gaya AlertDialog & card-stone */}
      <div
        className="relative w-full max-w-4xl rounded-xl card-stone shadow-xl border-2 border-coc-gold/50 flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()} // Hindari penutupan jika klik di dalam
      >
        {/* [FASE 2] Header Modal */}
        <div className="flex items-center justify-between p-4 border-b border-coc-gold-dark/30">
          <h3 className="flex items-center text-xl font-clash text-coc-gold">
            <IconSparkle className="h-6 w-6 mr-3 text-coc-yellow" />
            Asisten AI Clan
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* [FASE 2] Konten chat dibuat fleksibel di dalam modal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 1. Area Chat History (dibuat flex-1 agar bisa scroll) */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 space-y-4 overflow-y-auto"
          >
            {/* Pesan Selamat Datang */}
            {chatHistory.length === 0 && (
              <div className="flex items-start space-x-3 p-3 bg-coc-dark-blue/70 rounded-lg">
                <div className="text-coc-gold pt-1">
                  <IconSparkle className="w-5 h-5" />
                </div>
                <p className="text-gray-300 text-sm">
                  Halo! Saya adalah Asisten AI Clan Anda. Tanyakan apa saja
                  tentang clan ini (performa war, anggota, aturan) atau strategi
                  CoC secara umum.
                </p>
              </div>
            )}

            {/* Render Pesan Chat */}
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${
                  msg.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {/* Ikon untuk Model (AI) */}
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 text-coc-gold bg-coc-dark-blue p-2 rounded-full">
                    <IconSparkle className="w-5 h-5" />
                  </div>
                )}

                {/* Konten Pesan */}
                <div
                  className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${
                    msg.role === 'user'
                      ? 'bg-coc-gold/20 text-gray-200'
                      : 'bg-coc-dark-blue/70 text-gray-300'
                  }`}
                >
                  <div className="text-sm font-sans leading-relaxed">
                    {msg.role === 'model' ? (
                      <SimpleMarkdownParser text={msg.parts} />
                    ) : (
                      msg.parts
                    )}
                  </div>
                </div>

                {/* Ikon untuk User */}
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 text-gray-400 bg-coc-stone-dark p-2 rounded-full">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {/* Indikator Loading */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-coc-gold bg-coc-dark-blue p-2 rounded-full">
                  <IconSparkle className="w-5 h-5" />
                </div>
                <div className="p-3 rounded-lg bg-coc-dark-blue/70 text-gray-400">
                  <RefreshCwIcon className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* 2. Area Input Form (menempel di bawah) */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center p-4 border-t border-coc-gold-dark/30 bg-coc-dark rounded-b-lg"
          >
            <Input
              type="text"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder={
                isLoading ? 'AI sedang berpikir...' : 'Tulis pertanyaan Anda...'
              }
              disabled={isLoading}
              className="flex-1 mr-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !currentPrompt.trim()}
            >
              {isLoading ? (
                <RefreshCwIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PaperPlaneIcon className="w-5 h-5" />
              )}
            </Button>
          </form>

          {/* 3. Area Error (jika ada) */}
          {error && (
            <div className="p-2 text-center text-xs text-red-400 bg-red-900/50">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Ekspor default agar bisa di-load di ManageClanClient
export default GeminiAssistantTab;