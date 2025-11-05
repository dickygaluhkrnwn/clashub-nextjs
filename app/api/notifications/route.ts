// File: app/api/notifications/route.ts
// Deskripsi: TAHAP 1.4 - API Endpoint untuk mengambil (GET) dan
//            menandai notifikasi sebagai terbaca (PUT).

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Notification } from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

/**
 * @handler GET
 * Mengambil daftar notifikasi untuk pengguna yang sedang login.
 * Notifikasi diurutkan dari yang terbaru (createdAt desc).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Otentikasi: Dapatkan pengguna dari sesi
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query Firestore
    // Path: /users/{uid}/notifications
    const notifRef = adminFirestore
      .collection(COLLECTIONS.USERS)
      .doc(sessionUser.uid)
      .collection(COLLECTIONS.NOTIFICATIONS)
      .orderBy('createdAt', 'desc') // Tampilkan yang terbaru di atas
      .limit(50); // Batasi 50 notifikasi terbaru

    const snapshot = await notifRef.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 }); // Kembalikan array kosong
    }

    // 3. Konversi data
    const notifications = snapshot.docs
      .map((doc) => docToDataAdmin<Notification>(doc))
      .filter(Boolean) as Notification[]; // Filter data null jika ada

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('[API Notifications GET Error]:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * @handler PUT
 * Menandai satu notifikasi spesifik sebagai 'read: true'.
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Otentikasi: Dapatkan pengguna dari sesi
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil notificationId dari body
    const { notificationId } = await request.json();
    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json(
        { error: 'Notification ID tidak valid' },
        { status: 400 }
      );
    }

    // 3. Update Dokumen di Firestore
    // Path: /users/{uid}/notifications/{notificationId}
    const docRef = adminFirestore
      .collection(COLLECTIONS.USERS)
      .doc(sessionUser.uid)
      .collection(COLLECTIONS.NOTIFICATIONS)
      .doc(notificationId);

    // Cek apakah dokumen ada sebelum update (opsional tapi bagus)
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Notifikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Lakukan update
    await docRef.update({ read: true });

    return NextResponse.json(
      { message: 'Notifikasi ditandai sebagai terbaca' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Notifications PUT Error]:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}