import { entrar, expect, test } from './apoio.js'

// A tabela de novidades é uma só para todos os usuários: gravar nela mostraria o banner
// nos testes que rodam em paralelo. A resposta é simulada só nesta página.
const ITENS = Array.from({ length: 25 }, (_, i) => `Novidade fictícia número ${i + 1}, com texto longo o bastante para ocupar duas linhas no celular`)

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/novidades*', (rota) => rota.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'n1', versao: 'e2e-lista-longa', itens: ITENS, ativo: true, created_at: '2026-03-15T12:00:00Z' }]),
  }))
})

test('lista longa de novidades: o X fica na tela e fecha o banner', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  const banner = page.getByRole('dialog', { name: 'Últimas atualizações' })
  await expect(banner).toBeVisible()
  const fechar = banner.getByRole('button', { name: 'Fechar novidades' })
  await expect(fechar).toBeInViewport()

  // A lista rola por dentro até o último item, e rolar mantém o banner aberto.
  const ultimo = banner.getByText(ITENS.at(-1))
  await ultimo.scrollIntoViewIfNeeded()
  await expect(ultimo).toBeInViewport()
  await expect(banner).toContainText('Toque no X ou fora do quadro para fechar.')
  await expect(fechar).toBeInViewport()

  await fechar.click()
  await expect(banner).toBeHidden()
})

test('tocar fora do quadro fecha o banner', async ({ page, dados }) => {
  const usuario = await dados.usuario()
  await entrar(page, usuario)

  const banner = page.getByRole('dialog', { name: 'Últimas atualizações' })
  await expect(banner).toBeVisible()
  // Canto da tela, fora do quadro: a margem lateral do fundo escuro.
  await page.mouse.click(4, 4)
  await expect(banner).toBeHidden()
})
