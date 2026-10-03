// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { criarSupabaseFalso, sessaoDeTeste } from '../fixtures/supabaseFalso.js'

const estado = vi.hoisted(() => ({ cliente: null }))
vi.mock('../../src/supabase.js', () => ({ get supabase() { return estado.cliente } }))

const { default: App } = await import('../../src/App.jsx')

const USUARIO = 'usuario-teste'

// Banco fictício de um usuário em 15/03/2026. Contas esperadas na Home:
//   receitas do mês 3.000 | pago no mês 100 | a pagar 200
//   saldo inicial 1.000 − 500 = 500 | saldo atual 4.000 − 600 = 3.400
const bancoInicial = () => ({
  receitas: [
    { id: 1, user_id: USUARIO, fonte: 'Salário', valor: 3000, mes: '2026-03' },
    { id: 2, user_id: USUARIO, fonte: 'Salário', valor: 1000, mes: '2026-02' },
  ],
  despesas: [
    { id: 10, user_id: USUARIO, descricao: 'Mercado', valor: 200, status: 'pendente', data: '2026-03-20', data_vencimento: '2026-03-20', data_pagamento: null, categoria_id: 'c1', forma_pagamento: 'pix', parcela_atual: null, parcelas_total: null, parcelamento_id: null },
    { id: 11, user_id: USUARIO, descricao: 'Luz', valor: 100, status: 'paga', data: '2026-03-05', data_vencimento: '2026-03-05', data_pagamento: '2026-03-05', categoria_id: null, forma_pagamento: 'pix', parcela_atual: null, parcelas_total: null, parcelamento_id: null },
    { id: 12, user_id: USUARIO, descricao: 'Aluguel', valor: 500, status: 'paga', data: '2026-02-10', data_vencimento: '2026-02-10', data_pagamento: '2026-02-10', categoria_id: null, forma_pagamento: 'pix', parcela_atual: null, parcelas_total: null, parcelamento_id: null },
  ],
  assinaturas: [],
  parcelamentos: [],
  categorias: [{ id: 'c1', user_id: USUARIO, nome: 'Comida', cor: '#34d399', icone: 'Utensils', padrao: true }],
})

// Leitura paginada devolve a tabela; o resto cai no `escrita` de cada teste.
const criarCliente = ({ banco = bancoInicial(), escrita = () => undefined } = {}) => criarSupabaseFalso({
  sessao: sessaoDeTeste({ id: USUARIO }),
  responder: (c) => {
    if (c.tabela && c.tem('range')) return { data: banco[c.tabela] ?? [], error: null }
    if (c.tabela === 'profiles' && c.tem('maybeSingle')) return { data: { is_admin: false }, error: null }
    return escrita(c)
  },
})

const cardDe = (rotulo) => screen.getByText(rotulo, { selector: 'span' }).closest('[class*="rounded-2xl"]')
const valorDe = (rotulo) => cardDe(rotulo).textContent.replace(/\s/g, ' ')

const abrirApp = async () => {
  render(<App/>)
  await screen.findByText(/olá, Teste/)
  await waitFor(() => expect(valorDe('Saldo atual')).toContain('R$ 3.400,00'))
}

