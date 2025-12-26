'use client';

import React, { useMemo } from 'react';
import { FirestoreDocument, Promotion } from '@/lib/clashub.types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart2Icon,
  PieChartIcon,
  ThumbsUpIcon,
  AlertTriangleIcon
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PromotionAnalyticsProps {
  promotions: FirestoreDocument<Promotion>[];
}

const PIE_COLORS = [
  '#FFD700', // Gold (TH 16)
  '#DAA520', // Dark Gold (TH 15)
  '#B8860B', // Darker Gold (TH 14)
  '#F4A460', // Orange (TH 13)
  '#CD853F', // Brown (TH 12)
  '#D2691E', // Chocolate (TH 11)
  '#A9A9A9', // Grey (Others)
  '#696969', // Dark Grey (Unknown)
];

const sortTHData = (
  a: { name: string; klik: number },
  b: { name: string; klik: number },
) => {
  const thA = parseInt(a.name.replace('TH ', '')) || 0;
  const thB = parseInt(b.name.replace('TH ', '')) || 0;
  return thB - thA;
};

export const PromotionAnalytics: React.FC<PromotionAnalyticsProps> = ({
  promotions,
}) => {
  const { t } = useLanguage();

  // --- Agregasi Data ---
  const {
    totalKlikSeluruhPromosi,
    dataPerformaBanner,
    dataDemografiTH,
  } = useMemo(() => {
    let totalKlik = 0;
    const thMap = new Map<string, number>();

    const performaBanner = promotions.map((p) => {
      totalKlik += p.totalClicks || 0;

      if (p.clicksByTH) {
        for (const [th, count] of Object.entries(p.clicksByTH)) {
          const key = `TH ${th === 'unknown' ? '?' : th}`;
          thMap.set(key, (thMap.get(key) || 0) + count);
        }
      }

      return {
        name: p.title.length > 15 ? `${p.title.substring(0, 15)}...` : p.title,
        fullTitle: p.title,
        klik: p.totalClicks || 0,
      };
    }).sort((a, b) => b.klik - a.klik);

    const demografiTH = Array.from(thMap, ([name, klik]) => ({ name, klik }))
      .filter((d) => d.klik > 0)
      .sort(sortTHData);

    return {
      totalKlikSeluruhPromosi: totalKlik,
      dataPerformaBanner: performaBanner,
      dataDemografiTH: demografiTH,
    };
  }, [promotions]);

  // Empty State
  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed min-h-[200px]">
        <div className="bg-coc-gold/10 p-4 rounded-full mb-3">
            <AlertTriangleIcon className="h-8 w-8 text-coc-gold/50" />
        </div>
        <h3 className="text-lg font-clash text-white mb-1">
          {t.clanBanners.analyticsTitle}
        </h3>
        <p className="text-sm text-gray-400 font-sans text-center max-w-sm">
          {t.clanBanners.analyticsNoData}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
            <BarChart2Icon className="h-6 w-6 text-coc-gold" />
        </div>
        <h2 className="text-2xl font-clash text-white">
            {t.clanBanners.analyticsTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kartu 1: Total Klik */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-transparent border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-coc-gold/5 rounded-full blur-[50px] -z-10 group-hover:bg-coc-gold/10 transition-colors" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/5 rounded-full">
                <ThumbsUpIcon className="h-5 w-5 text-coc-gold" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              {t.clanBanners.statTotalClicks}
            </h3>
          </div>
          
          <div className="mt-2">
            <p className="text-6xl font-clash text-white drop-shadow-md">
                {totalKlikSeluruhPromosi}
            </p>
            <p className="text-sm text-coc-gold/80 font-medium mt-2">
                {t.clanBanners.statTotalClicksDesc}
            </p>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-500 font-sans italic">
                {t.clanBanners.statTotalClicksNote}
            </p>
          </div>
        </div>

        {/* Kartu 2: Performa Banner (Bar Chart) */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-[350px]">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2Icon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              {t.clanBanners.chartPerformance}
            </h3>
          </div>
          
          <div className="flex-grow w-full">
            {dataPerformaBanner.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPerformaBanner} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        interval={0}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            borderColor: 'rgba(255, 215, 0, 0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#FFD700' }}
                        formatter={(value: number) => [`${value} Clicks`, 'Total']}
                    />
                    <Bar dataKey="klik" fill="#FFD700" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs italic">
                    {t.clanBanners.chartNoData}
                </div>
            )}
          </div>
        </div>

        {/* Kartu 3: Demografi TH (Pie Chart) */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-[350px]">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              {t.clanBanners.chartDemographics}
            </h3>
          </div>
          
          <div className="flex-grow w-full relative">
            {dataDemografiTH.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={dataDemografiTH}
                        dataKey="klik"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        stroke="none"
                    >
                        {dataDemografiTH.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            borderColor: 'rgba(255, 215, 0, 0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs italic">
                    {t.clanBanners.chartNoData}
                </div>
            )}
            
            {/* Center Text Overlay */}
            {dataDemografiTH.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl font-clash text-white/20">TH</span>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PromotionAnalytics;