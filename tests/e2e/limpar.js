import { createClient } from '@supabase/supabase-js'
import { supabaseLocal } from './ambiente.js'

// Depois da suíte: apaga o que escapou da limpeza de cada teste — tipicamente a conta
// de um cadastro pela tela cuja resposta chegou depois de o teste ter falhado por tempo.
// Só toca no que os testes criam: emails e2e-…@example.com e tokens com descrição "e2e".
export default async function limpar() {
  const { url, serviceRoleKey } = supabaseLocal()
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    const sobras = data.users.filter(u => /^e2e-[\w-]+@example\.com$/.test(u.email ?? ''))
    if (sobras.length === 0) break
    for (const u of sobras) await admin.auth.admin.deleteUser(u.id)
  }
  await admin.from('codigos_acesso').delete().eq('descricao', 'e2e')
}
