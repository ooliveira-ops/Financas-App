import { describe, expect, it } from 'vitest'
import {
  FONTE_AJUSTE, agruparPorMes, avancoSemDespesas, avisosDeVencimento, calcularSaldo, calcularSaldoMes,
  composicaoSaldoInicial, despesasDeAssinaturas, despesasDoMesNoHistorico, faturasDoCartao, filtrarDespesas,
  grupoDaDespesa, mesesComDespesas, mesesDoHistorico, montarDespesas, pagasNoMes, pendentesAnteriores,
  pendentesDoMes, pendentesPorVencimento, progressoParcelamento, proximasAssinaturas, receitasDoMes,
  resumoGrupo, separarPorStatus, somaValores, textoParcela, totaisPagoPendente,
  estaConcluido, podeConcluir, separarParcelamentos, saldoBruto, ajusteParaSaldo,
} from '../../src/calculos.js'

let proximoId = 1
const despesa = (campos = {}) => ({
  id: proximoId++, descricao: 'Despesa', valor: 100, status: 'pendente',
  data: null, data_vencimento: null, data_pagamento: null,
  parcela_atual: null, parcelas_total: null, parcelamento_id: null, categoria_id: null, forma_pagamento: null,
  ...campos,
})
const paga = (dataPagamento, campos = {}) => despesa({ status: 'paga', data_pagamento: dataPagamento, ...campos })
const pendente = (vencimento, campos = {}) => despesa({ data: vencimento, data_vencimento: vencimento, ...campos })
const receita = (mes, valor, campos = {}) => ({ id: proximoId++, fonte: 'Salário', mes, valor, ...campos })
const ids = (lista) => lista.map(d => d.id)

describe('separarPorStatus', () => {
  it('status nulo conta como pendente', () => {
    const semStatus = despesa({ status: null })
    const p = pendente('2026-03-10')
    const pg = paga('2026-03-05')
    const { pendentes, pagas } = separarPorStatus([semStatus, p, pg])
    expect(ids(pendentes)).toEqual([semStatus.id, p.id])
    expect(ids(pagas)).toEqual([pg.id])
  })
})

describe('somaValores', () => {
  it('aceita valor em string e trata ausente como zero', () => {
    expect(somaValores([{ valor: '10.50' }, { valor: 5 }, { valor: null }, {}])).toBe(15.5)
  })
})

describe('saldo acumulado', () => {
  it('é receitas de todo o histórico menos despesas pagas', () => {
    const receitas = [receita('2026-01', 1000), receita('2026-02', 1000), receita('2026-03', 500)]
    const pagas = [paga('2026-01-10', { valor: 300 }), paga('2026-03-02', { valor: 200 })]
    expect(calcularSaldo(receitas, pagas)).toEqual({ totalReceitas: 2500, temReceita: true, saldo: 2000 })
  })

  it('pendente não entra no saldo', () => {
    const despesas = [paga('2026-03-02', { valor: 200 }), pendente('2026-03-20', { valor: 999 })]
    const { pagas } = separarPorStatus(despesas)
    expect(calcularSaldo([receita('2026-03', 1000)], pagas).saldo).toBe(800)
  })

  it('valor_pago e parcelas_pagas do parcelamento nunca entram na soma', () => {
    const parc = { id: 'p1', valor_total: 300, parcelas_total: 3, parcelas_pagas: 3, valor_pago: 300 }
    const despesas = [
      paga('2026-01-10', { valor: 100, parcelamento_id: parc.id }),
      pendente('2026-02-10', { valor: 100, parcelamento_id: parc.id }),
      pendente('2026-03-10', { valor: 100, parcelamento_id: parc.id }),
    ]
    const { pagas } = separarPorStatus(despesas)
    // Só a parcela paga sai do saldo, mesmo com o acompanhamento dizendo 300 pagos.
    expect(calcularSaldo([receita('2026-01', 1000)], pagas).saldo).toBe(900)
  })

  it('sem receita o saldo é null, mesmo com despesa paga', () => {
    expect(calcularSaldo([], [paga('2026-03-02')])).toEqual({ totalReceitas: 0, temReceita: false, saldo: null })
  })

  it('ajuste negativo que zera as receitas também deixa o saldo null', () => {
    const receitas = [receita('2026-01', 100), receita('2026-01', -100, { fonte: FONTE_AJUSTE })]
    expect(calcularSaldo(receitas, []).saldo).toBeNull()
  })
})

