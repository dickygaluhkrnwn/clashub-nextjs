import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { GET as syncYoutubeVideo } from '../../../youtube/sync/route'; // Import fungsi GET langsung

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
    // Kita membuat Request tiruan (mock) yang seolah-olah memiliki Secret Key yang benar
    // Ini cara pintar memanggil endpoint lain tanpa HTTP fetch ke localhost (yg sering error di Vercel)
    
    const secret = process.env.CRON_SECRET || process.env.YOUTUBE_SYNC_SECRET || '';
    const mockUrl = new URL('http://localhost/api/youtube/sync');
    mockUrl.searchParams.set('secret', secret);

    const mockRequest = new NextRequest(mockUrl, {
      method: 'GET',
      headers: {
        // Kita juga bisa inject Authorization header jika perlu
        'Authorization': `Bearer ${secret}`
      }
    });

    // Panggil fungsi GET dari route youtube/sync secara langsung
    const response = await syncYoutubeVideo(mockRequest);
    
    // Ambil data JSON hasil eksekusi
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('[Admin Trigger] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}