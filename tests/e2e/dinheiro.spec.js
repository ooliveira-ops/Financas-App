import { aviso, card, entrar, expect, irPara, test } from './apoio.js'

test('receita: criar, ver no saldo e apagar com confirmação', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  await irPara(page, 'Receitas')
  await page.getByRole('button', { name: 'Nova', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Nova receita' })
  await modal.getByPlaceholder(/Salário/).fill('Salário')
  await modal.getByPlaceholder('0,00').fill('2500')
  await modal.getByRole('button', { name: 'Salvar receita' }).click()
  await expect(aviso(page)).toContainText('Receita "Salário" adicionada')

  await irPara(page, 'Início')
  await expect(card(page, 'Receitas')).toContainText('R$ 2.500,00')
  await expect(card(page, 'Saldo atual')).toContainText('R$ 2.500,00')

  await irPara(page, 'Receitas')
  await page.getByRole('button', { name: 'Apagar' }).click()
  const confirmar = page.getByRole('dialog', { name: 'Confirmar' })
  await expect(confirmar).toContainText('Apagar esta receita?')
  await confirmar.getByRole('button', { name: 'Apagar' }).click()
  await expect(aviso(page)).toContainText('Receita "Salário" apagada')

  expect(await dados.linhas('receitas', usuario.id)).toEqual([])
  await irPara(page, 'Início')
  await expect(card(page, 'Receitas')).toContainText('R$ 0,00')
})

test('despesa: criar pendente, marcar paga, e o saldo cai exatamente uma vez', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await dados.inserir('receitas', [{ user_id: usuario.id, fonte: 'Salário', valor: 1000, mes: '2026-03' }])
  await entrar(page, usuario)

  await irPara(page, 'Despesas')
  await page.getByRole('button', { name: 'Nova', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Nova despesa' })
  await modal.getByPlaceholder(/Mercado/).fill('Mercado')
  await modal.getByPlaceholder('0,00').fill('150')
  await modal.getByRole('button', { name: 'Salvar despesa' }).click()
  await expect(aviso(page)).toContainText('Despesa "Mercado" criada')

  await irPara(page, 'Início')
  await expect(card(page, 'A pagar')).toContainText('R$ 150,00')
  await expect(card(page, 'Saldo atual')).toContainText('R$ 1.000,00')

  await irPara(page, 'Despesas')
  const saldoNaAba = page.getByText('Saldo atual', { exact: true }).locator('..')
  await expect(saldoNaAba).toContainText('R$ 1.000,00')
  // Clique duplo: a trava por item precisa impedir o segundo pagamento.
  await page.getByRole('button', { name: 'Marcar como paga' }).dblclick()
  await expect(aviso(page)).toContainText('"Mercado" paga')
  // O saldo cai na própria aba, sem ir à Home.
  await expect(saldoNaAba).toContainText('R$ 850,00')

  await irPara(page, 'Início')
  await expect(card(page, 'Pago')).toContainText('R$ 150,00')
  await expect(card(page, 'Saldo atual')).toContainText('R$ 850,00')
  await expect(card(page, 'A pagar')).toContainText('R$ 0,00')

  const despesas = await dados.linhas('despesas', usuario.id)
  expect(despesas).toHaveLength(1)
  expect(despesas[0]).toMatchObject({ status: 'paga', data_pagamento: '2026-03-15' })

  await page.reload()
  await expect(card(page, 'Saldo atual')).toContainText('R$ 850,00')
})
