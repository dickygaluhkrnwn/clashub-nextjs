import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSessionUser } from '@/lib/server-auth'; // FIX: Mengganti getSession -> getSessionUser
import { verifyUserClanRole } from '@/lib/firestore-admin/management';
import {
  getManagedClanDataAdmin,
  getClanApiCacheAdmin, // Impor ini untuk data anggota live
} from '@/lib/firestore-admin/clans';
import { getTeamMembersAdmin } from '@/lib/firestore-admin/users'; // Tetap digunakan untuk data statis user Clashub
import {
  getWarArchivesByClanId,
  getCwlArchivesByClanId,
  getRaidArchivesByClanId,
} from '@/lib/firestore-admin/archives';

// Impor Tipe Data untuk perangkuman
import { WarArchive, CwlArchive, RaidArchive } from '@/lib/types/archive.types';
import { UserProfile } from '@/lib/types/user.types';
import { ManagedClan } from '@/lib/types/clan.types';

// Inisialisasi Klien Gemini AI
// Pastikan GEMINI_API_KEY ada di file .env.local Anda
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Handle POST request untuk AI Assistant
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clanId: string } },
) {
  // 1. Keamanan: Verifikasi Sesi Pengguna
  const session = await getSessionUser(); // FIX: Mengganti getSession -> getSessionUser
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Keamanan: Verifikasi Parameter dan Otorisasi Admin Clan
  const { clanId } = params;
  if (!clanId) {
    return NextResponse.json({ error: 'Clan ID is required' }, { status: 400 });
  }

  const { isAuthorized } = await verifyUserClanRole(session.uid, clanId);
  if (!isAuthorized) {
    // Hanya admin (Leader/Co-Leader) yang boleh menggunakan fitur ini
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Ambil Input Pengguna
  let prompt: string;
  let history: any[]; // Opsional: histori chat sebelumnya
  try {
    const body = await req.json();
    prompt = body.prompt;
    history = body.history || [];

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // 4. Pengumpulan Data (Grounding) dari Firestore
    // Kita ambil semua data secara paralel untuk efisiensi
    // [Catatan] getTeamMembersAdmin mengambil data user /users (static)
    // Data live seperti donasi ada di ClanApiCache, kita bisa tambahkan nanti
    const [clanData, membersData, warData, cwlData, raidData] =
      await Promise.all([
        getManagedClanDataAdmin(clanId),
        getTeamMembersAdmin(clanId), // Fungsi dari users.ts (mengembalikan UserProfile[])
        getWarArchivesByClanId(clanId), // Ambil 50 terbaru (sesuai file archives.ts)
        getCwlArchivesByClanId(clanId),
        getRaidArchivesByClanId(clanId),
      ]);

    // 5. Rangkum Data (PENTING untuk efisiensi token)

    // Rangkuman Profil Clan
    const summarizedClan = clanData
      ? {
          name: clanData.name,
          tag: clanData.tag,
          description: clanData.profileDescription,
          rules: clanData.clanRules,
          vision: clanData.vision,
          recruiting: clanData.recruitingStatus,
        }
      : null;

    // Rangkuman Anggota (Maks 50) - Berdasarkan UserProfile
    const summarizedMembers = membersData
      .map((m: UserProfile) => ({
        name: m.inGameName || m.displayName, // FIX: Menggunakan field yang ada
        th: m.thLevel, // FIX: Menggunakan field thLevel
        role: m.clanRole, // Field ini sudah benar
        // 'donations' tidak ada di UserProfile, jadi kita hapus.
        playerTag: m.playerTag, // Field ini sudah benar
      }))
      .slice(0, 50);

    // Rangkuman Warlog (Maks 20 laga terakhir)
    const summarizedWarlog = warData
      .map((w: WarArchive) => ({
        opponent: w.opponent.name,
        result: w.result,
        ourStars: w.clan.stars,
        opponentStars: w.opponent.stars,
        date: w.warEndTime.toISOString().split('T')[0], // Hanya tanggal
      }))
      .slice(0, 20);

    // Rangkuman CWL (Maks 5 musim terakhir)
    const summarizedCwl = cwlData
      .map((c: CwlArchive) => ({
        season: c.season,
        rounds: c.rounds.map((r) => ({
          opponent: r.opponent.name,
          result: r.result,
          ourStars: r.clan.stars,
          opponentStars: r.opponent.stars,
        })),
      }))
      .slice(0, 5);

    // Rangkuman Raid (Maks 20 raid terakhir)
    const summarizedRaids = raidData
      .map((r: RaidArchive) => ({
        loot: r.capitalTotalLoot,
        attacks: r.totalAttacks,
        date: r.endTime?.toISOString().split('T')[0],
      }))
      .slice(0, 20);

    // 6. Buat System Prompt (Instruksi untuk AI)
    // Ini adalah "otak" dari AI kita
    const clanContext = `
      ANDA ADALAH "ASISTEN CLAN" UNTUK CLAN BERNAMA ${
        summarizedClan?.name || 'Clan Ini'
      }.
      Tugas Anda adalah menjawab pertanyaan dari admin clan (user) dengan ramah.

      ATURAN UTAMA:
      1. Selalu jawab dalam Bahasa Indonesia.
      2. Untuk pertanyaan UMUM (misal: "apa strategi serangan terbaik TH15?", "kapan update CoC?"), jawablah menggunakan pengetahuan general Anda.
      3. Untuk pertanyaan SPESIFIK TENTANG CLAN INI (misal: "bagaimana performa war kita?", "siapa donatur terbanyak?", "apa aturan clan?"), Anda HARUS menjawab HANYA berdasarkan data JSON di bawah ini.
      4. JANGAN mengarang data jika tidak ada di JSON. Jika data tidak ada atau tidak cukup, katakan "Maaf, saya tidak memiliki data spesifik mengenai itu." (Contoh: data donasi tidak ada di JSON, jadi jangan jawab).
      5. Selalu gunakan nama player (name) saat merujuk ke anggota, jangan playerTag.
      6. [PERBAIKAN] PENTING: Selalu format jawaban Anda menggunakan MARKDOWN. Gunakan **teks** untuk tebal dan *teks* untuk miring. JANGAN gunakan tag HTML (seperti <strong> atau <em>).

      --- DATA DATABASE CLAN (JSON) ---

      1. PROFIL_CLAN:
      ${JSON.stringify(summarizedClan, null, 2)}

      2. DAFTAR_ANGGOTA (Total: ${summarizedMembers.length}):
      ${JSON.stringify(summarizedMembers, null, 2)}

      3. HISTORI_WAR (20 Laga Terakhir):
      ${JSON.stringify(summarizedWarlog, null, 2)}

      4. HISTORI_CWL (5 Musim Terakhir):
      ${JSON.stringify(summarizedCwl, null, 2)}

      5. HISTORI_RAID (20 Raid Terakhir):
      ${JSON.stringify(summarizedRaids, null, 2)}
      
      --- AKHIR DATA DATABASE ---
    `;

    // 7. Panggil Gemini API
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-preview-09-2025',
        systemInstruction: clanContext,
      });

      // Siapkan histori chat (jika ada)
      const chatHistory = (history || []).map(
        (msg: { role: 'user' | 'model'; parts: string }) => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        }),
      );

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1500, // Beri ruang untuk jawaban yang agak panjang
          temperature: 0.7, // Sedikit kreatif tapi tetap faktual
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();

      // 8. Kirim Jawaban ke Frontend
      return NextResponse.json({ response: text });
    } catch (geminiError) {
      console.error('[AI Assistant] Gemini API Error:', geminiError);
      return NextResponse.json(
        { error: 'Error processing AI response' },
        { status: 500 },
      );
    }
  } catch (dataError) {
    console.error('[AI Assistant] Error gathering data:', dataError);
    return NextResponse.json(
      { error: 'Failed to gather clan data for AI' },
      { status: 500 },
    );
  }
}