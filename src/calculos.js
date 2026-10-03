import { dividirEmParcelas, hojeISO, somarDias, somarMeses } from "./utils";

// Contas do app como funções puras: recebem as listas e a data de referência ("hoje"
// em YYYY-MM-DD, mês em YYYY-MM) e nunca leem o relógio nem o banco.

// Identifica a receita gerada por "Ajustar saldo inicial" entre as receitas comuns.
export const FONTE_AJUSTE = "Ajuste de saldo";

export const somaValores = (lista) => lista.reduce((s, x) => s + parseFloat(x.valor || 0), 0);
const somaArredondada = (lista) => Math.round(somaValores(lista) * 100) / 100;

export const vencimentoDe = (d) => d.data_vencimento || d.data || "";
const mesDoVencimento = (d) => vencimentoDe(d).substring(0, 7);
const estaPaga = (d) => d.status === "paga";

// ── STATUS E TOTAIS ──────────────────────────────────────────────────────────────

// Status nulo conta como pendente.
export const separarPorStatus = (despesas) => ({
  pendentes: despesas.filter(d => d.status === "pendente" || !d.status),
  pagas: despesas.filter(estaPaga),
});

// Receita sem `mes` conta como do mês informado.
export const receitasDoMes = (receitas, mes) => receitas.filter(r => (r.mes || mes) === mes);
export const pagasNoMes = (pagas, mes) => pagas.filter(d => d.data_pagamento && d.data_pagamento.startsWith(mes));
export const pendentesDoMes = (despesas, mes) =>
  despesas.filter(d => (d.status === "pendente" || !d.status) && (d.data_vencimento || d.data)?.startsWith(mes));

// SALDO ACUMULADO: receitas e despesas pagas de TODA a história, não só do mês. É assim
// que o que sobra de um mês passa sozinho para o seguinte. Parcelamentos entram pelas
// despesas de cada parcela, nunca por `valor_pago` — somar os dois descontaria o mesmo
// dinheiro duas vezes. `null` enquanto não há receita.
export const calcularSaldo = (receitas, pagas) => {
  const totalReceitas = somaValores(receitas);
  const temReceita = totalReceitas > 0;
  return { totalReceitas, temReceita, saldo: temReceita ? totalReceitas - somaValores(pagas) : null };
};

// SALDO DO MÊS: só o que entrou e o que foi pago dentro do mês, sem herdar o que sobrou
// dos meses anteriores. `null` quando o mês não tem movimento.
export const calcularSaldoMes = (totalReceitasMes, totalPagasMes) => {
  const temMovimento = totalReceitasMes > 0 || totalPagasMes > 0;
  return { temMovimento, saldo: temMovimento ? totalReceitasMes - totalPagasMes : null };
};

// SALDO INICIAL: o que sobrou (ou faltou) até o fim do mês anterior — é com ele que o
// mês começa. Despesa paga sem `data_pagamento` (registro antigo) conta como anterior:
// ela já entra no saldo atual, e deixá-la de fora inflaria o saldo inicial.
export const composicaoSaldoInicial = ({ receitas, pagas, pendentes, mes }) => {
  const receitasAntes = receitas.filter(r => r.mes && r.mes < mes);
  const ajustes = receitasAntes.filter(r => r.fonte === FONTE_AJUSTE);
  const pagasAntes = pagas.filter(d => !d.data_pagamento || d.data_pagamento.substring(0, 7) < mes);
  return {
    receitas: somaArredondada(receitasAntes.filter(r => r.fonte !== FONTE_AJUSTE)),
    ajustes,
    totalAjustes: somaArredondada(ajustes),
    pagas: somaArredondada(pagasAntes),
    pagasSemData: somaArredondada(pagasAntes.filter(d => !d.data_pagamento)),
    // Pistas para quando o saldo inicial não bate com o banco:
    pendentesAntigas: somaArredondada(pendentes.filter(d => mesDoVencimento(d) && mesDoVencimento(d) < mes)),
    antigasPagasNoMes: somaArredondada(pagas.filter(d => d.data_pagamento?.startsWith(mes) && mesDoVencimento(d) && mesDoVencimento(d) < mes)),
    saldo: Math.round((somaArredondada(receitasAntes) - somaArredondada(pagasAntes)) * 100) / 100,
  };
};

