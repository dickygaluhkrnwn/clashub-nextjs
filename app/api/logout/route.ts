import { NextResponse } from 'next/server';

/**
 * Route Handler ini digunakan untuk menghapus cookie 'session-token'
 * sehingga Server Components tidak lagi mengenali pengguna sebagai login.
 * @returns 
 */
export async function POST() {
    // Mengatur Max-Age ke 0 (atau tanggal kadaluwarsa di masa lalu) untuk menghapus cookie.
    const cookieString = `session-token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax;`;

    // Mengembalikan respons dengan header Set-Cookie yang menghapus token
    return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Set-Cookie': cookieString,
            'Content-Type': 'application/json',
        },
    });
}
