import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Plus, Trash2, Wallet, X, TrendingUp, Repeat, Home, PieChart as PieIcon,
  Check, LogOut, Loader2, Clock, History, CheckCircle2, Bell, Zap,
  FileDown, Shield, BarChart2, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, CreditCard, Pencil, Receipt, Tag,
} from "lucide-react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import { BotaoAjuda } from "./Ajuda";
import { ModalBase, ModalConfirmar, Campo, InputValor, Selecao, Aviso, Rodape, inputCls } from "./ModalBase";
import {
  formatBRL, hojeISO, mesAtual, somarMeses, nomeMes,
  formatarDataBR, formatarDataHora, dividirEmParcelas, mesclarPorId,
} from "./utils";

// Carregada sob demanda para manter o recharts fora do bundle inicial.
const GraficoAba = lazy(() => import("./GraficoAba"));

const QUOTES = [
  { text: "Tudo posso naquele que me fortalece.", author: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor e nada me faltará.", author: "Salmos 23:1" },
  { text: "Porque sou eu que conheço os planos que tenho para vocês.", author: "Jeremias 29:11" },
  { text: "Confie no Senhor de todo o seu coração.", author: "Provérbios 3:5" },
  { text: "Honre o Senhor com a sua riqueza e com as primícias.", author: "Provérbios 3:9" },
  { text: "Não acumulem para si tesouros na terra.", author: "Mateus 6:19" },
  { text: "O amor ao dinheiro é a raiz de todos os males.", author: "1 Timóteo 6:10" },
  { text: "Quem dá ao pobre empresta ao Senhor.", author: "Provérbios 19:17" },
  { text: "Sede diligentes nos negócios, ferventes no espírito.", author: "Romanos 12:11" },
  { text: "O trabalho de mãos diligentes traz riqueza.", author: "Provérbios 10:4" },
  { text: "Busquem primeiro o reino de Deus e a sua justiça.", author: "Mateus 6:33" },
  { text: "Dê, e lhe será dado; uma boa medida.", author: "Lucas 6:38" },
  { text: "Os planos do diligente levam à abundância.", author: "Provérbios 21:5" },
  { text: "Bem-aventurado o homem que teme ao Senhor e se deleita nos seus mandamentos.", author: "Salmos 112:1" },
  { text: "Não vos preocupeis com o dia de amanhã.", author: "Mateus 6:34" },
  { text: "Hoje você está mais perto do que ontem.", author: "" },
  { text: "A persistência realiza o impossível.", author: "Provérbio chinês" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A disciplina é a ponte entre objetivos e conquistas.", author: "Jim Rohn" },
  { text: "Cuide dos centavos, que os reais cuidarão de si mesmos.", author: "Benjamin Franklin" },
  { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "A jornada de mil milhas começa com um único passo.", author: "Lao-Tsé" },
  { text: "Investir em conhecimento rende sempre os melhores juros.", author: "Benjamin Franklin" },
  { text: "Acredite que você pode, e você já está no meio do caminho.", author: "Theodore Roosevelt" },
];

// Novidades são gerenciadas pelo painel admin — sem editar código!

// O valor gravado em `despesas.forma_pagamento` é o `id`; o rótulo é só de exibição.
const FORMAS_PAGAMENTO = [
  { id: "pix", label: "Pix" },
  { id: "cartao", label: "Cartão" },
  { id: "dinheiro", label: "Dinheiro" },
];
const rotuloForma = (id) => FORMAS_PAGAMENTO.find(f => f.id === id)?.label || null;

// Identifica a receita gerada por "Ajustar saldo inicial" entre as receitas comuns.
const FONTE_AJUSTE = "Ajuste de saldo";

// Uma compra parcelada vira N linhas em `despesas`. Com parcelamento, a chave do grupo é
// `parcelamento_id`; sem ele, as N linhas saem do mesmo INSERT e dividem o `created_at`
// (o NOW() é o da transação). A descrição não serve de chave: compras distintas repetem.
const vencimentoDe = (d) => d.data_vencimento || d.data || "";
const grupoDaDespesa = (d, lista) => {
  if (d.parcelamento_id) return lista.filter(x => x.parcelamento_id === d.parcelamento_id);
  if (d.parcelas_total > 1 && d.created_at) return lista.filter(x => !x.parcelamento_id && x.parcelas_total === d.parcelas_total && x.created_at === d.created_at);
  return [d];
};
const resumoGrupo = (grupo) => ({
  valor: Math.round(grupo.reduce((s, d) => s + parseFloat(d.valor || 0), 0) * 100) / 100,
  parcelas: grupo.length,
  primeiroVencimento: grupo.map(vencimentoDe).sort()[0] || hojeISO(),
  temPaga: grupo.some(d => d.status === "paga"),
});

// Crédito ao projeto original: fixo no código para acompanhar qualquer cópia.
const REPO_URL = "https://github.com/ooliveira-ops/Financas-App";
// Logo inline: o lucide está removendo ícones de marcas.
const LogoGithub = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
);

const CATEGORIAS_PADRAO = [
  { nome: "Faculdade", cor: "#60a5fa", icone: "GraduationCap" },
  { nome: "Comida", cor: "#34d399", icone: "Utensils" },
  { nome: "Gastos pessoais", cor: "#a78bfa", icone: "User" },
  { nome: "Moradia", cor: "#38bdf8", icone: "Home" },
  { nome: "Transporte", cor: "#6ee7b7", icone: "Car" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [carregandoSession, setCarregandoSession] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setCarregandoSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (carregandoSession) return <div className="min-h-screen flex items-center justify-center bg-[#060d1a]"><Loader2 className="text-blue-400/60 animate-spin" size={28} /></div>;
  if (!session) return <Auth />;
  return <AppLogado session={session} />;
}

function AppLogado({ session }) {
  const userId = session.user.id;
  const userNome = session.user.user_metadata?.nome || session.user.email.split("@")[0];
  const [aba, setAba] = useState("home");
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [parcelamentos, setParcelamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [modalParcelamento, setModalParcelamento] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);
  const [erroCarregar, setErroCarregar] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const carregandoRef = React.useRef(false);
  const assinaturasGeradasMesRef = React.useRef("");
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [bannerSaindo, setBannerSaindo] = useState(false);
  const [novidades, setNovidades] = useState({ versao: "", itens: [] });

  const gerarDespesasAssinaturas = async (assinaturasData, despesasExistentes) => {
    if (!assinaturasData || assinaturasData.length === 0) return [];
    const mes = mesAtual();
    const [ano, mesNum] = mes.split("-").map(Number);

    // Usa as despesas já carregadas — sem nova query ao banco
    // Filtra só despesas sem parcela (não são parcelamentos)
    const chaves = new Set(
      (despesasExistentes || [])
        .filter(d => d.parcela_atual === null && d.parcelas_total === null)
        .map(d => `${d.descricao}|${d.data_vencimento}`)
    );

    const novas = assinaturasData
      .map(a => {
        const dia = Math.min(parseInt(a.dia_vencimento), new Date(ano, mesNum, 0).getDate());
        const dataVenc = `${mes}-${String(dia).padStart(2, "0")}`;
        return { a, dataVenc };
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

    if (novas.length > 0) {
      const { data: inseridas, error } = await supabase.from("despesas").insert(novas).select();
      if (!error && inseridas) return inseridas;
    }
    return [];
  };

  // O PostgREST corta a resposta no "max rows" do projeto (1000 por padrão) sem devolver
  // erro, e o saldo acumulado depende do histórico completo — daí a paginação.
  // PAGINA fica abaixo do limite para que "página curta = última página" seja válido.
  const PAGINA = 500;
  const buscarTodos = async (tabela) => {
    let todos = [];
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data, error } = await supabase
        .from(tabela).select("*").eq("user_id", userId)
        .order("id", { ascending: true })
        .range(inicio, inicio + PAGINA - 1);
      if (error) throw error;
      todos = todos.concat(data || []);
      if (!data || data.length < PAGINA) return todos;
    }
  };

  // A chamada do supabase-js só vai à rede quando a promise é consumida: construir a
  // query e descartá-la não dispara requisição nenhuma. Por isso o registro fica numa
  // função própria, que roda de verdade sem prender o primeiro render.
  const registrarUltimoLogin = async () => {
    await supabase.from("profiles").update({ ultimo_login: new Date().toISOString() }).eq("id", userId);
  };

  const carregarTudo = async () => {
    // Mutex: impede execução simultânea
    if (carregandoRef.current) return;
    carregandoRef.current = true;

    try {
      const [r, d, a, p, c, prof] = await Promise.all([
        buscarTodos("receitas"),
        buscarTodos("despesas"),
        buscarTodos("assinaturas"),
        buscarTodos("parcelamentos"),
        buscarTodos("categorias"),
        supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle(),
      ]);
      setReceitas(r);
      setAssinaturas(a);
      setParcelamentos(p);
      setIsAdmin(prof.data?.is_admin || false);
      registrarUltimoLogin();

      // Só gera despesas de assinaturas se ainda não gerou neste mês
      const mes = mesAtual();
      let todasDespesas = d;
      if (assinaturasGeradasMesRef.current !== mes) {
        const novasGeradas = await gerarDespesasAssinaturas(a, d);
        if (novasGeradas.length > 0) todasDespesas = [...todasDespesas, ...novasGeradas];
        assinaturasGeradasMesRef.current = mes;
      }
      setDespesas(todasDespesas);

      if (c.length === 0) {
        // Duas sessões abertas ao mesmo tempo leem a lista vazia antes de qualquer
        // insert terminar; sem a unicidade por (user_id, nome) cada uma cria a sua
        // cópia das categorias padrão. O estado vem de uma releitura porque o upsert
        // que ignora duplicata devolve só as linhas que ele mesmo inseriu.
        const novas = CATEGORIAS_PADRAO.map(cat => ({ ...cat, user_id: userId, padrao: true }));
        const { error } = await supabase.from("categorias").upsert(novas, { onConflict: "user_id,nome", ignoreDuplicates: true });
        setCategorias(error ? [] : await buscarTodos("categorias"));
      } else { setCategorias(c); }
    } finally {
      carregandoRef.current = false;
    }
  };

  const carregar = async () => {
    setCarregandoDados(true);
    setErroCarregar(null);
    try {
      await carregarTudo();
    } catch (e) {
      setErroCarregar(e?.message || "Não foi possível carregar seus dados.");
    }
    setCarregandoDados(false);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  };

  useEffect(() => { carregar(); }, [userId]);

  const notificar = (texto, tipo = "erro") => setNotificacao({ texto, tipo });
  useEffect(() => {
    if (!notificacao) return;
    const t = setTimeout(() => setNotificacao(null), 5000);
    return () => clearTimeout(t);
  }, [notificacao]);

  const pedirConfirmacao = (mensagem, acao, textoConfirmar) => setConfirmacao({ mensagem, acao, textoConfirmar });

  // Trava por item enquanto a gravação está em andamento. O Set do ref barra o segundo
  // clique na hora; o state só existe para a tela desabilitar o botão. Sem isso, ações
  // que escolhem o alvo pelo estado atual (a "próxima parcela") pagam duas linhas.
  const travasRef = React.useRef(new Set());
  const [emAndamento, setEmAndamento] = useState([]);
  const comTrava = async (chave, acao) => {
    if (travasRef.current.has(chave)) return;
    travasRef.current.add(chave);
    setEmAndamento([...travasRef.current]);
    try { await acao(); } finally {
      travasRef.current.delete(chave);
      setEmAndamento([...travasRef.current]);
    }
  };

  const adicionarReceita = async (n) => {
    const { data, error } = await supabase.from("receitas").insert({ ...n, user_id: userId }).select().single();
    if (error || !data) return notificar("Não foi possível salvar a receita: " + (error?.message || ""));
    setReceitas(prev => [...prev, data]);
    notificar(`Receita "${data.fonte}" adicionada: ${formatBRL(data.valor)}.`, "sucesso");
  };
  const removerReceita = (id) => pedirConfirmacao("Apagar esta receita? Não dá para desfazer.", async () => {
    const alvo = receitas.find(r => r.id === id);
    const { error } = await supabase.from("receitas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setReceitas(prev => prev.filter(r => r.id !== id));
    notificar(`Receita "${alvo?.fonte || ""}" apagada (${formatBRL(alvo?.valor)}).`, "removido");
  });

  // Ajuste de saldo é uma receita do mês anterior (negativa quando o app mostra mais do
  // que o banco tem): corrige o saldo inicial sem mexer em nenhuma despesa, e apagá-la
  // desfaz a correção.
  const ajustarSaldoInicial = async (valorReal, saldoAtualInicial) => {
    const diferenca = Math.round((valorReal - saldoAtualInicial) * 100) / 100;
    if (diferenca === 0) return notificar("O saldo inicial já está nesse valor.", "info");
    const mesAnterior = somarMeses(`${mesAtual()}-01`, -1).substring(0, 7);
    const { data, error } = await supabase.from("receitas").insert({ fonte: FONTE_AJUSTE, valor: diferenca, mes: mesAnterior, user_id: userId }).select().single();
    if (error || !data) return notificar("Não foi possível ajustar o saldo: " + (error?.message || ""));
    setReceitas(prev => [...prev, data]);
    notificar(`Saldo inicial ajustado para ${formatBRL(valorReal)} (${diferenca > 0 ? "+" : ""}${formatBRL(diferenca)}).`, "sucesso");
  };

  // `parcelamentos` guarda só o acompanhamento; o dinheiro é a despesa de cada parcela.
  // Por isso o progresso é recalculado a partir delas a cada mudança, nunca incrementado —
  // assim as duas telas mostram o mesmo estado, independente de onde a parcela foi quitada.
  const sincronizarParcelamento = async (parcelamentoId, listaDespesas) => {
    const doParcelamento = listaDespesas.filter(d => d.parcelamento_id === parcelamentoId);
    if (doParcelamento.length === 0) return;
    const vencimento = (d) => d.data_vencimento || d.data || "";
    const pagas = doParcelamento.filter(d => d.status === "paga");
    const pendentes = doParcelamento.filter(d => d.status !== "paga").sort((a, b) => vencimento(a).localeCompare(vencimento(b)));
    const ultimaPaga = [...pagas].sort((a, b) => vencimento(b).localeCompare(vencimento(a)))[0];
    const { data, error } = await supabase.from("parcelamentos").update({
      parcelas_pagas: pagas.length,
      valor_pago: Math.round(pagas.reduce((s, d) => s + parseFloat(d.valor || 0), 0) * 100) / 100,
      status: pendentes.length === 0 ? "finalizado" : "ativo",
      proxima_parcela_data: pendentes.length > 0 ? vencimento(pendentes[0]) : (ultimaPaga ? vencimento(ultimaPaga) : null),
    }).eq("id", parcelamentoId).select().maybeSingle();
    if (error) return notificar("Não foi possível atualizar o parcelamento: " + error.message);
    if (data) setParcelamentos(prev => prev.map(p => p.id === parcelamentoId ? data : p));
  };

  const montarDespesas = (n) => {
    const { parcelas, dataVencimento, valor, categoria_id, forma_pagamento, ...resto } = n;
    // Select vazio devolve string, e coluna UUID/CHECK não aceita "" — vira NULL.
    const vinculos = { categoria_id: categoria_id || null, forma_pagamento: forma_pagamento || null };
    // `valor` é o total da compra; a divisão em centavos exatos é feita aqui.
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
  const adicionarDespesa = async (n) => {
    const { data, error } = await supabase.from("despesas").insert(montarDespesas(n)).select();
    if (error) { notificar("Não foi possível salvar a despesa: " + error.message); return []; }
    if (data) setDespesas(prev => [...prev, ...data]);
    return data || [];
  };

  // Descrição, categoria e forma valem para a compra inteira. Valor, parcelas e 1º
  // vencimento refazem as parcelas — só sem parcela paga, porque o dinheiro já pago saiu
  // do saldo. Ao refazer, as novas linhas são gravadas antes de apagar as antigas: se a
  // remoção falhar, sobra duplicata visível em vez de a compra sumir.
  const editarDespesa = (original, n) => comTrava(original.id, async () => {
    const grupo = grupoDaDespesa(original, despesas);
    const ids = grupo.map(d => d.id);
    const atual = resumoGrupo(grupo);
    const vinculos = { categoria_id: n.categoria_id || null, forma_pagamento: n.forma_pagamento || null };
    const refazer = grupo.length > 1 || n.parcelas > 1
      ? (Math.round(n.valor * 100) !== Math.round(atual.valor * 100) || n.parcelas !== atual.parcelas || n.dataVencimento !== atual.primeiroVencimento)
      : false;
    let lista;
    let sobrouDuplicata = false;
    if (!refazer) {
      const campos = { descricao: n.descricao, ...vinculos };
      if (grupo.length === 1) Object.assign(campos, { valor: n.valor, data: n.dataVencimento, data_vencimento: n.dataVencimento });
      const { data, error } = await supabase.from("despesas").update(campos).in("id", ids).select();
      if (error) return notificar("Não foi possível salvar as alterações: " + error.message);
      if (!data || data.length < ids.length) return notificar("Nem tudo foi atualizado. Recarregue a página e confira.");
      lista = mesclarPorId(despesas, data);
      setDespesas(lista);
    } else {
      if (atual.temPaga) return notificar("Esta compra tem parcela paga: valor, parcelas e vencimento não podem mudar. Apague e lance de novo, se precisar.");
      const novas = montarDespesas({ ...n, ...(original.parcelamento_id ? { parcelamento_id: original.parcelamento_id } : {}) });
      const { data: criadas, error } = await supabase.from("despesas").insert(novas).select();
      if (error || !criadas) return notificar("Não foi possível refazer as parcelas: " + (error?.message || ""));
      const { data: apagadas, error: erroApagar } = await supabase.from("despesas").delete().in("id", ids).select("id");
      const removidas = new Set((apagadas || []).map(d => d.id));
      lista = [...despesas.filter(d => !removidas.has(d.id)), ...criadas];
      setDespesas(lista);
      sobrouDuplicata = Boolean(erroApagar) || removidas.size < ids.length;
    }
    if (original.parcelamento_id) {
      const campos = { descricao: n.descricao, categoria_id: vinculos.categoria_id, ...(refazer ? { valor_total: n.valor, parcelas_total: n.parcelas } : {}) };
      const { data } = await supabase.from("parcelamentos").update(campos).eq("id", original.parcelamento_id).select().maybeSingle();
      if (data) setParcelamentos(prev => prev.map(p => p.id === data.id ? data : p));
      await sincronizarParcelamento(original.parcelamento_id, lista);
    }
    if (sobrouDuplicata) return notificar("As novas parcelas foram criadas, mas parte das antigas não foi apagada. Apague as duplicadas na lista.");
    notificar(refazer
      ? `"${n.descricao}" refeita: ${n.parcelas > 1 ? `${n.parcelas}x, ` : ""}${formatBRL(n.valor)} no total.`
      : `Despesa "${n.descricao}" atualizada${grupo.length > 1 ? ` nas ${grupo.length} parcelas` : ""}.`, "sucesso");
  });
  const removerDespesa = (id) => pedirConfirmacao("Apagar esta despesa? Não dá para desfazer.", () => comTrava(id, async () => {
    const alvo = despesas.find(d => d.id === id);
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    const restantes = despesas.filter(d => d.id !== id);
    setDespesas(restantes);
    if (alvo?.parcelamento_id) await sincronizarParcelamento(alvo.parcelamento_id, restantes);
    notificar(`Despesa "${alvo?.descricao || ""}" apagada (${formatBRL(alvo?.valor)}).`, "removido");
  }));
  // Pagamento individual e de fatura passam pelo mesmo caminho: um único UPDATE, e o
  // número de linhas devolvidas confirma quantas foram de fato pagas (RLS não dá erro).
  // O filtro de status impede que uma linha já paga ganhe nova data de pagamento;
  // status nulo conta como pendente, e `neq` sozinho descartaria essas linhas.
  const pagarDespesas = async (ids, rotulo) => {
    if (ids.length === 0) return;
    const { data, error } = await supabase.from("despesas")
      .update({ status: "paga", data_pagamento: hojeISO() })
      .in("id", ids).or("status.is.null,status.neq.paga").select();
    if (error) return notificar("Não foi possível marcar como paga: " + error.message);
    if (!data || data.length === 0) return notificar("Nada foi atualizado. Recarregue a página e confira se já não estava paga.");
    const pagas = new Map(data.map(d => [d.id, d]));
    const atualizadas = despesas.map(d => pagas.get(d.id) || d);
    setDespesas(atualizadas);
    for (const parcId of new Set(data.map(d => d.parcelamento_id).filter(Boolean))) {
      await sincronizarParcelamento(parcId, atualizadas);
    }
    const total = data.reduce((s, d) => s + parseFloat(d.valor || 0), 0);
    if (data.length < ids.length) return notificar(`${data.length} de ${ids.length} despesas pagas (${formatBRL(total)}). Recarregue a página para conferir as demais.`);
    const titulo = rotulo || (data.length === 1 ? `"${data[0].descricao}" paga` : `${data.length} despesas pagas`);
    notificar(`${titulo}: ${formatBRL(total)} descontado do saldo.`, "sucesso");
  };
  const marcarComoPaga = (id) => comTrava(id, () => pagarDespesas([id]));
  const pagarFatura = (mes, ids, total) => pedirConfirmacao(
    `Pagar a fatura do cartão de ${nomeMes(mes)}? São ${ids.length} despesa${ids.length === 1 ? "" : "s"}, ${formatBRL(total)} no total.`,
    () => comTrava(`fatura-${mes}`, () => pagarDespesas(ids, `Fatura de ${nomeMes(mes)} paga (${ids.length} despesa${ids.length === 1 ? "" : "s"})`)),
    "Pagar fatura",
  );

  const adicionarAssinatura = async (n) => {
    const { data, error } = await supabase.from("assinaturas").insert({ ...n, user_id: userId }).select().single();
    if (error || !data) return notificar("Não foi possível salvar a assinatura: " + (error?.message || ""));
    setAssinaturas(prev => [...prev, data]);
    // A geração de despesas de assinatura é do cliente, não do banco: a do mês
    // corrente é criada aqui mesmo.
    const geradas = await gerarDespesasAssinaturas([data], despesas);
    if (geradas.length > 0) setDespesas(prev => mesclarPorId(prev, geradas));
    notificar(`Assinatura "${data.nome}" criada: ${formatBRL(data.valor)} por mês.`, "sucesso");
  };
  const removerAssinatura = (id) => pedirConfirmacao("Apagar esta assinatura? As despesas já geradas continuam na lista.", async () => {
    const alvo = assinaturas.find(a => a.id === id);
    const { error } = await supabase.from("assinaturas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setAssinaturas(prev => prev.filter(a => a.id !== id));
    notificar(`Assinatura "${alvo?.nome || ""}" apagada.`, "removido");
  });

  const recarregarDespesas = async () => {
    try { setDespesas(await buscarTodos("despesas")); } catch { /* a operação principal já foi gravada */ }
  };

  // O dinheiro de um parcelamento entra no saldo pelas despesas, uma por parcela —
  // `parcelamentos` guarda só o acompanhamento. Por isso as N despesas são criadas
  // aqui, pelo mesmo caminho de uma despesa parcelada comum.
  const adicionarParcelamento = async (n) => {
    if (!n.descricao || !n.valor_total || !n.parcelas_total) return notificar("Preencha todos os campos");
    const parcelasTotal = parseInt(n.parcelas_total);
    const { data, error } = await supabase.from("parcelamentos").insert({ descricao: n.descricao, valor_total: parseFloat(n.valor_total), parcelas_total: parcelasTotal, parcelas_pagas: 0, valor_pago: 0, user_id: userId, proxima_parcela_data: n.dataInicio, categoria_id: n.categoria_id || null, status: "ativo" }).select().single();
    if (error) return notificar("Não foi possível salvar o parcelamento: " + error.message);
    if (!data) return notificar("O parcelamento não foi salvo. Tente de novo.");
    setParcelamentos(prev => [...prev, data]);
    await adicionarDespesa({
      descricao: n.descricao,
      valor: parseFloat(n.valor_total),
      categoria_id: n.categoria_id,
      forma_pagamento: n.forma_pagamento,
      dataVencimento: n.dataInicio,
      parcelas: parcelasTotal,
      parcelamento_id: data.id,
    });
    await recarregarDespesas();
    notificar(`Parcelamento "${data.descricao}" criado: ${parcelasTotal}x, ${formatBRL(data.valor_total)} no total.`, "sucesso");
  };
  // O botão da aba Parcelamentos quita a próxima parcela pendente — a mesma despesa que
  // apareceria na aba Despesas. Parcelamento antigo, sem despesa vinculada, ainda avança
  // pelo contador próprio: não há parcela para marcar.
  const marcarParcelaComoPaga = (id) => comTrava(id, async () => {
    const parc = parcelamentos.find(p => p.id === id);
    if (!parc) return;
    const vinculadas = despesas.filter(d => d.parcelamento_id === id);
    if (vinculadas.length > 0) {
      const pendentes = vinculadas
        .filter(d => d.status !== "paga")
        .sort((a, b) => (a.data_vencimento || a.data || "").localeCompare(b.data_vencimento || b.data || ""));
      if (pendentes.length === 0) return notificar("Todas as parcelas já foram pagas!", "info");
      const proxima = pendentes[0];
      const qual = proxima.parcela_atual && proxima.parcelas_total ? ` ${proxima.parcela_atual}/${proxima.parcelas_total}` : "";
      return pagarDespesas([proxima.id], `Parcela${qual} de "${parc.descricao}" paga`);
    }
    if (parc.parcelas_pagas >= parc.parcelas_total) return notificar("Todas as parcelas já foram pagas!", "info");
    const novasParcelas = parc.parcelas_pagas + 1;
    const ehUltima = novasParcelas >= parc.parcelas_total;
    // A última parcela fecha no total exato, para não sobrar nem faltar centavo.
    const novoValorPago = ehUltima
      ? parseFloat(parc.valor_total)
      : Math.round(((parc.valor_pago || 0) + parc.valor_total / parc.parcelas_total) * 100) / 100;
    const { data, error } = await supabase.from("parcelamentos").update({
      parcelas_pagas: novasParcelas,
      valor_pago: novoValorPago,
      status: ehUltima ? "finalizado" : "ativo",
      proxima_parcela_data: ehUltima || !parc.proxima_parcela_data
        ? parc.proxima_parcela_data
        : somarMeses(parc.proxima_parcela_data, 1),
    }).eq("id", id).select().maybeSingle();
    if (error) return notificar("Não foi possível atualizar o parcelamento: " + error.message);
    if (!data) return notificar("O parcelamento não foi atualizado. Recarregue a página e tente de novo.");
    setParcelamentos(prev => prev.map(p => p.id === id ? data : p));
    notificar(`Parcela ${novasParcelas}/${parc.parcelas_total} de "${parc.descricao}" marcada como paga.`, "sucesso");
  });
  const removerParcelamento = (id) => pedirConfirmacao("Apagar este parcelamento? As despesas das parcelas continuam na lista.", async () => {
    const alvo = parcelamentos.find(p => p.id === id);
    const { error } = await supabase.from("parcelamentos").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setParcelamentos(prev => prev.filter(p => p.id !== id));
    setDespesas(prev => prev.map(d => d.parcelamento_id === id ? { ...d, parcelamento_id: null } : d));
    notificar(`Parcelamento "${alvo?.descricao || ""}" apagado. As despesas das parcelas continuam na lista.`, "removido");
  });
  const adicionarCategoria = async (n) => {
    const { data, error } = await supabase.from("categorias").insert({ ...n, user_id: userId, padrao: false }).select().single();
    if (error) return notificar(error.code === "23505" ? "Já existe uma categoria com esse nome." : "Não foi possível salvar a categoria: " + error.message);
    if (data) setCategorias(prev => [...prev, data]);
    if (data) notificar(`Categoria "${data.nome}" criada.`, "sucesso");
  };
  const removerCategoria = (id) => {
    if (despesas.some(d => d.categoria_id === id)) return notificar("Não é possível remover: existem despesas nesta categoria.");
    pedirConfirmacao("Apagar esta categoria?", async () => {
      const alvo = categorias.find(c => c.id === id);
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) return notificar("Não foi possível apagar: " + error.message);
      setCategorias(prev => prev.filter(c => c.id !== id));
      notificar(`Categoria "${alvo?.nome || ""}" apagada.`, "removido");
    });
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Busca novidades do Supabase e mostra 1 vez por versão
  useEffect(() => {
    const carregarNovidades = async () => {
      const { data } = await supabase
        .from("novidades")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return;
      const visto = localStorage.getItem("banner_versao_vista");
      if (visto !== data.versao) {
        const itens = typeof data.itens === "string" ? JSON.parse(data.itens) : data.itens;
        setNovidades({ versao: data.versao, itens });
        setMostrarBanner(true);
      }
    };
    carregarNovidades();
  }, []);

  useEffect(() => {
    if (!mostrarBanner) return;
    localStorage.setItem("banner_versao_vista", novidades.versao);
    const timerSaida = setTimeout(() => setBannerSaindo(true), 7000);
    const timerSome = setTimeout(() => setMostrarBanner(false), 8000);
    return () => { clearTimeout(timerSaida); clearTimeout(timerSome); };
  }, [mostrarBanner]);

  const despesasPendentes = useMemo(() => despesas.filter(d => d.status === "pendente" || !d.status), [despesas]);
  const despesasPagas = useMemo(() => despesas.filter(d => d.status === "paga"), [despesas]);
  const totalReceitasMes = useMemo(() => receitas.filter(r => (r.mes || mesAtual()) === mesAtual()).reduce((s, r) => s + parseFloat(r.valor || 0), 0), [receitas]);
  const totalAssinaturasMes = useMemo(() => assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0), [assinaturas]);
  const despesasPagasMesAtual = useMemo(() => despesasPagas.filter(d => d.data_pagamento && d.data_pagamento.startsWith(mesAtual())), [despesasPagas]);
  const totalDespesasPagasMes = useMemo(() => despesasPagasMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPagasMesAtual]);
  // Assinaturas só entram no "Pago" se houver despesa gerada por elas e marcada como paga no mês
  // O card "Pago" mostra só despesas efetivamente pagas no mês atual
  const totalDespesasMes = totalDespesasPagasMes;
  // SALDO ACUMULADO: soma receitas e despesas pagas de TODA a história, não só do mês atual.
  // É assim que o saldo final de um mês (ex: R$160 sobrando) passa automaticamente para o mês seguinte,
  // sem precisar adicionar manualmente.
  const totalReceitasGeral = useMemo(() => receitas.reduce((s, r) => s + parseFloat(r.valor || 0), 0), [receitas]);
  const totalDespesasPagasGeral = useMemo(() => despesasPagas.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPagas]);
  // Parcelamentos entram no saldo pelas despesas que o banco gera para cada parcela,
  // não por `valor_pago` — somar os dois descontaria o mesmo dinheiro duas vezes.
  const temReceitaNoMes = totalReceitasGeral > 0;
  const saldo = temReceitaNoMes ? totalReceitasGeral - totalDespesasPagasGeral : null;
  // SALDO DO MÊS: só o que entrou e o que foi pago dentro do mês corrente, sem herdar
  // o que sobrou dos meses anteriores. Entra no relatório como resultado do mês.
  const temMovimentoNoMes = totalReceitasMes > 0 || totalDespesasPagasMes > 0;
  const saldoMes = temMovimentoNoMes ? totalReceitasMes - totalDespesasPagasMes : null;
  // SALDO INICIAL: o que sobrou (ou faltou) até o fim do mês anterior — é com ele que o
  // mês começa. Despesa paga sem `data_pagamento` (registro antigo) conta como anterior:
  // ela já entra no saldo atual, e deixá-la de fora inflaria o saldo inicial.
  const composicaoSaldoInicial = useMemo(() => {
    const mes = mesAtual();
    const soma = (lista) => Math.round(lista.reduce((s, x) => s + parseFloat(x.valor || 0), 0) * 100) / 100;
    const receitasAntes = receitas.filter(r => r.mes && r.mes < mes);
    const ajustes = receitasAntes.filter(r => r.fonte === FONTE_AJUSTE);
    const pagasAntes = despesasPagas.filter(d => !d.data_pagamento || d.data_pagamento.substring(0, 7) < mes);
    const vencimento = (d) => (d.data_vencimento || d.data || "").substring(0, 7);
    return {
      receitas: soma(receitasAntes.filter(r => r.fonte !== FONTE_AJUSTE)),
      ajustes,
      totalAjustes: soma(ajustes),
      pagas: soma(pagasAntes),
      pagasSemData: soma(pagasAntes.filter(d => !d.data_pagamento)),
      // Pistas para quando o saldo inicial não bate com o banco:
      pendentesAntigas: soma(despesasPendentes.filter(d => vencimento(d) && vencimento(d) < mes)),
      antigasPagasNoMes: soma(despesasPagas.filter(d => d.data_pagamento?.startsWith(mes) && vencimento(d) && vencimento(d) < mes)),
      saldo: Math.round((soma(receitasAntes) - soma(pagasAntes)) * 100) / 100,
    };
  }, [receitas, despesasPagas, despesasPendentes]);
  const saldoInicial = composicaoSaldoInicial.saldo;
  // "A PAGAR" GERAL: soma TODAS as despesas pendentes, de qualquer mês (não só do mês atual),
  // para nada "desaparecer" quando o mês virar. Na aba Despesas dá pra filtrar por mês específico.
  const totalPendentesGeral = useMemo(() => despesasPendentes.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPendentes]);
  const proximasAssinaturas = useMemo(() => { const hoje = new Date(); const diaH = hoje.getDate(); return [...assinaturas].map(a => { const dia = parseInt(a.dia_vencimento || 5); let dr = dia >= diaH ? dia - diaH : (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()) - diaH + dia; return { ...a, diasRestantes: dr }; }).sort((a, b) => a.diasRestantes - b.diasRestantes); }, [assinaturas]);
  const avisoDespesas = useMemo(() => { const hoje = new Date(); hoje.setHours(0,0,0,0); const limite = new Date(hoje); limite.setDate(limite.getDate() + 7); const vencidas = []; const vencendo = []; despesasPendentes.forEach(d => { if (!d.data_vencimento) return; const v = new Date(d.data_vencimento + "T00:00:00"); if (v < hoje) vencidas.push(d); else if (v <= limite) vencendo.push(d); }); return { vencidas, vencendo }; }, [despesasPendentes]);

  // O aviso fica sobre o canto do cabeçalho (Sair, GitHub): some sozinho depois de 6s.
  const temAvisoContas = !carregandoDados && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0);
  useEffect(() => {
    if (!temAvisoContas || avisoFechado) return;
    const t = setTimeout(() => setAvisoFechado(true), 6000);
    return () => clearTimeout(t);
  }, [temAvisoContas, avisoFechado]);

  if (carregandoDados) return <div className="min-h-screen flex items-center justify-center bg-[#060d1a]"><Loader2 className="text-blue-400/60 animate-spin" size={28} /></div>;

  const abas = [
    { id: "home", label: "Início", icon: Home },
    { id: "despesas", label: "Despesas", icon: PieIcon },
    { id: "historico", label: "Histórico", icon: History },
    { id: "parcelamentos", label: "Parcelamentos", icon: Zap },
    { id: "receitas", label: "Receitas", icon: Wallet },
    { id: "assinaturas", label: "Assinaturas", icon: Repeat },
    { id: "grafico", label: "Gráfico", icon: BarChart2 },
    ...(isAdmin ? [{ id: "usuarios", label: "Usuários", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#060d1a] text-slate-100 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-c { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #060d1a; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
        .banner-enter { animation: slideDown 0.5s ease-out forwards; }
        .banner-exit { animation: slideUp 0.5s ease-in forwards; }
        @keyframes progress8s { from { width: 100%; } to { width: 0%; } }
        @keyframes progress6s { from { width: 100%; } to { width: 0%; } }
        .delay-1{animation-delay:.1s}.delay-2{animation-delay:.25s}.delay-3{animation-delay:.4s}.delay-4{animation-delay:.55s}.delay-5{animation-delay:.7s}
        .num-tabular { font-variant-numeric: tabular-nums; font-style: normal; }
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0d1829}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
      `}</style>
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] pointer-events-none" style={{background:"radial-gradient(circle,rgba(37,99,235,.10),transparent 70%)"}}/>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] pointer-events-none" style={{background:"radial-gradient(circle,rgba(14,165,233,.07),transparent 70%)"}}/>

      {mostrarBanner && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${bannerSaindo ? "banner-exit" : "banner-enter"}`}>
          <div className="bg-[#0d1829] border-2 border-blue-500/50 rounded-2xl w-full max-w-lg mx-4 shadow-2xl shadow-blue-900/40 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                <span className="font-mono-c text-xs text-blue-300 uppercase tracking-widest">Últimas atualizações</span>
              </div>
              <button onClick={() => { setBannerSaindo(true); setTimeout(() => setMostrarBanner(false), 500); }} className="text-slate-400/60 hover:text-white transition-colors">
                <X size={16}/>
              </button>
            </div>
            {/* Lista de atualizações */}
            <div className="px-6 py-5 space-y-3">
              {novidades.itens.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-blue-900/30">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">✔︎</span>
                  <span className="font-body text-sm text-slate-200 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            {/* Footer com barra de progresso */}
            <div className="px-6 pb-5">
              <div className="w-full bg-blue-900/30 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{animation: "progress8s 8s linear forwards"}}/>
              </div>
              <p className="font-body text-[11px] text-slate-400/50 text-center mt-2">Fecha automaticamente em 8s</p>
            </div>
          </div>
        </div>
      )}

      {erroCarregar && (
        <div className="relative z-40 mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <AlertTriangle size={16} className="text-red-400 shrink-0"/>
          <div className="flex-1 min-w-[200px]">
            <p className="font-body text-sm text-red-300">Não conseguimos carregar seus dados. Eles continuam salvos — os valores abaixo podem estar incompletos.</p>
            <p className="font-mono-c text-[10px] text-slate-400/40 mt-1 break-words">{erroCarregar}</p>
          </div>
          <button onClick={carregar} className="px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-200 font-body text-xs hover:bg-red-500/25 transition">Tentar novamente</button>
        </div>
      )}

      {/* A centralização fica no contêiner: a animação fadeInUp redefine `transform` e
          anularia um -translate-x aplicado no próprio aviso. */}
      {notificacao && (
        <div className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none bottom-[calc(5rem_+_env(safe-area-inset-bottom))] sm:bottom-6">
          <div role="status" className={`pointer-events-auto animate-fadeInUp w-full max-w-md px-4 py-3 rounded-xl border font-body text-sm bg-[#0d1829] shadow-xl shadow-black/40 flex items-start gap-2 ${notificacao.tipo === "sucesso" ? "border-emerald-500/40 text-emerald-200" : notificacao.tipo === "info" ? "border-blue-500/30 text-blue-200" : "border-red-500/40 text-red-200"}`}>
            {notificacao.tipo === "sucesso" && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5"/>}
            {notificacao.tipo === "removido" && <Trash2 size={16} className="text-red-400 shrink-0 mt-0.5"/>}
            {notificacao.tipo === "erro" && <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5"/>}
            <span className="flex-1">{notificacao.texto}</span>
            <button onClick={() => setNotificacao(null)} className="p-1 -m-1 text-slate-400/50 hover:text-slate-200 shrink-0" aria-label="Fechar aviso"><X size={14}/></button>
          </div>
        </div>
      )}

      {confirmacao && (
        <ModalConfirmar
          mensagem={confirmacao.mensagem}
          textoConfirmar={confirmacao.textoConfirmar}
          perigo={!confirmacao.textoConfirmar}
          onCancelar={() => setConfirmacao(null)}
          onConfirmar={async () => { const acao = confirmacao.acao; setConfirmacao(null); await acao(); }}
        />
      )}

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 animate-fadeInUp max-w-sm bg-[#0d1829]/95 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display italic text-slate-100 flex items-center gap-2"><Bell size={16} className="text-blue-400"/>Contas a pagar</h3>
            <button onClick={() => setAvisoFechado(true)} className="p-2 -m-2 text-slate-400/60" aria-label="Fechar"><X size={14}/></button>
          </div>
          {avisoDespesas.vencidas.length > 0 && <p className="text-xs text-red-400 mb-1">🔴 {avisoDespesas.vencidas.length} vencida(s)</p>}
          {avisoDespesas.vencendo.length > 0 && <p className="text-xs text-sky-400">🟡 {avisoDespesas.vencendo.length} em até 7 dias</p>}
          <div className="mt-3 w-full bg-blue-900/30 rounded-full h-0.5 overflow-hidden"><div className="bg-blue-500/70 h-full" style={{animation: "progress6s 6s linear forwards"}}/></div>
        </div>
      )}

      {/* No app instalado a barra de status é translúcida e sobrepõe o topo; as
          margens env(safe-area-inset-*) mantêm cabeçalho e navegação fora do entalhe. */}
      <header className="relative z-10 px-4 sm:px-6 md:px-12 pt-[max(2rem,calc(env(safe-area-inset-top)_+_1rem))] pb-4 flex items-center justify-between border-b border-blue-900/30">
        <div className="animate-fadeInUp">
          <div className="font-mono-c text-[10px] tracking-[0.3em] text-slate-400/60 uppercase">Finanças · {nomeMes(mesAtual())}</div>
          <h1 className="font-display text-2xl md:text-3xl italic text-slate-100 mt-1">
            olá, {userNome}
            {isAdmin && <span className="ml-2 text-xs font-body not-italic bg-blue-600/25 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full align-middle">admin</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" title="Projeto original no GitHub" aria-label="Projeto original no GitHub" className="w-9 h-9 rounded-full bg-white/[0.05] border border-blue-900/30 text-slate-300 hover:text-white hover:border-blue-500/40 transition flex items-center justify-center"><LogoGithub/></a>
          <button onClick={handleLogout} className="h-9 px-4 rounded-full bg-white/[0.05] border border-blue-900/30 text-slate-200 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10 active:bg-red-500/20 transition flex items-center gap-2 font-body text-sm"><LogOut size={15}/>Sair</button>
        </div>
      </header>

      {/* No celular as abas ficam numa barra fixa embaixo, ao alcance do polegar. */}
      <nav className="fixed sm:relative bottom-0 inset-x-0 z-40 sm:z-10 bg-[#060d1a]/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t sm:border-t-0 sm:border-b border-blue-900/30 px-2 sm:px-6 md:px-12 pt-1.5 pb-[calc(0.375rem_+_env(safe-area-inset-bottom))] sm:py-4 flex gap-1 overflow-x-auto">
        {abas.map(t => { const Icon = t.icon; const ativo = aba === t.id; return (
          <button key={t.id} onClick={() => { setAba(t.id); window.scrollTo(0, 0); }} className={`flex-1 sm:flex-none min-w-[64px] sm:min-w-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full font-body text-[10px] sm:text-sm flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 transition-all whitespace-nowrap ${ativo ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200 hover:bg-white/5"}`}>
            <Icon size={18} className="sm:w-3.5 sm:h-3.5"/>{t.label}
          </button>
        );})}
      </nav>

      <main className="relative z-10 px-4 sm:px-6 md:px-12 pt-8 pb-[calc(6rem_+_env(safe-area-inset-bottom))] sm:pb-8 max-w-6xl mx-auto">
        {aba === "home" && <HomeAba quote={quote} saldo={saldo} saldoInicial={saldoInicial} composicaoSaldoInicial={composicaoSaldoInicial} onAjustarSaldoInicial={ajustarSaldoInicial} onRemoverAjuste={removerReceita} temReceitaNoMes={temReceitaNoMes} saldoMes={saldoMes} temMovimentoNoMes={temMovimentoNoMes} totalReceitasMes={totalReceitasMes} totalDespesasMes={totalDespesasMes} totalPendentesGeral={totalPendentesGeral} proximasAssinaturas={proximasAssinaturas} receitas={receitas} despesas={despesas} assinaturas={assinaturas} parcelamentos={parcelamentos} userNome={userNome} onAviso={notificar}/>}
        {aba === "despesas" && <DespesasAba despesasPendentes={despesasPendentes} despesasPagas={despesasPagas} categorias={categorias} emAndamento={emAndamento} onAdicionar={() => setModalDespesa(true)} onAdicionarParcelamento={() => setModalParcelamento(true)} onNovaCategoria={() => setModalCategoria(true)} onRemoverCategoria={removerCategoria} onRemover={removerDespesa} onMarcarPaga={marcarComoPaga} onPagarFatura={pagarFatura} onEditar={setDespesaEditando}/>}
        {aba === "grafico" && (
          <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="text-blue-400/60 animate-spin" size={24}/></div>}>
            <GraficoAba despesas={despesas} receitas={receitas} assinaturas={assinaturas}/>
          </Suspense>
        )}
        {aba === "historico" && <HistoricoAba despesas={despesas} assinaturas={assinaturas} receitas={receitas} parcelamentos={parcelamentos} userNome={userNome} onAviso={notificar}/>}
        {aba === "parcelamentos" && <ParcelamentosAba parcelamentos={parcelamentos} categorias={categorias} emAndamento={emAndamento} onAdicionar={() => setModalParcelamento(true)} onRemover={removerParcelamento} onMarcarPaga={marcarParcelaComoPaga}/>}
        {aba === "receitas" && <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes} onAdicionar={() => setModalReceita(true)} onRemover={removerReceita}/>}
        {aba === "assinaturas" && <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes} onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura}/>}
        {aba === "usuarios" && isAdmin && <UsuariosAba onAviso={notificar}/>}
      </main>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async r => { await adicionarReceita(r); setModalReceita(false); }}/>}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async d => {
        const criadas = await adicionarDespesa(d);
        setModalDespesa(false);
        if (criadas.length > 0) notificar(`Despesa "${d.descricao}" criada: ${formatBRL(d.valor)}${criadas.length > 1 ? ` em ${criadas.length}x` : ""}.`, "sucesso");
      }}/>}
      {despesaEditando && (() => {
        const grupo = grupoDaDespesa(despesaEditando, despesas);
        const r = resumoGrupo(grupo);
        return <ModalDespesa categorias={categorias} onFechar={() => setDespesaEditando(null)}
          edicao={{
            descricao: despesaEditando.descricao, valor: r.valor, dataVencimento: r.primeiroVencimento, parcelas: r.parcelas,
            categoria_id: despesaEditando.categoria_id || "", forma_pagamento: despesaEditando.forma_pagamento || "",
            emGrupo: grupo.length > 1,
            travaEstrutura: grupo.length > 1 && r.temPaga,
            travaParcelas: r.temPaga,
          }}
          onSalvar={async d => { const original = despesaEditando; setDespesaEditando(null); await editarDespesa(original, d); }}/>;
      })()}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={async a => { await adicionarAssinatura(a); setModalAssinatura(false); }}/>}
      {modalParcelamento && <ModalParcelamento categorias={categorias} onFechar={() => setModalParcelamento(false)} onSalvar={async p => { await adicionarParcelamento(p); setModalParcelamento(false); }}/>}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={async c => { await adicionarCategoria(c); setModalCategoria(false); }}/>}
    </div>
  );
}

