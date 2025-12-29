import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { logAdminAction } from '@/lib/firestore-admin/audit'; // Integrasi Audit Log

// Helper Auth Check
async function verifyAdmin() {
  const user = await getSessionUser();
  if (!user || !user.uid) return null;
  const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) return null;
  return user;
}

// GET: Ambil daftar postingan (Limit 50 terbaru)
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const postsQuery = await adminFirestore
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const posts = postsQuery.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Serialisasi timestamp untuk client
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        };
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PUT: Toggle Featured/Pinned Status
export async function PUT(request: NextRequest) {
    try {
      const admin = await verifyAdmin();
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
      const body = await request.json();
      const { postId, isFeatured } = body;
  
      if (!postId) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
      await adminFirestore.collection('posts').doc(postId).update({
        isFeatured: isFeatured
      });

      // Log activity
      logAdminAction(
          admin.uid,
          admin.email || 'unknown',
          'UPDATE_ASSET', // Kita reuse tipe ini atau bisa buat baru 'MODERATE_POST'
          postId,
          { action: 'toggle_featured', isFeatured }
      );
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// DELETE: Hapus Postingan
export async function DELETE(request: NextRequest) {
    try {
      const admin = await verifyAdmin();
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
  
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
      // Ambil data post dulu untuk log judulnya sebelum dihapus
      const postDoc = await adminFirestore.collection('posts').doc(id).get();
      const postTitle = postDoc.exists ? postDoc.data()?.title : 'Unknown Post';

      await adminFirestore.collection('posts').doc(id).delete();

      // Log activity
      logAdminAction(
          admin.uid,
          admin.email || 'unknown',
          'DELETE_ASSET', // Reuse tipe delete asset
          id,
          { title: postTitle, type: 'knowledge_hub_post' }
      );
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}