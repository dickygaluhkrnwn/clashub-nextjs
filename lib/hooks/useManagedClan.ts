import useSWR, { KeyedMutator } from 'swr'; // Impor KeyedMutator
import {
  // Tipe-tipe yang dibutuhkan
  ClanApiCache,
  CocWarLog,
  CocCurrentWar, // <-- [PERBAIKAN ERROR 3] Tambahkan CocCurrentWar
  CocLeagueGroup,
  UserProfile,
  JoinRequestWithProfile,
  FirestoreDocument, // <-- PERBAIKAN 2: Tipe data arsip
  WarSummary, // <-- PERBAIKAN 2: Tipe data arsip
  RaidArchive, // <-- PERBAIKAN 3: Tipe data arsip raid
  CocRaidLog, // <-- PERBAIKAN 3: Tipe data raid saat ini
  CwlArchive, // <-- [PERBAIKAN] Impor Tipe Arsip CWL
} from '@/lib/types'; // Mengimpor tipe dari barrel file utama

/**
 * @type ManagedClanRaidData
 * Tipe data baru untuk struktur data yang dikembalikan oleh hook raid.
 */
interface ManagedClanRaidData {
  currentRaid: CocRaidLog | null;
  raidArchives: FirestoreDocument<RaidArchive>[];
}

/**
 * @function fetcher
 * Fungsi fetcher generik untuk digunakan oleh SWR.
 * Mengambil URL dan mengembalikan data JSON.
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || 'Terjadi kesalahan saat mengambil data.'
    );
  }

  return res.json();
};

/**
 * @hook useManagedClanCache
 * Hook SWR untuk mengambil data cache dasar klan (Info & Anggota).
 * [PERBAIKAN V6] Mengganti nama hook dan URL dari '/sync/basic' ke '/cache'.
 */
export const useManagedClanCache = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ClanApiCache>(
    clanId ? `/api/clan/manage/${clanId}/cache` : null, // <-- [BUG FIX] URL diubah
    fetcher
  );

  return {
    clanCache: data,
    isLoading: isLoading,
    isError: error,
    mutateCache: mutate, // [PERBAIKAN V6] Ganti nama mutate
  };
};

/**
 * @hook useManagedClanWar
 * Hook SWR untuk mengambil data Perang (War) saat ini.
 * [PERBAIKAN V6] URL diubah dari '/sync/war' ke '/war'.
 */
export const useManagedClanWar = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocCurrentWar | null>( // <-- [PERBAIKAN ERROR 3] Ganti tipe ke CocCurrentWar | null
    clanId ? `/api/clan/manage/${clanId}/war` : null, // <-- [BUG FIX] URL diubah
    fetcher
  );

  return {
    warData: data,
    isLoading: isLoading,
    isError: error,
    mutateWar: mutate,
  };
};

/**
 * @hook useManagedClanWarLog
 * Hook SWR untuk mengambil data Log Perang (War Log) klan.
 * [PERBAIKAN V6] URL diubah dari '/sync/warlog' ke '/warlog'.
 */
export const useManagedClanWarLog = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<
    FirestoreDocument<WarSummary>[]
  >(
    clanId ? `/api/clan/manage/${clanId}/warlog` : null, // <-- [BUG FIX] URL diubah
    fetcher,
    {
      // Opsi SWR untuk memastikan data tanggal konsisten
      revalidateOnFocus: false,
    }
  );

  return {
    warLogData: data,
    isLoading: isLoading,
    isError: error,
    mutateWarLog: mutate,
  };
};

/**
 * @hook useManagedClanCWL
 * @description [PERBAIKAN] Hook SWR untuk mengambil data RIWAYAT CWL (Arsip).
 */
export const useManagedClanCWL = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<
    FirestoreDocument<CwlArchive>[] | null
  >(
    // <-- [PERBAIKAN] Tipe diubah dari CocLeagueGroup ke Array Arsip
    clanId ? `/api/clan/manage/${clanId}/cwl` : null, // <-- URL sudah benar (GET)
    fetcher
  );

  return {
    cwlData: data, // Tipe data sekarang adalah CwlArchive[]
    isLoading: isLoading,
    isError: error,
    mutateCWL: mutate,
  };
};

/**
 * @hook useManagedClanRaid
 * Hook SWR untuk mengambil data Log Raid Capital (Aktif dan Arsip).
 * [PERBAIKAN V6] URL diubah dari '/sync/raid' ke '/raid'.
 */
export const useManagedClanRaid = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ManagedClanRaidData>( // <-- TIPE DIPERBAIKI
    clanId ? `/api/clan/manage/${clanId}/raid` : null, // <-- [BUG FIX] URL diubah
    fetcher
  );

  return {
    // Kembalikan dua properti: currentRaid dan raidArchives
    currentRaid: data?.currentRaid,
    raidArchives: data?.raidArchives,
    isLoading: isLoading,
    isError: error,
    mutateRaid: mutate,
  };
};

/**
 * @hook useManagedClanMembers
 * Hook SWR untuk mengambil data internal UserProfile anggota klan.
 * (File ini sudah benar)
 */
export const useManagedClanMembers = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<UserProfile[]>(
    clanId ? `/api/clan/manage/${clanId}/members` : null,
    fetcher
  );

  return {
    membersData: data, // Ini adalah UserProfile[]
    isLoading: isLoading,
    isError: error,
    mutateMembers: mutate,
  };
};

/**
 * @hook useManagedClanRequests
 * Hook SWR untuk mengambil data permintaan (Join Requests) klan.
 * (File ini sudah benar)
 */
export const useManagedClanRequests = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<JoinRequestWithProfile[]>(
    clanId ? `/api/clan/manage/${clanId}/requests` : null,
    fetcher
  );

  return {
    requestsData: data, // Ini adalah JoinRequestWithProfile[]
    isLoading: isLoading,
    isError: error,
    mutateRequests: mutate,
  };
};

