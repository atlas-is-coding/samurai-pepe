import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Разрешаем запросы из ngrok для разработки
        source: '/(.*)',
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  // Разрешаем использование ngrok для разработки
  // output: 'export',

  experimental: {
    allowedDevOrigins: ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok.io', 'pepesamurai.com'],
  },
};

export default nextConfig;
