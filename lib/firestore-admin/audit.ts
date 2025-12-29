import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AuditActionType = 
  | 'VERIFY_CLAN' 
  | 'UNVERIFY_CLAN' 
  | 'PROMOTE_ADMIN' 
  | 'DEMOTE_ADMIN' 
  | 'RESET_USER' 
  | 'CREATE_ANNOUNCEMENT' 
  | 'DELETE_ANNOUNCEMENT'
  | 'TOGGLE_MAINTENANCE' 
  | 'UPDATE_ASSET'
  | 'DELETE_ASSET'
  | 'MANUAL_SYNC_YOUTUBE'
  | 'FORCE_SYNC_CLAN'
  | 'FORCE_SYNC_USER';

interface AuditLogEntry {
  adminUid: string;
  adminEmail: string;
  action: AuditActionType;
  target: string; // ID atau Nama objek yang diubah
  details?: any;  // Data tambahan (opsional)
  timestamp: FieldValue;
  userAgent?: string; // Opsional: info browser/device
}

/**
 * Merekam aktivitas admin ke dalam koleksi 'auditLogs'
 */
export async function logAdminAction(
  adminUid: string, 
  adminEmail: string, 
  action: AuditActionType, 
  target: string, 
  details?: any
) {
  try {
    const logEntry: AuditLogEntry = {
      adminUid,
      adminEmail,
      action,
      target,
      details: details || {},
      timestamp: FieldValue.serverTimestamp()
    };

    // Fire & Forget (Tidak perlu await agar tidak memperlambat response API utama)
    adminFirestore.collection('auditLogs').add(logEntry);
    
    console.log(`[AUDIT] ${action} by ${adminEmail} on ${target}`);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}