describe('acerto do saldo com o banco', () => {
  it('saldoBruto é receitas menos pagas, mesmo sem receita', () => {
    expect(saldoBruto([receita('2026-03', 100)], [paga('2026-03-01', { valor: 30 })])).toBe(70)
    expect(saldoBruto([], [paga('2026-03-01', { valor: 30 })])).toBe(-30)
    expect(saldoBruto([receita('2026-03', 0.1), receita('2026-03', 0.2)], [])).toBe(0.3)
  })

  it('o ajuste leva o saldo calculado exatamente ao valor real', () => {
    // Caso real: saldo inicial lançado com o valor de hoje, saldo atual dobrou.
    expect(ajusteParaSaldo(946.26, 1892.52)).toBe(-946.26)
    expect(ajusteParaSaldo(1000, 999.99)).toBe(0.01)
    expect(ajusteParaSaldo(500, 500)).toBe(0)
  })

  it('o ajuste somado ao saldo dá o valor real, em centavos', () => {
    for (const [real, calculado] of [[946.27, 2487.78], [0, 123.45], [-50.1, 10.2]]) {
      expect(Math.round((calculado + ajusteParaSaldo(real, calculado)) * 100)).toBe(Math.round(real * 100))
    }
  })
})

describe('saldo do mês', () => {
  it('receitas do mês menos pagas no mês', () => {
    expect(calcularSaldoMes(1000, 300)).toEqual({ temMovimento: true, saldo: 700 })
  })

  it('só com despesa paga ainda tem movimento', () => {
    expect(calcularSaldoMes(0, 300)).toEqual({ temMovimento: true, saldo: -300 })
  })

  it('null quando o mês não tem movimento', () => {
    expect(calcularSaldoMes(0, 0)).toEqual({ temMovimento: false, saldo: null })
  })

  it('receitasDoMes trata receita sem mês como do mês informado', () => {
    const lista = [receita('2026-03', 100), receita(null, 50), receita('2026-02', 999)]
    expect(somaValores(receitasDoMes(lista, '2026-03'))).toBe(150)
  })

  it('pagasNoMes usa a data de pagamento, não o vencimento', () => {
    const pagaEmMarco = paga('2026-03-01', { data_vencimento: '2026-02-20' })
    const pagaEmFevereiro = paga('2026-02-28', { data_vencimento: '2026-03-05' })
    const semData = paga(null)
    expect(ids(pagasNoMes([pagaEmMarco, pagaEmFevereiro, semData], '2026-03'))).toEqual([pagaEmMarco.id])
  })

  it('pendentesDoMes usa o vencimento, ou a data quando não há vencimento', () => {
    const pelaData = despesa({ data: '2026-03-15' })
    const pelaVencimento = pendente('2026-03-20')
    const outroMes = pendente('2026-04-01')
    const jaPaga = paga('2026-03-10', { data_vencimento: '2026-03-10' })
    expect(ids(pendentesDoMes([pelaData, pelaVencimento, outroMes, jaPaga], '2026-03'))).toEqual([pelaData.id, pelaVencimento.id])
  })
})

