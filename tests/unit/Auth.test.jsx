// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { criarSupabaseFalso } from '../fixtures/supabaseFalso.js'

const estado = vi.hoisted(() => ({ cliente: null }))
vi.mock('../../src/supabase.js', () => ({ get supabase() { return estado.cliente } }))

// O número do WhatsApp é lido quando o módulo carrega; cada teste importa de novo.
const carregarAuth = async () => {
  vi.resetModules()
  return (await import('../../src/Auth.jsx')).default
}

const RPC_OK = { verificar_codigo_acesso: true, consumir_codigo_acesso: true }
const clienteCom = (rpcs = RPC_OK) => criarSupabaseFalso({
  responder: (c) => (c.rpc ? { data: rpcs[c.rpc], error: null } : undefined),
})

// A aba e o botão de envio se chamam "Entrar"; o de envio é o último.
const botaoEntrar = () => screen.getAllByRole('button', { name: 'Entrar' }).at(-1)

const preencherCadastro = async (user) => {
  await user.click(screen.getByRole('button', { name: /cadastrar/i }))
  await user.type(screen.getByPlaceholderText('Seu nome'), 'Teste')
  await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@example.com')
  await user.type(screen.getByPlaceholderText('Senha'), 'senha-teste')
  await user.type(screen.getByPlaceholderText(/token/i), 'ab12-cd34')
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('Auth', () => {
  let Auth
  let user

  beforeEach(async () => {
    estado.cliente = clienteCom()
    Auth = await carregarAuth()
    user = userEvent.setup()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  describe('login', () => {
    it('envia email e senha', async () => {
      render(<Auth/>)
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@example.com')
      await user.type(screen.getByPlaceholderText('Senha'), 'senha-teste')
      await user.click(botaoEntrar())

      expect(estado.cliente.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'teste@example.com', password: 'senha-teste' })
    })

    it('traduz credencial inválida', async () => {
      estado.cliente.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } })
      render(<Auth/>)
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@example.com')
      await user.type(screen.getByPlaceholderText('Senha'), 'errada')
      await user.click(botaoEntrar())

      expect(await screen.findByText('Email ou senha incorretos')).toBeTruthy()
    })

    it('campos vazios não chamam o Supabase', async () => {
      render(<Auth/>)
      await user.click(botaoEntrar())
      expect(screen.getByText('Preencha email e senha')).toBeTruthy()
      expect(estado.cliente.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('cadastro com token', () => {
    it('token válido: verifica, cria a conta e só então consome o token', async () => {
      estado.cliente.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [{ id: 'i1' }] }, session: {} }, error: null })
      render(<Auth/>)
      await preencherCadastro(user)

      const rpcs = estado.cliente.chamadas.filter(c => c.rpc).map(c => [c.rpc, c.parametros])
      expect(rpcs).toEqual([
        ['verificar_codigo_acesso', { codigo_input: 'AB12-CD34' }],
        ['consumir_codigo_acesso', { codigo_input: 'AB12-CD34', email_input: 'teste@example.com' }],
      ])
      expect(estado.cliente.auth.signUp).toHaveBeenCalledWith({
        email: 'teste@example.com', password: 'senha-teste', options: { data: { nome: 'Teste' } },
      })
      expect(estado.cliente.naoConsumidas()).toEqual([])
    })

    it('token inválido ou já usado: não cria conta', async () => {
      estado.cliente = clienteCom({ ...RPC_OK, verificar_codigo_acesso: false })
      Auth = await carregarAuth()
      render(<Auth/>)
      await preencherCadastro(user)

      expect(await screen.findByText(/Token inválido ou já utilizado/)).toBeTruthy()
      expect(estado.cliente.auth.signUp).not.toHaveBeenCalled()
      expect(estado.cliente.chamadas.some(c => c.rpc === 'consumir_codigo_acesso')).toBe(false)
    })

    it('signUp com identities vazio (email já cadastrado) NÃO consome o token', async () => {
      estado.cliente.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null })
      render(<Auth/>)
      await preencherCadastro(user)

      expect(await screen.findByText(/Este email já está cadastrado/)).toBeTruthy()
      expect(estado.cliente.chamadas.some(c => c.rpc === 'consumir_codigo_acesso')).toBe(false)
    })

    it('sem sessão no retorno (confirmação de email ligada) avisa e volta ao login', async () => {
      estado.cliente.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [{ id: 'i1' }] }, session: null }, error: null })
      render(<Auth/>)
      await preencherCadastro(user)

      expect(await screen.findByText(/Conta criada! Confirme seu email/)).toBeTruthy()
      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    })

    it('token não marcado como usado é avisado', async () => {
      estado.cliente = clienteCom({ ...RPC_OK, consumir_codigo_acesso: false })
      estado.cliente.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [{ id: 'i1' }] }, session: {} }, error: null })
      Auth = await carregarAuth()
      render(<Auth/>)
      await preencherCadastro(user)

      expect(await screen.findByText(/o token não ficou marcado como usado/)).toBeTruthy()
    })

    it('senha curta é recusada antes de chamar o Supabase', async () => {
      render(<Auth/>)
      await user.click(screen.getByRole('button', { name: /cadastrar/i }))
      await user.type(screen.getByPlaceholderText('Seu nome'), 'Teste')
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@example.com')
      await user.type(screen.getByPlaceholderText('Senha'), '123')
      await user.type(screen.getByPlaceholderText(/token/i), 'AB12-CD34')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      expect(screen.getByText('A senha precisa ter pelo menos 6 caracteres')).toBeTruthy()
      expect(estado.cliente.chamadas).toEqual([])
    })
  })

  describe('recuperação de senha', () => {
    it('envia o link e confirma na tela', async () => {
      render(<Auth/>)
      await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
      await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@example.com')
      await user.click(screen.getByRole('button', { name: 'Enviar link' }))

      expect(estado.cliente.auth.resetPasswordForEmail).toHaveBeenCalledWith('teste@example.com', { redirectTo: window.location.origin })
      expect(await screen.findByText('Link de recuperação enviado para seu email.')).toBeTruthy()
    })

    it('volta ao login', async () => {
      render(<Auth/>)
      await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
      await user.click(screen.getByRole('button', { name: /voltar ao login/i }))
      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    })
  })

  describe('link de WhatsApp', () => {
    it('some quando VITE_WHATSAPP_NUMERO não existe', () => {
      render(<Auth/>)
      expect(screen.queryByRole('link', { name: /whatsapp/i })).toBeNull()
    })

    it('aparece quando a variável existe', async () => {
      vi.stubEnv('VITE_WHATSAPP_NUMERO', '5500000000000')
      Auth = await carregarAuth()
      render(<Auth/>)
      expect(screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href')).toMatch(/\/5500000000000$/)
    })
  })
})