// ── VENCIMENTOS ──────────────────────────────────────────────────────────────────

// Dias até o próximo vencimento de cada assinatura, do mais próximo ao mais distante.
export const proximasAssinaturas = (assinaturas, hoje) => {
  const [ano, mes, diaHoje] = hoje.split("-").map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return [...assinaturas]
    .map(a => {
      const dia = parseInt(a.dia_vencimento || 5);
      return { ...a, diasRestantes: dia >= diaHoje ? dia - diaHoje : diasNoMes - diaHoje + dia };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
};

// Pendentes vencidas antes de hoje e as que vencem de hoje até 7 dias à frente.
export const avisosDeVencimento = (pendentes, hoje) => {
  const limite = somarDias(hoje, 7);
  const vencidas = [];
  const vencendo = [];
  pendentes.forEach(d => {
    if (!d.data_vencimento) return;
    if (d.data_vencimento < hoje) vencidas.push(d);
    else if (d.data_vencimento <= limite) vencendo.push(d);
  });
  return { vencidas, vencendo };
};

// ── HISTÓRICO ────────────────────────────────────────────────────────────────────

// Paga entra no mês do pagamento; pendente, no do vencimento. O mês atual sempre aparece.
export const mesesDoHistorico = (despesas, mesAtual) => {
  const s = new Set();
  despesas.forEach(d => {
    if (estaPaga(d) && d.data_pagamento) s.add(d.data_pagamento.substring(0, 7));
    if (!estaPaga(d) && d.data_vencimento) s.add(d.data_vencimento.substring(0, 7));
  });
  s.add(mesAtual);
  return [...s].sort((a, b) => b.localeCompare(a));
};

export const despesasDoMesNoHistorico = (despesas, mes) =>
  despesas
    .filter(d => estaPaga(d) ? d.data_pagamento?.startsWith(mes) : (d.data_vencimento || d.data)?.startsWith(mes))
    .sort((a, b) => vencimentoDe(b).localeCompare(vencimentoDe(a)));

export const totaisPagoPendente = (lista) => ({
  pago: somaValores(lista.filter(estaPaga)),
  pendente: somaValores(lista.filter(d => !estaPaga(d))),
});

// ── ABA DESPESAS ─────────────────────────────────────────────────────────────────

// A fatura não é tabela própria: é o agrupamento das despesas pendentes no cartão pelo
// mês de vencimento. Pagar a fatura marca essas despesas como pagas — o dinheiro sai do
// saldo uma vez só, pelas mesmas linhas que o pagamento individual usaria. Fatura de mês
// anterior ainda pendente está vencida: continua visível no mês filtrado.
export const faturasDoCartao = (pendentes, mesFiltro) => {
  const mapa = new Map();
  pendentes.filter(d => d.forma_pagamento === "cartao").forEach(d => {
    const mes = mesDoVencimento(d);
    if (!mes) return;
    if (!mapa.has(mes)) mapa.set(mes, []);
    mapa.get(mes).push(d);
  });
  return [...mapa.entries()]
    .filter(([mes]) => mesFiltro === "todos" || mes <= mesFiltro)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, itens]) => ({ mes, ids: itens.map(d => d.id), total: somaArredondada(itens) }));
};

// Meses com alguma despesa (pendente pelo vencimento, paga pelo pagamento), do mais
// recente para o mais antigo. O mês atual sempre aparece.
export const mesesComDespesas = (pendentes, pagas, mesAtual) => {
  const s = new Set();
  pendentes.forEach(d => { const dr = d.data_vencimento || d.data; if (dr) s.add(dr.substring(0, 7)); });
  pagas.forEach(d => { if (d.data_pagamento) s.add(d.data_pagamento.substring(0, 7)); });
  s.add(mesAtual);
  return [...s].sort((a, b) => b.localeCompare(a));
};

