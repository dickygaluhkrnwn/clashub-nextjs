'use client';

import React, { useState, useMemo, useEffect } from 'react'; // <-- [PERBAIKAN] Kurung siku [ ] diubah jadi { }
import Image from 'next/image';
import { User } from 'firebase/auth'; // <-- Dibutuhkan untuk token
import {
  EsportsTeam,
  UserProfile,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import {
  EditIcon, // <-- Ganti ikon
  XIcon,
  Loader2Icon,
  CheckIcon, // <-- Ganti ikon
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';

// =========================================================================
// KOMPONEN MODAL: EditTeamModal
// =========================================================================
interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  currentUser: User | null; // <-- Dibutuhkan untuk token
  availableMembers: UserProfile[];
  onAction: (message: string, type: NotificationProps['type']) => void;
  allTeams: FirestoreDocument<EsportsTeam>[];
  teamToEdit: FirestoreDocument<EsportsTeam>; // <-- Data tim yang akan diedit
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  clanId,
  currentUser,
  availableMembers,
  onAction,
  allTeams,
  teamToEdit,
}) => {
  // Inisialisasi state dengan data dari teamToEdit
  const [teamName, setTeamName] = useState(teamToEdit.teamName);
  const [selectedUids, setSelectedUids] = useState<string[]>(teamToEdit.memberUids);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika modal dibuka untuk tim yang berbeda, reset state
  useEffect(() => {
    if (isOpen) {
      setTeamName(teamToEdit.teamName);
      setSelectedUids(teamToEdit.memberUids);
    }
  }, [isOpen, teamToEdit]);

  // Buat Set (HashSet) untuk mengecek UID anggota yang sudah ada di tim lain
  // PENTING: Kecualikan anggota tim yang sedang diedit
  const membersInOtherTeams = useMemo(() => {
    const uids = new Set<string>();
    allTeams
      .filter((team) => team.id !== teamToEdit.id) // <-- Filter tim saat ini
      .forEach((team) => {
        team.memberUids.forEach((uid) => uids.add(uid));
      });
    return uids;
  }, [allTeams, teamToEdit.id]);

  // Handler untuk memilih/membatalkan anggota
  const handleMemberToggle = (uid: string) => {
    setSelectedUids((prev) => {
      if (prev.includes(uid)) {
        // Batalkan pilihan
        return prev.filter((id) => id !== uid);
      } else {
        // Tambah pilihan
        if (prev.length >= 5) {
          onAction('Anda hanya dapat memilih 5 anggota.', 'error');
          return prev;
        }
        return [...prev, uid];
      }
    });
  };

  // Handler untuk submit form (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() === '') {
      onAction('Nama tim tidak boleh kosong.', 'error');
      return;
    }
    if (selectedUids.length !== 5) {
      onAction('Anda harus memilih tepat 5 anggota.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!currentUser) {
        throw new Error('Otentikasi gagal. Silakan login ulang.');
      }
      const token = await currentUser.getIdToken();

      // Ubah array 5 string menjadi tuple [string, string, string, string, string]
      const memberUidsTuple: [string, string, string, string, string] = [
        selectedUids[0],
        selectedUids[1],
        selectedUids[2],
        selectedUids[3],
        selectedUids[4],
      ];

      // Panggil API PUT untuk update
      const response = await fetch(
        `/api/clan/manage/${clanId}/esports/${teamToEdit.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            teamName: teamName.trim(),
            memberUids: memberUidsTuple,
            // Catatan: teamLeaderUid tidak diubah di sini, tapi bisa ditambahkan jika perlu
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal memperbarui tim.');
      }

      onAction(`Tim "${teamName}" berhasil diperbarui!`, 'success');
      onClose(); // Tutup modal setelah sukses
    } catch (error) {
      console.error('Error updating team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl card-stone shadow-xl border-2 border-coc-gold/50">
        <form onSubmit={handleSubmit}>
          {/* Header Modal */}
          <div className="flex justify-between items-center p-4 border-b border-coc-gold-dark/30">
            <h3 className="text-xl font-clash text-coc-gold flex items-center">
              <EditIcon className="h-6 w-6 mr-3" />
              Edit Tim E-Sports
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!p-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Body Modal */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Input Nama Tim */}
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-300 font-sans mb-1"
              >
                Nama Tim
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Misal: Tim Elit War"
                className="input-base" // Kelas dari globals.css
                disabled={isSubmitting}
              />
            </div>

            {/* Pemilih Anggota */}
            <div>
              <label className="block text-sm font-medium text-gray-300 font-sans mb-1">
                Pilih Anggota ({selectedUids.length}/5)
              </label>
              <p className="text-xs text-gray-400 font-sans mb-2">
                Pilih 5 anggota terverifikasi. Anggota yang sudah ada di tim
                lain akan dinonaktifkan.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 rounded-lg bg-coc-stone-dark/30 p-3">
                {availableMembers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Tidak ada anggota terverifikasi yang tersedia.
                  </p>
                ) : (
                  availableMembers.map((member) => {
                    const isSelected = selectedUids.includes(member.uid);
                    // Cek jika anggota ada di tim lain (kecuali tim ini)
                    const isInOtherTeam =
                      membersInOtherTeams.has(member.uid) &&
                      !teamToEdit.memberUids.includes(member.uid);

                    const isDisabled =
                      (isInOtherTeam && !isSelected) ||
                      (selectedUids.length >= 5 && !isSelected) ||
                      isSubmitting;

                    return (
                      <button
                        type="button"
                        key={member.uid}
                        onClick={() => handleMemberToggle(member.uid)}
                        disabled={isDisabled}
                        className={`w-full flex items-center space-x-3 p-2 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-coc-gold/20 border border-coc-gold'
                            : 'bg-coc-dark/50 hover:bg-coc-dark/80'
                        } ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'bg-coc-gold border-coc-gold'
                              : 'border-gray-400'
                          } ${
                            isInOtherTeam && !isSelected
                              ? 'bg-gray-600 border-gray-500'
                              : ''
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="h-4 w-4 text-coc-dark" />
                          )}
                          {isInOtherTeam && !isSelected && (
                            <XIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Image
                          src={getThImage(member.thLevel)}
                          alt={`TH${member.thLevel}`}
                          width={28}
                          height={28}
                          className="h-7 w-auto"
                        />
                        <div className="text-left">
                          <p
                            className={`font-sans font-medium ${
                              isSelected ? 'text-white' : 'text-gray-200'
                            }`}
                          >
                            {member.displayName}
                          </p>
                          {isInOtherTeam && (
                            <p className="text-xs text-coc-yellow/80">
                              (Sudah di tim lain)
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="flex justify-end gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isSubmitting ||
                teamName.trim() === '' ||
                selectedUids.length !== 5
              }
            >
              {isSubmitting ? (
                <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckIcon className="h-5 w-5 mr-2" /> // <-- Ganti ikon
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'} 
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;