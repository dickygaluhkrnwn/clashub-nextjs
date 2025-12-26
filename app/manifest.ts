import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clashub Indonesia',
    short_name: 'Clashub',
    description: 'Platform Komunitas Clash of Clans Indonesia Terlengkap',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#FFD700',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/images/logoClashub.png', // Pastikan file ini ada (192x192)
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logoClashub.png', // Pastikan file ini ada (512x512)
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}