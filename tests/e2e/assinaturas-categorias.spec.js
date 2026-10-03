import { createClient } from '@supabase/supabase-js'
import { AGORA, aviso, entrar, expect, irPara, test } from './apoio.js'
import { supabaseLocal } from './ambiente.js'

test('assinatura gera a despesa do mês no dia escolhido', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  await irPara(page, 'Assinaturas')
  await page.getByRole('button', { name: 'Nova', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Nova assinatura' })
  await modal.getByPlaceholder(/Streaming/).fill('Streaming')
  await modal.getByPlaceholder('0,00').fill('40')
  await modal.getByRole('spinbutton', { name: /Dia do vencimento/ }).fill('20')
  await modal.getByRole('button', { name: 'Salvar assinatura' }).click()
  await expect(aviso(page)).toContainText('Assinatura "Streaming" criada')

  const despesas = await dados.linhas('despesas', usuario.id)
  expect(despesas).toHaveLength(1)
  expect(despesas[0]).toMatchObject({ descricao: 'Streaming', data_vencimento: '2026-03-20', status: 'pendente' })

  // Recarregar não gera a despesa de novo.
  await page.reload()
  await expect(page.getByText('olá, Teste E2E')).toBeVisible()
  expect(await dados.linhas('despesas', usuario.id)).toHaveLength(1)
})

test('duas abas abertas ao mesmo tempo não duplicam as categorias padrão', async ({ context, dados }) => {
  const usuario = await dados.usuario()
  // Sessão gravada antes de abrir as abas, para as duas carregarem juntas, com a lista
  // de categorias ainda vazia.
  const { url, anonKey } = supabaseLocal()
  const cliente = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await cliente.auth.signInWithPassword({ email: usuario.email, password: usuario.senha })
  if (error) throw error
  const chave = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
  await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [chave, JSON.stringify(data.session)])

  const [aba1, aba2] = await Promise.all([context.newPage(), context.newPage()])
  await Promise.all([aba1.clock.setFixedTime(AGORA), aba2.clock.setFixedTime(AGORA)])
  await Promise.all([aba1.goto('/'), aba2.goto('/')])
  await Promise.all([
    expect(aba1.getByText('olá, Teste E2E')).toBeVisible(),
    expect(aba2.getByText('olá, Teste E2E')).toBeVisible(),
  ])

  await expect.poll(async () => (await dados.linhas('categorias', usuario.id)).length).toBe(5)
  const nomes = (await dados.linhas('categorias', usuario.id)).map(c => c.nome)
  expect(new Set(nomes).size).toBe(5)
})
