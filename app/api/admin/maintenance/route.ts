import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';

// Helper verifikasi admin
async function verifyAdmin() {
  const user = await getSessionUser();
  if (!user || !user.uid) return null;

  const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) return null;

  return user;
}

// GET: Ambil status maintenance saat ini
export async function GET() {
  try {
    const docRef = adminFirestore.collection('settings').doc('general');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // Default false jika dokumen belum ada
      return NextResponse.json({ maintenanceMode: false });
    }

    return NextResponse.json({ maintenanceMode: docSnap.data()?.maintenanceMode || false });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: Toggle status maintenance
export async function POST(request: NextRequest) {
  try {
    // 1. Cek Admin
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // 2. Ambil Body
    const body = await request.json();
    const { enabled } = body; // boolean

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3. Simpan ke Firestore (Settings -> General)
    await adminFirestore.collection('settings').doc('general').set({
      maintenanceMode: enabled,
      lastUpdatedBy: admin.uid,
      lastUpdatedAt: new Date()
    }, { merge: true });

    console.log(`[Admin Maintenance] Mode set to ${enabled} by ${admin.email}`);

    return NextResponse.json({ success: true, maintenanceMode: enabled });

  } catch (error) {
    console.error('[Admin Maintenance API] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}