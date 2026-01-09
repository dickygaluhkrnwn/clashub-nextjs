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
  '#F59E0B', // Amber (TH 15)
  '#EF4444', // Red (TH 14)
  '#3B82F6', // Blue (TH 13)
  '#10B981', // Emerald (TH 12)
  '#8B5CF6', // Violet (TH 11)
  '#6B7280', // Gray (Others)
  '#374151', // Dark Gray (Unknown)
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
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm border-dashed min-h-[200px]">
        <div className="bg-[#1a1a1a] p-4 rounded-full mb-3 border border-white/5 shadow-inner">
            <AlertTriangleIcon className="h-8 w-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-clash text-white mb-1 tracking-wide">
          {t.clanBanners.analyticsTitle}
        </h3>
        <p className="text-sm text-gray-500 font-mono text-center max-w-sm">
          {t.clanBanners.analyticsNoData}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-4 px-1 border-l-4 border-coc-gold pl-4 py-1">
        <BarChart2Icon className="h-6 w-6 text-coc-gold" />
        <h2 className="text-2xl font-clash text-white tracking-wide">
            {t.clanBanners.analyticsTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kartu 1: Total Klik */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-coc-gold/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-coc-gold/5 rounded-full blur-[60px] -z-10 group-hover:bg-coc-gold/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-coc-gold/10 rounded-xl border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <ThumbsUpIcon className="h-5 w-5 text-coc-gold" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono">
              {t.clanBanners.statTotalClicks}
            </h3>
          </div>
          
          <div className="mt-4">
            <p className="text-6xl md:text-7xl font-clash text-white drop-shadow-lg tracking-tighter">
                {totalKlikSeluruhPromosi}
            </p>
            <p className="text-xs text-coc-gold font-bold mt-3 uppercase tracking-wider bg-coc-gold/10 px-3 py-1 rounded-full inline-block border border-coc-gold/20">
                {t.clanBanners.statTotalClicksDesc}
            </p>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5">
            <p className="text-[10px] text-gray-600 font-mono leading-relaxed">
                {t.clanBanners.statTotalClicksNote}
            </p>
          </div>
        </div>

        {/* Kartu 2: Performa Banner (Bar Chart) */}
        <div className="bg-[#15171e]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-[400px] relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-6 z-10">
            <BarChart2Icon className="h-4 w-4 text-coc-blue opacity-70" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              {t.clanBanners.chartPerformance}
            </h3>
          </div>
          
          <div className="flex-grow w-full z-10">
            {dataPerformaBanner.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPerformaBanner} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#6B7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                        interval={0}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                        contentStyle={{
                            backgroundColor: '#0a0a0b',
                            borderColor: 'rgba(255, 215, 0, 0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                            padding: '8px 12px'
                        }}
                        itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value} Clicks`, 'Total']}
                        labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    <Bar 
                        dataKey="klik" 
                        fill="#FFD700" 
                        radius={[0, 4, 4, 0]} 
                        barSize={16}
                        animationDuration={1500}
                    >
                        {dataPerformaBanner.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#FFD700' : 'rgba(255, 215, 0, 0.6)'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs italic">
                    <BarChart2Icon className="h-8 w-8 mb-2 opacity-20" />
                    {t.clanBanners.chartNoData}
                </div>
            )}
          </div>
        </div>

        {/* Kartu 3: Demografi TH (Pie Chart) */}
        <div className="bg-[#15171e]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-[400px] relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-6 z-10">
            <PieChartIcon className="h-4 w-4 text-purple-400 opacity-70" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              {t.clanBanners.chartDemographics}
            </h3>
          </div>
          
          <div className="flex-grow w-full relative z-10">
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
                        paddingAngle={4}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                        animationDuration={1500}
                        animationBegin={200}
                    >
                        {dataDemografiTH.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth={1}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a0a0b',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                            padding: '8px 12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value} Clicks`, 'Interest']}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs italic">
                    <PieChartIcon className="h-8 w-8 mb-2 opacity-20" />
                    {t.clanBanners.chartNoData}
                </div>
            )}
            
            {/* Center Text Overlay */}
            {dataDemografiTH.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                    <span className="text-3xl font-clash text-white tracking-tight">TH</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Interest</span>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PromotionAnalytics;