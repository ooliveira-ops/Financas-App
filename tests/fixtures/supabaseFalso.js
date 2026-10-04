import { vi } from 'vitest'

// Cliente Supabase de mentira para testes. Imita o builder do supabase-js: cada método
// encadeia e devolve o próprio builder, e a requisição só "acontece" quando alguém o
// consome (await, .then, Promise.all) — igual ao real, que não dispara sem isso.
//
// `responder(chamada)` decide o retorno. A chamada traz a tabela (ou a RPC), os métodos
// encadeados e os argumentos de cada um:
//   chamada.tabela        'despesas'
//   chamada.rpc           'verificar_codigo_acesso' (nas RPCs)
//   chamada.tem('update') true
//   chamada.args('eq')    ['user_id', 'u1']
// Sem resposta definida, devolve { data: null, error: null }.
const METODOS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'in', 'or', 'is', 'order', 'range', 'limit', 'single', 'maybeSingle',
]

export function criarSupabaseFalso({ responder = () => undefined, sessao = null } = {}) {
  const chamadas = []

  const novaChamada = (inicial) => {
    const chamada = {
      ...inicial,
      operacoes: [],
      consumida: false,
      tem: (metodo) => chamada.operacoes.some(o => o.metodo === metodo),
      args: (metodo) => chamada.operacoes.find(o => o.metodo === metodo)?.args,
    }
    chamadas.push(chamada)
    const builder = {}
    for (const metodo of METODOS) {
      builder[metodo] = (...args) => { chamada.operacoes.push({ metodo, args }); return builder }
    }
    builder.then = (resolve, reject) => {
      chamada.consumida = true
      return Promise.resolve()
        .then(() => responder(chamada) ?? { data: null, error: null })
        .then(resolve, reject)
    }
    return builder
  }

  const cliente = {
    chamadas,
    from: (tabela) => novaChamada({ tabela }),
    rpc: (nome, parametros) => novaChamada({ rpc: nome, parametros }),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: sessao }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
      signUp: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    },
    // Chamadas montadas e nunca enviadas: no cliente real, elas simplesmente não existem.
    naoConsumidas: () => chamadas.filter(c => !c.consumida),
    na: (tabela, metodo) => chamadas.filter(c => c.tabela === tabela && (!metodo || c.tem(metodo))),
  }
  return cliente
}

// Sessão de um usuário fictício.
export const sessaoDeTeste = (campos = {}) => ({
  user: { id: 'usuario-teste', email: 'teste@example.com', user_metadata: { nome: 'Teste' }, ...campos },
})
