/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // Tambahkan konfigurasi untuk remotePatterns
    remotePatterns: [
      {
        protocol: 'https', // Protokol yang digunakan (biasanya https)
        hostname: 'api-assets.clashofclans.com', // Hostname yang diizinkan
        port: '', // Kosongkan jika port standar (443 untuk https)
        pathname: '/badges/**', // Path opsional (wildcard ** mengizinkan semua path di bawah /badges/)
      },
      // --- PENAMBAHAN BARU (Langkah 5) ---
      // Izinkan gambar dari Imgur (untuk Base Building)
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Hostname umum Imgur untuk gambar
        port: '',
        pathname: '/**', // Izinkan semua path gambar
      },
      // --- PENAMBAHAN BARU (Langkah 1): Izinkan Thumbnail YouTube ---
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // Hostname untuk thumbnail YouTube
        port: '',
        pathname: '/vi/**', // Path umum untuk thumbnail video (/vi/<videoId>/...)
      },
      // --- AKHIR PENAMBAHAN ---
      // Anda bisa menambahkan pattern lain di sini jika perlu
      // Contoh: Untuk gambar placeholder jika digunakan di next/image
      // {
      //   protocol: 'https',
      //   hostname: 'placehold.co',
      // },
    ],
  },
};

module.exports = nextConfig;
