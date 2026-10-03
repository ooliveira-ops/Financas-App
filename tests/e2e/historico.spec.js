import { entrar, expect, irPara, test } from './apoio.js'

test('histórico abre no mês atual e navega entre os meses', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await dados.inserir('despesas', [
    { user_id: usuario.id, descricao: 'Aluguel', valor: 800, status: 'paga', data: '2026-02-10', data_vencimento: '2026-02-10', data_pagamento: '2026-02-10' },
    { user_id: usuario.id, descricao: 'Conta de luz', valor: 120, status: 'pendente', data: '2026-03-25', data_vencimento: '2026-03-25' },
  ])
  await entrar(page, usuario)

  await irPara(page, 'Histórico')
  await expect(page.getByRole('heading', { name: 'Março 2026' })).toBeVisible()
  await expect(page.getByText('Conta de luz')).toBeVisible()
  await expect(page.getByText('Aluguel')).toHaveCount(0)

  await page.getByRole('combobox').selectOption('2026-02')
  await expect(page.getByRole('heading', { name: 'Fevereiro 2026' })).toBeVisible()
  await expect(page.getByText('Aluguel')).toBeVisible()
  await expect(page.getByText('Pago em 10/02/2026')).toBeVisible()
  await expect(page.getByText('Conta de luz')).toHaveCount(0)

  await page.getByRole('combobox').selectOption('2026-03')
  await expect(page.getByRole('heading', { name: 'Março 2026' })).toBeVisible()
})

test('relatório do mês em PDF é baixado', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await dados.inserir('receitas', [{ user_id: usuario.id, fonte: 'Salário', valor: 1000, mes: '2026-03' }])
  await entrar(page, usuario)

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Gerar Relatório do Mês' }).click()
  const arquivo = await download

  expect(arquivo.suggestedFilename()).toBe('relatorio-2026-03.pdf')
  const { readFile } = await import('node:fs/promises')
  const conteudo = await readFile(await arquivo.path())
  expect(conteudo.subarray(0, 5).toString()).toBe('%PDF-')
})
