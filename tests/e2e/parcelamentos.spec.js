import { aviso, entrar, expect, irPara, test } from './apoio.js'

test('100 em 3x: três despesas somando 100,00 e progresso nas duas abas sem recarregar', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  await irPara(page, 'Parcelamentos')
  await page.getByRole('button', { name: 'Novo', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Novo parcelamento' })
  await modal.getByPlaceholder(/Notebook/).fill('Notebook')
  await modal.getByPlaceholder('0,00').fill('100')
  await modal.getByRole('spinbutton', { name: /Parcelas/ }).fill('3')
  await modal.getByRole('button', { name: 'Salvar parcelamento' }).click()
  await expect(aviso(page)).toContainText('Parcelamento "Notebook" criado: 3x')

  const despesas = (await dados.linhas('despesas', usuario.id))
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
  expect(despesas.map(d => Number(d.valor))).toEqual([33.33, 33.33, 33.34])
  expect(despesas.reduce((s, d) => s + Math.round(Number(d.valor) * 100), 0)).toBe(10000)
  expect(despesas.map(d => d.data_vencimento)).toEqual(['2026-03-15', '2026-04-15', '2026-05-15'])
  const [parcelamento] = await dados.linhas('parcelamentos', usuario.id)
  expect(despesas.every(d => d.parcelamento_id === parcelamento.id)).toBe(true)

  const cartao = page.locator('div.p-6').filter({ has: page.getByRole('heading', { name: 'Notebook' }) })
  await expect(cartao).toContainText('0/3')

  // Paga a parcela pela aba Despesas; o progresso muda na aba Parcelamentos.
  await irPara(page, 'Despesas')
  await page.getByRole('button', { name: 'Marcar como paga' }).click()
  await expect(aviso(page)).toContainText('"Notebook" paga')
  await irPara(page, 'Parcelamentos')
  await expect(cartao).toContainText('1/3')
  await expect(cartao).toContainText('R$ 33,33')

  // E pelo caminho inverso: paga em Parcelamentos, a aba Despesas acompanha.
  await cartao.getByRole('button', { name: 'Marcar próxima como paga' }).click()
  await expect(aviso(page)).toContainText('Parcela 2/3 de "Notebook" paga')
  await expect(cartao).toContainText('2/3')
  await expect(cartao).toContainText('R$ 66,66')
  await irPara(page, 'Despesas')
  await expect(page.getByRole('button', { name: /Pendentes \(1\)/ })).toBeVisible()
})