describe('App com o Supabase mockado', () => {
  let user

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-15T12:00:00-03:00'))
    window.scrollTo = () => {}
    localStorage.clear()
    user = userEvent.setup()
  })

  afterEach(() => {
    // Toda chamada montada precisa ter sido enviada: no cliente real, query sem
    // await/then simplesmente não acontece.
    expect(estado.cliente.naoConsumidas().map(c => c.tabela || c.rpc)).toEqual([])
    cleanup()
    vi.useRealTimers()
  })

  describe('carga inicial', () => {
    it('mostra os cards da Home com os totais certos', async () => {
      estado.cliente = criarCliente()
      await abrirApp()

      expect(valorDe('Receitas')).toContain('R$ 3.000,00')
      expect(valorDe('Pago')).toContain('R$ 100,00')
      expect(valorDe('A pagar')).toContain('R$ 200,00')
      expect(valorDe('Saldo inicial')).toContain('R$ 500,00')
    })

    it('lê as cinco tabelas paginando e filtrando pelo usuário', async () => {
      estado.cliente = criarCliente()
      await abrirApp()

      for (const tabela of ['receitas', 'despesas', 'assinaturas', 'parcelamentos', 'categorias']) {
        const [leitura] = estado.cliente.na(tabela, 'range')
        expect(leitura.args('eq'), tabela).toEqual(['user_id', USUARIO])
        expect(leitura.args('range'), tabela).toEqual([0, 499])
      }
    })

    it('leituras que podem não existir usam maybeSingle', async () => {
      estado.cliente = criarCliente()
      await abrirApp()

      const perfil = estado.cliente.na('profiles', 'select')
      const novidades = estado.cliente.na('novidades', 'select')
      for (const leitura of [...perfil, ...novidades]) {
        expect(leitura.tem('maybeSingle'), leitura.tabela).toBe(true)
        expect(leitura.tem('single'), leitura.tabela).toBe(false)
      }
      expect(perfil).toHaveLength(1)
      expect(novidades).toHaveLength(1)
    })

    it('registra o último acesso de fato (a query é enviada)', async () => {
      estado.cliente = criarCliente()
      await abrirApp()

      await waitFor(() => expect(estado.cliente.na('profiles', 'update')).toHaveLength(1))
      const [registro] = estado.cliente.na('profiles', 'update')
      expect(registro.args('eq')).toEqual(['id', USUARIO])
      expect(registro.consumida).toBe(true)
    })

    it('erro de leitura aparece na tela em vez de saldo incompleto calado', async () => {
      estado.cliente = criarSupabaseFalso({
        sessao: sessaoDeTeste({ id: USUARIO }),
        responder: (c) => {
          if (c.tabela === 'despesas' && c.tem('range')) return { data: null, error: new Error('permission denied') }
          return { data: c.tem('maybeSingle') ? null : [], error: null }
        },
      })
      render(<App/>)
      expect(await screen.findByText(/Não conseguimos carregar seus dados/)).toBeTruthy()
    })
  })

  describe('marcar despesa como paga', () => {
    const irParaDespesas = async () => {
      await user.click(screen.getByRole('button', { name: 'Despesas' }))
      return screen.findByRole('button', { name: 'Editar Mercado' })
    }

    it('update que volta com 0 linhas (RLS barrou) não faz update otimista', async () => {
      estado.cliente = criarCliente({ escrita: (c) => (c.tabela === 'despesas' && c.tem('update') ? { data: [], error: null } : undefined) })
      await abrirApp()
      await irParaDespesas()

      await user.click(screen.getByRole('button', { name: 'Marcar como paga' }))

      expect(await screen.findByText(/Nada foi atualizado/)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Editar Mercado' })).toBeTruthy()
      await user.click(screen.getByRole('button', { name: 'Início' }))
      expect(valorDe('Saldo atual')).toContain('R$ 3.400,00')
      expect(valorDe('A pagar')).toContain('R$ 200,00')
    })

    it('com sucesso, o saldo cai exatamente uma vez', async () => {
      estado.cliente = criarCliente({
        escrita: (c) => {
          if (c.tabela === 'despesas' && c.tem('update')) {
            const [, ids] = c.args('in')
            const mercado = bancoInicial().despesas.find(d => ids.includes(d.id))
            return { data: [{ ...mercado, ...c.args('update')[0] }], error: null }
          }
        },
      })
      await abrirApp()
      await irParaDespesas()

      await user.click(screen.getByRole('button', { name: 'Marcar como paga' }))
      expect(await screen.findByText(/"Mercado" paga/)).toBeTruthy()

      const [pagamento] = estado.cliente.na('despesas', 'update')
      expect(pagamento.args('update')).toEqual([{ status: 'paga', data_pagamento: '2026-03-15' }])
      expect(pagamento.args('in')).toEqual(['id', [10]])
      expect(pagamento.args('or')).toEqual(['status.is.null,status.neq.paga'])
      expect(pagamento.tem('select')).toBe(true)

      await user.click(screen.getByRole('button', { name: 'Início' }))
      expect(valorDe('Pago')).toContain('R$ 300,00')
      expect(valorDe('Saldo atual')).toContain('R$ 3.200,00')
      expect(valorDe('A pagar')).toContain('R$ 0,00')
    })

    it('erro no update é avisado e nada muda', async () => {
      estado.cliente = criarCliente({ escrita: (c) => (c.tem('update') && c.tabela === 'despesas' ? { data: null, error: { message: 'falha simulada' } } : undefined) })
      await abrirApp()
      await irParaDespesas()

      await user.click(screen.getByRole('button', { name: 'Marcar como paga' }))
      expect(await screen.findByText(/Não foi possível marcar como paga: falha simulada/)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Editar Mercado' })).toBeTruthy()
    })
  })

  describe('nova despesa', () => {
    it('categoria deixada em branco no select vai como null no insert', async () => {
      estado.cliente = criarCliente({
        escrita: (c) => (c.tabela === 'despesas' && c.tem('insert')
          ? { data: c.args('insert')[0].map((l, i) => ({ ...l, id: 100 + i })), error: null }
          : undefined),
      })
      await abrirApp()
      await user.click(screen.getByRole('button', { name: 'Despesas' }))
      await user.click(screen.getByRole('button', { name: 'Nova' }))

      const dialogo = screen.getByRole('dialog', { name: 'Nova despesa' })
      await user.type(within(dialogo).getByPlaceholderText(/Mercado, conta de luz/), 'Farmácia')
      await user.type(within(dialogo).getByPlaceholderText('0,00'), '45.9')
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar despesa' }))

      expect(await screen.findByText(/Despesa "Farmácia" criada/)).toBeTruthy()
      const [insercao] = estado.cliente.na('despesas', 'insert')
      const [linha] = insercao.args('insert')[0]
      expect(linha).toMatchObject({
        descricao: 'Farmácia', valor: 45.9, user_id: USUARIO, status: 'pendente',
        categoria_id: null, forma_pagamento: 'pix', data_vencimento: '2026-03-15',
        parcela_atual: null, parcelas_total: null,
      })
      expect(insercao.tem('select')).toBe(true)
    })

    it('em 3x cria três linhas que somam o total', async () => {
      estado.cliente = criarCliente({
        escrita: (c) => (c.tabela === 'despesas' && c.tem('insert')
          ? { data: c.args('insert')[0].map((l, i) => ({ ...l, id: 100 + i })), error: null }
          : undefined),
      })
      await abrirApp()
      await user.click(screen.getByRole('button', { name: 'Despesas' }))
      await user.click(screen.getByRole('button', { name: 'Nova' }))

      const dialogo = screen.getByRole('dialog', { name: 'Nova despesa' })
      await user.type(within(dialogo).getByPlaceholderText(/Mercado, conta de luz/), 'Geladeira')
      await user.type(within(dialogo).getByPlaceholderText('0,00'), '100')
      // Apagar o campo faz o app voltar para 1 parcela; o valor entra de uma vez.
      fireEvent.change(within(dialogo).getByRole('spinbutton', { name: /Parcelas/ }), { target: { value: '3' } })
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar despesa' }))

      expect(await screen.findByText(/Despesa "Geladeira" criada: R\$\s100,00 em 3x/)).toBeTruthy()
      const linhas = estado.cliente.na('despesas', 'insert')[0].args('insert')[0]
      expect(linhas.map(l => l.valor)).toEqual([33.33, 33.33, 33.34])
      expect(linhas.map(l => l.data_vencimento)).toEqual(['2026-03-15', '2026-04-15', '2026-05-15'])
    })
  })
})
