// O PostgREST corta a resposta no "max rows" do projeto (1000 por padrão) sem devolver
// erro, e o saldo acumulado depende do histórico completo — daí a paginação.
// A página fica abaixo do limite para que "página curta = última página" seja válido.
export const PAGINA = 500;

export const buscarTodos = async (cliente, tabela, userId, pagina = PAGINA) => {
  let todos = [];
  for (let inicio = 0; ; inicio += pagina) {
    const { data, error } = await cliente
      .from(tabela).select("*").eq("user_id", userId)
      .order("id", { ascending: true })
      .range(inicio, inicio + pagina - 1);
    if (error) throw error;
    todos = todos.concat(data || []);
    if (!data || data.length < pagina) return todos;
  }
};
