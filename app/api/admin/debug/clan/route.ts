import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import cocApi from '@/lib/coc-api';

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

    // 2. Ambil Parameter Tag
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) return NextResponse.json({ error: 'Clan Tag is required' }, { status: 400 });

    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    console.log(`[Clan Inspector] Inspecting: ${formattedTag} by ${user.email}`);

    // 3. Fetch Data Firestore (Database)
    // Cari dokumen managedClan berdasarkan tag
    const clanQuery = await adminFirestore
      .collection('managedClans')
      .where('tag', '==', formattedTag)
      .limit(1)
      .get();

    let firestoreData = null;
    let cacheData = null;
    let clanId = null;

    if (!clanQuery.empty) {
      const clanDoc = clanQuery.docs[0];
      clanId = clanDoc.id;
      firestoreData = { id: clanDoc.id, ...clanDoc.data() };

      // Ambil Cache jika ada
      const cacheDoc = await clanDoc.ref.collection('clanApiCache').doc('current').get();
      if (cacheDoc.exists) {
        cacheData = cacheDoc.data();
      }
    }

    // 4. Fetch Data CoC API (Live)
    let apiData = null;
    let apiError = null;
    try {
      apiData = await cocApi.getClanData(encodeURIComponent(formattedTag));
    } catch (err) {
      apiError = (err as Error).message;
    }

    // 5. Return Comparison
    return NextResponse.json({
      status: 'success',
      clanId,
      comparison: {
        firestore: {
          main: firestoreData || 'NOT FOUND IN DB',
          cache: cacheData || 'NO CACHE'
        },
        liveApi: {
          data: apiData,
          error: apiError
        }
      }
    });

  } catch (error) {
    console.error('[Clan Inspector Error]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}