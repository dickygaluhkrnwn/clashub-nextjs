import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { logAdminAction } from '@/lib/firestore-admin/audit'; // [BARU] Import Logger

// Helper slugify sederhana
const toSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// Helper Auth Check
async function verifyAdmin() {
  const user = await getSessionUser();
  if (!user || !user.uid) return null;
  const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) return null;
  return user;
}

// GET: Ambil semua assets
export async function GET() {
  try {
    const snapshot = await adminFirestore.collection('gameAssets').get();
    const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: Tambah/Update Asset
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { name, type, imageUrl } = body; // type: 'troop', 'hero', 'spell', 'pet', 'equipment'

    if (!name || !type || !imageUrl) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const slug = toSlug(name);
    const docId = `${type}_${slug}`; // ID unik kombinasi tipe & nama

    await adminFirestore.collection('gameAssets').doc(docId).set({
      name,
      slug,
      type,
      imageUrl,
      updatedBy: admin.email,
      updatedAt: new Date()
    });

    // [BARU] Log
    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'UPDATE_ASSET',
        name,
        { type, docId, imageUrl }
    );

    return NextResponse.json({ success: true, docId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE: Hapus Asset
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await adminFirestore.collection('gameAssets').doc(id).delete();

    // [BARU] Log
    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'DELETE_ASSET',
        id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}