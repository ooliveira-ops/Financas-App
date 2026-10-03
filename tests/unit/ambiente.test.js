import { describe, expect, it } from 'vitest'

// O .env.local aponta para o banco de produção. Se um teste enxergar essas variáveis,
// qualquer componente que importe src/supabase.js sem mock passa a falar com ele.
describe('ambiente de teste', () => {
  it('não carrega as VITE_* do .env.local', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBeUndefined()
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeUndefined()
    expect(import.meta.env.VITE_WHATSAPP_NUMERO).toBeUndefined()
  })

  it('não recebe as VITE_* do Supabase pelo process.env', () => {
    expect(process.env.VITE_SUPABASE_URL).toBeUndefined()
    expect(process.env.VITE_SUPABASE_ANON_KEY).toBeUndefined()
  })
})
