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
      // --- PENAMBAHAN BARU: Izinkan Gambar dari GitHub ---
      {
        protocol: 'https',
        hostname: 'github.com', // Untuk aset yang diupload di issue/readme
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com', // Untuk file raw
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'user-images.githubusercontent.com', // Host umum untuk gambar upload user GitHub
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Untuk avatar user GitHub
        port: '',
        pathname: '/**',
      },
      // --- Izinkan Placeholder Image (Penting untuk Default Banner) ---
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // --- AKHIR PENAMBAHAN ---
    ],
  },
};

module.exports = nextConfig;