// File: app/api/posts/[postId]/route.ts
// Deskripsi: API Route untuk menghapus (DELETE) atau memperbarui (PUT) postingan
// di Knowledge Hub. Membutuhkan otorisasi penulis atau admin.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
// Import fungsi Admin SDK yang baru dibuat
import { deletePostAdmin, updatePostAdmin } from '@/lib/firestore-admin';
// Import fungsi Client SDK untuk read (aman di server components/api routes)
import { getPostById } from '@/lib/firestore';
import { Post } from '@/lib/types';

// Tipe untuk parameter rute dinamis
interface RouteParams {
    params: {
        postId: string;
    };
}

// =========================================================================
// DELETE /api/posts/[postId] - Hapus Postingan
// =========================================================================

export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const { postId } = params;

    // 1. Otorisasi Pengguna
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ message: 'Unauthorized: Sesi pengguna tidak ditemukan.' }, { status: 401 });
    }
    const userId = sessionUser.uid;

    try {
        // 2. Ambil Postingan
        const post = await getPostById(postId);

        if (!post) {
            return NextResponse.json({ message: 'Postingan tidak ditemukan.' }, { status: 404 });
        }

        // 3. Validasi Kepemilikan (Hanya Penulis atau Admin yang Boleh Hapus)
        // Catatan: Asumsi admin dapat diverifikasi dari profile Firestore (tidak diimplementasikan di sini, jadi hanya cek penulis)
        const isAuthor = post.authorId === userId;
        
        // TODO: Tambahkan logika cek peran admin di masa depan
        const isAuthorized = isAuthor; 

        if (!isAuthorized) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda bukan penulis postingan ini.' }, { status: 403 });
        }

        // 4. Hapus Postingan
        await deletePostAdmin(postId);

        return NextResponse.json({ 
            message: 'Postingan berhasil dihapus.',
        }, { status: 200 });

    } catch (error) {
        console.error(`API Error DELETE /api/posts/${postId}:`, error);
        return NextResponse.json({ message: 'Gagal menghapus postingan: ' + (error instanceof Error ? error.message : 'Kesalahan server') }, { status: 500 });
    }
}


// =========================================================================
// PUT /api/posts/[postId] - Edit Postingan
// =========================================================================

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const { postId } = params;

    // 1. Otorisasi Pengguna
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ message: 'Unauthorized: Sesi pengguna tidak ditemukan.' }, { status: 401 });
    }
    const userId = sessionUser.uid;

    try {
        // 2. Ambil Postingan Lama
        const existingPost = await getPostById(postId);

        if (!existingPost) {
            return NextResponse.json({ message: 'Postingan tidak ditemukan.' }, { status: 404 });
        }

        // 3. Validasi Kepemilikan
        if (existingPost.authorId !== userId) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda bukan penulis postingan ini.' }, { status: 403 });
        }

        // 4. Ambil Payload Update
        // Catatan: Payload di sini harus sesuai dengan tipe Partial<Post>
        const updatedData = await request.json() as Partial<Post>;

        // 5. Validasi Minimal Data
        if (!updatedData.title || !updatedData.content) {
             return NextResponse.json({ message: 'Judul dan konten wajib diisi.' }, { status: 400 });
        }
        
        // 6. Update Postingan
        await updatePostAdmin(postId, updatedData);

        return NextResponse.json({ 
            message: 'Postingan berhasil diperbarui.',
            postId: postId
        }, { status: 200 });

    } catch (error) {
        console.error(`API Error PUT /api/posts/${postId}:`, error);
        return NextResponse.json({ message: 'Gagal memperbarui postingan: ' + (error instanceof Error ? error.message : 'Kesalahan server') }, { status: 500 });
    }
}
