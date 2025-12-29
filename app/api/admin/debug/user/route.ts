import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import cocApi from '@/lib/coc-api';
import { logAdminAction, AuditActionType } from '@/lib/firestore-admin/audit'; // [BARU] Import Logger

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth Check (Master Admin Only)
    const user = await getSessionUser();
    if (!user || !user.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Ambil Parameter Query
    const { searchParams } = new URL(request.url);
    const queryTerm = searchParams.get('q'); // Bisa Email, UID, atau Tag

    if (!queryTerm) return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 });

    console.log(`[User Inspector] Inspecting: ${queryTerm}`);

    // [BARU] Log Inspection (Optional: Gunakan casting jika tipe 'INSPECT_USER' belum ada di audit.ts)
    // Kita gunakan console log saja untuk GET agar tidak memenuhi audit log, 
    // atau gunakan tipe generik jika perlu.
    
    // 3. Cari User di Firestore
    let firestoreData = null;
    let userId = null;
    let playerTag = null;

    // Strategi Pencarian: Cek UID dulu, lalu Email, lalu Player Tag
    let userQuery = await adminFirestore.collection('users').doc(queryTerm).get(); // Asumsi UID
    
    if (userQuery.exists) {
        firestoreData = { id: userQuery.id, ...userQuery.data() };
        userId = userQuery.id;
        playerTag = userQuery.data()?.playerTag;
    } else {
        // Cek by Email
        const emailQuery = await adminFirestore.collection('users').where('email', '==', queryTerm).limit(1).get();
        if (!emailQuery.empty) {
            const doc = emailQuery.docs[0];
            firestoreData = { id: doc.id, ...doc.data() };
            userId = doc.id;
            playerTag = doc.data()?.playerTag;
        } else {
            // Cek by Player Tag (Pastikan format # benar)
            const formattedTag = queryTerm.startsWith('#') ? queryTerm : `#${queryTerm}`;
            const tagQuery = await adminFirestore.collection('users').where('playerTag', '==', formattedTag).limit(1).get();
            if (!tagQuery.empty) {
                const doc = tagQuery.docs[0];
                firestoreData = { id: doc.id, ...doc.data() };
                userId = doc.id;
                playerTag = doc.data()?.playerTag;
            } else {
                // Jika masih tidak ketemu di DB, mungkin ini Player Tag murni yang belum terdaftar
                if (queryTerm.startsWith('#') || queryTerm.length < 15) {
                    playerTag = queryTerm.startsWith('#') ? queryTerm : `#${queryTerm}`;
                }
            }
        }
    }

    // 4. Fetch Data CoC API (Live)
    let apiData = null;
    let apiError = null;

    if (playerTag && playerTag !== 'RESET') {
        try {
            apiData = await cocApi.getPlayerData(encodeURIComponent(playerTag));
        } catch (err) {
            apiError = (err as Error).message;
        }
    } else {
        apiError = "No Player Tag linked to this user, or User not found.";
    }

    // 5. Return Comparison
    return NextResponse.json({
      status: 'success',
      userId,
      playerTag,
      comparison: {
        firestore: firestoreData || 'NOT FOUND IN DB',
        liveApi: {
          data: apiData,
          error: apiError
        }
      }
    });

  } catch (error) {
    console.error('[User Inspector Error]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: Force Sync Player Data
export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const requester = await getSessionUser();
        if (!requester || !requester.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const requesterDoc = await adminFirestore.collection('users').doc(requester.uid).get();
        if (!requesterDoc.data()?.isGlobalAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { userId, playerTag } = body;

        if (!userId || !playerTag) return NextResponse.json({ error: 'User ID and Player Tag required' }, { status: 400 });

        // 2. Fetch Live Data
        const apiData = await cocApi.getPlayerData(encodeURIComponent(playerTag));

        // 3. Update Firestore
        await adminFirestore.collection('users').doc(userId).update({
            inGameName: apiData.name,
            thLevel: apiData.townHallLevel,
            trophies: apiData.trophies,
            expLevel: apiData.expLevel,
            league: apiData.league || null,
            clanTag: apiData.clan?.tag || null,
            clanName: apiData.clan?.name || null,
            clanRole: apiData.role || null, 
            lastVerified: FieldValue.serverTimestamp()
        });

        // 4. Update Cache (Opsional, tapi bagus)
        await adminFirestore.collection('users').doc(userId).update({
            cachedHeroes: apiData.heroes || [],
            cachedTroops: apiData.troops || [],
            cachedSpells: apiData.spells || [],
            lastCacheTimestamp: FieldValue.serverTimestamp()
        });

        // [BARU] Log
        logAdminAction(
            requester.uid,
            requester.email || 'unknown',
            'FORCE_SYNC_USER',
            userId,
            { playerTag }
        );

        return NextResponse.json({ success: true, message: 'Player data force-synced successfully!' });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}