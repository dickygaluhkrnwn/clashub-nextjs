// File: app/api/clan/manage/[clanId]/profile/route.ts
// Deskripsi: API route untuk mengambil (GET) dan memperbarui (POST) data profil internal klan.

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers'; // Diperlukan untuk getSessionUser
import { getSessionUser } from '@/lib/server-auth'; // Otorisasi
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans'; // Mengambil data klan
import { cleanDataForAdminSDK } from '@/lib/firestore-admin/utils'; // Membersihkan data untuk update
import { adminFirestore } from '@/lib/firebase-admin'; // Akses database admin
import { COLLECTIONS } from '@/lib/firestore-collections';
// [FIX ERROR 2304] Menambahkan 'FirestoreDocument' ke daftar impor
import {
  ClanSocialLink,
  ManagedClan,
  FirestoreDocument,
} from '@/lib/clashub.types'; // Tipe data kita

/**
 * @handler GET
 * Mengambil data profil publik untuk sebuah klan (deskripsi, aturan, link).
 * Endpoint ini bisa diakses siapa saja untuk melihat profil internal.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clanId: string } },
) {
  const { clanId } = params;

  if (!clanId) {
    return NextResponse.json({ error: 'Clan ID tidak ditemukan' }, { status: 400 });
  }

  try {
    const clan = await getManagedClanDataAdmin(clanId);
    if (!clan) {
      return NextResponse.json({ error: 'Klan tidak ditemukan' }, { status: 404 });
    }

    // Ekstrak hanya data profil yang relevan untuk ditampilkan
    const profileData = {
      profileDescription: clan.profileDescription || '',
      clanRules: clan.clanRules || '',
      recruitingStatus: clan.recruitingStatus || 'Closed',
      socialLinks: clan.socialLinks || [],
    };

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error(
      `[API GET /profile] Error fetching clan profile ${clanId}:`,
      error,
    );
    return NextResponse.json(
      { error: 'Gagal mengambil data profil klan' },
      { status: 500 },
    );
  }
}

/**
 * @handler POST
 * Memperbarui data profil klan (deskripsi, aturan, status rekrutmen, link sosial).
 * Endpoint ini HANYA bisa diakses oleh 'ownerUid' (Leader) klan.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clanId: string } },
) {
  const { clanId } = params;

  if (!clanId) {
    return NextResponse.json({ error: 'Clan ID tidak ditemukan' }, { status: 400 });
  }

  // 1. Otentikasi: Siapa user ini?
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Otentikasi diperlukan untuk aksi ini' },
      { status: 401 },
    );
  }

  // 2. Otorisasi: Apakah user ini leader klan yang dituju?
  let clan: FirestoreDocument<ManagedClan> | null;
  try {
    clan = await getManagedClanDataAdmin(clanId);
    if (!clan) {
      return NextResponse.json({ error: 'Klan tidak ditemukan' }, { status: 404 });
    }

    // Pengecekan kritis: UID pengguna harus sama dengan ownerUid klan
    if (clan.ownerUid !== user.uid) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda bukan leader klan ini' },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error(
      `[API POST /profile] Error authorizing user ${user.uid} for clan ${clanId}:`,
      error,
    );
    return NextResponse.json(
      { error: 'Gagal memverifikasi otorisasi Anda' },
      { status: 500 },
    );
  }

  // 3. Validasi Body & Update Data
  let body;
  try {
    body = await request.json();

    // Validasi payload (dasar)
    const {
      profileDescription,
      clanRules,
      recruitingStatus,
      socialLinks,
    } = body;

    // Memastikan tipe data dasar sudah benar sebelum dikirim ke database
    if (
      typeof profileDescription !== 'string' ||
      typeof clanRules !== 'string' ||
      !['Open', 'Invite Only', 'Closed'].includes(recruitingStatus) ||
      !Array.isArray(socialLinks)
    ) {
      return NextResponse.json(
        { error: 'Data payload tidak valid atau tidak lengkap' },
        { status: 400 },
      );
    }

    // Payload update
    const updatePayload: Partial<ManagedClan> = {
      profileDescription,
      clanRules,
      recruitingStatus,
      socialLinks: socialLinks as ClanSocialLink[], // Kita percaya struktur array dari client
    };

    // 4. Simpan ke Firestore
    const docRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    // Gunakan cleanDataForAdminSDK untuk membersihkan undefined/null
    // dan mengonversi Date (jika ada) ke Timestamp
    const cleanedPayload = cleanDataForAdminSDK(updatePayload);

    await docRef.update(cleanedPayload);

    return NextResponse.json(
      { success: true, message: 'Profil klan berhasil diperbarui' },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `[API POST /profile] Error updating clan profile ${clanId}:`,
      error,
    );
    if (error instanceof SyntaxError) {
      // Error jika JSON.parse(body) gagal
      return NextResponse.json({ error: 'Payload JSON tidak valid' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Gagal memperbarui profil klan' },
      { status: 500 },
    );
  }
}