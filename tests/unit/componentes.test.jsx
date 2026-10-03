// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { criarSupabaseFalso } from '../fixtures/supabaseFalso.js'

vi.mock('../../src/supabase.js', () => ({ supabase: criarSupabaseFalso() }))

const { AJUDA_CONTEUDO, BotaoAjuda } = await import('../../src/Ajuda.jsx')
const { ModalConfirmar } = await import('../../src/ModalBase.jsx')
const { BannerNovidades, CardResumo, CardSaldo, SeletorMes } = await import('../../src/App.jsx')

const Icone = () => <svg/>
const texto = (el) => el.textContent.replace(/\s/g, ' ')

afterEach(cleanup)

describe('BotaoAjuda', () => {
  it('abre a explicação e o passo a passo do tópico e fecha', async () => {
    const user = userEvent.setup()
    render(<BotaoAjuda topico="home"/>)
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByTitle('Dúvidas'))
    const dialogo = screen.getByRole('dialog', { name: AJUDA_CONTEUDO.home.titulo })
    expect(dialogo.textContent).toContain(AJUDA_CONTEUDO.home.explicacao)
    for (const passo of AJUDA_CONTEUDO.home.passos) expect(dialogo.textContent).toContain(passo)

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('tópico sem conteúdo não renderiza nada', () => {
    const { container } = render(<BotaoAjuda topico="inexistente"/>)
    expect(container.innerHTML).toBe('')
  })

  it('todo tópico tem título, explicação e ao menos um passo', () => {
    for (const [topico, c] of Object.entries(AJUDA_CONTEUDO)) {
      expect(c.titulo, topico).toBeTruthy()
      expect(c.explicacao, topico).toBeTruthy()
      expect(c.passos.length, topico).toBeGreaterThan(0)
    }
  })
})

describe('ModalConfirmar', () => {
  it('confirma e cancela pelos botões', async () => {
    const user = userEvent.setup()
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    render(<ModalConfirmar mensagem="Apagar esta receita?" onConfirmar={onConfirmar} onCancelar={onCancelar}/>)

    expect(screen.getByText('Apagar esta receita?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Apagar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('usa o texto de confirmação informado', () => {
    render(<ModalConfirmar mensagem="Pagar a fatura?" textoConfirmar="Pagar fatura" perigo={false} onConfirmar={() => {}} onCancelar={() => {}}/>)
    expect(screen.getByRole('button', { name: 'Pagar fatura' })).toBeTruthy()
  })
})

describe('SeletorMes', () => {
  const meses = ['2026-03', '2026-02', '2026-01']

  it('mostra o mês selecionado pelo nome', () => {
    render(<SeletorMes meses={meses} valor="2026-02" onChange={() => {}}/>)
    expect(screen.getByRole('combobox').value).toBe('2026-02')
    expect(screen.getByRole('option', { name: 'Fevereiro 2026' }).selected).toBe(true)
  })

  it('"Mês anterior" volta no tempo e "Próximo mês" avança', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SeletorMes meses={meses} valor="2026-02" onChange={onChange}/>)

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }))
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(onChange.mock.calls).toEqual([['2026-01'], ['2026-03']])
  })

  it('as setas travam no mês mais antigo e no mais recente', () => {
    const { rerender } = render(<SeletorMes meses={meses} valor="2026-03" onChange={() => {}}/>)
    expect(screen.getByRole('button', { name: 'Próximo mês' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Mês anterior' }).disabled).toBe(false)

    rerender(<SeletorMes meses={meses} valor="2026-01" onChange={() => {}}/>)
    expect(screen.getByRole('button', { name: 'Mês anterior' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Próximo mês' }).disabled).toBe(false)
  })

  it('com "todos" selecionado as setas ficam desabilitadas', () => {
    render(<SeletorMes meses={meses} valor="todos" onChange={() => {}} incluirTodos/>)
    expect(screen.getByRole('button', { name: 'Mês anterior' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Próximo mês' }).disabled).toBe(true)
  })

  it('escolher no select avisa o mês escolhido', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SeletorMes meses={meses} valor="2026-03" onChange={onChange}/>)
    await user.selectOptions(screen.getByRole('combobox'), '2026-01')
    expect(onChange).toHaveBeenCalledWith('2026-01')
  })

  it('"todos" entra como primeira opção quando pedido', () => {
    render(<SeletorMes meses={meses} valor="todos" onChange={() => {}} incluirTodos/>)
    expect(screen.getAllByRole('option')[0].textContent).toBe('Todos os meses')
  })

  it('sem meses, avisa em vez de mostrar seletor vazio', () => {
    render(<SeletorMes meses={[]} valor="" onChange={() => {}}/>)
    expect(screen.getByText('Nenhum mês ainda.')).toBeTruthy()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})

describe('BannerNovidades', () => {
  const itens = ['🎯 Primeira novidade', '🐛 Segunda novidade']
  const passar = (ms) => act(() => { vi.advanceTimersByTime(ms) })
  const abrir = () => {
    const onFechar = vi.fn()
    render(<BannerNovidades itens={itens} onFechar={onFechar}/>)
    return { onFechar, quadro: screen.getByRole('dialog', { name: 'Últimas atualizações' }) }
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mostra os itens e fecha sozinho em 8 s se ninguém mexer', () => {
    const { onFechar } = abrir()
    for (const item of itens) expect(screen.getByText(item)).toBeTruthy()
    // Em etapas: aos 7,5 s começa a animação de saída, e o React precisa renderizar
    // entre um avanço e outro para agendar o fechamento.
    passar(7500)
    expect(onFechar).not.toHaveBeenCalled()
    passar(400)
    expect(onFechar).not.toHaveBeenCalled()
    passar(100)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('fecha pelo X, que tem nome acessível', () => {
    const { onFechar } = abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novidades' }))
    passar(500)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('fecha ao tocar fora do quadro, mas não ao tocar dentro', () => {
    const { onFechar, quadro } = abrir()
    fireEvent.click(screen.getByText(itens[0]))
    passar(500)
    expect(onFechar).not.toHaveBeenCalled()
    fireEvent.click(quadro.parentElement)
    passar(500)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('fecha com Esc', () => {
    const { onFechar } = abrir()
    fireEvent.keyDown(window, { key: 'Escape' })
    passar(500)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('tocar na lista cancela o fechamento automático', () => {
    const { onFechar, quadro } = abrir()
    passar(3000)
    fireEvent.pointerDown(quadro)
    passar(60_000)
    expect(onFechar).not.toHaveBeenCalled()
    expect(quadro.textContent).toContain('Toque no X ou fora do quadro para fechar.')
    expect(quadro.textContent).not.toContain('Fecha sozinho')
  })

  it('rolar a lista também cancela o fechamento automático', () => {
    const { onFechar } = abrir()
    fireEvent.scroll(screen.getByText(itens[0]).closest('.overflow-y-auto'))
    passar(60_000)
    expect(onFechar).not.toHaveBeenCalled()
  })

  it('o quadro nunca passa da altura da tela e só a lista rola', () => {
    const { quadro } = abrir()
    expect(quadro.className).toContain('max-h-full')
    expect(screen.getByText(itens[0]).closest('.overflow-y-auto')).toBeTruthy()
  })
})

describe('cards de resumo', () => {
  it('CardResumo mostra rótulo, valor em reais e escopo', () => {
    const { container } = render(<CardResumo label="Pago" escopo="este mês" valor={1234.5} icon={Icone} cor="text-red-400" delay={1}/>)
    expect(texto(container)).toContain('Pago')
    expect(texto(container)).toContain('R$ 1.234,50')
    expect(texto(container)).toContain('este mês')
  })

  it('CardResumo com valor ausente mostra zero', () => {
    const { container } = render(<CardResumo label="A pagar" valor={null} icon={Icone} cor="" delay={1}/>)
    expect(texto(container)).toContain('R$ 0,00')
  })

  it('CardSaldo positivo em verde, negativo em vermelho', () => {
    render(<CardSaldo label="Saldo atual" escopo="acumulado" saldo={150} temReceita delay={1}/>)
    expect(screen.getByText(/150,00/).className).toContain('text-emerald-400')
    cleanup()
    render(<CardSaldo label="Saldo atual" escopo="acumulado" saldo={-20} temReceita delay={1}/>)
    expect(screen.getByText(/20,00/).className).toContain('text-red-400')
  })

  it('CardSaldo sem receita mostra traço e pede cadastro', () => {
    const { container } = render(<CardSaldo label="Saldo atual" escopo="acumulado" saldo={null} temReceita={false} delay={1}/>)
    expect(texto(container)).toContain('—')
    expect(texto(container)).toContain('Cadastre receitas')
    expect(texto(container)).not.toContain('R$')
  })

  it('CardSaldo com ação vira botão clicável', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CardSaldo label="Saldo inicial" escopo="sobrou" saldo={10} temReceita delay={1} onClick={onClick} acao="Toque para conferir"/>)
    await user.click(screen.getByRole('button', { name: /Saldo inicial/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
