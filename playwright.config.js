import { defineConfig, devices } from '@playwright/test'
import { supabaseLocal } from './tests/e2e/ambiente.js'

const supabase = supabaseLocal()
const PORTA = 4174

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/preparar.js',
  globalTeardown: './tests/e2e/limpar.js',
  // Cadastro e login passam pelo hash de senha do Supabase local, lento com vários
  // testes em paralelo.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    // Sem isso o service worker do PWA serve a build anterior em cache.
    serviceWorkers: 'block',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  // Build próprio apontando para o Supabase local, numa porta separada do `npm run
  // preview`. Nunca reaproveita um servidor que já esteja rodando: ele poderia ser uma
  // build de produção.
  webServer: {
    command: 'npm run e2e:servidor',
    url: `http://127.0.0.1:${PORTA}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: supabase.url, VITE_SUPABASE_ANON_KEY: supabase.anonKey },
  },
})
