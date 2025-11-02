import useSWR, { KeyedMutator } from 'swr'; // Impor KeyedMutator
import {
    // Tipe-tipe yang dibutuhkan
    ClanApiCache,
    CocWarLog, // <-- PERBAIKAN 1: Diganti dari CocCurrentWar
    CocLeagueGroup,
    UserProfile,
    JoinRequestWithProfile,
    FirestoreDocument, // <-- PERBAIKAN 2: Tipe data arsip
    WarSummary,        // <-- PERBAIKAN 2: Tipe data arsip
    RaidArchive,       // <-- PERBAIKAN 3: Tipe data arsip raid
    CocRaidLog,        // <-- PERBAIKAN 3: Tipe data raid saat ini
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
 * @hook useManagedClanBasic
 * Hook SWR untuk mengambil data dasar klan (Info & Anggota).
 */
export const useManagedClanBasic = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ClanApiCache>(
    clanId ? `/api/clan/manage/${clanId}/sync/basic` : null,
    fetcher
  );

  return {
    clanCache: data, 
    isLoading: isLoading,
    isError: error,
    mutateBasic: mutate, 
  };
};

/**
 * @hook useManagedClanWar
 * Hook SWR untuk mengambil data Perang (War) saat ini.
 * PERBAIKAN 1: Menggunakan tipe data CocWarLog.
 */
export const useManagedClanWar = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocWarLog>( // <-- TIPE DIPERBAIKI
    clanId ? `/api/clan/manage/${clanId}/sync/war` : null,
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
 * PERBAIKAN 2: Menggunakan tipe data FirestoreDocument<WarSummary>[].
 */
export const useManagedClanWarLog = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<FirestoreDocument<WarSummary>[]>( // <-- TIPE DIPERBAIKI
    clanId ? `/api/clan/manage/${clanId}/sync/warlog` : null,
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
 * Hook SWR untuk mengambil data Liga Perang Klan (CWL) saat ini.
 */
export const useManagedClanCWL = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocLeagueGroup>(
    clanId ? `/api/clan/manage/${clanId}/sync/cwl` : null,
    fetcher
  );

  return {
    cwlData: data,
    isLoading: isLoading,
    isError: error,
    mutateCWL: mutate, 
  };
};

/**
 * @hook useManagedClanRaid
 * Hook SWR untuk mengambil data Log Raid Capital (Aktif dan Arsip).
 * PERBAIKAN 3: Menggunakan tipe data ManagedClanRaidData.
 */
export const useManagedClanRaid = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ManagedClanRaidData>( // <-- TIPE DIPERBAIKI
    clanId ? `/api/clan/manage/${clanId}/sync/raid` : null,
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

