import { describe, expect, it } from 'vitest'
import { PAGINA, buscarTodos } from '../../src/dados.js'
import { criarSupabaseFalso } from '../fixtures/supabaseFalso.js'

const linhas = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, valor: 1 }))

// Simula o PostgREST: devolve a fatia pedida pelo range, cortada no max-rows.
const bancoCom = (total, maxRows = 1000) => criarSupabaseFalso({
  responder: (c) => {
    const [de, ate] = c.args('range')
    return { data: linhas(total).slice(de, Math.min(ate + 1, de + maxRows)), error: null }
  },
})

describe('buscarTodos', () => {
  it('pagina além das 1000 linhas e devolve todas', async () => {
    const cliente = bancoCom(1201)
    const todas = await buscarTodos(cliente, 'despesas', 'usuario-teste')

    expect(todas).toHaveLength(1201)
    expect(new Set(todas.map(l => l.id)).size).toBe(1201)
    expect(cliente.chamadas.map(c => c.args('range'))).toEqual([[0, 499], [500, 999], [1000, 1499]])
  })

  it('filtra pelo usuário e ordena por id, para as páginas não se sobreporem', async () => {
    const cliente = bancoCom(10)
    await buscarTodos(cliente, 'receitas', 'usuario-teste')
    const [chamada] = cliente.chamadas
    expect(chamada.tabela).toBe('receitas')
    expect(chamada.args('eq')).toEqual(['user_id', 'usuario-teste'])
    expect(chamada.args('order')).toEqual(['id', { ascending: true }])
  })

  it('total múltiplo da página: busca uma página vazia e para', async () => {
    const cliente = bancoCom(PAGINA * 2)
    expect(await buscarTodos(cliente, 'despesas', 'u')).toHaveLength(PAGINA * 2)
    expect(cliente.chamadas).toHaveLength(3)
  })

  it('tabela vazia: uma chamada só', async () => {
    const cliente = bancoCom(0)
    expect(await buscarTodos(cliente, 'despesas', 'u')).toEqual([])
    expect(cliente.chamadas).toHaveLength(1)
  })

  it('erro em qualquer página é lançado, não vira lista parcial', async () => {
    const erro = new Error('permission denied')
    const cliente = criarSupabaseFalso({
      responder: (c) => c.args('range')[0] === 0 ? { data: linhas(PAGINA), error: null } : { data: null, error: erro },
    })
    await expect(buscarTodos(cliente, 'despesas', 'u')).rejects.toBe(erro)
  })

  it('toda página pedida é de fato enviada', async () => {
    const cliente = bancoCom(1201)
    await buscarTodos(cliente, 'despesas', 'u')
    expect(cliente.naoConsumidas()).toEqual([])
  })
})
