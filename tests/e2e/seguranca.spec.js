import { admin, card, clienteDe, entrar, expect, irPara, test } from './apoio.js'

test('isolamento: o usuário B não vê nem altera dado do usuário A', async ({ page, dados }) => {
  const a = await dados.usuario({ nome: 'Pessoa A' })
  const b = await dados.usuario({ nome: 'Pessoa B' })
  const [despesaDeA] = await dados.inserir('despesas', [
    { user_id: a.id, descricao: 'Despesa de A', valor: 999, status: 'pendente', data: '2026-03-10', data_vencimento: '2026-03-10' },
  ])
  await dados.inserir('receitas', [{ user_id: a.id, fonte: 'Renda de A', valor: 5000, mes: '2026-03' }])

  // Pela tela: nada de A aparece para B.
  await entrar(page, b)
  await expect(card(page, 'Receitas')).toContainText('R$ 0,00')
  await expect(card(page, 'A pagar')).toContainText('R$ 0,00')
  await irPara(page, 'Despesas')
  await page.getByRole('combobox').selectOption('todos')
  await expect(page.getByText('Despesa de A')).toHaveCount(0)

  // Direto na API, com a sessão de B: o RLS barra sem devolver erro (0 linhas).
  const clienteB = await clienteDe(b)
  const leitura = await clienteB.from('despesas').select('*').eq('id', despesaDeA.id)
  expect(leitura.data).toEqual([])
  const alteracao = await clienteB.from('despesas').update({ valor: 1 }).eq('id', despesaDeA.id).select()
  expect(alteracao.error).toBeNull()
  expect(alteracao.data).toEqual([])
  const remocao = await clienteB.from('despesas').delete().eq('id', despesaDeA.id).select()
  expect(remocao.data).toEqual([])
  const intrusa = await clienteB.from('despesas').insert({ user_id: a.id, descricao: 'Intrusa', valor: 1, data: '2026-03-10' })
  expect(intrusa.error).not.toBeNull()

  const { data: intacta } = await admin.from('despesas').select('valor').eq('id', despesaDeA.id).single()
  expect(Number(intacta.valor)).toBe(999)
  expect(await dados.linhas('despesas', a.id)).toHaveLength(1)
})

test('admin: o painel Usuários só aparece para is_admin', async ({ page, dados }) => {
  const comum = await dados.usuario({ nome: 'Pessoa Comum' })
  await entrar(page, comum)
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Usuários' })).toHaveCount(0)

  // O signOut é assíncrono: navegar antes de ele terminar recarrega a sessão antiga.
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  const chefe = await dados.usuario({ nome: 'Pessoa Admin', ehAdmin: true })
  await entrar(page, chefe)
  await irPara(page, 'Usuários')
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()
  await expect(page.getByText(chefe.email)).toBeVisible()
})

test('admin: a RPC recusa usuário comum mesmo chamada direto', async ({ dados }) => {
  const comum = await dados.usuario()
  const cliente = await clienteDe(comum)

  const promocao = await cliente.rpc('toggle_user_admin', { target_id: comum.id, novo_valor: true })
  expect(promocao.error?.message).toMatch(/Apenas administradores/)

  // Nem pelo update direto no próprio perfil: a policy não deixa mudar is_admin.
  await cliente.from('profiles').update({ is_admin: true }).eq('id', comum.id)

  const { data } = await admin.from('profiles').select('is_admin').eq('id', comum.id).single()
  expect(data.is_admin).toBe(false)
})
