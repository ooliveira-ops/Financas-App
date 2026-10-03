import { supabaseLocal } from './ambiente.js'

// Antes do primeiro teste: espera a autenticação e a API do Supabase local responderem.
// Logo depois do `supabase start`, a primeira chamada de cada serviço demora, e vários
// testes em paralelo batendo ao mesmo tempo estouram o tempo de espera.
export default async function preparar() {
  const { url, anonKey } = supabaseLocal()
  const cabecalhos = { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  const limite = Date.now() + 60_000
  for (const caminho of ['/auth/v1/health', '/rest/v1/']) {
    for (;;) {
      try {
        const resposta = await fetch(url + caminho, { headers: cabecalhos })
        if (resposta.ok) break
      } catch { /* serviço ainda subindo */ }
      if (Date.now() > limite) throw new Error(`Supabase local não respondeu em ${caminho}`)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}
