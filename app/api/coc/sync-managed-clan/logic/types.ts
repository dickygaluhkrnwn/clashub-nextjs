// File: app/api/coc/sync-managed-clan/logic/types.ts

/**
 * @interface ClanWarLog
 * Merepresentasikan struktur War Log dari CoC API (diperlukan untuk War Classic).
 * Log War Classic adalah array of objects.
 */
export interface ClanWarLog {
    items: {
        tag: string;
        state: 'notInWar' | 'inWar' | 'ended' | 'preparation';
        teamSize: number;
        clan: {
            members: {
                tag: string;
                name: string;
                townHallLevel: number;
                attacks?: {
                    order: number;
                    attackerTag: string;
                    defenderTag: string;
                    stars: number;
                    destructionPercentage: number;
                }[];
                // Tipe data lain yang mungkin ada: defense, mapPosition
            }[];
        };
        endTime: string; // ISO 8601 string
        // Properti lain (opponent, result, etc.)
        [key: string]: any;
    }[];
}

/**
 * @interface CwlWarLog
 * Merepresentasikan arsip CWL (biasanya disimpan per musim).
 * Diperlukan untuk menghitung partisipasi CWL.
 */
export interface CwlWarLog {
    id: string; // ID Musim/Arsip
    clanTag: string;
    season: string;
    // CWL terdiri dari beberapa putaran (rounds)
    rounds: {
        roundNumber: number;
        endTime: string;
        clan: {
            members: {
                tag: string;
                name: string;
                townHallLevel: number;
                attacks?: {
                    order: number;
                    attackerTag: string;
                    defenderTag: string;
                    stars: number;
                    destructionPercentage: number;
                }[];
            }[];
        };
        // Properti lain (opponent, result, etc.)
        [key: string]: any;
    }[];
    [key: string]: any; // Memungkinkan field lain di tingkat akar CWL season
}
