import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth Check (Wajib Master Admin)
    const user = await getSessionUser();
    if (!user || !user.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch Logs (Limit 50 terbaru)
    const logsQuery = await adminFirestore
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const logs = logsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Konversi Timestamp ke string ISO untuk dikirim ke client
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json(logs);

  } catch (error) {
    console.error('[Audit Logs API] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}