import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Разрешаем запросы из ngrok для разработки
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Разрешаем использование ngrok для разработки
  output: 'export',

  experimental: {
    allowedDevOrigins: ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok.io', "pepesamurai.com"],
  },
};

export default nextConfig;
