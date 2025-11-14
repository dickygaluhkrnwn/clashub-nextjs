import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import CarouselSection from "@/app/components/layout/CarouselSection";

// --- DATA STATIS SEMENTARA (Akan diganti di Sprint berikutnya) ---
// Data statis untuk PostCard, disesuaikan dengan props yang benar.
const latestPosts = [
    { title: "PANDUAN SERANGAN DRAGON RIDER POPULER", category: "#TH15", tag: "Strategi", stats: "1.2K Views | 2 Hari Lalu", author: "VERIFIED STRATEGIST", href: "/knowledge-hub/1" },
    { title: "5 TIPS KOMUNIKASI EFEKTIF KAPTEN TIM", category: "#TEAM", tag: "Manajemen", stats: "500 Views | 1 Minggu Lalu", author: "CLASHHUB ADVISOR", href: "/knowledge-hub/2" },
    { title: "PANDUAN BASE ANTI 3 BINTANG DI CWL", category: "#BASE", tag: "Building", stats: "2.5K Views | 3 Hari Lalu", author: "BASEMASTER", href: "/knowledge-hub/3" },
    { title: "TIPS MENGGUNAKAN ROOT RIDER UNTUK PEMULA", category: "#TH16", tag: "Strategi", stats: "890 Views | 5 Hari Lalu", author: "PROATTACKER", href: "/knowledge-hub/4" },
];
// --- AKHIR DATA STATIS ---

export default function LatestStrategies() {
    return (
        <CarouselSection title="Strategi & Tips Terbaru" icon={<BookOpenIcon className="inline-block h-6 w-6" />}>
            {latestPosts.map(post => <PostCard key={post.title} {...post} />)}
        </CarouselSection>
    );
}