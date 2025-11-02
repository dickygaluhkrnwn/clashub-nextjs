// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route ini SUDAH TIDAK DIGUNAKAN (DEPRECATED)
// Sesuai Roadmap Tahap 1.2, fungsionalitasnya dipecah ke
// /api/clan/manage/[clanId]/sync/*

import { NextRequest, NextResponse } from "next/server";

/**
 * @function GET
 * @deprecated Endpoint ini tidak lagi digunakan dan telah digantikan oleh
 * API granular di /api/clan/manage/[clanId]/sync/*
 */
export async function GET(request: NextRequest) {
  console.warn(
    `[DEPRECATED] Endpoint LAMA (app/api/coc/sync-managed-clan) dipanggil. Frontend harus diperbarui.`
  );

  return NextResponse.json(
    {
      error: "Endpoint Deprecated",
      message:
        "This API endpoint is deprecated and no longer in use. Please use the new granular sync endpoints (/api/clan/manage/[clanId]/sync/*).",
    },
    { status: 410 } // 410 Gone - Status yang tepat untuk endpoint yang dinonaktifkan
  );
}
