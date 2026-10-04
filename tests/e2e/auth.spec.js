import { admin, emailNovo, entrar, expect, test } from './apoio.js'

const cadastrar = async (page, { nome, email, token }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await page.getByPlaceholder('Seu nome').fill(nome)
  await page.getByPlaceholder('seu@email.com').fill(email)
  await page.getByPlaceholder('Senha').fill('senha-e2e-123')
  await page.getByPlaceholder(/Token/).fill(token)
  await page.getByRole('button', { name: 'Criar conta' }).click()
}

const contaExiste = async (email) => {
  const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  return Boolean(data)
}

test.describe('cadastro com token', () => {
  test('token válido cria a conta, entra no app e consome o token', async ({ page, dados }) => {
    const token = await dados.token()
    const email = emailNovo()
    dados.cadastradoPelaTela(email)

    await cadastrar(page, { nome: 'Pessoa Nova', email, token: token.toLowerCase() })

    await expect(page.getByText('olá, Pessoa Nova')).toBeVisible()
    const { data } = await admin.from('codigos_acesso').select('ativo, usado_por').eq('codigo', token).single()
    expect(data).toEqual({ ativo: false, usado_por: email })
  })

  test('token inexistente é recusado e nenhuma conta é criada', async ({ page, dados }) => {
    const email = emailNovo()
    dados.cadastradoPelaTela(email)

    await cadastrar(page, { nome: 'Pessoa Nova', email, token: 'ZZZZ-ZZZZ' })

    await expect(page.getByText(/Token inválido ou já utilizado/)).toBeVisible()
    expect(await contaExiste(email)).toBe(false)
  })

  test('token já usado é recusado', async ({ page, dados }) => {
    const token = await dados.token()
    await admin.from('codigos_acesso').update({ ativo: false, usado_por: 'outra-pessoa@example.com' }).eq('codigo', token)
    const email = emailNovo()
    dados.cadastradoPelaTela(email)

    await cadastrar(page, { nome: 'Pessoa Nova', email, token })

    await expect(page.getByText(/Token inválido ou já utilizado/)).toBeVisible()
    expect(await contaExiste(email)).toBe(false)
  })

  test('email já cadastrado não consome o token', async ({ page, dados }) => {
    const existente = await dados.usuario()
    const token = await dados.token()

    await cadastrar(page, { nome: 'Outra Pessoa', email: existente.email, token })

    await expect(page.getByText(/já está cadastrado/)).toBeVisible()
    const { data } = await admin.from('codigos_acesso').select('ativo').eq('codigo', token).single()
    expect(data.ativo).toBe(true)
  })
})

test('login e logout', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  await page.getByRole('button', { name: 'Sair' }).click()

  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('senha errada não entra', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await page.goto('/')
  await page.getByPlaceholder('seu@email.com').fill(usuario.email)
  await page.getByPlaceholder('Senha').fill('senha-errada')
  await page.getByRole('button', { name: 'Entrar' }).last().click()

  await expect(page.getByText('Email ou senha incorretos')).toBeVisible()
})
