import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dataLocalISO, dividirEmParcelas, formatBRL, formatarDataBR, formatarDataHora, hojeISO,
  mesAtual, mesclarPorId, nomeMes, nomeMesAbrev, somarDias, somarMeses, ultimosMeses,
} from '../../src/utils.js'

// O app roda em UTC-3; o runner do CI roda em UTC. Os helpers de data precisam dar a
// mesma resposta "local" nos dois.
const FUSOS = [
  { tz: 'America/Sao_Paulo', offset: '-03:00', minutos: 180 },
  { tz: 'UTC', offset: 'Z', minutos: 0 },
]

const espacoNormal = (s) => s.replace(/\s/g, ' ')

describe.each(FUSOS)('datas em $tz', ({ tz, offset, minutos }) => {
  const tzOriginal = process.env.TZ
  const relogio = (localISO) => vi.setSystemTime(new Date(`${localISO}${offset}`))

  beforeEach(() => {
    process.env.TZ = tz
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = tzOriginal
  })

  it('o fuso do teste está ativo', () => {
    expect(new Date('2026-03-10T12:00:00Z').getTimezoneOffset()).toBe(minutos)
  })

  it('hojeISO às 21:30 não avança o dia', () => {
    relogio('2026-03-10T21:30:00')
    expect(hojeISO()).toBe('2026-03-10')
  })

  it('último dia do mês às 23:59 não vira o mês', () => {
    relogio('2026-01-31T23:59:59')
    expect(hojeISO()).toBe('2026-01-31')
    expect(mesAtual()).toBe('2026-01')
  })

  it('último dia do ano às 21:30 continua no ano', () => {
    relogio('2025-12-31T21:30:00')
    expect(mesAtual()).toBe('2025-12')
  })

  it('dataLocalISO usa os campos locais da data', () => {
    expect(dataLocalISO(new Date(2026, 1, 5, 23, 59))).toBe('2026-02-05')
  })

  it('ultimosMeses atravessa a virada do ano em ordem crescente', () => {
    relogio('2026-01-31T21:30:00')
    expect(ultimosMeses(3)).toEqual(['2025-11', '2025-12', '2026-01'])
    expect(ultimosMeses(1)).toEqual(['2026-01'])
  })

  it('formatarDataHora mostra a hora local', () => {
    const esperado = tz === 'UTC' ? /15\/01\/2026,? 02:00/ : /14\/01\/2026,? 23:00/
    expect(formatarDataHora('2026-01-15T02:00:00Z')).toMatch(esperado)
  })
})

describe('toISOString em UTC-3', () => {
  const tzOriginal = process.env.TZ

  beforeEach(() => {
    process.env.TZ = 'America/Sao_Paulo'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-31T21:30:00-03:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = tzOriginal
  })

  it('já devolve o dia e o mês seguintes às 21:30, e os helpers não', () => {
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-02-01')
    expect(hojeISO()).toBe('2026-01-31')
    expect(mesAtual()).toBe('2026-01')
  })
})

describe('somarMeses', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2024-01-31', 1, '2024-02-29'],
    ['2026-01-31', 3, '2026-04-30'],
    ['2026-12-15', 1, '2027-01-15'],
    ['2026-01-01', -1, '2025-12-01'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2026-01-15', -13, '2024-12-15'],
    ['2026-01-15', -24, '2024-01-15'],
    ['2026-01-15', 14, '2027-03-15'],
    ['2026-01-15', 24, '2028-01-15'],
    ['2026-05-20', 0, '2026-05-20'],
  ])('%s somando %i mês(es) = %s', (data, meses, esperado) => {
    expect(somarMeses(data, meses)).toBe(esperado)
  })

  it('nunca gera mês 00 nem 13', () => {
    for (let m = -30; m <= 30; m++) {
      const mes = Number(somarMeses('2026-01-15', m).slice(5, 7))
      expect(mes).toBeGreaterThanOrEqual(1)
      expect(mes).toBeLessThanOrEqual(12)
    }
  })
})

