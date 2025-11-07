// File: app/profile/components/TeamHistoryCard.tsx

'use client';

import React from 'react';
import { ShieldIcon } from '@/app/components/icons';
import { FirestoreDocument } from '@/lib/types';
// [EDIT TAHAP 4.2] Impor DocumentData untuk tipe clanHistory
import { DocumentData } from 'firebase/firestore';

interface TeamHistoryCardProps {
  clanHistory: FirestoreDocument<DocumentData>[];
}

/**
 * Komponen Card untuk menampilkan "Riwayat Tim Clashub" di halaman profil.
 */
export const TeamHistoryCard = ({ clanHistory }: TeamHistoryCardProps) => {
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white">
        <ShieldIcon className="h-6 w-6 text-coc-gold" /> Riwayat Tim Clashub
      </h2>
      <div className="space-y-4">
        {clanHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Anda belum memiliki riwayat tim di Clashub.
          </p>
        ) : (
          <ul className="space-y-3">
            {clanHistory.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 p-3 bg-coc-stone/50 rounded-md border border-coc-gold-dark/30"
              >
                <span
                  className={`font-bold text-sm ${
                    entry.action === 'join'
                      ? 'text-coc-green'
                      : 'text-coc-red'
                  }`}
                >
                  {entry.action === 'join'
                    ? 'Bergabung'
                    : entry.action === 'leave'
                    ? 'Keluar'
                    : 'Dikeluarkan'}
                </span>
                <span className="text-white font-semibold">
                  {entry.clanName || 'Klan Tidak Dikenal'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {entry.timestamp
                    ? new Date(
                        (entry.timestamp as any)._seconds * 1000 || // Handle Firestore Timestamp (jika diserialisasi)
                          entry.timestamp, // Handle ISO String
                      ).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Tanggal tidak diketahui'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};