import React from 'react';
import { 
    ManagedClan, UserProfile, JoinRequest
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { NotificationProps } from '@/app/components/ui/Notification';
import { MailOpenIcon, ThumbsUpIcon, ThumbsDownIcon } from '@/app/components/icons';
import { formatNumber } from '@/lib/th-utils'; // Menggunakan formatNumber untuk TH Level

interface RequestTabContentProps {
    clan: ManagedClan;
    joinRequests: JoinRequest[];
    userProfile: UserProfile;
    onAction: (message: string, type: NotificationProps['type']) => void;
    onRefresh: () => void;
}

/**
 * Komponen konten utama untuk Tab Permintaan Bergabung.
 * Menangani persetujuan dan penolakan permintaan.
 */
const RequestTabContent: React.FC<RequestTabContentProps> = ({ 
    clan, joinRequests, userProfile, onAction, onRefresh 
}) => {
    
    // Fungsi untuk memanggil API PUT Role
    const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', requesterName: string) => {
        onAction(`Memproses permintaan dari ${requesterName}...`, 'info');
        
        try {
            const response = await fetch(`/api/clan/manage/request/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, clanId: clan.id }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal ${action === 'approved' ? 'menyetujui' : 'menolak'} permintaan.`);

            let message = result.message;
            if (action === 'approved' && result.clanLink) {
                // Catatan: Link klan akan dikirimkan ke requester.
                message += ` (Link Klan telah dikirim ke requester.)`;
            }

            onAction(message, 'success');
            onRefresh(); // Refresh data server untuk update UI
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };
    
    if (joinRequests.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <MailOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada Permintaan Bergabung yang Tertunda</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Semua permintaan sudah diproses atau klan Anda belum menerima permintaan baru.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {joinRequests.map(request => (
                <div key={request.id} className="card-stone p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 border-l-4 border-coc-gold">
                    <div className="text-left flex-grow space-y-1">
                        <p className="text-lg font-clash text-white">
                            {request.requesterName} 
                            <span className="text-sm font-sans text-gray-400 ml-2">(TH {formatNumber(request.requesterThLevel)})</span>
                        </p>
                        <p className="text-sm text-gray-300 font-sans italic">"{request.message || 'Tidak ada pesan.'}"</p>
                        <p className="text-xs text-gray-500 mt-1">Diajukan: {new Date(request.timestamp).toLocaleDateString('id-ID')}</p>
                    </div>
                    
                    <div className="flex space-x-3 flex-shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'approved', request.requesterName)}
                        >
                            <ThumbsUpIcon className="h-4 w-4 mr-1" /> Terima
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'rejected', request.requesterName)}
                            className="bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
                        >
                            <ThumbsDownIcon className="h-4 w-4 mr-1" /> Tolak
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RequestTabContent;
