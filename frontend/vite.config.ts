// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';
import fs from 'fs';
import path from 'path';

// Определяем base URL в зависимости от окружения
// Для Tauri build используем '/', для веб-версии '/RIP-BMSTU-FRONTED/'
// Tauri устанавливает переменные окружения при сборке
const isTauriBuild = process.env.TAURI_PLATFORM !== undefined || 
                     process.env.TAURI_FAMILY !== undefined ||
                     process.env.TAURI_BUILD === 'true';
const base = isTauriBuild ? '/' : '/RIP-BMSTU-FRONTED/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tsconfigPaths(),
    mkcert(), // ← настоящий HTTPS-сертификат
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true }, // PWA работает даже в dev-режиме
      // Отключаем PWA для Tauri build
      disable: isTauriBuild,
      manifest: {
        name: 'Расчёт утеплителя',
        short_name: 'Утеплитель',
        theme_color: '#422711',
        background_color: '#f8f8f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: isTauriBuild ? '/pwa-192x192.png' : '/RIP-BMSTU-FRONTED/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: isTauriBuild ? '/pwa-512x512.png' : '/RIP-BMSTU-FRONTED/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: isTauriBuild ? '/pwa-512x512.png' : '/RIP-BMSTU-FRONTED/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],

  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
    },           // mkcert даёт валидный сертификат
    host: '0.0.0.0',     // слушает все интерфейсы → доступно по твоему IP
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
          // Используем localhost, так как бэкенд должен быть доступен локально
          // Если бэкенд на другом IP, измените на нужный адрес
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // Логируем запросы для отладки
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      '/insulation-image': {                   // ← если у тебя отдельный сервер картинок
        target: 'http://localhost:9000',   // или localhost:9000
        changeOrigin: true,
        secure: false
      }
    }
  },

  clearScreen: false
});