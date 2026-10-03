import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// O cliente delega para um vi.fn recriado a cada teste. Limpar o mesmo vi.fn com
// mockClear/mockReset faz a rejeição seguinte ser reportada como erro do teste, mesmo
// quando o handler a trata.
const mocks = vi.hoisted(() => {
  const mocks = { rpc: null }
  mocks.createClient = vi.fn(() => ({ rpc: (...args) => mocks.rpc(...args) }))
  return mocks
})

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))

const criarRes = () => {
  const res = { statusCode: null, body: null }
  res.status = (codigo) => { res.statusCode = codigo; return res }
  res.json = (corpo) => { res.body = corpo; return res }
  return res
}

describe('api/ping', () => {
  let handler

  beforeAll(async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://supabase.teste.local')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-ficticia')
    ;({ default: handler } = await import('../../../api/ping.js'))
  })

  beforeEach(() => { mocks.rpc = vi.fn() })

  it('cria o cliente com as variáveis de ambiente da function', () => {
    expect(mocks.createClient).toHaveBeenCalledWith('http://supabase.teste.local', 'chave-ficticia')
  })

  it('responde 200 com ok: true e o horário devolvido pela RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: '2026-01-01T10:00:00+00:00', error: null })
    const res = criarRes()

    await handler({}, res)

    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).toHaveBeenCalledWith('ping')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, pingedAt: '2026-01-01T10:00:00+00:00' })
  })

  it('sem data na resposta, ainda devolve um horário', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })
    const res = criarRes()

    await handler({}, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Number.isNaN(Date.parse(res.body.pingedAt))).toBe(false)
  })

  it('responde 500 quando a RPC devolve erro', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('function ping() does not exist') })
    const res = criarRes()

    await handler({}, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ ok: false, error: 'function ping() does not exist' })
  })

  it('responde 500 quando a chamada falha na rede', async () => {
    mocks.rpc.mockRejectedValue(new Error('fetch failed'))
    const res = criarRes()

    await handler({}, res)

    expect(mocks.rpc).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ ok: false, error: 'fetch failed' })
  })
})
