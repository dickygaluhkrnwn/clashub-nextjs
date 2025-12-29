import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { GET as syncYoutubeVideo } from '../../../youtube/sync/route'; 
import { logAdminAction } from '@/lib/firestore-admin/audit'; // [BARU] Import Logger

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Auth (Session User)
    const user = await getSessionUser();
    if (!user || !user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verifikasi Status Global Admin di Database
    const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    console.log(`[Admin Trigger] YouTube Sync triggered by ${user.email} (${user.uid})`);

    // 3. Panggil Logika Sinkronisasi
    const secret = process.env.CRON_SECRET || process.env.YOUTUBE_SYNC_SECRET || '';
    const mockUrl = new URL('http://localhost/api/youtube/sync');
    mockUrl.searchParams.set('secret', secret);

    const mockRequest = new NextRequest(mockUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secret}`
      }
    });

    const response = await syncYoutubeVideo(mockRequest);
    const data = await response.json();

    // [BARU] Log
    logAdminAction(
        user.uid,
        user.email || 'unknown',
        'MANUAL_SYNC_YOUTUBE',
        'YouTube Channel'
    );

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('[Admin Trigger] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}