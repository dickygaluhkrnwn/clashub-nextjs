import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { logAdminAction } from '@/lib/firestore-admin/audit';
import cocApi from '@/lib/coc-api';
import { FieldValue } from 'firebase-admin/firestore';

// Helper verifikasi admin
async function verifyAdmin() {
  const user = await getSessionUser();
  if (!user || !user.uid) return null;
  const userDoc = await adminFirestore.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isGlobalAdmin) return null;
  return user;
}

// GET: Ambil daftar featured items
export async function GET(request: NextRequest) {
  try {
    const itemsQuery = await adminFirestore
      .collection('featuredItems')
      .orderBy('createdAt', 'desc')
      .get();

    const items = itemsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: Tambah Featured Item Baru
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { tag, type, title, description } = body; // type: 'clan' | 'player'

    if (!tag || !type || !title) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Validasi Tag ke CoC API (Auto-fetch data)
    let gameData = null;
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    const encodedTag = encodeURIComponent(formattedTag);

    try {
      if (type === 'clan') {
        const clan = await cocApi.getClanData(encodedTag);
        gameData = {
          name: clan.name,
          image: clan.badgeUrls.medium,
          level: clan.clanLevel
        };
      } else {
        const player = await cocApi.getPlayerData(encodedTag);
        gameData = {
          name: player.name,
          image: player.league?.iconUrls?.medium || '', // Fallback icon liga
          level: player.townHallLevel
        };
      }
    } catch (apiError) {
      return NextResponse.json({ error: 'Tag tidak ditemukan di Clash of Clans' }, { status: 404 });
    }

    // 2. Simpan ke Firestore
    const docRef = await adminFirestore.collection('featuredItems').add({
      tag: formattedTag,
      type,
      title,
      description: description || '',
      gameData, // Simpan snapshot data game (Nama, Logo) agar tidak perlu fetch ulang di frontend
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.email
    });

    // 3. Log Audit
    logAdminAction(
      admin.uid,
      admin.email || 'unknown',
      'UPDATE_ASSET', // Reuse tipe asset update
      docRef.id,
      { action: 'feature_item', tag: formattedTag, type }
    );

    return NextResponse.json({ success: true, id: docRef.id, gameData });

  } catch (error) {
    console.error('[Featured API] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE: Hapus Item
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await adminFirestore.collection('featuredItems').doc(id).delete();

    logAdminAction(
        admin.uid,
        admin.email || 'unknown',
        'DELETE_ASSET',
        id,
        { type: 'featured_item' }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}