'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth'; // <-- [BARU] Impor tipe User
import {
  UserProfile,
  FirestoreDocument,
  EsportsTeam,
} from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import {
  EditIcon, // <-- [EDIT] Ganti ikon
  XIcon,
  Loader2Icon,
  CheckIcon, // <-- [EDIT] Ganti ikon
  CrownIcon, // <-- [BARU] Ikon untuk leader
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';

// =========================================================================
// KOMPONEN MODAL: EditTeamModal
// =========================================================================
interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  currentUser: User | null; // <-- [BARU] Tambahkan currentUser
  availableMembers: UserProfile[];
  onAction: (message: string, type: NotificationProps['type']) => void;
  allTeams: FirestoreDocument<EsportsTeam>[];
  teamToEdit: FirestoreDocument<EsportsTeam>; // <-- [BARU] Tim yang akan diedit
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  clanId,
  currentUser, // <-- [BARU]
  availableMembers,
  onAction,
  allTeams,
  teamToEdit, // <-- [BARU]
}) => {
  // [EDIT] Inisialisasi state dengan data dari teamToEdit
  const [teamName, setTeamName] = useState(teamToEdit.teamName);
  const [selectedUids, setSelectedUids] = useState<string[]>([
    ...teamToEdit.memberUids,
  ]);
  const [selectedLeaderUid, setSelectedLeaderUid] = useState<string>(
    teamToEdit.teamLeaderUid
  ); // <-- [BARU]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [EDIT] useEffect tidak diperlukan lagi untuk reset,
  // karena state diinisialisasi setiap kali modal dibuka (didasarkan pada props)
  // Kita tambahkan useEffect untuk sinkronisasi jika props berubah saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setTeamName(teamToEdit.teamName);
      setSelectedUids([...teamToEdit.memberUids]);
      setSelectedLeaderUid(teamToEdit.teamLeaderUid);
      setIsSubmitting(false);
    }
  }, [isOpen, teamToEdit]);

  // Buat Set (HashSet) untuk mengecek UID anggota yang sudah ada di tim lain
  // [EDIT] Kita harus mengecualikan anggota tim ini sendiri
  const membersInOtherTeams = useMemo(() => {
    const uids = new Set<string>();
    allTeams.forEach((team) => {
      // Hanya tambahkan UID dari tim LAIN
      if (team.id !== teamToEdit.id) {
        team.memberUids.forEach((uid) => uids.add(uid));
      }
    });
    return uids;
  }, [allTeams, teamToEdit.id]);

  // [BARU] Dapatkan profil lengkap dari anggota yang dipilih (untuk dropdown leader)
  const selectedMembers = useMemo(() => {
    return availableMembers.filter((m) => selectedUids.includes(m.uid));
  }, [selectedUids, availableMembers]);

  // Handler untuk memilih/membatalkan anggota
  const handleMemberToggle = (uid: string) => {
    let newSelectedUids = [...selectedUids];

    if (newSelectedUids.includes(uid)) {
      // Batalkan pilihan
      newSelectedUids = newSelectedUids.filter((id) => id !== uid);
      // Jika leader yang dibatalkan, reset pilihan leader
      if (uid === selectedLeaderUid) {
        setSelectedLeaderUid('');
      }
    } else {
      // Tambah pilihan
      if (newSelectedUids.length >= 5) {
        onAction('Anda hanya dapat memilih 5 anggota.', 'error');
        return;
      }
      newSelectedUids.push(uid);
    }
    setSelectedUids(newSelectedUids);
  };

  // Handler untuk submit form
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
    // [BARU] Validasi leader tim
    if (selectedLeaderUid === '') {
      onAction('Anda harus memilih seorang Leader Tim.', 'error');
      return;
    }
    // [BARU] Validasi token
    if (!currentUser) {
      onAction('Autentikasi gagal. Silakan login ulang.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await currentUser.getIdToken();

      // [EDIT] Panggil API PUT
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
            teamLeaderUid: selectedLeaderUid, // <-- [BARU] Kirim leader baru
            memberUids: selectedUids, // Kirim sebagai array, API akan konversi ke tuple
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal memperbarui tim.');
      }

      // [EDIT] Pesan sukses baru sesuai permintaan
      onAction(
        result.message || // <-- Ambil pesan dari API (bisa jadi ada peringatan)
          'Tim E-Sports berhasil diperbarui! Harap promosikan juga leader tim di dalam game.',
        'success'
      );
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
                    // [EDIT] Cek apakah UID ada di tim lain (kecuali tim ini)
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

            {/* [BARU] Pemilih Leader Tim */}
            <div>
              <label
                htmlFor="teamLeader"
                className="block text-sm font-medium text-gray-300 font-sans mb-1"
              >
                <CrownIcon className="h-4 w-4 mr-1.5 inline-block" />
                Pilih Leader Tim
              </label>
              <select
                id="teamLeader"
                value={selectedLeaderUid}
                onChange={(e) => setSelectedLeaderUid(e.target.value)}
                className="input-base"
                disabled={isSubmitting || selectedUids.length !== 5}
              >
                <option value="" disabled>
                  {selectedUids.length !== 5
                    ? 'Pilih 5 anggota dulu'
                    : 'Pilih seorang leader...'}
                </option>
                {selectedMembers.map((member) => (
                  <option key={member.uid} value={member.uid}>
                    {member.displayName} (TH{member.thLevel})
                  </option>
                ))}
              </select>
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
                selectedUids.length !== 5 ||
                selectedLeaderUid === '' // <-- [BARU] Validasi tombol
              }
            >
              {isSubmitting ? (
                <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckIcon className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;