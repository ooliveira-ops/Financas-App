import { execSync } from 'node:child_process'

// Credenciais do Supabase LOCAL usado pelos e2e. Vêm das variáveis E2E_* (CI) ou, sem
// elas, do `supabase status`. Os testes criam e apagam usuários com a chave de serviço,
// por isso qualquer URL que não seja da própria máquina é recusada.
export function supabaseLocal() {
  if (!process.env.E2E_SUPABASE_URL) {
    let status
    try {
      const saida = execSync('npx supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      status = JSON.parse(saida.slice(saida.indexOf('{')))
    } catch {
      throw new Error('Supabase local não está rodando. Suba com `npx supabase start` (precisa do Docker).')
    }
    process.env.E2E_SUPABASE_URL = status.API_URL
    process.env.E2E_SUPABASE_ANON_KEY = status.ANON_KEY
    process.env.E2E_SUPABASE_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY
  }
  const url = process.env.E2E_SUPABASE_URL
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url)) {
    throw new Error(`E2E_SUPABASE_URL precisa ser o Supabase local (http://127.0.0.1:54321), não ${url}`)
  }
  return {
    url,
    anonKey: process.env.E2E_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
  }
}
