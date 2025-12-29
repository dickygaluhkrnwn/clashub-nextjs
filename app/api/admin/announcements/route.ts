import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAdminAction } from '@/lib/firestore-admin/audit'; // [BARU] Import Logger

// Helper untuk verifikasi Admin
async function verifyAdmin() {
  const user = await getSessionUser();
  if (!user || !user.uid) return null;

  const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) return null;

  return user;
}

// 1. CREATE Announcement
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and Message required' }, { status: 400 });
    }

    const docRef = await adminFirestore.collection('announcements').add({
      title,
      message,
      type: type || 'info',
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid
    });

    // [BARU] Log
    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'CREATE_ANNOUNCEMENT',
        title,
        { type, id: docRef.id }
    );

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// 2. UPDATE Status (Toggle Active)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await adminFirestore.collection('announcements').doc(id).update({
      isActive: isActive
    });

    // [BARU] Log Update (Menggunakan tipe CREATE_ANNOUNCEMENT sebagai 'Update' karena belum ada tipe khusus)
    // Atau bisa didefinisikan tipe baru 'UPDATE_ANNOUNCEMENT' di audit.ts jika mau strict.
    // Di sini kita pakai CREATE dengan detail 'Update Status'
    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'CREATE_ANNOUNCEMENT', // Reuse type for general management
        id,
        { action: 'toggle_status', isActive }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// 3. DELETE Announcement
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await adminFirestore.collection('announcements').doc(id).delete();

    // [BARU] Log
    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'DELETE_ANNOUNCEMENT',
        id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}