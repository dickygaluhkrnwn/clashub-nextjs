'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
// [FIX FASE 4] Memperbaiki nama impor ikon
import {
  PaperPlaneIcon, // Mengganti IconSend
  RefreshCwIcon, // Mengganti IconSpinner
  UserIcon, // Mengganti IconUser
  IconSparkle,
} from '@/app/components/icons';

// Tipe untuk setiap pesan dalam histori chat
interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

// [FIX] Menambahkan kembali interface Tipe props yang hilang
interface GeminiAssistantTabProps {
  clanId: string;
}

/**
 * Komponen untuk parsing Markdown sederhana dari jawaban AI.
 * Mengubah **teks** menjadi <b>teks</b> dan * item menjadi <li> item.
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
            <li key={index} className="ml-5 list-disc">
              {line.trim().substring(2)}
            </li>
          );
        }
        if (line.trim().startsWith('- ')) {
          return (
            <li key={index} className="ml-5 list-disc">
              {line.trim().substring(2)}
            </li>
          );
        }
        return (
          <span key={index}>
            {line}
            <br />
          </span>
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
 * Komponen Tab Asisten AI (Gemini)
 * Menyediakan antarmuka chat untuk berinteraksi dengan API AI.
 */
export const GeminiAssistantTab: React.FC<GeminiAssistantTabProps> = ({
  clanId,
}) => {
  // ... (Kode state: chatHistory, currentPrompt, isLoading, dll tetap sama) ...
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
    // ... (Kode handleSubmit tetap sama) ...
    e.preventDefault();
    if (!currentPrompt.trim() || isLoading) {
      return; // Jangan kirim jika kosong atau sedang loading
    }

    setIsLoading(true);
    setError(null);

    // Tambahkan pesan pengguna ke histori
    const userMessage: ChatMessage = { role: 'user', parts: currentPrompt };
    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);
    setCurrentPrompt(''); // Kosongkan input

    try {
      // Panggil API route yang sudah kita buat
      const response = await fetch(
        `/api/clan/manage/${clanId}/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: currentPrompt,
            // Kirim histori sebelumnya (tanpa pesan terakhir) untuk konteks
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

      // Tambahkan respons AI ke histori
      setChatHistory([...newChatHistory, modelMessage]);
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      // Jika gagal, tambahkan pesan error generik ke chat
      setChatHistory([
        ...newChatHistory,
        {
          role: 'model',
          parts: `Maaf, terjadi kesalahan: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false); // Selesai loading
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-4xl mx-auto bg-coc-dark/50 rounded-lg shadow-lg overflow-hidden border border-coc-gold-dark/30">
      {/* 1. Area Chat History */}
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
              Halo! Saya adalah Asisten AI Clan Anda. Tanyakan apa saja tentang
              clan ini (performa war, anggota, aturan) atau strategi CoC secara
              umum.
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
                <UserIcon className="w-5 h-5" />{' '}
                {/* FIX: Ganti IconUser -> UserIcon */}
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
              <RefreshCwIcon className="w-5 h-5 animate-spin" />{' '}
              {/* FIX: Ganti IconSpinner -> RefreshCwIcon */}
            </div>
          </div>
        )}
      </div>

      {/* 2. Area Input Form */}
      <form
        // ... (Kode form onSubmit tetap sama) ...
        onSubmit={handleSubmit}
        className="flex items-center p-4 border-t border-coc-gold-dark/30 bg-coc-dark"
      >
        <Input
          // ... (Kode Input tetap sama) ...
          type="text"
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            isLoading ? 'AI sedang berpikir...' : 'Tulis pertanyaan Anda...'
          }
          disabled={isLoading}
          className="flex-1 mr-3"
          // Izinkan submit dengan tombol Enter
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
            <RefreshCwIcon className="w-5 h-5 animate-spin" /> /* FIX: Ganti IconSpinner -> RefreshCwIcon */
          ) : (
            <PaperPlaneIcon className="w-5 h-5" /> /* FIX: Ganti IconSend -> PaperPlaneIcon */
          )}
        </Button>
      </form>

      {/* 3. Area Error (jika ada) */}
      {error && (
        // ... (Kode area error tetap sama) ...
        <div className="p-2 text-center text-xs text-red-400 bg-red-900/50">
          {error}
        </div>
      )}
    </div>
  );
};

// Ekspor default agar bisa di-load di ManageClanClient
export default GeminiAssistantTab;