'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileTextIcon, 
  RefreshCwIcon, 
  UserIcon, 
  ClockIcon,
  AlertTriangleIcon
} from '@/app/components/icons';

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: any;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Gagal load logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('DEMOTE') || action.includes('RESET')) return 'text-coc-red bg-coc-red/10 border-coc-red/20';
    if (action.includes('MAINTENANCE') || action.includes('FORCE')) return 'text-coc-gold bg-coc-gold/10 border-coc-gold/20';
    return 'text-coc-blue bg-coc-blue/10 border-coc-blue/20';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
            <FileTextIcon className="h-8 w-8 text-coc-blue" />
            Audit Logs
          </h1>
          <p className="text-gray-400">
            Rekam jejak aktivitas admin. Memantau siapa melakukan apa dan kapan.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4">Target / Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 animate-pulse">
                    Memuat catatan...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group font-mono">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-3 w-3 opacity-50" />
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                          {log.adminEmail.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px]" title={log.adminEmail}>{log.adminEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-xs">
                      <p className="font-bold text-white mb-0.5">{log.target}</p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-gray-500 truncate max-w-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}