describe('composicaoSaldoInicial', () => {
  const mes = '2026-03'

  it('soma o que entrou e saiu antes do mês, com os ajustes à parte', () => {
    const receitas = [
      receita('2026-01', 1000), receita('2026-02', 1000), receita('2026-03', 1000),
      receita('2026-02', -50, { fonte: FONTE_AJUSTE }),
    ]
    const pagas = [
      paga('2026-01-15', { valor: 400 }),
      paga('2026-02-15', { valor: 300 }),
      paga('2026-03-05', { valor: 999 }),
    ]
    const c = composicaoSaldoInicial({ receitas, pagas, pendentes: [], mes })
    expect(c.receitas).toBe(2000)
    expect(c.totalAjustes).toBe(-50)
    expect(c.ajustes).toHaveLength(1)
    expect(c.pagas).toBe(700)
    expect(c.saldo).toBe(1250)
  })

  it('despesa paga sem data de pagamento conta como anterior', () => {
    const pagas = [paga(null, { valor: 80 }), paga('2026-02-10', { valor: 20 })]
    const c = composicaoSaldoInicial({ receitas: [receita('2026-02', 500)], pagas, pendentes: [], mes })
    expect(c.pagas).toBe(100)
    expect(c.pagasSemData).toBe(80)
    expect(c.saldo).toBe(400)
  })

  it('receita sem mês não entra no saldo inicial', () => {
    const c = composicaoSaldoInicial({ receitas: [receita(null, 500)], pagas: [], pendentes: [], mes })
    expect(c.saldo).toBe(0)
  })

  it('aponta pendentes antigas e antigas pagas neste mês', () => {
    const pendentes = [pendente('2026-02-10', { valor: 30 }), pendente('2026-03-10', { valor: 999 })]
    const pagas = [paga('2026-03-02', { valor: 45, data_vencimento: '2026-02-25' })]
    const c = composicaoSaldoInicial({ receitas: [], pagas, pendentes, mes })
    expect(c.pendentesAntigas).toBe(30)
    expect(c.antigasPagasNoMes).toBe(45)
  })

  it('arredonda em centavos', () => {
    const receitas = [receita('2026-02', 0.1), receita('2026-02', 0.2)]
    expect(composicaoSaldoInicial({ receitas, pagas: [], pendentes: [], mes }).saldo).toBe(0.3)
  })
})

describe('proximasAssinaturas', () => {
  const assinaturas = [
    { id: 'a', nome: 'Streaming', dia_vencimento: 5 },
    { id: 'b', nome: 'Academia', dia_vencimento: 30 },
    { id: 'c', nome: 'Nuvem', dia_vencimento: 15 },
  ]

  it('conta os dias e ordena do mais próximo', () => {
    const r = proximasAssinaturas(assinaturas, '2026-03-10')
    expect(r.map(a => [a.id, a.diasRestantes])).toEqual([['c', 5], ['b', 20], ['a', 26]])
  })

  it('na virada do mês conta até o dia do mês seguinte', () => {
    const r = proximasAssinaturas(assinaturas, '2026-01-30')
    expect(r.map(a => [a.id, a.diasRestantes])).toEqual([['b', 0], ['a', 6], ['c', 16]])
  })

  it('usa o tamanho do mês corrente, inclusive fevereiro', () => {
    expect(proximasAssinaturas([{ id: 'x', dia_vencimento: 1 }], '2026-02-28')[0].diasRestantes).toBe(1)
    expect(proximasAssinaturas([{ id: 'x', dia_vencimento: 1 }], '2024-02-28')[0].diasRestantes).toBe(2)
  })

  it('sem dia informado assume o dia 5', () => {
    expect(proximasAssinaturas([{ id: 'x', dia_vencimento: null }], '2026-03-01')[0].diasRestantes).toBe(4)
  })

  it('não altera a lista recebida', () => {
    const lista = [...assinaturas]
    proximasAssinaturas(lista, '2026-03-10')
    expect(lista).toEqual(assinaturas)
    expect(lista[0]).not.toHaveProperty('diasRestantes')
  })
})

describe('avisosDeVencimento', () => {
  const hoje = '2026-03-28'

  it('separa vencidas das que vencem de hoje até 7 dias', () => {
    const ontem = pendente('2026-03-27')
    const deHoje = pendente('2026-03-28')
    const em7 = pendente('2026-04-04')
    const em8 = pendente('2026-04-05')
    const { vencidas, vencendo } = avisosDeVencimento([ontem, deHoje, em7, em8], hoje)
    expect(ids(vencidas)).toEqual([ontem.id])
    expect(ids(vencendo)).toEqual([deHoje.id, em7.id])
  })

  it('ignora quem não tem data de vencimento, mesmo com data', () => {
    const { vencidas, vencendo } = avisosDeVencimento([despesa({ data: '2026-01-01' })], hoje)
    expect(vencidas).toEqual([])
    expect(vencendo).toEqual([])
  })

  it('atravessa a virada do ano', () => {
    const { vencendo } = avisosDeVencimento([pendente('2027-01-03')], '2026-12-29')
    expect(vencendo).toHaveLength(1)
  })
})

