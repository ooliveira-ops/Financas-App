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
const criarCliente = ({ banco = bancoInicial(), escrita = () => undefined, admin = false } = {}) => criarSupabaseFalso({
  sessao: sessaoDeTeste({ id: USUARIO }),
  responder: (c) => {
    if (c.tabela && c.tem('range')) return { data: banco[c.tabela] ?? [], error: null }
    if (c.tabela === 'profiles' && c.tem('maybeSingle')) return { data: { is_admin: admin }, error: null }
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

    it('o saldo atual aparece na própria aba Despesas e cai na hora do pagamento', async () => {
      estado.cliente = criarCliente({
        escrita: (c) => {
          if (c.tabela === 'despesas' && c.tem('update')) {
            const mercado = bancoInicial().despesas.find(d => d.id === 10)
            return { data: [{ ...mercado, ...c.args('update')[0] }], error: null }
          }
        },
      })
      await abrirApp()
      await irParaDespesas()
      const saldoNaAba = () => screen.getByText('Saldo atual', { selector: 'p' }).parentElement.textContent.replace(/\s/g, ' ')

      expect(saldoNaAba()).toContain('R$ 3.400,00')
      await user.click(screen.getByRole('button', { name: 'Marcar como paga' }))
      await waitFor(() => expect(saldoNaAba()).toContain('R$ 3.200,00'))
      expect(screen.queryByText('Saldo atual', { selector: 'span' })).toBeNull()
    })

    it('sem receita, a aba Despesas mostra traço no saldo', async () => {
      estado.cliente = criarCliente({ banco: { ...bancoInicial(), receitas: [] } })
      render(<App/>)
      await screen.findByText(/olá, Teste/)
      await user.click(screen.getByRole('button', { name: 'Despesas' }))
      const bloco = (await screen.findByText('Saldo atual', { selector: 'p' })).parentElement
      expect(bloco.textContent).toContain('—')
      expect(bloco.textContent).not.toContain('R$')
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

  describe('acertar o saldo com o banco', () => {
    // Ajuste é uma receita gravada no mês anterior; o insert devolve a linha criada.
    const gravaAjuste = (c) => (c.tabela === 'receitas' && c.tem('insert')
      ? { data: { id: 99, created_at: '2026-03-15T15:00:00Z', ...c.args('insert')[0] }, error: null }
      : undefined)
    const abrirModal = async () => {
      await user.click(cardDe('Saldo inicial'))
      return screen.getByRole('dialog', { name: 'Saldo inicial' })
    }

    it('"Registrar saldo atual" é o padrão e faz o saldo atual virar o valor informado', async () => {
      estado.cliente = criarCliente({ escrita: gravaAjuste })
      await abrirApp()
      const modal = await abrirModal()

      expect(within(modal).getByRole('button', { name: 'Registrar saldo atual', pressed: true })).toBeTruthy()
      expect(modal.textContent.replace(/\s/g, ' ')).toContain('Hoje o app calcula R$ 3.400,00')
      await user.type(within(modal).getByPlaceholderText('0,00'), '3000')
      expect(modal.textContent.replace(/\s/g, ' ')).toContain('correção de −R$ 400,00')
      await user.click(within(modal).getAllByRole('button', { name: 'Registrar saldo atual' }).at(-1))

      expect(await screen.findByText(/Saldo atual registrado em R\$\s3\.000,00 \(−R\$\s400,00\)/)).toBeTruthy()
      const [ajuste] = estado.cliente.na('receitas', 'insert')
      expect(ajuste.args('insert')[0]).toMatchObject({ fonte: 'Ajuste de saldo', valor: -400, mes: '2026-02', user_id: USUARIO })
      expect(valorDe('Saldo atual')).toContain('R$ 3.000,00')
      expect(valorDe('Saldo inicial')).toContain('R$ 100,00')
      expect(valorDe('Receitas')).toContain('R$ 3.000,00')

      // A correção aparece dizendo o que corrige e quando foi feita, não só o mês.
      const reaberto = await abrirModal()
      const texto = reaberto.textContent.replace(/\s/g, ' ')
      expect(texto).toContain('Correção do saldo até Fevereiro 2026')
      expect(texto).toContain('feita em 15/03/2026')
      expect(texto).toContain('−R$ 400,00')
      expect(within(reaberto).getByRole('button', { name: 'Desfazer correção' })).toBeTruthy()
    })

    it('"Saldo do início do mês" continua acertando só o começo do mês', async () => {
      estado.cliente = criarCliente({ escrita: gravaAjuste })
      await abrirApp()
      const modal = await abrirModal()

      await user.click(within(modal).getByRole('button', { name: 'Saldo do início do mês' }))
      expect(modal.textContent).toContain('Quanto você tinha no dia 1º de Março 2026')
      expect(modal.textContent).toContain('Não é receita do mês')
      await user.type(within(modal).getByPlaceholderText('0,00'), '600')
      await user.click(within(modal).getByRole('button', { name: 'Registrar saldo do dia 1º' }))

      expect(await screen.findByText(/Saldo inicial ajustado para R\$\s600,00/)).toBeTruthy()
      expect(estado.cliente.na('receitas', 'insert')[0].args('insert')[0]).toMatchObject({ valor: 100, mes: '2026-02' })
      expect(valorDe('Saldo inicial')).toContain('R$ 600,00')
      expect(valorDe('Saldo atual')).toContain('R$ 3.500,00')
    })

    it('valor igual ao calculado não grava nada', async () => {
      estado.cliente = criarCliente({ escrita: gravaAjuste })
      await abrirApp()
      const modal = await abrirModal()

      await user.type(within(modal).getByPlaceholderText('0,00'), '3400')
      expect(modal.textContent).toContain('Já está nesse valor.')
      expect(within(modal).getAllByRole('button', { name: 'Registrar saldo atual' }).at(-1).disabled).toBe(true)
      expect(estado.cliente.na('receitas', 'insert')).toEqual([])
    })
  })

  describe('painel de novidades (admin)', () => {
    const PERFIS = [{ id: USUARIO, nome: 'Teste', email: 'teste@example.com', is_admin: true, created_at: '2026-01-01T00:00:00Z' }]
    // Tabela de novidades vazia, como numa instalação nova. `publicar` decide o retorno do upsert.
    const banco = (publicar) => (c) => {
      if (c.tabela === 'profiles' && c.tem('order')) return { data: PERFIS, error: null }
      if (c.tabela === 'novidades' && c.tem('maybeSingle')) return { data: null, error: null }
      if (c.tabela === 'novidades' && c.tem('upsert')) return publicar(c)
      if (c.tabela === 'novidades' && c.tem('update')) return { data: [], error: null }
      return undefined
    }
    const abrirPainel = async () => {
      await user.click(screen.getByRole('button', { name: 'Usuários' }))
      return screen.findByRole('heading', { name: /Gerenciar Novidades/ })
    }
    const preencherEPublicar = async (versao) => {
      await user.type(screen.getByPlaceholderText(/Nova novidade/), 'Item fictício{Enter}')
      await user.type(screen.getByPlaceholderText('ex: v4'), versao)
      await user.click(screen.getByRole('button', { name: 'Publicar novidades' }))
    }

    it('abre com a tabela vazia sem erro, lendo com maybeSingle', async () => {
      estado.cliente = criarCliente({ admin: true, escrita: banco(() => undefined) })
      await abrirApp()
      await abrirPainel()

      expect(await screen.findByText('Nenhum item ainda.')).toBeTruthy()
      expect(screen.queryByText(/Erro/)).toBeNull()
      const leituras = estado.cliente.na('novidades', 'select').filter(c => !c.tem('upsert'))
      expect(leituras.length).toBeGreaterThanOrEqual(2)
      expect(leituras.every(c => c.tem('maybeSingle') && !c.tem('single'))).toBe(true)
    })

    it('grava a versão nova antes de desativar as outras, com a versão aparada', async () => {
      estado.cliente = criarCliente({
        admin: true,
        escrita: banco((c) => ({ data: [{ id: 'n1', ...c.args('upsert')[0] }], error: null })),
      })
      await abrirApp()
      await abrirPainel()
      await preencherEPublicar(' v5 ')

      expect(await screen.findByText(/Salvo! Todos os usuários/)).toBeTruthy()
      const escritas = estado.cliente.chamadas.filter(c => c.tabela === 'novidades' && (c.tem('upsert') || c.tem('update')))
      expect(escritas.map(c => (c.tem('upsert') ? 'upsert' : 'update'))).toEqual(['upsert', 'update'])
      expect(escritas[0].args('upsert')[0]).toMatchObject({ versao: 'v5', ativo: true })
      expect(escritas[0].tem('select')).toBe(true)
      expect(escritas[1].args('neq')).toEqual(['versao', 'v5'])
    })

    it('gravação barrada (0 linhas) avisa e não desativa as versões anteriores', async () => {
      estado.cliente = criarCliente({ admin: true, escrita: banco(() => ({ data: [], error: null })) })
      await abrirApp()
      await abrirPainel()
      await preencherEPublicar('v5')

      expect(await screen.findByText(/a versão não foi gravada/)).toBeTruthy()
      expect(estado.cliente.na('novidades', 'update')).toEqual([])
    })
  })

  describe('concluir parcelamento', () => {
    const PIZZA = { id: 'p1', user_id: USUARIO, descricao: 'Pizza', valor_total: 60, parcelas_total: 1, parcelas_pagas: 1, valor_pago: 60, status: 'finalizado', concluido: false, proxima_parcela_data: '2026-03-01' }
    const OCULOS = { id: 'p2', user_id: USUARIO, descricao: 'Óculos', valor_total: 900, parcelas_total: 3, parcelas_pagas: 1, valor_pago: 300, status: 'ativo', concluido: false, proxima_parcela_data: '2026-04-01' }
    const comParcelamentos = (...lista) => ({ ...bancoInicial(), parcelamentos: lista })
    // Update de parcelamento devolve a linha com o que foi gravado.
    const gravaParcelamento = (c) => {
      if (c.tabela !== 'parcelamentos' || !c.tem('update')) return undefined
      const [, id] = c.args('eq')
      const atual = [PIZZA, OCULOS].find(p => p.id === id)
      return { data: { ...atual, ...c.args('update')[0] }, error: null }
    }
    const irParaParcelamentos = async () => {
      await user.click(screen.getByRole('button', { name: 'Parcelamentos' }))
      await screen.findByRole('heading', { name: 'Óculos' })
    }

    it('só o quitado oferece "Marcar como concluído", e concluir tira da lista', async () => {
      estado.cliente = criarCliente({ banco: comParcelamentos(PIZZA, OCULOS), escrita: gravaParcelamento })
      await abrirApp()
      await irParaParcelamentos()

      expect(screen.getAllByRole('button', { name: 'Marcar como concluído' })).toHaveLength(1)
      await user.click(screen.getByRole('button', { name: 'Marcar como concluído' }))

      expect(await screen.findByText(/"Pizza" concluído/)).toBeTruthy()
      const [gravacao] = estado.cliente.na('parcelamentos', 'update')
      expect(gravacao.args('update')).toEqual([{ concluido: true }])
      expect(gravacao.args('eq')).toEqual(['id', 'p1'])
      expect(gravacao.tem('select') && gravacao.tem('maybeSingle')).toBe(true)

      expect(screen.queryByRole('heading', { name: 'Pizza' })).toBeNull()
      expect(screen.getByRole('heading', { name: 'Óculos' })).toBeTruthy()
      const recolhido = screen.getByRole('button', { name: /Concluídos \(1\)/ })
      expect(recolhido.getAttribute('aria-expanded')).toBe('false')
      await user.click(recolhido)
      expect(screen.getByText('Pizza')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Reabrir' })).toBeTruthy()
    })

    it('reabrir devolve o parcelamento à lista', async () => {
      estado.cliente = criarCliente({ banco: comParcelamentos({ ...PIZZA, concluido: true }, OCULOS), escrita: gravaParcelamento })
      await abrirApp()
      await irParaParcelamentos()

      expect(screen.queryByRole('heading', { name: 'Pizza' })).toBeNull()
      await user.click(screen.getByRole('button', { name: /Concluídos \(1\)/ }))
      await user.click(screen.getByRole('button', { name: 'Reabrir' }))

      expect(await screen.findByText(/"Pizza" voltou para a lista/)).toBeTruthy()
      expect(estado.cliente.na('parcelamentos', 'update')[0].args('update')).toEqual([{ concluido: false }])
      expect(screen.getByRole('heading', { name: 'Pizza' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /Concluídos/ })).toBeNull()
    })

    it('update barrado (0 linhas) avisa e não tira da lista', async () => {
      estado.cliente = criarCliente({
        banco: comParcelamentos(PIZZA, OCULOS),
        escrita: (c) => (c.tabela === 'parcelamentos' && c.tem('update') ? { data: null, error: null } : undefined),
      })
      await abrirApp()
      await irParaParcelamentos()

      await user.click(screen.getByRole('button', { name: 'Marcar como concluído' }))
      expect(await screen.findByText(/O parcelamento não foi atualizado/)).toBeTruthy()
      expect(screen.getByRole('heading', { name: 'Pizza' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /Concluídos/ })).toBeNull()
    })

    it('banco sem a coluna nova: o erro diz qual migração rodar', async () => {
      estado.cliente = criarCliente({
        banco: comParcelamentos(PIZZA, OCULOS),
        escrita: (c) => (c.tabela === 'parcelamentos' && c.tem('update')
          ? { data: null, error: { message: "Could not find the 'concluido' column of 'parcelamentos' in the schema cache" } }
          : undefined),
      })
      await abrirApp()
      await irParaParcelamentos()

      await user.click(screen.getByRole('button', { name: 'Marcar como concluído' }))
      expect(await screen.findByText(/Rode no Supabase as migrações do supabase\/supabase-setup\.sql/)).toBeTruthy()
      expect(screen.getByRole('heading', { name: 'Pizza' })).toBeTruthy()
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
