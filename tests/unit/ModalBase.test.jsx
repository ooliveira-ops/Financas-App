// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ModalBase, ModalConfirmar } from '../../src/ModalBase.jsx'

afterEach(cleanup)

// A animação de entrada termina com `transform` aplicado, e um ancestral com transform
// prende o `position: fixed` dos filhos. O modal precisa sair do bloco onde foi aberto.
describe('ModalBase dentro de bloco animado', () => {
  const abrirDentroDeBloco = (modal) =>
    render(<section data-testid="bloco" className="animate-fadeInUp text-center">{modal}</section>)

  it('é renderizado direto no body, fora do bloco', () => {
    abrirDentroDeBloco(<ModalBase titulo="Como funciona a Home" onFechar={() => {}}><p>texto</p></ModalBase>)
    const dialogo = screen.getByRole('dialog', { name: 'Como funciona a Home' })
    expect(screen.getByTestId('bloco').contains(dialogo)).toBe(false)
    expect(dialogo.parentElement.parentElement).toBe(document.body)
  })

  it('não herda o alinhamento centralizado', () => {
    abrirDentroDeBloco(<ModalBase titulo="Ajuda" onFechar={() => {}}><p>texto</p></ModalBase>)
    expect(screen.getByRole('dialog').parentElement.className).toContain('text-left')
  })

  it('a confirmação de exclusão também sai do bloco', () => {
    abrirDentroDeBloco(<ModalConfirmar mensagem="Apagar esta despesa?" onConfirmar={() => {}} onCancelar={() => {}}/>)
    expect(screen.getByTestId('bloco').contains(screen.getByRole('dialog'))).toBe(false)
  })
})

describe('ModalBase', () => {
  it('fecha pelo botão, pelo fundo e pelo Esc, mas não por clique dentro', () => {
    const onFechar = vi.fn()
    render(<ModalBase titulo="Ajuda" onFechar={onFechar}><p>conteúdo</p></ModalBase>)

    fireEvent.click(screen.getByText('conteúdo'))
    expect(onFechar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.click(screen.getByRole('dialog').parentElement)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(3)
  })

  it('sai do body ao desmontar', () => {
    const { unmount } = render(<ModalBase titulo="Ajuda" onFechar={() => {}}><p>x</p></ModalBase>)
    unmount()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
})