// Pendências de meses anteriores ao filtrado, que o filtro do mês esconderia.
export const pendentesAnteriores = (pendentes, mesFiltro) => {
  if (mesFiltro === "todos") return null;
  const antigas = pendentes.filter(d => { const ref = mesDoVencimento(d); return ref && ref < mesFiltro; });
  return antigas.length > 0 ? { qtd: antigas.length, total: somaValores(antigas) } : null;
};

// Pendentes são filtradas pelo vencimento; pagas, pelo pagamento.
const referenciaDaSubAba = (subAba) => (d) => (subAba === "pendentes" ? (d.data_vencimento || d.data) : d.data_pagamento);

export const filtrarDespesas = (lista, { subAba, mes, categoria, soCartao }) => {
  const referencia = referenciaDaSubAba(subAba);
  return lista.filter(d => {
    const casaCategoria = categoria === "todas" || (categoria === "sem" ? !d.categoria_id : d.categoria_id === categoria);
    if (!casaCategoria) return false;
    if (soCartao && d.forma_pagamento !== "cartao") return false;
    if (mes === "todos") return true;
    const ref = referencia(d);
    return ref && ref.startsWith(mes);
  });
};

// Agrupa por mês de referência, do mais recente ao mais antigo, com o subtotal de cada um.
export const agruparPorMes = (lista, subAba) => {
  const referencia = (d) => referenciaDaSubAba(subAba)(d) || "";
  const mapa = new Map();
  [...lista].sort((a, b) => referencia(b).localeCompare(referencia(a))).forEach(d => {
    const mes = referencia(d).substring(0, 7) || "sem-data";
    if (!mapa.has(mes)) mapa.set(mes, []);
    mapa.get(mes).push(d);
  });
  return [...mapa.entries()].map(([mes, itens]) => ({ mes, itens, subtotal: somaValores(itens) }));
};

// ── PARCELAS ─────────────────────────────────────────────────────────────────────

// A parcela vive em coluna, não na descrição: sem isto duas parcelas da mesma compra
// aparecem com o mesmo texto na lista.
export const textoParcela = (d) => (d.parcela_atual && d.parcelas_total ? `${d.parcela_atual}/${d.parcelas_total}` : null);

// Uma compra parcelada vira N linhas em `despesas`. Com parcelamento, a chave do grupo é
// `parcelamento_id`; sem ele, as N linhas saem do mesmo INSERT e dividem o `created_at`
// (o NOW() é o da transação). A descrição não serve de chave: compras distintas repetem.
export const grupoDaDespesa = (d, lista) => {
  if (d.parcelamento_id) return lista.filter(x => x.parcelamento_id === d.parcelamento_id);
  if (d.parcelas_total > 1 && d.created_at) return lista.filter(x => !x.parcelamento_id && x.parcelas_total === d.parcelas_total && x.created_at === d.created_at);
  return [d];
};

export const resumoGrupo = (grupo, hoje = hojeISO()) => ({
  valor: somaArredondada(grupo),
  parcelas: grupo.length,
  primeiroVencimento: grupo.map(vencimentoDe).sort()[0] || hoje,
  temPaga: grupo.some(estaPaga),
});

// Linhas a inserir para uma despesa, uma por parcela. `valor` é o total da compra; a
// divisão em centavos exatos é feita aqui. Select vazio devolve string, e coluna
// UUID/CHECK não aceita "" — categoria e forma de pagamento viram NULL.
export const montarDespesas = (n, userId) => {
  const { parcelas, dataVencimento, valor, categoria_id, forma_pagamento, ...resto } = n;
  const vinculos = { categoria_id: categoria_id || null, forma_pagamento: forma_pagamento || null };
  return dividirEmParcelas(valor, parcelas).map((valorParcela, i) => {
    const dataStr = somarMeses(dataVencimento, i);
    return {
      ...resto, ...vinculos, valor: valorParcela, user_id: userId, data: dataStr, data_vencimento: dataStr,
      status: "pendente",
      parcela_atual: parcelas > 1 ? i + 1 : null,
      parcelas_total: parcelas > 1 ? parcelas : null,
    };
  });
};