// ── USUÁRIOS (ADMIN) ─────────────────────────────────────────────────────────────
function UsuariosAba({ onAviso }) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  const carregar = async () => {
    setCarregando(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) onAviso?.("Não foi possível carregar os usuários: " + error.message);
    else setUsuarios(data || []);
    setCarregando(false);
  };
  useEffect(() => { carregar(); }, []);

  const toggleAdmin = async (id, atual) => {
    const { data, error } = await supabase.rpc("toggle_user_admin", { target_id: id, novo_valor: !atual });
    if (error) return onAviso?.("Não foi possível alterar a permissão: " + error.message);
    // Um UPDATE barrado por RLS não gera erro, só afeta 0 linhas: o estado exibido vem
    // do valor efetivo devolvido pelo RPC, nunca da suposição de que deu certo.
    if (typeof data !== "boolean") { await carregar(); return; }
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, is_admin: data } : u));
    onAviso?.(data ? "Usuário agora é admin." : "Permissão de admin removida.", "info");
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Painel admin</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">Usuários</h2></div>
        <button onClick={carregar} className="px-4 py-2.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-body text-sm flex items-center gap-2 hover:bg-blue-600/30 transition-all"><RefreshCw size={14}/>Atualizar</button>
      </div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {carregando ? <div className="p-12 flex justify-center"><Loader2 className="text-blue-400/60 animate-spin" size={24}/></div>
        : usuarios.length === 0 ? <div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhum usuário.</p></div>
        : (
          <div className="divide-y divide-blue-900/20">
            {usuarios.map(u => (
              <div key={u.id}>
                <div className="flex items-center gap-4 p-4 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandido(expandido === u.id ? null : u.id)}>
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-body text-sm text-blue-300 font-medium">{(u.nome || u.email || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-slate-200 truncate">{u.nome || "—"}</span>
                      {u.is_admin && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600/25 text-blue-300 border border-blue-500/30 font-body flex-shrink-0">admin</span>}
                    </div>
                    <div className="font-mono-c text-[10px] text-slate-400/50 truncate">{u.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono-c text-[10px] text-slate-400/40 uppercase mb-0.5">Cadastro</div>
                    <div className="font-mono-c text-xs text-slate-400/60">{formatarDataBR(u.created_at?.substring(0,10))}</div>
                  </div>
                </div>
                {expandido === u.id && (
                  <div className="px-6 pb-5 bg-white/[0.01] border-t border-blue-900/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="bg-[#060d1a] rounded-xl p-4 border border-blue-900/20">
                        <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-1">Último login</p>
                        <p className="font-mono-c text-sm text-sky-300">{formatarDataHora(u.ultimo_login)}</p>
                      </div>
                      <div className="bg-[#060d1a] rounded-xl p-4 border border-blue-900/20">
                        <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-1">ID</p>
                        <p className="font-mono-c text-[11px] text-slate-400/60 truncate">{u.id}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleAdmin(u.id, u.is_admin)} className={`w-full py-2.5 rounded-xl font-body text-sm flex items-center justify-center gap-2 transition-all border ${u.is_admin ? "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20" : "bg-blue-600/15 text-blue-300 border-blue-500/25 hover:bg-blue-600/25"}`}>
                      <Shield size={14}/>{u.is_admin ? "Remover admin" : "Tornar admin"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4">
        <p className="font-body text-xs text-slate-400/70 leading-relaxed">
          💡 <span className="text-blue-400">Dica:</span> Para garantir acesso em caso de perda de conta, marque outra conta como admin aqui ou no Supabase → Table Editor → profiles → <span className="font-mono-c text-blue-300">is_admin = true</span>.
        </p>
      </div>

      <PainelNovidades />
    </div>
  );
}

// ── PAINEL NOVIDADES (ADMIN) ──────────────────────────────────────────────────────
function PainelNovidades() {
  const [novidades, setNovidades] = useState([]);
  const [versao, setVersao] = useState("");
  const [novoItem, setNovoItem] = useState("");
  const [novaVersao, setNovaVersao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const { data } = await supabase.from("novidades").select("*").order("created_at", { ascending: false }).limit(1).single();
    if (data) {
      const itens = typeof data.itens === "string" ? JSON.parse(data.itens) : data.itens;
      setNovidades(itens);
      setVersao(data.versao);
      setNovaVersao(data.versao);
    }
  };

  useEffect(() => { carregar(); }, []);

  const adicionarItem = () => {
    if (!novoItem.trim()) return;
    setNovidades(prev => [...prev, novoItem.trim()]);
    setNovoItem("");
  };

  const removerItem = (i) => setNovidades(prev => prev.filter((_, idx) => idx !== i));

  const salvar = async () => {
    if (!novaVersao.trim() || novidades.length === 0) return;
    setSalvando(true); setMsg("");
    // Desativa todas as versões anteriores
    await supabase.from("novidades").update({ ativo: false }).neq("versao", novaVersao);
    // Upsert da nova versão
    const { error } = await supabase.from("novidades").upsert({
      versao: novaVersao.trim(),
      itens: JSON.stringify(novidades),
      ativo: true,
    }, { onConflict: "versao" });
    setSalvando(false);
    if (error) setMsg("Erro: " + error.message);
    else { setMsg("✔︎ Salvo! Todos os usuários verão na próxima abertura."); setVersao(novaVersao); }
  };

  return (
    <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl italic text-slate-100">📢 Gerenciar Novidades</h3>
        <span className="font-mono-c text-[10px] text-blue-400/70 border border-blue-500/30 px-2 py-1 rounded-full">versão atual: {versao}</span>
      </div>

      {/* Lista atual */}
      <div className="space-y-2">
        {novidades.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-blue-900/20 group">
            <span className="text-blue-400 text-xs flex-shrink-0">✔︎</span>
            <span className="font-body text-sm text-slate-200 flex-1">{item}</span>
            <button onClick={() => removerItem(i)} className="opacity-0 group-hover:opacity-100 text-slate-400/40 hover:text-red-400 transition-all"><Trash2 size={13}/></button>
          </div>
        ))}
        {novidades.length === 0 && <p className="font-body text-sm text-slate-400/40 text-center py-4">Nenhum item ainda.</p>}
      </div>

      {/* Adicionar item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={novoItem}
          onChange={e => setNovoItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && adicionarItem()}
          placeholder="Nova novidade... (Enter para adicionar)"
          className="flex-1 bg-white/[0.03] border border-blue-900/40 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 text-sm"
        />
        <button onClick={adicionarItem} className="px-4 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-600/30 transition-all">
          <Plus size={16}/>
        </button>
      </div>

      {/* Versão */}
      <div className="flex gap-2 items-center">
        <span className="font-body text-xs text-slate-400/60 flex-shrink-0">Versão:</span>
        <input
          type="text"
          value={novaVersao}
          onChange={e => setNovaVersao(e.target.value)}
          placeholder="ex: v4"
          className="w-24 bg-white/[0.03] border border-blue-900/40 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 text-sm font-mono-c"
        />
        <span className="font-body text-[11px] text-slate-400/40">← mude para forçar exibição para todos</span>
      </div>

      {msg && <p className={`font-body text-xs ${msg.startsWith("✔︎") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}

      <button onClick={salvar} disabled={salvando} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all flex items-center justify-center gap-2">
        {salvando ? <><Loader2 size={14} className="animate-spin"/>Salvando...</> : "Publicar novidades"}
      </button>
    </div>
  );
}

// A parcela vive em coluna, não na descrição: sem isto duas parcelas da mesma compra
// aparecem com o mesmo texto na lista.
const rotuloParcela = (d) =>
  d.parcela_atual && d.parcelas_total
    ? <span className="font-mono-c text-[10px] text-slate-400/50 ml-2">{d.parcela_atual}/{d.parcelas_total}</span>
    : null;

// Um mês por vez, em linha única. Um botão por mês cresce junto com o histórico e,
// em tela estreita, empurra a lista de lançamentos para fora da primeira dobra.
// O `select` nativo abre o seletor do próprio sistema no celular; as setas atendem
// a navegação sequencial, que é o uso comum no desktop.
function SeletorMes({ meses, valor, onChange, incluirTodos = false, rotuloTodos = "Todos os meses" }) {
  const opcoes = incluirTodos ? ["todos", ...meses] : meses;
  if (opcoes.length === 0) return <p className="font-body text-slate-400/50 text-sm">Nenhum mês ainda.</p>;
  const atual = opcoes.indexOf(valor);
  const irPara = (delta) => { const alvo = opcoes[atual + delta]; if (alvo) onChange(alvo); };
  const setaCls = "p-2 rounded-full bg-white/5 border border-blue-900/30 text-slate-300 transition-all enabled:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <button onClick={() => irPara(-1)} disabled={atual <= 0} className={setaCls} aria-label="Mês anterior"><ChevronLeft size={16}/></button>
      <div className="relative flex-1 sm:flex-none">
        <select
          value={valor}
          onChange={e => onChange(e.target.value)}
          className="w-full sm:w-52 appearance-none bg-white/5 border border-blue-900/30 rounded-full pl-4 pr-9 py-2.5 sm:py-2 font-body text-base sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          {opcoes.map(m => <option key={m} value={m} className="bg-[#0d1829]">{m === "todos" ? rotuloTodos : nomeMes(m)}</option>)}
        </select>
        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400/50 pointer-events-none"/>
      </div>
      <button onClick={() => irPara(1)} disabled={atual >= opcoes.length - 1} className={setaCls} aria-label="Próximo mês"><ChevronRight size={16}/></button>
    </div>
  );
}

// ── HISTÓRICO ────────────────────────────────────────────────────────────────────
function HistoricoAba({ despesas, assinaturas, receitas, parcelamentos, userNome, onAviso }) {
  const mesesComDespesas = useMemo(() => {
    const s = new Set();
    despesas.forEach(d => { if (d.status === "paga" && d.data_pagamento) s.add(d.data_pagamento.substring(0,7)); if (d.status !== "paga" && d.data_vencimento) s.add(d.data_vencimento.substring(0,7)); });
    s.add(mesAtual());
    return [...s].sort((a,b) => b.localeCompare(a));
  }, [despesas]);
  // Abre no mês atual, não no mais recente da lista: parcelas futuras pendentes
  // empurrariam a abertura para o último mês parcelado.
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  // O estado inicial é lido uma única vez; sem este ajuste a seleção fica presa num
  // mês que deixou de existir na lista.
  useEffect(() => {
    if (!mesesComDespesas.includes(mesSelecionado)) setMesSelecionado(mesAtual());
  }, [mesesComDespesas, mesSelecionado]);
  const despesasDomes = useMemo(() => despesas.filter(d => { if (d.status === "paga") return d.data_pagamento?.startsWith(mesSelecionado); return (d.data_vencimento || d.data)?.startsWith(mesSelecionado); }).sort((a,b) => (b.data_vencimento||b.data||"").localeCompare(a.data_vencimento||a.data||"")), [despesas, mesSelecionado]);
  const totalPago = useMemo(() => despesasDomes.filter(d => d.status === "paga").reduce((s,d) => s + parseFloat(d.valor||0), 0), [despesasDomes]);
  const totalPendente = useMemo(() => despesasDomes.filter(d => d.status !== "paga").reduce((s,d) => s + parseFloat(d.valor||0), 0), [despesasDomes]);

  const gerarPDFMes = async () => {
    try {
      const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.getWidth(); let y = 20;
      doc.setFontSize(22); doc.text(`Relatório — ${nomeMes(mesSelecionado)}`, pw/2, y, {align:"center"}); y+=12;
      doc.setFontSize(9); doc.setTextColor(120,120,140); doc.text(`Usuário: ${userNome}   |   ${new Date().toLocaleDateString("pt-BR")}`, pw/2, y, {align:"center"}); doc.setTextColor(0,0,0); y+=15;
      autoTable(doc, {startY:y, head:[["Item","Valor"]], body:[["Total Pago",formatBRL(totalPago)],["Total Pendente",formatBRL(totalPendente)],["Total Geral",formatBRL(totalPago+totalPendente)]], theme:"grid", headStyles:{fillColor:[30,64,175]}});
      y = doc.lastAutoTable.finalY + 15;
      const pagas = despesasDomes.filter(d => d.status === "paga");
      if (pagas.length > 0) { doc.setFontSize(13); doc.text("Despesas Pagas", 20, y); y+=8; autoTable(doc, {startY:y, head:[["Descrição","Data Pgto","Valor"]], body:pagas.map(d=>[d.descricao,formatarDataBR(d.data_pagamento),formatBRL(d.valor)]), theme:"grid", headStyles:{fillColor:[5,150,105]}}); y = doc.lastAutoTable.finalY+15; }
      const pend = despesasDomes.filter(d => d.status !== "paga");
      if (pend.length > 0) { doc.setFontSize(13); doc.text("Despesas Pendentes", 20, y); y+=8; autoTable(doc, {startY:y, head:[["Descrição","Vencimento","Valor"]], body:pend.map(d=>[d.descricao,formatarDataBR(d.data_vencimento||d.data),formatBRL(d.valor)]), theme:"grid", headStyles:{fillColor:[180,83,9]}}); }
      doc.save(`relatorio-${mesSelecionado}.pdf`);
    } catch (e) { onAviso?.("Não foi possível gerar o PDF: " + e.message); }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3"><BotaoAjuda topico="historico"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Histórico de Meses</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">{nomeMes(mesSelecionado)}</h2></div></div>
        <button onClick={gerarPDFMes} className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><FileDown size={14}/>Gerar PDF</button>
      </div>
      <SeletorMes meses={mesesComDespesas} valor={mesSelecionado} onChange={setMesSelecionado}/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Pago</p><p className="font-mono-c num-tabular text-2xl font-bold text-emerald-400">{formatBRL(totalPago)}</p></div>
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Pendente</p><p className="font-mono-c num-tabular text-2xl font-bold text-sky-400">{formatBRL(totalPendente)}</p></div>
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Total Geral</p><p className="font-mono-c num-tabular text-2xl font-bold text-slate-100">{formatBRL(totalPago+totalPendente)}</p></div>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {despesasDomes.length === 0 ? <div className="p-12 text-center"><p className="font-body text-slate-400/50">Nenhuma despesa neste mês.</p></div> : (
          <div className="divide-y divide-blue-900/20">
            {despesasDomes.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.status==="paga"?"bg-emerald-400":"bg-sky-400"}`}/>
                <div className="flex-1"><div className="font-body text-slate-200">{d.descricao}{rotuloParcela(d)}</div><div className="font-mono-c text-[10px] text-slate-400/50">{d.status==="paga"?`Pago em ${formatarDataBR(d.data_pagamento)}`:`Vence em ${formatarDataBR(d.data_vencimento||d.data)}`}</div></div>
                <div className={`font-mono-c num-tabular text-sm ${d.status==="paga"?"text-emerald-400":"text-slate-300"}`}>{formatBRL(d.valor)}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body ${d.status==="paga"?"bg-emerald-500/15 text-emerald-400":"bg-sky-500/15 text-sky-400"}`}>{d.status==="paga"?"Pago":"Pendente"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────────────────
function HomeAba({ quote, saldo, saldoInicial, composicaoSaldoInicial, onAjustarSaldoInicial, onRemoverAjuste, temReceitaNoMes, saldoMes, temMovimentoNoMes, totalReceitasMes, totalDespesasMes, totalPendentesGeral, proximasAssinaturas, receitas, despesas, assinaturas, parcelamentos, userNome, onAviso }) {
  const mesAnterior = nomeMes(somarMeses(`${mesAtual()}-01`, -1).substring(0, 7));
  const [verSaldoInicial, setVerSaldoInicial] = useState(false);
  const despesasPagasCount = despesas.filter(d => d.status === "paga").length;
  const parcelamentosAtivos = parcelamentos.filter(p => p.status === "ativo").length;
  const receitasMes = receitas.filter(r => (r.mes || mesAtual()) === mesAtual()).length;

  const gerarRelatorio = async () => {
    try {
      const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.getWidth(); let y = 20;
      doc.setFontSize(22); doc.text("Relatório de Despesas", pw/2, y, {align:"center"}); y+=12;
      doc.setFontSize(9); doc.setTextColor(120,120,140); doc.text(`Usuário: ${userNome}   |   Mês: ${nomeMes(mesAtual())}   |   ${new Date().toLocaleDateString("pt-BR")}`, pw/2, y, {align:"center"}); doc.setTextColor(0,0,0); y+=15;
      // O resumo mistura valores do mês com acumulados, por isso cada linha traz o
      // período: as tabelas seguintes listam apenas o mês corrente.
      const dpe = despesas.filter(d=>(d.status==="pendente"||!d.status)&&(d.data_vencimento||d.data)?.startsWith(mesAtual()));
      const totalPendentesDoMes = dpe.reduce((s,d)=>s+parseFloat(d.valor||0),0);
      const mesRef = nomeMes(mesAtual());
      autoTable(doc, {startY:y, head:[["Item","Valor"]], body:[
        [`Receitas (${mesRef})`, formatBRL(totalReceitasMes)],
        [`Despesas pagas (${mesRef})`, formatBRL(totalDespesasMes)],
        [`Saldo inicial (veio de ${mesAnterior})`, formatBRL(saldoInicial)],
        [`Resultado do mês (${mesRef})`, temMovimentoNoMes?formatBRL(saldoMes):"Sem movimento no mês"],
        [`A pagar (${mesRef})`, formatBRL(totalPendentesDoMes)],
        ["A pagar (todos os meses)", formatBRL(totalPendentesGeral)],
        ["Saldo atual (saldo inicial + resultado do mês)", temReceitaNoMes?formatBRL(saldo):"Sem receita cadastrada"],
      ], theme:"grid", headStyles:{fillColor:[30,64,175]}}); y=doc.lastAutoTable.finalY+15;
      const rm = receitas.filter(r=>(r.mes||mesAtual())===mesAtual()); if(rm.length>0){doc.setFontSize(13);doc.text("Receitas",20,y);y+=8;autoTable(doc,{startY:y,head:[["Fonte","Valor"]],body:rm.map(r=>[r.fonte,formatBRL(r.valor)]),theme:"grid",headStyles:{fillColor:[5,150,105]}});y=doc.lastAutoTable.finalY+15;}
      const dp = despesas.filter(d=>d.status==="paga"&&d.data_pagamento?.startsWith(mesAtual())); if(dp.length>0){doc.setFontSize(13);doc.text("Despesas Pagas",20,y);y+=8;autoTable(doc,{startY:y,head:[["Descrição","Data","Valor"]],body:dp.map(d=>[d.descricao,formatarDataBR(d.data_pagamento),formatBRL(d.valor)]),theme:"grid",headStyles:{fillColor:[30,64,175]}});y=doc.lastAutoTable.finalY+15;}
      if(dpe.length>0){doc.setFontSize(13);doc.text(`Despesas Pendentes — ${mesRef}`,20,y);y+=8;autoTable(doc,{startY:y,head:[["Descrição","Vencimento","Valor"]],body:dpe.map(d=>[d.descricao,formatarDataBR(d.data_vencimento||d.data),formatBRL(d.valor)]),theme:"grid",headStyles:{fillColor:[180,83,9]}});}
      doc.save(`relatorio-${mesAtual()}.pdf`);
    } catch(e){ onAviso?.("Não foi possível gerar o PDF: " + e.message); }
  };

  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 text-center relative">
        <div className="absolute top-0 right-0"><BotaoAjuda topico="home"/></div>
        <p className="font-display text-3xl italic leading-tight text-slate-100">"{quote.text}"</p>
        {quote.author && <p className="font-body text-sm text-slate-400/70 mt-3">— {quote.author}</p>}
      </section>
      {/* Lidos em sequência: o mês começa no saldo inicial, soma as receitas, desconta o
          pago e chega ao saldo atual. "A pagar" é o único que soma todos os meses. */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CardSaldo label="Saldo inicial" escopo={saldoInicial < 0 ? `faltou em ${mesAnterior}` : `sobrou de ${mesAnterior}`} saldo={saldoInicial} temReceita delay={2} onClick={() => setVerSaldoInicial(true)} acao="Toque para conferir ou ajustar"/>
        <CardResumo label="Receitas" escopo="este mês" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-400" delay={2}/>
        <CardResumo label="Pago" escopo="este mês" valor={totalDespesasMes} icon={CheckCircle2} cor="text-red-400" delay={3}/>
        <CardSaldo label="Saldo atual" escopo="saldo inicial + receitas − pago" saldo={saldo} temReceita={temReceitaNoMes} delay={3}/>
        <CardResumo label="A pagar" escopo="todos os meses" valor={totalPendentesGeral} icon={Clock} cor="text-sky-400" delay={4}/>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fadeInUp delay-5 bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl italic text-slate-100">Visão Geral</h3>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">💳 Despesas</div><div className="font-mono-c num-tabular text-lg text-red-400">{despesasPagasCount} de {despesas.length} pagas</div><div className="text-xs text-slate-400/50 mt-1">Total: {formatBRL(despesas.reduce((s,d)=>s+parseFloat(d.valor||0),0))}</div></div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">📅 Parcelamentos</div><div className="font-mono-c num-tabular text-lg text-sky-400">{parcelamentosAtivos} ativo{parcelamentosAtivos!==1?"s":""}</div></div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">💰 Receitas</div><div className="font-mono-c num-tabular text-lg text-emerald-400">{receitasMes} este mês</div><div className="text-xs text-slate-400/50 mt-1">Total: {formatBRL(totalReceitasMes)}</div></div>
          {!temReceitaNoMes && <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl"><p className="font-body text-xs text-sky-400">💡 Cadastre suas receitas do mês para ver o saldo.</p></div>}
          <button onClick={gerarRelatorio} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all flex items-center justify-center gap-2"><FileDown size={16}/>Gerar Relatório do Mês</button>
        </div>
        <div className="animate-fadeInUp delay-5 bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-slate-100 mb-6">Próximas assinaturas</h3>
          {proximasAssinaturas.length===0?<div className="h-[200px] flex items-center justify-center"><p className="font-body text-slate-400/40">Nenhuma</p></div>:(
            <div className="space-y-2">{proximasAssinaturas.slice(0,6).map(a=>(
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-blue-900/20">
                <div className="font-body text-sm text-slate-200">{a.nome}</div>
                <div className="font-mono-c num-tabular text-sm text-sky-300">{formatBRL(a.valor)}</div>
              </div>
            ))}</div>
          )}
        </div>
      </section>
      {verSaldoInicial && <ModalSaldoInicial composicao={composicaoSaldoInicial} mesAnterior={mesAnterior} onFechar={() => setVerSaldoInicial(false)} onAjustar={onAjustarSaldoInicial} onRemoverAjuste={onRemoverAjuste}/>}
    </div>
  );
}

function CardResumo({ label, escopo, valor, icon: Icon, cor, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border bg-[#0d1829] border-blue-900/30`}>
      <div className="flex items-center justify-between mb-3"><span className="font-mono-c text-[10px] text-slate-400/50 uppercase">{label}</span><Icon size={16} className={cor}/></div>
      <div className={`font-mono-c num-tabular text-2xl font-bold not-italic ${cor}`}>{formatBRL(valor)}</div>
      {escopo && <p className="font-body text-[10px] text-slate-400/40 mt-1">{escopo}</p>}
    </div>
  );
}
function CardSaldo({ label, escopo, saldo, temReceita, delay, onClick, acao }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border bg-[#0d1829] border-blue-500/30 text-left w-full ${onClick ? "hover:border-blue-400/60 active:scale-[0.99] transition" : ""}`}>
      <div className="flex items-center justify-between mb-3"><span className="font-mono-c text-[10px] text-slate-400/50 uppercase">{label}</span><Wallet size={16} className="text-blue-400"/></div>
      {temReceita?<div className={`font-mono-c num-tabular text-2xl font-bold not-italic ${saldo>=0?"text-emerald-400":"text-red-400"}`}>{formatBRL(saldo)}</div>:<div className="font-mono-c text-xl font-bold text-slate-400/40">—</div>}
      <p className="font-body text-[10px] text-slate-400/40 mt-1">{temReceita ? escopo : "Cadastre receitas"}</p>
      {acao && <p className="font-body text-sm font-medium text-white mt-3 flex items-center gap-1.5"><Pencil size={13}/>{acao}</p>}
    </Tag>
  );
}

// Mostra de onde vem o saldo inicial e deixa corrigi-lo para o valor real do banco.
// O app só conhece o que foi registrado nele; as pistas apontam os desencontros comuns.
function ModalSaldoInicial({ composicao, mesAnterior, onFechar, onAjustar, onRemoverAjuste }) {
  const [valorReal, setValorReal] = useState("");
  const [salvando, setSalvando] = useState(false);
  const c = composicao;
  const real = valorReal === "" ? null : parseFloat(valorReal);
  const diferenca = real === null || isNaN(real) ? null : Math.round((real - c.saldo) * 100) / 100;
  const linha = (rotulo, valor, cor) => (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5"><span className="font-body text-sm text-slate-400/80">{rotulo}</span><span className={`font-mono-c num-tabular text-sm ${cor}`}>{valor < 0 ? "− " : ""}{formatBRL(Math.abs(valor))}</span></div>
  );
  const submit = async () => {
    if (diferenca === null || diferenca === 0) return;
    setSalvando(true);
    await onAjustar(real, c.saldo);
    onFechar();
  };
  return (
    <ModalBase titulo="Saldo inicial" subtitulo={`Com quanto você começou ${nomeMes(mesAtual())}`} icone={Wallet} onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar="Ajustar saldo" salvando={salvando} desabilitado={diferenca === null || diferenca === 0}/>}>
      <div className="rounded-xl border border-blue-900/30 overflow-hidden divide-y divide-blue-900/20 bg-white/[0.02]">
        {linha(`Receitas até ${mesAnterior}`, c.receitas, "text-emerald-400")}
        {linha(`Pago até ${mesAnterior}`, -c.pagas, "text-red-400")}
        {c.totalAjustes !== 0 && linha("Ajustes de saldo", c.totalAjustes, "text-sky-300")}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03]"><span className="font-body text-sm font-medium text-slate-100">Saldo inicial</span><span className={`font-mono-c num-tabular text-lg font-bold ${c.saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(c.saldo)}</span></div>
      </div>
      {(c.pendentesAntigas > 0 || c.antigasPagasNoMes > 0 || c.pagasSemData > 0) && (
        <Aviso tom="ambar" icone={AlertTriangle}>
          <span className="block font-medium mb-1">Não bate com o banco? Confira:</span>
          {c.pendentesAntigas > 0 && <span className="block">• {formatBRL(c.pendentesAntigas)} em despesas de meses anteriores ainda pendentes. Se já pagou pelo banco, marque como pagas.</span>}
          {c.antigasPagasNoMes > 0 && <span className="block">• {formatBRL(c.antigasPagasNoMes)} em contas de meses anteriores marcadas como pagas só neste mês — saem do mês atual, não do saldo inicial.</span>}
          {c.pagasSemData > 0 && <span className="block">• {formatBRL(c.pagasSemData)} em despesas pagas sem data contam como anteriores.</span>}
        </Aviso>
      )}
      {c.ajustes.length > 0 && (
        <div className="space-y-1.5">
          <span className="block font-body text-xs font-medium text-slate-300/80">Ajustes feitos</span>
          {c.ajustes.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-blue-900/20">
              <span className="font-body text-xs text-slate-400/70 flex-1">{nomeMes(a.mes)}</span>
              <span className="font-mono-c num-tabular text-sm text-sky-300">{formatBRL(a.valor)}</span>
              <button type="button" onClick={() => { onFechar(); onRemoverAjuste(a.id); }} className="p-2 -m-1 rounded-lg text-slate-400/50 hover:text-red-400 hover:bg-red-500/10" aria-label="Desfazer ajuste"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      )}
      <div className="pt-1 border-t border-blue-900/20">
        <Campo rotulo={`Valor real no banco no fim de ${mesAnterior}`} dica={diferenca === null ? "A diferença vira um ajuste — nenhuma despesa é alterada." : diferenca === 0 ? "Já está nesse valor." : `Será registrado um ajuste de ${diferenca > 0 ? "+" : "−"}${formatBRL(Math.abs(diferenca))}.`} className="pt-4">
          <InputValor value={valorReal} onChange={e => setValorReal(e.target.value)}/>
        </Campo>
      </div>
    </ModalBase>
  );
}

// ── DESPESAS ──────────────────────────────────────────────────────────────────────
function DespesasAba({ despesasPendentes, despesasPagas, categorias, emAndamento, onAdicionar, onAdicionarParcelamento, onNovaCategoria, onRemoverCategoria, onRemover, onMarcarPaga, onPagarFatura, onEditar }) {
  const [subAba, setSubAba] = useState("pendentes");
  // A aba sempre abre no mês atual; "todos" mostra qualquer mês, inclusive o que ficou
  // para trás. O aviso de pendências antigas cobre o que o filtro do mês esconderia.
  const [mesFiltro, setMesFiltro] = useState(mesAtual);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [soCartao, setSoCartao] = useState(false);
  // Recolhida, a fileira mostra só as primeiras categorias — e a selecionada, mesmo
  // que esteja além delas, para o filtro ativo nunca ficar escondido.
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const LIMITE_CATEGORIAS = 3;
  const categoriasVisiveis = categoriasExpandidas
    ? categorias
    : categorias.filter((c, i) => i < LIMITE_CATEGORIAS || c.id === categoriaFiltro);
  const ocultas = categorias.length - categoriasVisiveis.length;

  // A fatura não é tabela própria: é o agrupamento das despesas pendentes no cartão pelo
  // mês de vencimento. Pagar a fatura marca essas despesas como pagas — o dinheiro sai do
  // saldo uma vez só, pelas mesmas linhas que o pagamento individual usaria.
  const faturas = useMemo(() => {
    const mapa = new Map();
    despesasPendentes.filter(d => d.forma_pagamento === "cartao").forEach(d => {
      const mes = (d.data_vencimento || d.data || "").substring(0, 7);
      if (!mes) return;
      if (!mapa.has(mes)) mapa.set(mes, []);
      mapa.get(mes).push(d);
    });
    // Fatura de mês anterior ainda pendente está vencida: continua visível no mês filtrado.
    return [...mapa.entries()]
      .filter(([mes]) => mesFiltro === "todos" || mes <= mesFiltro)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, itens]) => ({ mes, ids: itens.map(d => d.id), total: Math.round(itens.reduce((s, d) => s + parseFloat(d.valor || 0), 0) * 100) / 100 }));
  }, [despesasPendentes, mesFiltro]);
  const nomeCategoria = (id) => categorias.find(c => c.id === id)?.nome;
  const corCategoria = (id) => categorias.find(c => c.id === id)?.cor || "#60a5fa";

  // Lista de meses que têm alguma despesa (pendente ou paga), do mais recente pro mais antigo
  const mesesDisponiveis = useMemo(() => {
    const s = new Set();
    despesasPendentes.forEach(d => { const dr = d.data_vencimento || d.data; if (dr) s.add(dr.substring(0, 7)); });
    despesasPagas.forEach(d => { if (d.data_pagamento) s.add(d.data_pagamento.substring(0, 7)); });
    s.add(mesAtual());
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [despesasPendentes, despesasPagas]);

  const pendentesAnteriores = useMemo(() => {
    if (mesFiltro === "todos") return null;
    const antigas = despesasPendentes.filter(d => { const ref = (d.data_vencimento || d.data || "").substring(0, 7); return ref && ref < mesFiltro; });
    return antigas.length > 0 ? { qtd: antigas.length, total: antigas.reduce((s, d) => s + parseFloat(d.valor || 0), 0) } : null;
  }, [despesasPendentes, mesFiltro]);

  const listaBase = subAba === "pendentes" ? despesasPendentes : despesasPagas;
  const lista = useMemo(() => {
    return listaBase.filter(d => {
      const casaCategoria = categoriaFiltro === "todas"
        || (categoriaFiltro === "sem" ? !d.categoria_id : d.categoria_id === categoriaFiltro);
      if (!casaCategoria) return false;
      if (soCartao && d.forma_pagamento !== "cartao") return false;
      if (mesFiltro === "todos") return true;
      const ref = subAba === "pendentes" ? (d.data_vencimento || d.data) : d.data_pagamento;
      return ref && ref.startsWith(mesFiltro);
    });
  }, [listaBase, mesFiltro, categoriaFiltro, soCartao, subAba]);

  const total = useMemo(() => lista.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [lista]);

  // Com vários meses na tela, a data solta em cada linha não diz a que período o bloco
  // pertence. Agrupar dá esse enquadramento e ainda mostra quanto pesa cada mês.
  const grupos = useMemo(() => {
    const referencia = (d) => (subAba === "pendentes" ? (d.data_vencimento || d.data) : d.data_pagamento) || "";
    const mapa = new Map();
    [...lista].sort((a, b) => referencia(b).localeCompare(referencia(a))).forEach(d => {
      const mes = referencia(d).substring(0, 7) || "sem-data";
      if (!mapa.has(mes)) mapa.set(mes, []);
      mapa.get(mes).push(d);
    });
    return [...mapa.entries()].map(([mes, itens]) => ({
      mes, itens, subtotal: itens.reduce((s, d) => s + parseFloat(d.valor || 0), 0),
    }));
  }, [lista, subAba]);

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BotaoAjuda topico="despesas"/>
          <div>
            <p className="font-mono-c text-[10px] text-slate-400/60 uppercase">
              {subAba === "pendentes" ? "A pagar" : "Pago"}{mesFiltro !== "todos" ? ` · ${nomeMes(mesFiltro)}` : " · todos os meses"}
            </p>
            <h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{formatBRL(total)}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onAdicionarParcelamento} className="px-4 py-2.5 rounded-full bg-white/5 border border-blue-900/30 text-slate-300 hover:bg-white/10 font-body text-sm flex items-center gap-2 transition-all"><Zap size={14}/>Parcelado</button>
          <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
        </div>
      </div>

      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-full w-fit border border-blue-900/30">
        <button onClick={()=>setSubAba("pendentes")} className={`px-4 py-1.5 rounded-full font-body text-xs transition-all ${subAba==="pendentes"?"bg-blue-600 text-white":"text-slate-400/70"}`}>Pendentes ({despesasPendentes.length})</button>
        <button onClick={()=>setSubAba("pagas")} className={`px-4 py-1.5 rounded-full font-body text-xs transition-all ${subAba==="pagas"?"bg-blue-600 text-white":"text-slate-400/70"}`}>Histórico ({despesasPagas.length})</button>
      </div>

      <SeletorMes meses={mesesDisponiveis} valor={mesFiltro} onChange={setMesFiltro} incluirTodos/>

      {subAba==="pendentes"&&pendentesAnteriores&&(
        <button onClick={()=>setMesFiltro("todos")} className="w-full text-left px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 font-body text-xs text-amber-300 flex items-center gap-2 hover:bg-amber-500/15 transition">
          <AlertTriangle size={14} className="shrink-0"/>
          <span className="flex-1">{pendentesAnteriores.qtd} pendente{pendentesAnteriores.qtd===1?"":"s"} de meses anteriores ({formatBRL(pendentesAnteriores.total)})</span>
          <span className="underline underline-offset-2 shrink-0">Ver todas</span>
        </button>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <span className="font-mono-c text-[10px] text-slate-400/50 uppercase mr-1">Categorias</span>
        <button onClick={()=>setCategoriaFiltro("todas")} className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${categoriaFiltro==="todas"?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>Todas</button>
        {categoriasVisiveis.map(c => (
          <span key={c.id} className={`group inline-flex items-center rounded-full transition-all ${categoriaFiltro===c.id?"bg-blue-600":"bg-white/5 border border-blue-900/30"}`}>
            <button onClick={()=>setCategoriaFiltro(c.id)} className={`pl-3 pr-2 py-1.5 font-body text-xs flex items-center gap-2 ${categoriaFiltro===c.id?"text-white":"text-slate-300"}`}>
              <span className="w-2 h-2 rounded-full" style={{background:c.cor}}/>{c.nome}
            </button>
            <button onClick={()=>onRemoverCategoria(c.id)} className="pr-2.5 pl-1 py-1.5 text-slate-400/50 sm:text-slate-400/0 sm:group-hover:text-slate-400/60 hover:!text-red-400 transition-colors" aria-label={`Apagar categoria ${c.nome}`}><X size={11}/></button>
          </span>
        ))}
        {(categoriasExpandidas||categoriaFiltro==="sem")&&<button onClick={()=>setCategoriaFiltro("sem")} className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${categoriaFiltro==="sem"?"bg-blue-600 text-white":"bg-white/5 text-slate-400/70 hover:bg-white/10 border border-blue-900/30"}`}>Sem categoria</button>}
        {categoriasExpandidas&&<button onClick={onNovaCategoria} className="px-3 py-1.5 rounded-full font-body text-xs bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-all flex items-center gap-1"><Plus size={11}/>Categoria</button>}
        <button onClick={()=>setCategoriasExpandidas(v=>!v)} aria-expanded={categoriasExpandidas} className={`pl-3 pr-2.5 py-1.5 rounded-full font-body text-xs font-medium transition-all flex items-center gap-1.5 border ${categoriasExpandidas?"bg-white/[0.03] border-blue-900/40 text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]":"bg-blue-500/10 border-blue-400/30 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400/50"}`}>
          {categoriasExpandidas?"Mostrar menos":"Mostrar todas"}
          {!categoriasExpandidas&&ocultas>0&&<span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500/30 text-blue-100 font-mono-c text-[10px] flex items-center justify-center">+{ocultas}</span>}
          <ChevronDown size={13} className={`transition-transform duration-200 ${categoriasExpandidas?"rotate-180":""}`}/>
        </button>
        <button onClick={()=>setSoCartao(v=>!v)} className={`px-3 py-1.5 rounded-full font-body text-xs transition-all flex items-center gap-1 ${soCartao?"bg-blue-600 text-white":"bg-white/5 text-slate-400/70 hover:bg-white/10 border border-blue-900/30"}`}><CreditCard size={11}/>Só cartão{soCartao&&<X size={11}/>}</button>
      </div>

      {subAba==="pendentes"&&faturas.length>0&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {faturas.map(f=>{const pagando=emAndamento.includes(`fatura-${f.mes}`);return(
            <div key={f.mes} className="bg-[#0d1829] border border-blue-500/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono-c text-[10px] text-slate-400/60 uppercase flex items-center gap-1.5"><CreditCard size={11} className="text-blue-400"/>Fatura do cartão{f.mes<mesAtual()&&<span className="text-red-400 normal-case">· vencida</span>}</p>
                  <p className="font-body text-slate-200 mt-0.5">{nomeMes(f.mes)}</p>
                  <p className="font-mono-c text-[10px] text-slate-400/50">{f.ids.length} compra{f.ids.length===1?"":"s"} pendente{f.ids.length===1?"":"s"}</p>
                </div>
                <p className="font-mono-c num-tabular text-xl font-bold text-sky-300 whitespace-nowrap">{formatBRL(f.total)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setMesFiltro(f.mes);setSoCartao(true);}} className="flex-1 py-2 rounded-xl font-body text-xs bg-white/5 border border-blue-900/30 text-slate-300 hover:bg-white/10 transition">Ver itens</button>
                <button onClick={()=>onPagarFatura(f.mes,f.ids,f.total)} disabled={pagando} className="flex-1 py-2 rounded-xl font-body text-xs bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 enabled:hover:bg-emerald-500/25 disabled:opacity-50 transition flex items-center justify-center gap-1.5">{pagando?<><Loader2 size={12} className="animate-spin"/>Pagando...</>:<><Check size={12}/>Pagar fatura</>}</button>
              </div>
            </div>
          );})}
        </div>
      )}

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {lista.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">{subAba==="pendentes"?"Sem despesas pendentes ✨":"Sem histórico"}</p></div>:(
          <div className="divide-y divide-blue-900/20">
            {grupos.map(({mes, itens, subtotal})=>(
              <div key={mes}>
                {grupos.length>1&&(
                  <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white/[0.02] border-b border-blue-900/20">
                    <span className="font-mono-c text-[10px] uppercase tracking-wider text-slate-400/60">{mes==="sem-data"?"Sem data":nomeMes(mes)}</span>
                    <span className="font-mono-c num-tabular text-[11px] text-slate-400/60">{itens.length} · {formatBRL(subtotal)}</span>
                  </div>
                )}
                <div className="divide-y divide-blue-900/20">
                  {itens.map(d=>{const ocupado=emAndamento.includes(d.id)||(d.forma_pagamento==="cartao"&&d.status!=="paga"&&emAndamento.includes(`fatura-${(d.data_vencimento||d.data||"").substring(0,7)}`));return(
                    <div key={d.id} className={`flex items-center gap-3 p-4 hover:bg-white/[0.02] group ${ocupado?"opacity-60":""}`}>
                      {/* A área do texto abre a edição: no celular não há hover para revelar o lápis. */}
                      <button onClick={()=>!ocupado&&onEditar(d)} className="flex-1 min-w-0 text-left" aria-label={`Editar ${d.descricao}`}>
                        <div className="font-body text-slate-200 flex items-center gap-1.5">{d.descricao}{rotuloParcela(d)}<Pencil size={11} className="text-slate-400/40 sm:hidden shrink-0"/></div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="font-mono-c text-[10px] text-slate-400/50">{formatarDataBR(d.data_vencimento||d.data)}</span>
                          {nomeCategoria(d.categoria_id) && <span className="font-body text-[10px] px-2 py-0.5 rounded-full border" style={{color:corCategoria(d.categoria_id),borderColor:corCategoria(d.categoria_id)+"55",background:corCategoria(d.categoria_id)+"14"}}>{nomeCategoria(d.categoria_id)}</span>}
                          {rotuloForma(d.forma_pagamento) && <span className="font-body text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-blue-900/30 text-slate-400/70">{rotuloForma(d.forma_pagamento)}</span>}
                        </div>
                      </button>
                      <div className="font-mono-c num-tabular text-slate-300 whitespace-nowrap">{formatBRL(d.valor)}</div>
                      {/* Sem hover em tela de toque: escondido só a partir de sm. */}
                      {ocupado ? <Loader2 size={14} className="text-blue-400/70 animate-spin"/> : (
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>onEditar(d)} className="hidden sm:block sm:p-1 text-slate-400/40 hover:text-blue-300" aria-label="Editar"><Pencil size={14}/></button>
                          {subAba==="pendentes"&&<button onClick={()=>onMarcarPaga(d.id)} className="w-10 h-10 sm:w-auto sm:h-auto sm:p-1 rounded-full flex items-center justify-center bg-emerald-500/15 sm:bg-transparent border border-emerald-500/25 sm:border-0 text-emerald-400 sm:text-emerald-400/70 hover:text-emerald-400 active:bg-emerald-500/30" aria-label="Marcar como paga"><Check size={16} className="sm:w-3.5 sm:h-3.5"/></button>}
                          <button onClick={()=>onRemover(d.id)} className="w-10 h-10 sm:w-auto sm:h-auto sm:p-1 rounded-full flex items-center justify-center bg-red-500/10 sm:bg-transparent border border-red-500/20 sm:border-0 text-red-400/80 sm:text-slate-400/30 hover:text-red-400 active:bg-red-500/25" aria-label="Apagar"><Trash2 size={16} className="sm:w-3.5 sm:h-3.5"/></button>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PARCELAMENTOS ─────────────────────────────────────────────────────────────────
function ParcelamentosAba({ parcelamentos, categorias, emAndamento, onAdicionar, onRemover, onMarcarPaga }) {
  const ativos = parcelamentos.filter(p=>p.status==="ativo");
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="parcelamentos"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Parcelamentos ativos</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{ativos.length}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Novo</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {parcelamentos.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhum parcelamento</p></div>:(
          <div className="divide-y divide-blue-900/20">
            {parcelamentos.map(p=>{const pct=(p.parcelas_pagas/p.parcelas_total)*100;const vp=dividirEmParcelas(p.valor_total,p.parcelas_total)[0];return(
              <div key={p.id} className="p-6 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between mb-4"><div><h3 className="font-body text-lg text-slate-100">{p.descricao}</h3><p className="font-mono-c text-[10px] text-slate-400/50 mt-1">Próx: {formatarDataBR(p.proxima_parcela_data)}</p></div><button onClick={()=>onRemover(p.id)} className="text-slate-400/30 hover:text-red-400"><Trash2 size={14}/></button></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">VALOR TOTAL</p><p className="font-mono-c num-tabular text-sky-300">{formatBRL(p.valor_total)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">JÁ PAGO</p><p className="font-mono-c num-tabular text-emerald-400">{formatBRL(p.valor_pago||0)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">POR PARCELA</p><p className="font-mono-c num-tabular text-slate-300">{formatBRL(vp)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">PROGRESSO</p><p className="font-mono-c num-tabular text-slate-300">{p.parcelas_pagas}/{p.parcelas_total}</p></div>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-2 mb-3 overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{width:`${pct}%`}}/></div>
                {p.parcelas_pagas<p.parcelas_total&&<button onClick={()=>onMarcarPaga(p.id)} disabled={emAndamento.includes(p.id)} className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 py-2 rounded-xl font-body text-sm enabled:hover:bg-emerald-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2">{emAndamento.includes(p.id)?<><Loader2 size={14} className="animate-spin"/>Pagando...</>:<><Check size={14}/>Marcar próxima como paga</>}</button>}
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RECEITAS ──────────────────────────────────────────────────────────────────────
function ReceitasAba({ receitas, totalReceitasMes, onAdicionar, onRemover }) {
  const recDoMes = receitas.filter(r=>(r.mes||mesAtual())===mesAtual());
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="receitas"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Receitas</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-emerald-400">{formatBRL(totalReceitasMes)}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {recDoMes.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhuma receita cadastrada</p></div>:(
          <div className="divide-y divide-blue-900/20">{recDoMes.map(r=>(
            <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] group">
              <div className="flex-1"><div className="font-body text-slate-200">{r.fonte}</div></div>
              <div className="font-mono-c num-tabular text-emerald-400">{formatBRL(r.valor)}</div>
              <button onClick={()=>onRemover(r.id)} className="p-2.5 -m-1.5 sm:p-0 sm:m-0 sm:opacity-0 sm:group-hover:opacity-100 text-red-400/60 sm:text-slate-400/30 hover:text-red-400 transition-opacity" aria-label="Apagar"><Trash2 size={16} className="sm:w-3.5 sm:h-3.5"/></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

// ── ASSINATURAS ───────────────────────────────────────────────────────────────────
function AssinaturasAba({ assinaturas, total, onAdicionar, onRemover }) {
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="assinaturas"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Total mensal</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{formatBRL(total)}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {assinaturas.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhuma assinatura</p></div>:(
          <div className="divide-y divide-blue-900/20">{assinaturas.map(a=>(
            <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] group">
              <div className="flex-1"><div className="font-body text-slate-200">{a.nome}</div></div>
              <div className="font-mono-c num-tabular text-sky-300">{formatBRL(a.valor)}</div>
              <button onClick={()=>onRemover(a.id)} className="p-2.5 -m-1.5 sm:p-0 sm:m-0 sm:opacity-0 sm:group-hover:opacity-100 text-red-400/60 sm:text-slate-400/30 hover:text-red-400 transition-opacity" aria-label="Apagar"><Trash2 size={16} className="sm:w-3.5 sm:h-3.5"/></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────────
function ModalReceita({ onFechar, onSalvar }) {
  const [fonte,setFonte]=useState(""); const [valor,setValor]=useState(""); const [salvando,setSalvando]=useState(false);
  const valido=fonte.trim()&&parseFloat(valor)>0;
  const submit=async()=>{if(!valido)return;setSalvando(true);await onSalvar({fonte:fonte.trim(),valor:parseFloat(valor),mes:mesAtual()});};
  return (
    <ModalBase titulo="Nova receita" subtitulo={`Entra nas receitas de ${nomeMes(mesAtual())}`} icone={TrendingUp} tom="verde" onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar="Salvar receita" salvando={salvando} desabilitado={!valido}/>}>
      <Campo rotulo="De onde veio"><input type="text" value={fonte} onChange={e=>setFonte(e.target.value)} placeholder="Ex: Salário, freela, reembolso" autoFocus className={inputCls}/></Campo>
      <Campo rotulo="Valor"><InputValor value={valor} onChange={e=>setValor(e.target.value)}/></Campo>
    </ModalBase>
  );
}

// Com `edicao`, o mesmo formulário edita uma despesa existente: os campos vêm
// preenchidos e, numa compra com parcela paga, valor/vencimento/parcelas ficam travados.
function ModalDespesa({ categorias, onFechar, onSalvar, edicao }) {
  const [descricao,setDescricao]=useState(edicao?.descricao??""); const [valor,setValor]=useState(edicao?String(edicao.valor):""); const [categoriaId,setCategoriaId]=useState(edicao?.categoria_id??"");
  const [formaPagamento,setFormaPagamento]=useState(edicao?edicao.forma_pagamento:"pix");
  const [dataVencimento,setDataVencimento]=useState(edicao?.dataVencimento??hojeISO()); const [parcelas,setParcelas]=useState(edicao?.parcelas??1); const [salvando,setSalvando]=useState(false);
  const travaEstrutura=Boolean(edicao?.travaEstrutura); const travaParcelas=travaEstrutura||Boolean(edicao?.travaParcelas);
  // O campo é o valor total da compra; quem divide é adicionarDespesa.
  const valoresParcelas=dividirEmParcelas(valor,Math.max(1,parcelas));
  const valorParcela=valoresParcelas[0]; const ultimaParcela=valoresParcelas[valoresParcelas.length-1];
  const valido=descricao.trim()&&parseFloat(valor)>0;
  const submit=async()=>{if(!valido)return;setSalvando(true);await onSalvar({descricao:descricao.trim(),valor:parseFloat(valor),categoria_id:categoriaId,forma_pagamento:formaPagamento,dataVencimento,parcelas});};
  const resumoParcelas=parcelas>1&&parseFloat(valor)>0?`${parcelas}x de ${formatBRL(valorParcela)}${ultimaParcela!==valorParcela?` (última ${formatBRL(ultimaParcela)})`:""}`:null;
  return (
    <ModalBase titulo={edicao?"Editar despesa":"Nova despesa"} subtitulo={edicao?(edicao.emGrupo?`Compra em ${edicao.parcelas} parcelas`:"Corrija o que foi lançado errado"):"Lance um gasto pago ou a pagar"} icone={edicao?Pencil:Receipt} onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar={edicao?"Salvar alterações":"Salvar despesa"} salvando={salvando} desabilitado={!valido}/>}>
      {edicao?.emGrupo&&!travaEstrutura&&<Aviso icone={Repeat}>As alterações valem para todas as parcelas. O valor é o total da compra.</Aviso>}
      {travaEstrutura&&<Aviso tom="ambar" icone={AlertTriangle}>Há parcela paga nesta compra: valor, vencimento e parcelas não podem mudar. Para corrigir, apague e lance de novo.</Aviso>}
      <Campo rotulo="Descrição"><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Mercado, conta de luz" autoFocus={!edicao} className={inputCls}/></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo={parcelas>1?"Valor total":"Valor"}><InputValor value={valor} onChange={e=>setValor(e.target.value)} disabled={travaEstrutura}/></Campo>
        <Campo rotulo={parcelas>1?"1º vencimento":"Vencimento"}><input type="date" value={dataVencimento} onChange={e=>setDataVencimento(e.target.value)} disabled={travaEstrutura} className={inputCls}/></Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Categoria"><Selecao value={categoriaId} onChange={e=>setCategoriaId(e.target.value)}><option value="">Sem categoria</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Selecao></Campo>
        <Campo rotulo="Pagamento"><Selecao value={formaPagamento} onChange={e=>setFormaPagamento(e.target.value)}>{edicao&&<option value="">Não informada</option>}{FORMAS_PAGAMENTO.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</Selecao></Campo>
      </div>
      <Campo rotulo="Parcelas" dica={resumoParcelas||"1 = pagamento à vista"}><input type="number" inputMode="numeric" min="1" max="60" value={parcelas} onChange={e=>setParcelas(Math.max(1,parseInt(e.target.value)||1))} disabled={travaParcelas} className={inputCls+" font-mono-c num-tabular"}/></Campo>
      {formaPagamento==="cartao"&&dataVencimento&&<Aviso icone={CreditCard}>Entra na fatura de {nomeMes(dataVencimento.substring(0,7))}{parcelas>1?" e as parcelas seguintes nas próximas faturas":""}. Use a data de vencimento da fatura.</Aviso>}
    </ModalBase>
  );
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [valor,setValor]=useState(""); const [diaVencimento,setDiaVencimento]=useState("5"); const [salvando,setSalvando]=useState(false);
  const valido=nome.trim()&&parseFloat(valor)>0&&parseInt(diaVencimento)>=1&&parseInt(diaVencimento)<=31;
  const submit=async()=>{if(!valido)return;setSalvando(true);await onSalvar({nome:nome.trim(),valor:parseFloat(valor),dia_vencimento:parseInt(diaVencimento)});};
  return (
    <ModalBase titulo="Nova assinatura" subtitulo="Gera uma despesa todo mês, no dia escolhido" icone={Repeat} onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar="Salvar assinatura" salvando={salvando} desabilitado={!valido}/>}>
      <Campo rotulo="Nome"><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Streaming, academia" autoFocus className={inputCls}/></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor mensal"><InputValor value={valor} onChange={e=>setValor(e.target.value)}/></Campo>
        <Campo rotulo="Dia do vencimento"><input type="number" inputMode="numeric" min="1" max="31" value={diaVencimento} onChange={e=>setDiaVencimento(e.target.value)} className={inputCls+" font-mono-c num-tabular"}/></Campo>
      </div>
    </ModalBase>
  );
}

function ModalParcelamento({ categorias, onFechar, onSalvar }) {
  const [descricao,setDescricao]=useState(""); const [valorTotal,setValorTotal]=useState(""); const [parcelas,setParcelas]=useState(3); const [dataInicio,setDataInicio]=useState(hojeISO()); const [salvando,setSalvando]=useState(false);
  const [categoriaId,setCategoriaId]=useState(""); const [formaPagamento,setFormaPagamento]=useState("cartao");
  const valido=descricao.trim()&&parseFloat(valorTotal)>0&&parcelas>=2;
  const submit=async()=>{if(!valido)return;setSalvando(true);await onSalvar({descricao:descricao.trim(),valor_total:parseFloat(valorTotal),parcelas_total:parseInt(parcelas),categoria_id:categoriaId,forma_pagamento:formaPagamento,dataInicio});};
  const valores=dividirEmParcelas(valorTotal,Math.max(2,parcelas));
  return (
    <ModalBase titulo="Novo parcelamento" subtitulo="Acompanhe uma compra parcela por parcela" icone={Zap} onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar="Salvar parcelamento" salvando={salvando} desabilitado={!valido}/>}>
      <Campo rotulo="Descrição"><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Notebook, geladeira" autoFocus className={inputCls}/></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor total"><InputValor value={valorTotal} onChange={e=>setValorTotal(e.target.value)}/></Campo>
        <Campo rotulo="Parcelas" dica={parseFloat(valorTotal)>0?`${parcelas}x de ${formatBRL(valores[0])}`:null}><input type="number" inputMode="numeric" min="2" max="60" value={parcelas} onChange={e=>setParcelas(Math.max(2,parseInt(e.target.value)||2))} className={inputCls+" font-mono-c num-tabular"}/></Campo>
      </div>
      <Campo rotulo="1º vencimento"><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className={inputCls}/></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Categoria"><Selecao value={categoriaId} onChange={e=>setCategoriaId(e.target.value)}><option value="">Sem categoria</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Selecao></Campo>
        <Campo rotulo="Pagamento"><Selecao value={formaPagamento} onChange={e=>setFormaPagamento(e.target.value)}>{FORMAS_PAGAMENTO.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</Selecao></Campo>
      </div>
    </ModalBase>
  );
}

const CORES_CATEGORIA = ["#60a5fa", "#34d399", "#a78bfa", "#38bdf8", "#6ee7b7", "#fbbf24", "#f87171", "#f472b6"];

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [cor,setCor]=useState(CORES_CATEGORIA[0]); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!nome.trim())return;setSalvando(true);await onSalvar({nome:nome.trim(),cor,icone:"Tag"});};
  return (
    <ModalBase titulo="Nova categoria" subtitulo="Agrupe gastos e filtre por ela na aba Despesas" icone={Tag} onFechar={onFechar} onSubmit={submit}
      rodape={<Rodape onCancelar={onFechar} textoConfirmar="Salvar categoria" salvando={salvando} desabilitado={!nome.trim()}/>}>
      <Campo rotulo="Nome"><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Faculdade, pets" autoFocus className={inputCls}/></Campo>
      <div className="space-y-1.5">
        <span className="block font-body text-xs font-medium text-slate-300/80">Cor</span>
        <div className="flex gap-2.5 flex-wrap">{CORES_CATEGORIA.map(c=>(<button type="button" key={c} onClick={()=>setCor(c)} aria-label={`Cor ${c}`} className={`w-9 h-9 rounded-full transition-all ${cor===c?"ring-2 ring-offset-2 ring-offset-[#0d1829] ring-white/70 scale-105":"opacity-80 hover:opacity-100"}`} style={{background:c}}/>))}</div>
      </div>
      {nome.trim()&&<div className="flex items-center gap-2"><span className="font-body text-xs text-slate-400/60">Prévia:</span><span className="font-body text-xs px-2.5 py-1 rounded-full border" style={{color:cor,borderColor:cor+"55",background:cor+"14"}}>{nome.trim()}</span></div>}
    </ModalBase>
  );
}
