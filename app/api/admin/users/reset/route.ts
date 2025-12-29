import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAdminAction } from '@/lib/firestore-admin/audit'; // [BARU] Import Logger

// POST: Reset status verifikasi user (Troubleshooting)
export async function POST(request: NextRequest) {
  try {
    // 1. Cek Login & Otoritas Admin
    const requester = await getSessionUser();
    if (!requester || !requester.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requesterDoc = await adminFirestore.collection('users').doc(requester.uid).get();
    if (!requesterDoc.exists || !requesterDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden: Master Admin only' }, { status: 403 });
    }

    // 2. Ambil Data Target
    const body = await request.json();
    const { targetEmail } = body;

    if (!targetEmail) {
      return NextResponse.json({ error: 'Target Email is required' }, { status: 400 });
    }

    // 3. Cari User berdasarkan Email
    const userQuery = await adminFirestore
      .collection('users')
      .where('email', '==', targetEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserDoc = userQuery.docs[0];
    const targetUserId = targetUserDoc.id;

    // 4. Lakukan Hard Reset (Hapus field verifikasi & klan)
    await adminFirestore.collection('users').doc(targetUserId).update({
      isVerified: false,
      playerTag: FieldValue.delete(),
      inGameName: FieldValue.delete(),
      thLevel: FieldValue.delete(),
      clanId: FieldValue.delete(),
      clanTag: FieldValue.delete(),
      clanRole: FieldValue.delete(),
      clanName: FieldValue.delete(),
    });

    console.log(`[Admin Reset] User ${targetEmail} verification reset by ${requester.email}`);

    // [BARU] Catat ke Audit Log
    logAdminAction(
      requester.uid,
      requester.email || 'unknown',
      'RESET_USER',
      targetEmail,
      { targetUserId }
    );

    return NextResponse.json({ 
      success: true, 
      message: `User ${targetEmail} berhasil di-reset. Mereka bisa verifikasi ulang sekarang.` 
    });

  } catch (error) {
    console.error('[Admin Reset API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}