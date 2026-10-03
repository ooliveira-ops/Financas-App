import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  // O .env.local da raiz aponta para o banco de produção e o Vite o carrega em todo
  // modo, inclusive no Vitest. Os testes leem env só da pasta tests/.
  envDir: mode === 'test' ? 'tests' : '.',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Finanças',
        short_name: 'Finanças',
        description: 'App pessoal de controle financeiro',
        theme_color: '#060d1a',
        background_color: '#060d1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  test: {
    include: ['tests/unit/**/*.test.{js,jsx}'],
    environment: 'node',
    // Fuso fixo para o resultado não depender da máquina; os testes de data trocam o
    // TZ por conta própria para cobrir também o UTC do runner de CI.
    env: { TZ: 'America/Sao_Paulo' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}', 'api/**/*.js'],
      reporter: ['text', 'html', 'lcov'],
      // O piso global só pode subir: o App.jsx é monolítico e ainda tem tela sem teste.
      thresholds: {
        statements: 60, branches: 75, functions: 55, lines: 60,
        'src/utils.js': { statements: 95, branches: 95, functions: 95, lines: 95 },
        'src/calculos.js': { statements: 95, branches: 95, functions: 95, lines: 95 },
      },
    },
  },
}))
