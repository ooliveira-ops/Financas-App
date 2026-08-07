import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Keep-alive do projeto Supabase, chamado pelo cron da Vercel. Usa a função ping()
// para não depender de leitura anônima em nenhuma tabela de dados de usuário.
export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.rpc('ping')
    if (error) throw error

    res.status(200).json({ ok: true, pingedAt: data ?? new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}
