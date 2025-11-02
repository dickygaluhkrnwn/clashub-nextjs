import useSWR, { KeyedMutator } from 'swr'; // Impor KeyedMutator
import {
  // REFAKTOR: Ganti CocClan ke ClanApiCache
  ClanApiCache,
  CocCurrentWar,
  CocWarLogEntry,
  CocLeagueGroup,
  CocRaidSeasons,
  UserProfile,
  JoinRequestWithProfile, // <-- DITAMBAHKAN: Tipe untuk hook requests
} from '@/lib/types'; // Mengimpor tipe dari barrel file utama

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
 * REFAKTOR: Menggunakan tipe data ClanApiCache (bukan CocClan).
 * @param clanId - ID internal (document ID) dari ManagedClan.
 */
export const useManagedClanBasic = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ClanApiCache>(
    clanId ? `/api/clan/manage/${clanId}/sync/basic` : null,
    fetcher
  );

  return {
    clanCache: data, // REFAKTOR: Ganti nama 'clanData' ke 'clanCache'
    isLoading: isLoading,
    isError: error,
    mutateBasic: mutate, // REFAKTOR: Ekspor 'mutate' sebagai 'mutateBasic'
  };
};

/**
 * @hook useManagedClanWar
 * Hook SWR untuk mengambil data Perang (War) saat ini.
 * Menggunakan tipe data CocCurrentWar.
 * @param clanId - ID internal (document ID) dari ManagedClan.
 */
export const useManagedClanWar = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocCurrentWar>(
    clanId ? `/api/clan/manage/${clanId}/sync/war` : null,
    fetcher
  );

  return {
    warData: data,
    isLoading: isLoading,
    isError: error,
    mutateWar: mutate, // REFAKTOR: Ekspor 'mutate' sebagai 'mutateWar'
  };
};

/**
 * @hook useManagedClanWarLog
 * Hook SWR untuk mengambil data Log Perang (War Log) klan.
 * Menggunakan tipe data CocWarLogEntry[].
 * @param clanId - ID internal (document ID) dari ManagedClan.
 */
export const useManagedClanWarLog = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocWarLogEntry[]>(
    clanId ? `/api/clan/manage/${clanId}/sync/warlog` : null,
    fetcher
  );

  return {
    warLogData: data,
    isLoading: isLoading,
    isError: error,
    mutateWarLog: mutate, // REFAKTOR: Ekspor 'mutate' sebagai 'mutateWarLog'
  };
};

/**
 * @hook useManagedClanCWL
 * Hook SWR untuk mengambil data Liga Perang Klan (CWL) saat ini.
 * Menggunakan tipe data CocLeagueGroup.
 * @param clanId - ID internal (document ID) dari ManagedClan.
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
    mutateCWL: mutate, // REFAKTOR: Ekspor 'mutate' sebagai 'mutateCWL'
  };
};

/**
 * @hook useManagedClanRaid
 * Hook SWR untuk mengambil data Log Raid Capital.
 * Menggunakan tipe data CocRaidSeasons.
 * @param clanId - ID internal (document ID) dari ManagedClan.
 */
export const useManagedClanRaid = (clanId: string) => {
  const { data, error, isLoading, mutate } = useSWR<CocRaidSeasons>(
    clanId ? `/api/clan/manage/${clanId}/sync/raid` : null,
    fetcher
  );

  return {
    // Kita kembalikan 'items' (array of raids) agar lebih mudah digunakan
    raidLogData: data?.items,
    isLoading: isLoading,
    isError: error,
    mutateRaid: mutate, // REFAKTOR: Ekspor 'mutate' sebagai 'mutateRaid'
  };
};

/**
 * @hook useManagedClanMembers
 * Hook SWR untuk mengambil data internal UserProfile anggota klan.
 * Menggunakan tipe data UserProfile[].
 * @param clanId - ID internal (document ID) dari ManagedClan.
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

// --- [BARU DITAMBAHKAN] ---
/**
 * @hook useManagedClanRequests
 * Hook SWR untuk mengambil data permintaan (Join Requests) klan.
 * Menggunakan tipe data JoinRequestWithProfile[].
 * @param clanId - ID internal (document ID) dari ManagedClan.
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
// --- [AKHIR TAMBAHAN] ---