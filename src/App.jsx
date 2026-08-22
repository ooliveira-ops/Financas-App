import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Plus, Trash2, Wallet, X, TrendingUp, Repeat, Home, PieChart as PieIcon,
  Check, LogOut, Loader2, Clock, History, CheckCircle2, Bell, Zap,
  FileDown, Shield, BarChart2, RefreshCw, AlertTriangle,
} from "lucide-react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import { BotaoAjuda } from "./Ajuda";
import { ModalBase, ModalConfirmar, inputCls, selectCls, btnPrimary } from "./ModalBase";
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
      // Sem await: nada depende desta escrita, e aguardá-la custa um round-trip
      // antes do primeiro render.
      supabase.from("profiles").update({ ultimo_login: new Date().toISOString() }).eq("id", userId);

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
        const novas = CATEGORIAS_PADRAO.map(cat => ({ ...cat, user_id: userId, padrao: true }));
        const { data: criadas } = await supabase.from("categorias").insert(novas).select();
        setCategorias(criadas || []);
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

  const pedirConfirmacao = (mensagem, acao) => setConfirmacao({ mensagem, acao });

  const adicionarReceita = async (n) => {
    const { data, error } = await supabase.from("receitas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) setReceitas(prev => [...prev, data]);
  };
  const removerReceita = (id) => pedirConfirmacao("Apagar esta receita? Não dá para desfazer.", async () => {
    const { error } = await supabase.from("receitas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setReceitas(prev => prev.filter(r => r.id !== id));
  });

  const adicionarDespesa = async (n) => {
    const { parcelas, dataVencimento, valor, categoria_id, forma_pagamento, ...resto } = n;
    // Select vazio devolve string, e coluna UUID/CHECK não aceita "" — vira NULL.
    const vinculos = { categoria_id: categoria_id || null, forma_pagamento: forma_pagamento || null };
    // `valor` é o total da compra; a divisão em centavos exatos é feita aqui.
    const lista = dividirEmParcelas(valor, parcelas).map((valorParcela, i) => {
      const dataStr = somarMeses(dataVencimento, i);
      return {
        ...resto, ...vinculos, valor: valorParcela, user_id: userId, data: dataStr, data_vencimento: dataStr,
        status: "pendente",
        parcela_atual: parcelas > 1 ? i + 1 : null,
        parcelas_total: parcelas > 1 ? parcelas : null,
      };
    });
    const { data, error } = await supabase.from("despesas").insert(lista).select();
    if (error) return notificar("Não foi possível salvar a despesa: " + error.message);
    if (data) setDespesas(prev => [...prev, ...data]);
  };
  const removerDespesa = (id) => pedirConfirmacao("Apagar esta despesa? Não dá para desfazer.", async () => {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setDespesas(prev => prev.filter(d => d.id !== id));
  });
  const marcarComoPaga = async (id) => {
    const { data, error } = await supabase.from("despesas").update({ status: "paga", data_pagamento: hojeISO() }).eq("id", id).select().single();
    if (error) return notificar("Não foi possível marcar como paga: " + error.message);
    if (data) setDespesas(prev => prev.map(d => d.id === id ? data : d));
  };

  const adicionarAssinatura = async (n) => {
    const { data, error } = await supabase.from("assinaturas").insert({ ...n, user_id: userId }).select().single();
    if (error || !data) return notificar("Não foi possível salvar a assinatura: " + (error?.message || ""));
    setAssinaturas(prev => [...prev, data]);
    // A geração de despesas de assinatura é do cliente, não do banco: a do mês
    // corrente é criada aqui mesmo.
    const geradas = await gerarDespesasAssinaturas([data], despesas);
    if (geradas.length > 0) setDespesas(prev => mesclarPorId(prev, geradas));
  };
  const removerAssinatura = (id) => pedirConfirmacao("Apagar esta assinatura? As despesas já geradas continuam na lista.", async () => {
    const { error } = await supabase.from("assinaturas").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setAssinaturas(prev => prev.filter(a => a.id !== id));
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
    if (data) setParcelamentos(prev => [...prev, data]);
    await adicionarDespesa({
      descricao: n.descricao,
      valor: parseFloat(n.valor_total),
      categoria_id: n.categoria_id,
      forma_pagamento: n.forma_pagamento,
      dataVencimento: n.dataInicio,
      parcelas: parcelasTotal,
    });
    await recarregarDespesas();
  };
  const marcarParcelaComoPaga = async (id) => {
    const parc = parcelamentos.find(p => p.id === id);
    if (!parc || parc.parcelas_pagas >= parc.parcelas_total) return notificar("Todas as parcelas já foram pagas!", "info");
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
    }).eq("id", id).select().single();
    if (error) return notificar("Não foi possível atualizar o parcelamento: " + error.message);
    if (data) setParcelamentos(prev => prev.map(p => p.id === id ? data : p));
  };
  const removerParcelamento = (id) => pedirConfirmacao("Apagar este parcelamento? O histórico de parcelas pagas será perdido.", async () => {
    const { error } = await supabase.from("parcelamentos").delete().eq("id", id);
    if (error) return notificar("Não foi possível apagar: " + error.message);
    setParcelamentos(prev => prev.filter(p => p.id !== id));
  });
  const adicionarCategoria = async (n) => {
    const { data, error } = await supabase.from("categorias").insert({ ...n, user_id: userId, padrao: false }).select().single();
    if (error) return notificar("Não foi possível salvar a categoria: " + error.message);
    if (data) setCategorias(prev => [...prev, data]);
  };
  const removerCategoria = (id) => {
    if (despesas.some(d => d.categoria_id === id)) return notificar("Não é possível remover: existem despesas nesta categoria.");
    pedirConfirmacao("Apagar esta categoria?", async () => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) return notificar("Não foi possível apagar: " + error.message);
      setCategorias(prev => prev.filter(c => c.id !== id));
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
  // o que sobrou dos meses anteriores. Serve para acompanhar o mês em andamento.
  const temMovimentoNoMes = totalReceitasMes > 0 || totalDespesasPagasMes > 0;
  const saldoMes = temMovimentoNoMes ? totalReceitasMes - totalDespesasPagasMes : null;
  // "A PAGAR" GERAL: soma TODAS as despesas pendentes, de qualquer mês (não só do mês atual),
  // para nada "desaparecer" quando o mês virar. Na aba Despesas dá pra filtrar por mês específico.
  const totalPendentesGeral = useMemo(() => despesasPendentes.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPendentes]);
  const proximasAssinaturas = useMemo(() => { const hoje = new Date(); const diaH = hoje.getDate(); return [...assinaturas].map(a => { const dia = parseInt(a.dia_vencimento || 5); let dr = dia >= diaH ? dia - diaH : (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()) - diaH + dia; return { ...a, diasRestantes: dr }; }).sort((a, b) => a.diasRestantes - b.diasRestantes); }, [assinaturas]);
  const avisoDespesas = useMemo(() => { const hoje = new Date(); hoje.setHours(0,0,0,0); const limite = new Date(hoje); limite.setDate(limite.getDate() + 7); const vencidas = []; const vencendo = []; despesasPendentes.forEach(d => { if (!d.data_vencimento) return; const v = new Date(d.data_vencimento + "T00:00:00"); if (v < hoje) vencidas.push(d); else if (v <= limite) vencendo.push(d); }); return { vencidas, vencendo }; }, [despesasPendentes]);

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

      {notificacao && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp max-w-md px-4 py-3 rounded-xl border font-body text-sm ${notificacao.tipo === "info" ? "bg-[#0d1829] border-blue-500/30 text-blue-200" : "bg-[#0d1829] border-red-500/30 text-red-200"}`}>
          {notificacao.texto}
        </div>
      )}

      {confirmacao && (
        <ModalConfirmar
          mensagem={confirmacao.mensagem}
          onCancelar={() => setConfirmacao(null)}
          onConfirmar={async () => { const acao = confirmacao.acao; setConfirmacao(null); await acao(); }}
        />
      )}

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <div className="fixed top-4 right-4 z-30 animate-fadeInUp max-w-sm bg-[#0d1829]/95 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display italic text-slate-100 flex items-center gap-2"><Bell size={16} className="text-blue-400"/>Contas a pagar</h3>
            <button onClick={() => setAvisoFechado(true)} className="text-slate-400/60"><X size={14}/></button>
          </div>
          {avisoDespesas.vencidas.length > 0 && <p className="text-xs text-red-400 mb-1">🔴 {avisoDespesas.vencidas.length} vencida(s)</p>}
          {avisoDespesas.vencendo.length > 0 && <p className="text-xs text-sky-400">🟡 {avisoDespesas.vencendo.length} em até 7 dias</p>}
        </div>
      )}

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-blue-900/30">
        <div className="animate-fadeInUp">
          <div className="font-mono-c text-[10px] tracking-[0.3em] text-slate-400/60 uppercase">Finanças · {nomeMes(mesAtual())}</div>
          <h1 className="font-display text-2xl md:text-3xl italic text-slate-100 mt-1">
            olá, {userNome}
            {isAdmin && <span className="ml-2 text-xs font-body not-italic bg-blue-600/25 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full align-middle">admin</span>}
          </h1>
        </div>
        <button onClick={handleLogout} className="text-slate-400/60 hover:text-slate-200 transition flex items-center gap-2 font-body text-sm"><LogOut size={16}/>Sair</button>
      </header>

      <nav className="relative z-10 px-6 md:px-12 py-4 flex gap-1 overflow-x-auto border-b border-blue-900/30">
        {abas.map(t => { const Icon = t.icon; const ativo = aba === t.id; return (
          <button key={t.id} onClick={() => setAba(t.id)} className={`px-4 py-2 rounded-full font-body text-sm flex items-center gap-2 transition-all whitespace-nowrap ${ativo ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200 hover:bg-white/5"}`}>
            <Icon size={14}/>{t.label}
          </button>
        );})}
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        {aba === "home" && <HomeAba quote={quote} saldo={saldo} temReceitaNoMes={temReceitaNoMes} saldoMes={saldoMes} temMovimentoNoMes={temMovimentoNoMes} totalReceitasMes={totalReceitasMes} totalDespesasMes={totalDespesasMes} totalPendentesGeral={totalPendentesGeral} proximasAssinaturas={proximasAssinaturas} receitas={receitas} despesas={despesas} assinaturas={assinaturas} parcelamentos={parcelamentos} userNome={userNome} onAviso={notificar}/>}
        {aba === "despesas" && <DespesasAba despesasPendentes={despesasPendentes} despesasPagas={despesasPagas} categorias={categorias} onAdicionar={() => setModalDespesa(true)} onAdicionarParcelamento={() => setModalParcelamento(true)} onNovaCategoria={() => setModalCategoria(true)} onRemoverCategoria={removerCategoria} onRemover={removerDespesa} onMarcarPaga={marcarComoPaga}/>}
        {aba === "grafico" && (
          <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="text-blue-400/60 animate-spin" size={24}/></div>}>
            <GraficoAba despesas={despesas} receitas={receitas} assinaturas={assinaturas}/>
          </Suspense>
        )}
        {aba === "historico" && <HistoricoAba despesas={despesas} assinaturas={assinaturas} receitas={receitas} parcelamentos={parcelamentos} userNome={userNome} onAviso={notificar}/>}
        {aba === "parcelamentos" && <ParcelamentosAba parcelamentos={parcelamentos} categorias={categorias} onAdicionar={() => setModalParcelamento(true)} onRemover={removerParcelamento} onMarcarPaga={marcarParcelaComoPaga}/>}
        {aba === "receitas" && <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes} onAdicionar={() => setModalReceita(true)} onRemover={removerReceita}/>}
        {aba === "assinaturas" && <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes} onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura}/>}
        {aba === "usuarios" && isAdmin && <UsuariosAba onAviso={notificar}/>}
      </main>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async r => { await adicionarReceita(r); setModalReceita(false); }}/>}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async d => { await adicionarDespesa(d); setModalDespesa(false); }}/>}
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