describe.each(FUSOS)('somarDias em $tz', ({ tz }) => {
  const tzOriginal = process.env.TZ
  beforeEach(() => { process.env.TZ = tz })
  afterEach(() => { process.env.TZ = tzOriginal })

  it.each([
    ['2026-03-10', 7, '2026-03-17'],
    ['2026-01-28', 7, '2026-02-04'],
    ['2026-12-28', 7, '2027-01-04'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-05-20', 0, '2026-05-20'],
  ])('%s somando %i dia(s) = %s', (data, dias, esperado) => {
    expect(somarDias(data, dias)).toBe(esperado)
  })
})

describe('dividirEmParcelas', () => {
  const emCentavos = (lista) => lista.map((v) => Math.round(v * 100))
  const soma = (lista) => emCentavos(lista).reduce((s, c) => s + c, 0)

  it('100 em 3x = 33,33 / 33,33 / 33,34', () => {
    expect(dividirEmParcelas(100, 3)).toEqual([33.33, 33.33, 33.34])
  })

  it.each([100, 0.01, 0.1, 1, 7, 50.05, 99.99, 333.33, 1000, 1234.56, 9999.99])(
    'a soma das parcelas de %s fecha com o total em qualquer número de parcelas',
    (total) => {
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24]) {
        const parcelas = dividirEmParcelas(total, n)
        expect(parcelas).toHaveLength(n)
        expect(soma(parcelas)).toBe(Math.round(total * 100))
        const centavos = emCentavos(parcelas)
        expect(new Set(centavos.slice(0, -1)).size).toBeLessThanOrEqual(1)
        expect(centavos[n - 1] - centavos[0]).toBeGreaterThanOrEqual(0)
        expect(centavos[n - 1] - centavos[0]).toBeLessThan(n)
      }
    },
  )

  it('n = 1 devolve o próprio total', () => {
    expect(dividirEmParcelas(1234.56, 1)).toEqual([1234.56])
  })

  it('aceita valor em string', () => {
    expect(dividirEmParcelas('100', 3)).toEqual([33.33, 33.33, 33.34])
    expect(soma(dividirEmParcelas('1234.56', 7))).toBe(123456)
  })

  it.each([['abc'], [''], [null], [undefined], [NaN]])('valor inválido %s vira parcelas zeradas', (valor) => {
    expect(dividirEmParcelas(valor, 3)).toEqual([0, 0, 0])
  })
})

describe('formatBRL', () => {
  it('formata em reais com separador brasileiro', () => {
    expect(espacoNormal(formatBRL(1234.5))).toBe('R$ 1.234,50')
  })

  it.each([[null], [undefined], [0], [NaN]])('%s vira R$ 0,00', (valor) => {
    expect(espacoNormal(formatBRL(valor))).toBe('R$ 0,00')
  })

  it('mantém o sinal de valor negativo', () => {
    expect(espacoNormal(formatBRL(-10))).toBe('-R$ 10,00')
  })
})

describe('nomes de mês e datas', () => {
  it('nomeMesAbrev', () => {
    expect(nomeMesAbrev('2026-01')).toBe('Jan/26')
    expect(nomeMesAbrev('2025-12')).toBe('Dez/25')
  })

  it('nomeMes', () => {
    expect(nomeMes('2026-03')).toBe('Março 2026')
    expect(nomeMes('2026-12')).toBe('Dezembro 2026')
  })

  it('formatarDataBR', () => {
    expect(formatarDataBR('2026-02-05')).toBe('05/02/2026')
  })

  it.each([[null], [undefined], ['']])('data ausente (%s) vira travessão', (valor) => {
    expect(formatarDataBR(valor)).toBe('—')
    expect(formatarDataHora(valor)).toBe('—')
  })
})

describe('mesclarPorId', () => {
  const local = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }]

  it('o banco sobrescreve o local no mesmo id e acrescenta os novos', () => {
    const doBanco = [{ id: 2, v: 'B' }, { id: 3, v: 'c' }]
    expect(mesclarPorId(local, doBanco)).toEqual([
      { id: 1, v: 'a' }, { id: 2, v: 'B' }, { id: 3, v: 'c' },
    ])
  })

  it('não altera as listas recebidas', () => {
    const doBanco = [{ id: 2, v: 'B' }]
    mesclarPorId(local, doBanco)
    expect(local).toEqual([{ id: 1, v: 'a' }, { id: 2, v: 'b' }])
    expect(doBanco).toEqual([{ id: 2, v: 'B' }])
  })

  it.each([[null], [undefined], [[]]])('resposta do banco %s mantém a lista local', (doBanco) => {
    expect(mesclarPorId(local, doBanco)).toEqual(local)
  })
})