describe('histórico por mês', () => {
  const despesas = [
    paga('2026-03-05', { valor: 100, data_vencimento: '2026-02-28' }),
    paga('2026-02-10', { valor: 50, data_vencimento: '2026-02-10' }),
    pendente('2026-03-20', { valor: 30 }),
    pendente('2026-05-01', { valor: 70 }),
    despesa({ data: '2026-03-25', valor: 10 }),
  ]

  it('paga entra no mês do pagamento, pendente no do vencimento', () => {
    const doMes = despesasDoMesNoHistorico(despesas, '2026-03')
    expect(doMes.map(d => d.valor)).toEqual([10, 30, 100])
    expect(totaisPagoPendente(doMes)).toEqual({ pago: 100, pendente: 40 })
  })

  it('lista os meses com movimento, mais o atual, do mais recente ao mais antigo', () => {
    expect(mesesDoHistorico(despesas, '2026-04')).toEqual(['2026-05', '2026-04', '2026-03', '2026-02'])
  })
})

describe('aba Despesas', () => {
  it('fatura agrupa pendentes no cartão por mês de vencimento e mantém as vencidas', () => {
    const pendentes = [
      pendente('2026-02-10', { forma_pagamento: 'cartao', valor: 10.1 }),
      pendente('2026-03-05', { forma_pagamento: 'cartao', valor: 20.2 }),
      pendente('2026-03-15', { forma_pagamento: 'cartao', valor: 0.1 }),
      pendente('2026-04-01', { forma_pagamento: 'cartao', valor: 99 }),
      pendente('2026-03-10', { forma_pagamento: 'pix', valor: 500 }),
    ]
    const faturas = faturasDoCartao(pendentes, '2026-03')
    expect(faturas.map(f => [f.mes, f.ids.length, f.total])).toEqual([['2026-02', 1, 10.1], ['2026-03', 2, 20.3]])
    expect(faturasDoCartao(pendentes, 'todos')).toHaveLength(3)
  })

  it('meses disponíveis: pendente pelo vencimento ou data, paga pelo pagamento', () => {
    const pendentes = [despesa({ data: '2026-06-01' }), pendente('2026-01-10')]
    const pagas = [paga('2026-02-03'), paga(null)]
    expect(mesesComDespesas(pendentes, pagas, '2026-03')).toEqual(['2026-06', '2026-03', '2026-02', '2026-01'])
  })

  it('pendências anteriores ao mês filtrado', () => {
    const pendentes = [pendente('2026-01-10', { valor: 10 }), pendente('2026-02-10', { valor: 5 }), pendente('2026-03-10', { valor: 99 })]
    expect(pendentesAnteriores(pendentes, '2026-03')).toEqual({ qtd: 2, total: 15 })
    expect(pendentesAnteriores(pendentes, '2026-01')).toBeNull()
    expect(pendentesAnteriores(pendentes, 'todos')).toBeNull()
  })

  describe('filtrarDespesas', () => {
    const lista = [
      pendente('2026-03-10', { categoria_id: 'cat1', forma_pagamento: 'cartao' }),
      pendente('2026-03-12', { categoria_id: null }),
      pendente('2026-04-01', { categoria_id: 'cat1' }),
    ]
    const base = { subAba: 'pendentes', mes: 'todos', categoria: 'todas', soCartao: false }

    it('por mês de vencimento', () => {
      expect(filtrarDespesas(lista, { ...base, mes: '2026-03' })).toHaveLength(2)
    })

    it('por categoria e "sem categoria"', () => {
      expect(filtrarDespesas(lista, { ...base, categoria: 'cat1' })).toHaveLength(2)
      expect(ids(filtrarDespesas(lista, { ...base, categoria: 'sem' }))).toEqual([lista[1].id])
    })

    it('só cartão', () => {
      expect(ids(filtrarDespesas(lista, { ...base, soCartao: true }))).toEqual([lista[0].id])
    })

    it('pagas são filtradas pela data de pagamento', () => {
      const pagas = [paga('2026-03-01', { data_vencimento: '2026-02-20' }), paga(null)]
      expect(filtrarDespesas(pagas, { ...base, subAba: 'pagas', mes: '2026-03' })).toHaveLength(1)
      expect(filtrarDespesas(pagas, { ...base, subAba: 'pagas', mes: '2026-02' })).toHaveLength(0)
    })
  })

  it('agrupa por mês, do mais recente, com subtotal; sem data vai para "sem-data"', () => {
    const lista = [pendente('2026-03-10', { valor: 10 }), pendente('2026-04-01', { valor: 5 }), pendente('2026-03-20', { valor: 1 }), despesa({ valor: 2 })]
    const grupos = agruparPorMes(lista, 'pendentes')
    expect(grupos.map(g => [g.mes, g.itens.length, g.subtotal])).toEqual([['2026-04', 1, 5], ['2026-03', 2, 11], ['sem-data', 1, 2]])
    expect(grupos[1].itens.map(d => d.valor)).toEqual([1, 10])
  })
})

