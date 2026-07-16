import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const { error } = await supabase
      .from('assinaturas')
      .select('id')
      .limit(1)

    if (error) throw error

    res.status(200).json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
}