// ── HISTÓRICO ────────────────────────────────────────────────────────────────────
function HistoricoAba({ despesas, assinaturas, receitas, parcelamentos, userNome, onAviso }) {
  const mesesComDespesas = useMemo(() => {
    const s = new Set();
    despesas.forEach(d => { if (d.status === "paga" && d.data_pagamento) s.add(d.data_pagamento.substring(0,7)); if (d.status !== "paga" && d.data_vencimento) s.add(d.data_vencimento.substring(0,7)); });
    return [...s].sort((a,b) => b.localeCompare(a));
  }, [despesas]);
  const [mesSelecionado, setMesSelecionado] = useState(mesesComDespesas[0] || mesAtual());
  // O estado inicial é lido uma única vez; sem este ajuste a seleção fica presa num
  // mês que deixou de existir na lista.
  useEffect(() => {
    if (mesesComDespesas.length > 0 && !mesesComDespesas.includes(mesSelecionado)) {
      setMesSelecionado(mesesComDespesas[0]);
    }
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
      <div className="flex gap-2 flex-wrap">
        {mesesComDespesas.length === 0 ? <p className="font-body text-slate-400/50 text-sm">Nenhum mês ainda.</p> : mesesComDespesas.map(m => (
          <button key={m} onClick={() => setMesSelecionado(m)} className={`px-4 py-2 rounded-full font-body text-sm transition-all ${mesSelecionado===m?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>{nomeMes(m)}</button>
        ))}
      </div>
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
function HomeAba({ quote, saldo, temReceitaNoMes, saldoMes, temMovimentoNoMes, totalReceitasMes, totalDespesasMes, totalPendentesGeral, proximasAssinaturas, receitas, despesas, assinaturas, parcelamentos, userNome, onAviso }) {
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
        [`Saldo do mês (${mesRef})`, temMovimentoNoMes?formatBRL(saldoMes):"Sem movimento no mês"],
        [`A pagar (${mesRef})`, formatBRL(totalPendentesDoMes)],
        ["A pagar (todos os meses)", formatBRL(totalPendentesGeral)],
        ["Saldo acumulado (todo o histórico)", temReceitaNoMes?formatBRL(saldo):"Sem receita cadastrada"],
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
      {/* Escopos diferentes no mesmo grid: os três primeiros são do mês, os dois últimos são acumulados. */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CardResumo label="Receitas" escopo="este mês" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-400" delay={2}/>
        <CardResumo label="Pago" escopo="este mês" valor={totalDespesasMes} icon={CheckCircle2} cor="text-red-400" delay={3}/>
        <CardSaldo label="Saldo do mês" escopo="receitas − despesas pagas deste mês" saldo={saldoMes} temReceita={temMovimentoNoMes} delay={3}/>
        <CardResumo label="A pagar" escopo="todos os meses" valor={totalPendentesGeral} icon={Clock} cor="text-sky-400" delay={4}/>
        <CardSaldo label="Saldo acumulado" escopo="receitas − despesas pagas, todo o histórico" saldo={saldo} temReceita={temReceitaNoMes} delay={4}/>
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
function CardSaldo({ label, escopo, saldo, temReceita, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border bg-[#0d1829] border-blue-500/30`}>
      <div className="flex items-center justify-between mb-3"><span className="font-mono-c text-[10px] text-slate-400/50 uppercase">{label}</span><Wallet size={16} className="text-blue-400"/></div>
      {temReceita?<div className={`font-mono-c num-tabular text-2xl font-bold not-italic ${saldo>=0?"text-emerald-400":"text-red-400"}`}>{formatBRL(saldo)}</div>:<div className="font-mono-c text-xl font-bold text-slate-400/40">—</div>}
      <p className="font-body text-[10px] text-slate-400/40 mt-1">{temReceita ? escopo : "Cadastre receitas"}</p>
    </div>
  );
}

// ── DESPESAS ──────────────────────────────────────────────────────────────────────
function DespesasAba({ despesasPendentes, despesasPagas, categorias, onAdicionar, onAdicionarParcelamento, onNovaCategoria, onRemoverCategoria, onRemover, onMarcarPaga }) {
  const [subAba, setSubAba] = useState("pendentes");
  // "todos" mostra despesas de qualquer mês (inclusive as que ficaram para trás).
  // Selecionando um mês específico, filtra só aquele período.
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const nomeCategoria = (id) => categorias.find(c => c.id === id)?.nome;
  const corCategoria = (id) => categorias.find(c => c.id === id)?.cor || "#60a5fa";

  // Lista de meses que têm alguma despesa (pendente ou paga), do mais recente pro mais antigo
  const mesesDisponiveis = useMemo(() => {
    const s = new Set();
    despesasPendentes.forEach(d => { const dr = d.data_vencimento || d.data; if (dr) s.add(dr.substring(0, 7)); });
    despesasPagas.forEach(d => { if (d.data_pagamento) s.add(d.data_pagamento.substring(0, 7)); });
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [despesasPendentes, despesasPagas]);

  const listaBase = subAba === "pendentes" ? despesasPendentes : despesasPagas;
  const lista = useMemo(() => {
    return listaBase.filter(d => {
      const casaCategoria = categoriaFiltro === "todas"
        || (categoriaFiltro === "sem" ? !d.categoria_id : d.categoria_id === categoriaFiltro);
      if (!casaCategoria) return false;
      if (mesFiltro === "todos") return true;
      const ref = subAba === "pendentes" ? (d.data_vencimento || d.data) : d.data_pagamento;
      return ref && ref.startsWith(mesFiltro);
    });
  }, [listaBase, mesFiltro, categoriaFiltro, subAba]);

  const total = useMemo(() => lista.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [lista]);

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

      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>setMesFiltro("todos")} className={`px-4 py-2 rounded-full font-body text-sm transition-all ${mesFiltro==="todos"?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>Todos os meses</button>
        {mesesDisponiveis.map(m => (
          <button key={m} onClick={()=>setMesFiltro(m)} className={`px-4 py-2 rounded-full font-body text-sm transition-all ${mesFiltro===m?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>{nomeMes(m)}</button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="font-mono-c text-[10px] text-slate-400/50 uppercase mr-1">Categorias</span>
        <button onClick={()=>setCategoriaFiltro("todas")} className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${categoriaFiltro==="todas"?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>Todas</button>
        {categorias.map(c => (
          <span key={c.id} className={`group inline-flex items-center rounded-full transition-all ${categoriaFiltro===c.id?"bg-blue-600":"bg-white/5 border border-blue-900/30"}`}>
            <button onClick={()=>setCategoriaFiltro(c.id)} className={`pl-3 pr-2 py-1.5 font-body text-xs flex items-center gap-2 ${categoriaFiltro===c.id?"text-white":"text-slate-300"}`}>
              <span className="w-2 h-2 rounded-full" style={{background:c.cor}}/>{c.nome}
            </button>
            <button onClick={()=>onRemoverCategoria(c.id)} className="pr-2.5 text-slate-400/0 group-hover:text-slate-400/60 hover:!text-red-400 transition-colors"><X size={11}/></button>
          </span>
        ))}
        <button onClick={()=>setCategoriaFiltro("sem")} className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${categoriaFiltro==="sem"?"bg-blue-600 text-white":"bg-white/5 text-slate-400/70 hover:bg-white/10 border border-blue-900/30"}`}>Sem categoria</button>
        <button onClick={onNovaCategoria} className="px-3 py-1.5 rounded-full font-body text-xs bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-all flex items-center gap-1"><Plus size={11}/>Categoria</button>
      </div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {lista.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">{subAba==="pendentes"?"Sem despesas pendentes ✨":"Sem histórico"}</p></div>:(
          <div className="divide-y divide-blue-900/20">
            {[...lista].sort((a,b)=>(b.data_vencimento||b.data||"").localeCompare(a.data_vencimento||a.data||"")).map(d=>(
              <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] group">
                <div className="flex-1">
                  <div className="font-body text-slate-200">{d.descricao}{rotuloParcela(d)}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-mono-c text-[10px] text-slate-400/50">{formatarDataBR(d.data_vencimento||d.data)}</span>
                    {nomeCategoria(d.categoria_id) && <span className="font-body text-[10px] px-2 py-0.5 rounded-full border" style={{color:corCategoria(d.categoria_id),borderColor:corCategoria(d.categoria_id)+"55",background:corCategoria(d.categoria_id)+"14"}}>{nomeCategoria(d.categoria_id)}</span>}
                    {rotuloForma(d.forma_pagamento) && <span className="font-body text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-blue-900/30 text-slate-400/70">{rotuloForma(d.forma_pagamento)}</span>}
                  </div>
                </div>
                <div className="font-mono-c num-tabular text-slate-300">{formatBRL(d.valor)}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {subAba==="pendentes"&&<button onClick={()=>onMarcarPaga(d.id)} className="p-1 text-emerald-400/70 hover:text-emerald-400"><Check size={14}/></button>}
                  <button onClick={()=>onRemover(d.id)} className="p-1 text-slate-400/30 hover:text-red-400"><Trash2 size={14}/></button>
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
function ParcelamentosAba({ parcelamentos, categorias, onAdicionar, onRemover, onMarcarPaga }) {
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
            {parcelamentos.map(p=>{const pct=(p.parcelas_pagas/p.parcelas_total)*100;const vp=p.valor_total/p.parcelas_total;return(
              <div key={p.id} className="p-6 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between mb-4"><div><h3 className="font-body text-lg text-slate-100">{p.descricao}</h3><p className="font-mono-c text-[10px] text-slate-400/50 mt-1">Próx: {formatarDataBR(p.proxima_parcela_data)}</p></div><button onClick={()=>onRemover(p.id)} className="text-slate-400/30 hover:text-red-400"><Trash2 size={14}/></button></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">VALOR TOTAL</p><p className="font-mono-c num-tabular text-sky-300">{formatBRL(p.valor_total)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">JÁ PAGO</p><p className="font-mono-c num-tabular text-emerald-400">{formatBRL(p.valor_pago||0)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">POR PARCELA</p><p className="font-mono-c num-tabular text-slate-300">{formatBRL(vp)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">PROGRESSO</p><p className="font-mono-c num-tabular text-slate-300">{p.parcelas_pagas}/{p.parcelas_total}</p></div>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-2 mb-3 overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{width:`${pct}%`}}/></div>
                {p.parcelas_pagas<p.parcelas_total&&<button onClick={()=>onMarcarPaga(p.id)} className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 py-2 rounded-xl font-body text-sm hover:bg-emerald-500/25 transition flex items-center justify-center gap-2"><Check size={14}/>Marcar próxima como paga</button>}
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
              <button onClick={()=>onRemover(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-400/30 hover:text-red-400 transition-opacity"><Trash2 size={14}/></button>
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
              <button onClick={()=>onRemover(a.id)} className="opacity-0 group-hover:opacity-100 text-slate-400/30 hover:text-red-400 transition-opacity"><Trash2 size={14}/></button>
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
  const submit=async()=>{if(!fonte||!valor)return;setSalvando(true);await onSalvar({fonte,valor:parseFloat(valor),mes:mesAtual()});};
  return <ModalBase titulo="Nova receita" onFechar={onFechar}><input type="text" value={fonte} onChange={e=>setFonte(e.target.value)} placeholder="Ex: Salário..." className={inputCls}/><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao,setDescricao]=useState(""); const [valor,setValor]=useState(""); const [categoriaId,setCategoriaId]=useState("");
  const [formaPagamento,setFormaPagamento]=useState("pix");
  const [dataVencimento,setDataVencimento]=useState(hojeISO()); const [parcelas,setParcelas]=useState(1); const [salvando,setSalvando]=useState(false);
  // O campo é o valor total da compra; quem divide é adicionarDespesa.
  const valoresParcelas=dividirEmParcelas(valor,Math.max(1,parcelas));
  const valorParcela=valoresParcelas[0]; const ultimaParcela=valoresParcelas[valoresParcelas.length-1];
  const submit=async()=>{if(!descricao||!valor)return;setSalvando(true);await onSalvar({descricao,valor:parseFloat(valor),categoria_id:categoriaId,forma_pagamento:formaPagamento,dataVencimento,parcelas});};
  return <ModalBase titulo="Nova despesa" onFechar={onFechar}><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Almoço" className={inputCls}/><div className="grid grid-cols-2 gap-3"><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><input type="date" value={dataVencimento} onChange={e=>setDataVencimento(e.target.value)} className={inputCls}/></div><div className="grid grid-cols-2 gap-3"><select value={categoriaId} onChange={e=>setCategoriaId(e.target.value)} className={selectCls}><option value="">Sem categoria</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><select value={formaPagamento} onChange={e=>setFormaPagamento(e.target.value)} className={selectCls}>{FORMAS_PAGAMENTO.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div><input type="number" min="1" max="60" value={parcelas} onChange={e=>setParcelas(Math.max(1,parseInt(e.target.value)||1))} placeholder="Parcelas" className={inputCls}/>{parcelas>1&&<p className="font-mono-c text-xs text-sky-400">{parcelas}x de {formatBRL(valorParcela)}{ultimaParcela!==valorParcela?` (última: ${formatBRL(ultimaParcela)})`:""}</p>}<button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [valor,setValor]=useState(""); const [diaVencimento,setDiaVencimento]=useState("5"); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!nome||!valor)return;setSalvando(true);await onSalvar({nome,valor:parseFloat(valor),dia_vencimento:parseInt(diaVencimento)});};
  return <ModalBase titulo="Nova assinatura" onFechar={onFechar}><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Netflix" className={inputCls}/><div className="grid grid-cols-2 gap-3"><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><input type="number" min="1" max="31" value={diaVencimento} onChange={e=>setDiaVencimento(e.target.value)} placeholder="Dia venc." className={inputCls}/></div><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalParcelamento({ categorias, onFechar, onSalvar }) {
  const [descricao,setDescricao]=useState(""); const [valorTotal,setValorTotal]=useState(""); const [parcelas,setParcelas]=useState(3); const [dataInicio,setDataInicio]=useState(hojeISO()); const [salvando,setSalvando]=useState(false);
  const [categoriaId,setCategoriaId]=useState(""); const [formaPagamento,setFormaPagamento]=useState("cartao");
  const submit=async()=>{if(!descricao||!valorTotal)return;setSalvando(true);await onSalvar({descricao,valor_total:parseFloat(valorTotal),parcelas_total:parseInt(parcelas),categoria_id:categoriaId,forma_pagamento:formaPagamento,dataInicio});};
  return <ModalBase titulo="Novo parcelamento" onFechar={onFechar}><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Monitor" className={inputCls}/><input type="number" step="0.01" value={valorTotal} onChange={e=>setValorTotal(e.target.value)} placeholder="Valor total" className={inputCls}/><input type="number" min="2" value={parcelas} onChange={e=>setParcelas(parseInt(e.target.value)||2)} placeholder="Nº de parcelas" className={inputCls}/><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className={inputCls}/><div className="grid grid-cols-2 gap-3"><select value={categoriaId} onChange={e=>setCategoriaId(e.target.value)} className={selectCls}><option value="">Sem categoria</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><select value={formaPagamento} onChange={e=>setFormaPagamento(e.target.value)} className={selectCls}>{FORMAS_PAGAMENTO.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

const CORES_CATEGORIA = ["#60a5fa", "#34d399", "#a78bfa", "#38bdf8", "#6ee7b7", "#fbbf24", "#f87171", "#f472b6"];

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [cor,setCor]=useState(CORES_CATEGORIA[0]); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!nome)return;setSalvando(true);await onSalvar({nome,cor,icone:"Tag"});};
  return <ModalBase titulo="Nova categoria" onFechar={onFechar}><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Faculdade" className={inputCls}/><div className="flex gap-2 flex-wrap">{CORES_CATEGORIA.map(c=>(<button key={c} onClick={()=>setCor(c)} className={`w-8 h-8 rounded-full transition-all ${cor===c?"ring-2 ring-offset-2 ring-offset-[#0d1829] ring-white/70":""}`} style={{background:c}}/>))}</div><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}
