import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomInt, randomUUID } from 'node:crypto'
import { supabaseLocal } from './ambiente.js'

const local = supabaseLocal()
const semSessao = { auth: { persistSession: false, autoRefreshToken: false } }

// Cliente com a chave de serviço do Supabase local: ignora RLS, só para preparar e
// limpar dados. O app testado usa a chave anon, como em produção.
export const admin = createClient(local.url, local.serviceRoleKey, semSessao)

// Relógio fixo no navegador: meses e vencimentos previsíveis em qualquer dia de execução.
export const AGORA = new Date('2026-03-15T12:00:00-03:00')
export const SENHA = 'senha-e2e-123'
export const emailNovo = () => `e2e-${randomUUID()}@example.com`

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const bloco = () => Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
export const tokenNovo = () => `${bloco()}-${bloco()}`

// Cliente com a chave anon logado como o usuário: o mesmo acesso que o navegador dele tem.
export async function clienteDe(usuario) {
  const cliente = createClient(local.url, local.anonKey, semSessao)
  const { error } = await cliente.auth.signInWithPassword({ email: usuario.email, password: usuario.senha })
  if (error) throw error
  return cliente
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(AGORA)
    await use(page)
  },

  // Cada teste cria os próprios usuários e tokens e eles são apagados no fim, passe ou
  // falhe. Apagar o usuário apaga em cascata tudo o que é dele (ON DELETE CASCADE).
  dados: async ({}, use) => {
    const usuarios = []
    const emailsDaTela = []
    const tokens = []
    const dados = {
      async usuario({ nome = 'Teste E2E', ehAdmin = false } = {}) {
        const email = emailNovo()
        const { data, error } = await admin.auth.admin.createUser({
          email, password: SENHA, email_confirm: true, user_metadata: { nome },
        })
        if (error) throw error
        usuarios.push(data.user.id)
        if (ehAdmin) {
          const { error: erro } = await admin.from('profiles').update({ is_admin: true }).eq('id', data.user.id)
          if (erro) throw erro
        }
        return { id: data.user.id, email, senha: SENHA, nome }
      },
      async token() {
        const codigo = tokenNovo()
        const { error } = await admin.from('codigos_acesso').insert({ codigo, descricao: 'e2e' })
        if (error) throw error
        tokens.push(codigo)
        return codigo
      },
      // Conta criada pelo formulário de cadastro: entra na limpeza pelo email.
      cadastradoPelaTela(email) { emailsDaTela.push(email) },
      async inserir(tabela, linhas) {
        const { data, error } = await admin.from(tabela).insert(linhas).select()
        if (error) throw error
        return data
      },
      async linhas(tabela, userId) {
        const { data, error } = await admin.from(tabela).select('*').eq('user_id', userId)
        if (error) throw error
        return data
      },
    }

    await use(dados)

    for (const email of emailsDaTela) {
      const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
      if (data) usuarios.push(data.id)
    }
    for (const id of usuarios) await admin.auth.admin.deleteUser(id)
    if (tokens.length) await admin.from('codigos_acesso').delete().in('codigo', tokens)
  },
})

export { expect }

export async function entrar(page, usuario) {
  await page.goto('/')
  await page.getByPlaceholder('seu@email.com').fill(usuario.email)
  await page.getByPlaceholder('Senha').fill(usuario.senha)
  // A aba e o botão de envio se chamam "Entrar"; o de envio é o último.
  await page.getByRole('button', { name: 'Entrar' }).last().click()
  await expect(page.getByText(`olá, ${usuario.nome}`)).toBeVisible()
}

export const irPara = (page, aba) => page.getByRole('navigation').getByRole('button', { name: aba, exact: true }).click()

// Card de resumo da Home pelo rótulo ("Receitas", "Pago", "Saldo atual", "A pagar").
export const card = (page, rotulo) =>
  page.locator('[class*="rounded-2xl"]').filter({ has: page.getByText(rotulo, { exact: true }) }).first()

export const aviso = (page) => page.getByRole('status')
