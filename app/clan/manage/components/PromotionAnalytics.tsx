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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart2Icon,
  PieChartIcon,
  ThumbsUpIcon,
} from '@/app/components/icons';

interface PromotionAnalyticsProps {
  promotions: FirestoreDocument<Promotion>[];
}

// Warna untuk Pie Chart
const PIE_COLORS = [
  '#FFD700', // Emas (TH 16)
  '#DAA520', // Emas Gelap (TH 15)
  '#B8860B', // Emas Sangat Gelap (TH 14)
  '#F4A460', // Oranye (TH 13)
  '#CD853F', // Coklat (TH 12)
  '#D2691E', // Coklat Tua (TH 11)
  '#A9A9A9', // Abu-abu (TH Lainnya)
  '#696969', // Abu-abu Gelap (Unknown)
];

// Helper untuk mengurutkan data TH
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
  // --- Agregasi Data ---
  const {
    totalKlikSeluruhPromosi,
    dataPerformaBanner,
    dataDemografiTH,
  } = useMemo(() => {
    let totalKlik = 0;
    const thMap = new Map<string, number>();

    // 1. Hitung total klik dan performa per banner
    const performaBanner = promotions.map((p) => {
      totalKlik += p.totalClicks || 0;

      // 2. Agregasi data TH dari SETIAP promosi
      if (p.clicksByTH) {
        for (const [th, count] of Object.entries(p.clicksByTH)) {
          const key = `TH ${th === 'unknown' ? '?' : th}`;
          thMap.set(key, (thMap.get(key) || 0) + count);
        }
      }

      return {
        name: p.title.length > 20 ? `${p.title.substring(0, 20)}...` : p.title,
        klik: p.totalClicks || 0,
      };
    }).sort((a, b) => b.klik - a.klik); // Urutkan banner terpopuler

    // 3. Konversi map Demografi TH ke array
    const demografiTH = Array.from(thMap, ([name, klik]) => ({ name, klik }))
      .filter((d) => d.klik > 0) // Hanya tampilkan yang ada klik
      .sort(sortTHData); // Urutkan berdasarkan level TH

    return {
      totalKlikSeluruhPromosi: totalKlik,
      dataPerformaBanner: performaBanner,
      dataDemografiTH: demografiTH,
    };
  }, [promotions]);
  // --- Akhir Agregasi Data ---

  // Jika tidak ada data promosi sama sekali
  if (promotions.length === 0) {
    return (
      <div className="card-stone p-6 text-center">
        <h3 className="text-xl font-clash text-coc-gold mb-2">
          Laporan Analitik
        </h3>
        <p className="text-gray-400 font-sans">
          Belum ada data analitik. Buat promosi baru untuk mulai melacak performa.
        </p>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-clash text-coc-gold mb-4">
        Laporan Analitik
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kartu 1: Total Klik */}
        <div className="card-stone p-6 flex flex-col justify-between h-[350px] lg:h-[300px]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ThumbsUpIcon className="h-5 w-5 text-coc-gold" />
              <h3 className="text-lg font-clash text-coc-gold-light">
                Total Klik (Semua Banner)
              </h3>
            </div>
            <p className="text-5xl font-clash text-white">
              {totalKlikSeluruhPromosi}
            </p>
            <p className="font-sans text-gray-400">
              Total klik yang tercatat dari semua banner promosi Anda.
            </p>
          </div>
          <div className="font-sans text-sm text-gray-500 mt-4">
            Statistik ini membantu mengukur jangkauan total promosi Anda.
          </div>
        </div>

        {/* Kartu 2: Performa Banner (Bar Chart) */}
        <div className="card-stone p-6 h-[300px]">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2Icon className="h-5 w-5 text-coc-gold" />
            <h3 className="text-lg font-clash text-coc-gold-light">
              Performa per Banner
            </h3>
          </div>
          {dataPerformaBanner.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={dataPerformaBanner} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#E0E0E0"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 215, 0, 0.1)' }}
                  contentStyle={{
                    backgroundColor: '#262626',
                    borderColor: '#B8860B',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="klik" fill="#FFD700" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center pt-10">Tidak ada data.</p>
          )}
        </div>

        {/* Kartu 3: Demografi TH (Pie Chart) */}
        <div className="card-stone p-6 h-[300px]">
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon className="h-5 w-5 text-coc-gold" />
            <h3 className="text-lg font-clash text-coc-gold-light">
              Demografi TH
            </h3>
          </div>
          {dataDemografiTH.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={dataDemografiTH}
                  dataKey="klik"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  // [FIX V4] Mengganti entry.klik menjadi entry.value
                  label={(entry) => `${entry.name} (${entry.value})`}
                  labelLine={false}
                  fontSize={12}
                >
                  {dataDemografiTH.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#262626',
                    borderColor: '#B8860B',
                    borderRadius: '8px',
                  }}
                />
                {/* <Legend /> */}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center pt-10">
              Belum ada klik tercatat.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionAnalytics;