import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';

// POST: Mengubah status admin (Promote/Demote)
export async function POST(request: NextRequest) {
  try {
    // 1. Cek Login
    const requester = await getSessionUser();
    if (!requester || !requester.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Cek Apakah Pengirim adalah Global Admin
    const requesterDoc = await adminFirestore.collection('users').doc(requester.uid).get();
    if (!requesterDoc.exists || !requesterDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden: You are not a Master Admin' }, { status: 403 });
    }

    // 3. Ambil Data Body
    const body = await request.json();
    const { targetEmail, action } = body; // action: 'promote' | 'demote'

    if (!targetEmail || !action) {
      return NextResponse.json({ error: 'Email and action are required' }, { status: 400 });
    }

    // 4. Cari User berdasarkan Email
    const userQuery = await adminFirestore
      .collection('users')
      .where('email', '==', targetEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserDoc = userQuery.docs[0];
    const targetUserData = targetUserDoc.data();

    // Pencegahan: Admin tidak bisa mendemote dirinya sendiri lewat API ini (untuk keamanan diri sendiri)
    if (action === 'demote' && targetUserDoc.id === requester.uid) {
      return NextResponse.json({ error: 'You cannot demote yourself.' }, { status: 400 });
    }

    // 5. Eksekusi Update
    const isGlobalAdmin = action === 'promote';
    
    await targetUserDoc.ref.update({
      isGlobalAdmin: isGlobalAdmin
    });

    console.log(`[Admin Role] ${requester.email} ${action}d ${targetEmail}`);

    return NextResponse.json({ 
      success: true, 
      message: `User ${targetUserData.displayName || targetEmail} has been ${action}d successfully.`,
      user: {
        uid: targetUserDoc.id,
        email: targetUserData.email,
        displayName: targetUserData.displayName,
        isGlobalAdmin: isGlobalAdmin
      }
    });

  } catch (error) {
    console.error('[Admin Role API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}