describe('parcelas', () => {
  it('textoParcela', () => {
    expect(textoParcela({ parcela_atual: 2, parcelas_total: 3 })).toBe('2/3')
    expect(textoParcela({ parcela_atual: null, parcelas_total: null })).toBeNull()
    expect(textoParcela({ parcela_atual: 1, parcelas_total: null })).toBeNull()
  })

  describe('montarDespesas', () => {
    const base = { descricao: 'Notebook', valor: 100, parcelas: 3, dataVencimento: '2026-01-31', categoria_id: 'cat1', forma_pagamento: 'cartao' }

    it('100 em 3x: três linhas que somam 100,00, uma por mês, sem transbordar o fim do mês', () => {
      const linhas = montarDespesas(base, 'usuario-teste')
      expect(linhas.map(l => l.valor)).toEqual([33.33, 33.33, 33.34])
      expect(Math.round(somaValores(linhas) * 100)).toBe(10000)
      expect(linhas.map(l => l.data_vencimento)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
      expect(linhas.map(textoParcela)).toEqual(['1/3', '2/3', '3/3'])
      expect(linhas.every(l => l.status === 'pendente' && l.user_id === 'usuario-teste' && l.data === l.data_vencimento)).toBe(true)
    })

    it('campo opcional de select vazio vira null', () => {
      const [linha] = montarDespesas({ ...base, parcelas: 1, categoria_id: '', forma_pagamento: '' }, 'u')
      expect(linha.categoria_id).toBeNull()
      expect(linha.forma_pagamento).toBeNull()
    })

    it('à vista não tem parcela', () => {
      const [linha] = montarDespesas({ ...base, parcelas: 1 }, 'u')
      expect(linha.parcela_atual).toBeNull()
      expect(linha.parcelas_total).toBeNull()
      expect(linha.valor).toBe(100)
    })

    it('não leva campos do formulário que não são colunas', () => {
      const [linha] = montarDespesas({ ...base, parcelas: 1 }, 'u')
      expect(linha).not.toHaveProperty('parcelas')
      expect(linha).not.toHaveProperty('dataVencimento')
    })

    it('mantém o vínculo com o parcelamento', () => {
      const linhas = montarDespesas({ ...base, parcelamento_id: 'p1' }, 'u')
      expect(linhas.every(l => l.parcelamento_id === 'p1')).toBe(true)
    })
  })

  describe('grupo de uma compra', () => {
    it('com parcelamento, agrupa pelo parcelamento_id', () => {
      const a = pendente('2026-01-10', { parcelamento_id: 'p1' })
      const b = pendente('2026-02-10', { parcelamento_id: 'p1' })
      const outra = pendente('2026-01-10', { parcelamento_id: 'p2' })
      expect(ids(grupoDaDespesa(a, [a, b, outra]))).toEqual([a.id, b.id])
    })

    it('sem parcelamento, agrupa por parcelas_total + created_at, nunca pela descrição', () => {
      const criado = '2026-01-01T10:00:00Z'
      const a = pendente('2026-01-10', { descricao: 'Celular', parcelas_total: 2, parcela_atual: 1, created_at: criado })
      const b = pendente('2026-02-10', { descricao: 'Celular', parcelas_total: 2, parcela_atual: 2, created_at: criado })
      const mesmaDescricao = pendente('2026-01-10', { descricao: 'Celular', parcelas_total: 2, parcela_atual: 1, created_at: '2026-01-05T10:00:00Z' })
      expect(ids(grupoDaDespesa(a, [a, b, mesmaDescricao]))).toEqual([a.id, b.id])
    })

    it('despesa avulsa é um grupo de uma', () => {
      const a = pendente('2026-01-10')
      expect(grupoDaDespesa(a, [a, pendente('2026-01-10')])).toEqual([a])
    })

    it('resumoGrupo', () => {
      const grupo = [pendente('2026-02-10', { valor: 33.33 }), paga('2026-01-12', { valor: 33.34, data_vencimento: '2026-01-10' })]
      expect(resumoGrupo(grupo, '2026-03-01')).toEqual({ valor: 66.67, parcelas: 2, primeiroVencimento: '2026-01-10', temPaga: true })
      expect(resumoGrupo([despesa()], '2026-03-01').primeiroVencimento).toBe('2026-03-01')
    })
  })

  describe('progresso do parcelamento derivado das despesas', () => {
    const doParcelamento = () => montarDespesas(
      { descricao: 'Sofá', valor: 100, parcelas: 3, dataVencimento: '2026-01-10', parcelamento_id: 'p1' }, 'u',
    ).map((l) => ({ ...l, id: proximoId++ }))

    it('nada pago: 0 de 3, próxima é a primeira', () => {
      expect(progressoParcelamento(doParcelamento(), 'p1')).toEqual({
        parcelas_pagas: 0, valor_pago: 0, status: 'ativo', proxima_parcela_data: '2026-01-10',
      })
    })

    it('marcar como paga recalcula', () => {
      const lista = doParcelamento()
      lista[0] = { ...lista[0], status: 'paga', data_pagamento: '2026-01-09' }
      expect(progressoParcelamento(lista, 'p1')).toEqual({
        parcelas_pagas: 1, valor_pago: 33.33, status: 'ativo', proxima_parcela_data: '2026-02-10',
      })
    })

    it('apagar a despesa paga recalcula para trás', () => {
      const lista = doParcelamento()
      lista[0] = { ...lista[0], status: 'paga' }
      const semAPaga = lista.filter(d => d.id !== lista[0].id)
      expect(progressoParcelamento(semAPaga, 'p1')).toMatchObject({ parcelas_pagas: 0, valor_pago: 0 })
    })

    it('todas pagas: finalizado, valor pago fecha o total e a data é a da última', () => {
      const lista = doParcelamento().map(d => ({ ...d, status: 'paga' }))
      expect(progressoParcelamento(lista, 'p1')).toEqual({
        parcelas_pagas: 3, valor_pago: 100, status: 'finalizado', proxima_parcela_data: '2026-03-10',
      })
    })

    it('fora de ordem: a próxima é a pendente de vencimento mais antigo', () => {
      const lista = doParcelamento()
      lista[1] = { ...lista[1], status: 'paga' }
      expect(progressoParcelamento(lista, 'p1').proxima_parcela_data).toBe('2026-01-10')
      expect(pendentesPorVencimento(lista).map(d => d.data_vencimento)).toEqual(['2026-01-10', '2026-03-10'])
    })

    it('null quando o parcelamento não tem despesa vinculada', () => {
      expect(progressoParcelamento(doParcelamento(), 'outro')).toBeNull()
    })
  })

  describe('parcelamento concluído', () => {
    const quitado = { id: 'a', status: 'finalizado', concluido: false }
    const arquivado = { id: 'b', status: 'finalizado', concluido: true }
    const pagando = { id: 'c', status: 'ativo', concluido: false }
    // Marcado, mas uma parcela paga foi apagada depois: voltou a ter pendência.
    const reaberto = { id: 'd', status: 'ativo', concluido: true }

    it('só conta como concluído se estiver marcado e quitado', () => {
      expect([quitado, arquivado, pagando, reaberto].map(estaConcluido)).toEqual([false, true, false, false])
    })

    it('só pode concluir o que está quitado e ainda não foi concluído', () => {
      expect([quitado, arquivado, pagando, reaberto].map(podeConcluir)).toEqual([true, false, false, false])
    })

    it('separa a lista dos concluídos, e o que voltou a ter pendência fica na lista', () => {
      const { naLista, concluidos } = separarParcelamentos([quitado, arquivado, pagando, reaberto])
      expect(naLista.map(p => p.id)).toEqual(['a', 'c', 'd'])
      expect(concluidos.map(p => p.id)).toEqual(['b'])
    })

    it('coluna ausente (banco sem a migração) conta como não concluído', () => {
      expect(estaConcluido({ status: 'finalizado' })).toBe(false)
      expect(podeConcluir({ status: 'finalizado' })).toBe(true)
    })
  })

  describe('parcelamento antigo, sem despesas', () => {
    const parc = { valor_total: 100, parcelas_total: 3, parcelas_pagas: 0, valor_pago: 0, proxima_parcela_data: '2026-01-31' }

    it('avança uma parcela e a data em um mês sem transbordar', () => {
      expect(avancoSemDespesas(parc)).toEqual({
        parcelas_pagas: 1, valor_pago: 33.33, status: 'ativo', proxima_parcela_data: '2026-02-28',
      })
    })

    it('a última fecha no total exato e mantém a data', () => {
      const penultima = { ...parc, parcelas_pagas: 2, valor_pago: 66.66, proxima_parcela_data: '2026-03-31' }
      expect(avancoSemDespesas(penultima)).toEqual({
        parcelas_pagas: 3, valor_pago: 100, status: 'finalizado', proxima_parcela_data: '2026-03-31',
      })
    })

    it('sem data de próxima parcela, continua sem', () => {
      expect(avancoSemDespesas({ ...parc, proxima_parcela_data: null }).proxima_parcela_data).toBeNull()
    })
  })
})

describe('despesas de assinatura do mês', () => {
  const assinaturas = [
    { nome: 'Streaming', valor: 40, dia_vencimento: 31 },
    { nome: 'Academia', valor: 90, dia_vencimento: 5 },
  ]

  it('gera uma despesa por assinatura, com o dia limitado ao fim do mês', () => {
    const novas = despesasDeAssinaturas(assinaturas, [], '2026-02', 'u')
    expect(novas.map(d => [d.descricao, d.data_vencimento, d.valor])).toEqual([
      ['Streaming', '2026-02-28', 40], ['Academia', '2026-02-05', 90],
    ])
    expect(novas.every(d => d.status === 'pendente' && d.parcela_atual === null && d.user_id === 'u')).toBe(true)
  })

  it('não duplica a que já existe no mês', () => {
    const existente = despesa({ descricao: 'Academia', data_vencimento: '2026-02-05' })
    expect(despesasDeAssinaturas(assinaturas, [existente], '2026-02', 'u').map(d => d.descricao)).toEqual(['Streaming'])
  })

  it('parcela com o mesmo nome e data não conta como já existente', () => {
    const parcela = despesa({ descricao: 'Academia', data_vencimento: '2026-02-05', parcela_atual: 1, parcelas_total: 2 })
    expect(despesasDeAssinaturas(assinaturas, [parcela], '2026-02', 'u')).toHaveLength(2)
  })

  it('sem assinatura, nada a gerar', () => {
    expect(despesasDeAssinaturas([], [], '2026-02', 'u')).toEqual([])
    expect(despesasDeAssinaturas(null, [], '2026-02', 'u')).toEqual([])
  })
})
