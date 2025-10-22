import { NextResponse } from 'next/server';

/**
 * Route Handler ini digunakan untuk mengatur cookie 'session-token'
 * yang disimulasikan oleh lib/server-auth.ts untuk otentikasi SSR.
 * * @param request 
 * @returns 
 */
export async function POST(request: Request) {
    // Simulasi data pengguna yang akan disimpan di token (jika ini JWT asli)
    const { uid } = await request.json(); 

    const oneDay = 60 * 60 * 24 * 1; // 1 hari dalam detik

    // Mengatur cookie dummy yang akan dibaca oleh lib/server-auth.ts
    const cookieString = `session-token=logged_in_${uid}; Max-Age=${oneDay}; Path=/; HttpOnly; SameSite=Lax;`;

    // Mengembalikan respons dengan header Set-Cookie
    return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Set-Cookie': cookieString,
            'Content-Type': 'application/json',
        },
    });
}