export const pendentesPorVencimento = (lista) =>
  lista.filter(d => !estaPaga(d)).sort((a, b) => vencimentoDe(a).localeCompare(vencimentoDe(b)));

// `parcelamentos` guarda só o acompanhamento; o dinheiro é a despesa de cada parcela.
// Por isso o progresso é derivado delas a cada mudança, nunca incrementado — assim as
// duas telas mostram o mesmo estado, independente de onde a parcela foi quitada.
// `null` quando o parcelamento não tem despesa vinculada.
export const progressoParcelamento = (despesas, parcelamentoId) => {
  const doParcelamento = despesas.filter(d => d.parcelamento_id === parcelamentoId);
  if (doParcelamento.length === 0) return null;
  const pagas = doParcelamento.filter(estaPaga);
  const pendentes = pendentesPorVencimento(doParcelamento);
  const ultimaPaga = [...pagas].sort((a, b) => vencimentoDe(b).localeCompare(vencimentoDe(a)))[0];
  return {
    parcelas_pagas: pagas.length,
    valor_pago: somaArredondada(pagas),
    status: pendentes.length === 0 ? "finalizado" : "ativo",
    proxima_parcela_data: pendentes.length > 0 ? vencimentoDe(pendentes[0]) : (ultimaPaga ? vencimentoDe(ultimaPaga) : null),
  };
};

// Concluído é o parcelamento quitado que o usuário tirou da lista. A marca só vale com
// tudo pago: se uma parcela paga for apagada, ele volta sozinho para a lista.
export const estaConcluido = (p) => Boolean(p.concluido) && p.status === "finalizado";
export const podeConcluir = (p) => p.status === "finalizado" && !p.concluido;

export const separarParcelamentos = (parcelamentos) => ({
  naLista: parcelamentos.filter(p => !estaConcluido(p)),
  concluidos: parcelamentos.filter(estaConcluido),
});

// Parcelamento antigo, sem despesa vinculada, avança pelo contador próprio: não há
// parcela para marcar. A última parcela fecha no total exato, para não sobrar nem
// faltar centavo.
export const avancoSemDespesas = (parc) => {
  const parcelasPagas = parc.parcelas_pagas + 1;
  const ehUltima = parcelasPagas >= parc.parcelas_total;
  return {
    parcelas_pagas: parcelasPagas,
    valor_pago: ehUltima
      ? parseFloat(parc.valor_total)
      : Math.round(((parc.valor_pago || 0) + parc.valor_total / parc.parcelas_total) * 100) / 100,
    status: ehUltima ? "finalizado" : "ativo",
    proxima_parcela_data: ehUltima || !parc.proxima_parcela_data
      ? parc.proxima_parcela_data
      : somarMeses(parc.proxima_parcela_data, 1),
  };
};

// ── ASSINATURAS ──────────────────────────────────────────────────────────────────

// Despesas do mês para as assinaturas que ainda não têm a sua. O vencimento é o dia
// escolhido, limitado ao último dia do mês. "Já tem" é uma despesa sem parcela com a
// mesma descrição e o mesmo vencimento.
export const despesasDeAssinaturas = (assinaturas, despesasExistentes, mes, userId) => {
  if (!assinaturas || assinaturas.length === 0) return [];
  const [ano, mesNum] = mes.split("-").map(Number);
  const chaves = new Set(
    (despesasExistentes || [])
      .filter(d => d.parcela_atual === null && d.parcelas_total === null)
      .map(d => `${d.descricao}|${d.data_vencimento}`)
  );
  return assinaturas
    .map(a => {
      const dia = Math.min(parseInt(a.dia_vencimento), new Date(ano, mesNum, 0).getDate());
      return { a, dataVenc: `${mes}-${String(dia).padStart(2, "0")}` };
    })
    .filter(({ a, dataVenc }) => !chaves.has(`${a.nome}|${dataVenc}`))
    .map(({ a, dataVenc }) => ({
      user_id: userId,
      descricao: a.nome,
      valor: a.valor,
      data: dataVenc,
      data_vencimento: dataVenc,
      status: "pendente",
      parcela_atual: null,
      parcelas_total: null,
    }));
};
