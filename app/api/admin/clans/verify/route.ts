import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';

// POST: Toggle status isVerified klan
export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Auth & Admin Privilege
    const user = await getSessionUser();
    if (!user || !user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden: Master Admin access required' }, { status: 403 });
    }

    // 2. Ambil Data
    const body = await request.json();
    const { clanId, isVerified } = body;

    if (!clanId) {
      return NextResponse.json({ error: 'Clan ID is required' }, { status: 400 });
    }

    // 3. Update Dokumen Klan
    await adminFirestore.collection('managedClans').doc(clanId).update({
      isVerified: isVerified
    });

    console.log(`[Admin] Clan ${clanId} verification set to ${isVerified} by ${user.email}`);

    return NextResponse.json({ success: true, clanId, isVerified });

  } catch (error) {
    console.error('[Admin Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}