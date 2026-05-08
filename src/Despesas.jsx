import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Check, History, Calendar, DollarSign,
  FileText, Layers, X, FastForward, Loader2, AlertCircle,
  TrendingDown, Clock, CheckCircle2, Tag
} from "lucide-react";
import { supabase } from "./supabase";

// =============================================================
// COMPONENTE DESPESAS - Adaptado para a estrutura real:
// - despesas: id (uuid), user_id, categoria_id, descricao, valor,
//             data, status, data_vencimento, data_pagamento,
//             parcela_atual, parcelas_total, grupo_parcelamento
// - categorias: id (uuid), user_id, nome, cor, icone, padrao
// =============================================================
export default function Despesas({ usuario }) {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState("pendentes");
  const [modalNova, setModalNova] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalAdiantar, setModalAdiantar] = useState(null);

  const carregarTudo = async () => {
    setCarregando(true);
    const [respDesp, respCats] = await Promise.all([
      supabase.from("despesas")
        .select("*")
        .eq("user_id", usuario.id)
        .order("data_vencimento", { ascending: true }),
      supabase.from("categorias")
        .select("*")
        .eq("user_id", usuario.id)
        .order("nome", { ascending: true }),
    ]);
    if (!respDesp.error && respDesp.data) setDespesas(respDesp.data);
    if (!respCats.error && respCats.data) setCategorias(respCats.data);
    setCarregando(false);
  };

  useEffect(() => { carregarTudo(); }, [usuario.id]);

  const pendentes = useMemo(
    () => despesas.filter((d) => d.status === "pendente"),
    [despesas]
  );
  const pagas = useMemo(
    () => despesas.filter((d) => d.status === "paga"),
    [despesas]
  );

  const totalPagoMesAtual = useMemo(() => {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    return pagas
      .filter((d) => {
        if (!d.data_pagamento) return false;
        const [a, m] = d.data_pagamento.split("-");
        return parseInt(a) === ano && parseInt(m) - 1 === mes;
      })
      .reduce((s, d) => s + Number(d.valor), 0);
  }, [pagas]);

  const totalPendente = pendentes.reduce((s, d) => s + Number(d.valor), 0);

  const marcarComoPaga = async (id) => {
    const hoje = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("despesas")
      .update({ status: "paga", data_pagamento: hoje })
      .eq("id", id);
    if (!error) carregarTudo();
  };

  const marcarMultiplasComoPagas = async (ids) => {
    const hoje = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("despesas")
      .update({ status: "paga", data_pagamento: hoje })
      .in("id", ids);
    if (!error) {
      carregarTudo();
      setModalAdiantar(null);
    }
  };

  const deletarDespesa = async (id) => {
    if (!confirm("Tem certeza que deseja apagar esta despesa?")) return;
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (!error) carregarTudo();
  };

  const parcelasPendentesDoGrupo = (grupoId) => {
    if (!grupoId) return [];
    return pendentes.filter((d) => d.grupo_parcelamento === grupoId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-7 h-7 text-rose-400" />
              Despesas
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Gerencie suas despesas, parcelamentos e categorias
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalCategoria(true)}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-medium px-3 py-2.5 rounded-lg transition border border-slate-500"
            >
              <Tag className="w-4 h-4" />
              Categorias
            </button>
            <button
              onClick={() => setModalNova(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-5 h-5" />
              Nova despesa
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ResumoCard icone={<Clock className="w-5 h-5" />} titulo="Pendentes"
            valor={totalPendente} cor="rose" quantidade={pendentes.length} />
          <ResumoCard icone={<CheckCircle2 className="w-5 h-5" />} titulo="Pago este mês"
            valor={totalPagoMesAtual} cor="emerald"
            quantidade={pagas.filter((d) => {
              if (!d.data_pagamento) return false;
              const hoje = new Date();
              const [a, m] = d.data_pagamento.split("-");
              return parseInt(a) === hoje.getFullYear() &&
                     parseInt(m) - 1 === hoje.getMonth();
            }).length} />
          <ResumoCard icone={<History className="w-5 h-5" />} titulo="Total no histórico"
            valor={pagas.reduce((s, d) => s + Number(d.valor), 0)}
            cor="indigo" quantidade={pagas.length} />
        </div>

        <div className="flex gap-1 mb-4 bg-slate-900/40 p-1 rounded-lg w-fit">
          <BotaoAba ativa={aba === "pendentes"} onClick={() => setAba("pendentes")}
            icone={<Clock className="w-4 h-4" />} label="Pendentes" badge={pendentes.length} />
          <BotaoAba ativa={aba === "pagas"} onClick={() => setAba("pagas")}
            icone={<History className="w-4 h-4" />} label="Histórico" badge={pagas.length} />
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : aba === "pendentes" ? (
          <ListaDespesas despesas={pendentes} categorias={categorias} tipo="pendente"
            onMarcarPaga={marcarComoPaga} onDeletar={deletarDespesa}
            onAdiantar={(g) => setModalAdiantar(g)}
            parcelasPendentesDoGrupo={parcelasPendentesDoGrupo} />
        ) : (
          <ListaDespesas despesas={pagas} categorias={categorias} tipo="paga"
            onDeletar={deletarDespesa} />
        )}
      </div>

      {modalNova && (
        <ModalNovaDespesa usuarioId={usuario.id} categorias={categorias}
          onFechar={() => setModalNova(false)}
          onSucesso={() => { setModalNova(false); carregarTudo(); }} />
      )}
      {modalCategoria && (
        <ModalCategorias usuarioId={usuario.id} categorias={categorias}
          onFechar={() => setModalCategoria(false)} onAtualizar={carregarTudo} />
      )}
      {modalAdiantar && (
        <ModalAdiantarParcelas
          parcelas={parcelasPendentesDoGrupo(modalAdiantar)}
          onFechar={() => setModalAdiantar(null)}
          onConfirmar={marcarMultiplasComoPagas} />
      )}
    </div>
  );
}

function ResumoCard({ icone, titulo, valor, cor, quantidade }) {
  const paletas = {
    rose: { bg: "from-rose-500/15 to-rose-500/5", border: "border-rose-500/30",
            text: "text-rose-200", icon: "text-rose-400", valor: "text-rose-400" },
    emerald: { bg: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/30",
               text: "text-emerald-200", icon: "text-emerald-400", valor: "text-emerald-400" },
    indigo: { bg: "from-indigo-500/15 to-indigo-500/5", border: "border-indigo-500/30",
              text: "text-indigo-200", icon: "text-indigo-400", valor: "text-indigo-400" },
  };
  const c = paletas[cor];
  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl p-5 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${c.text} text-sm font-medium`}>
          <span className={c.icon}>{icone}</span>
          {titulo}
        </div>
        <span className="text-xs bg-slate-900/50 text-slate-300 px-2 py-0.5 rounded-full">
          {quantidade} {quantidade === 1 ? "item" : "itens"}
        </span>
      </div>
      <div className={`text-3xl font-bold ${c.valor} tabular-nums not-italic`}>
        {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
    </div>
  );
}

function BotaoAba({ ativa, onClick, icone, label, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
        ativa ? "bg-slate-700 text-white shadow-md" : "text-slate-400 hover:text-white"
      }`}>
      {icone} {label}
      {badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums not-italic ${
          ativa ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function ListaDespesas({ despesas, categorias, tipo, onMarcarPaga, onDeletar, onAdiantar, parcelasPendentesDoGrupo }) {
  if (despesas.length === 0) {
    return (
      <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-300">
          {tipo === "pendente" ? "Nenhuma despesa pendente — você está em dia! 🎉" : "Nenhuma despesa paga ainda."}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {despesas.map((d) => (
        <CardDespesa key={d.id} despesa={d} categorias={categorias} tipo={tipo}
          onMarcarPaga={onMarcarPaga} onDeletar={onDeletar} onAdiantar={onAdiantar}
          parcelasPendentesDoGrupo={parcelasPendentesDoGrupo} />
      ))}
    </div>
  );
}

function CardDespesa({ despesa, categorias, tipo, onMarcarPaga, onDeletar, onAdiantar, parcelasPendentesDoGrupo }) {
  const ehParcelada = despesa.parcelas_total && despesa.parcelas_total > 1;
  const podeAdiantar = ehParcelada && tipo === "pendente" &&
    despesa.grupo_parcelamento && parcelasPendentesDoGrupo &&
    parcelasPendentesDoGrupo(despesa.grupo_parcelamento).length > 1;

  const categoria = categorias.find((c) => c.id === despesa.categoria_id);

  const formatarData = (data) => {
    if (!data) return "—";
    const [a, m, d] = data.split("-");
    return `${d}/${m}/${a}`;
  };

  const corVencimento = () => {
    if (tipo !== "pendente" || !despesa.data_vencimento) return "text-slate-300";
    const venc = new Date(despesa.data_vencimento + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.floor((venc - hoje) / 86400000);
    if (dias < 0) return "text-rose-400 font-semibold";
    if (dias <= 3) return "text-amber-400 font-semibold";
    return "text-slate-300";
  };

  return (
    <div className="bg-slate-700/60 hover:bg-slate-700/80 border border-slate-600/60 rounded-xl p-4 transition shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-white font-semibold text-base truncate">{despesa.descricao}</h3>
            {ehParcelada && (
              <span className="bg-indigo-500/20 text-indigo-200 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1 tabular-nums not-italic">
                <Layers className="w-3 h-3" />
                {despesa.parcela_atual}/{despesa.parcelas_total}
              </span>
            )}
            {categoria && (
              <span className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1"
                style={{ backgroundColor: (categoria.cor || "#64748b") + "33",
                         borderColor: (categoria.cor || "#64748b") + "55",
                         color: categoria.cor || "#cbd5e1" }}>
                {categoria.icone && <span>{categoria.icone}</span>}
                {categoria.nome}
              </span>
            )}
            {tipo === "paga" && (
              <span className="bg-emerald-500/20 text-emerald-200 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> Paga
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            {tipo === "pendente" && despesa.data_vencimento && (
              <span className={`flex items-center gap-1 ${corVencimento()} tabular-nums not-italic`}>
                <Calendar className="w-3.5 h-3.5" />
                Vence: {formatarData(despesa.data_vencimento)}
              </span>
            )}
            {tipo === "paga" && despesa.data_pagamento && (
              <span className="flex items-center gap-1 text-slate-300 tabular-nums not-italic">
                <Check className="w-3.5 h-3.5" />
                Paga em: {formatarData(despesa.data_pagamento)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-lg font-bold tabular-nums not-italic ${
            tipo === "pendente" ? "text-rose-400" : "text-emerald-400"
          }`}>
            {Number(despesa.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          <div className="flex items-center gap-1">
            {tipo === "pendente" && (
              <>
                <button onClick={() => onMarcarPaga(despesa.id)} title="Marcar como paga"
                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition border border-emerald-500/30">
                  <Check className="w-4 h-4" />
                </button>
                {podeAdiantar && (
                  <button onClick={() => onAdiantar(despesa.grupo_parcelamento)} title="Adiantar parcelas"
                    className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition border border-indigo-500/30">
                    <FastForward className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <button onClick={() => onDeletar(despesa.id)} title="Apagar"
              className="p-2 bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition border border-slate-600 hover:border-rose-500/30">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalNovaDespesa({ usuarioId, categorias, onFechar, onSucesso }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [parcelas, setParcelas] = useState(1);
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const valorNum = parseFloat(valor) || 0;
  const valorParcela = parcelas > 0 ? valorNum / parcelas : 0;

  const salvar = async () => {
    setErro(null);
    if (!descricao.trim() || !valor || !dataVencimento)
      return setErro("Preencha todos os campos obrigatórios");
    if (valorNum <= 0) return setErro("Valor deve ser maior que zero");
    if (parcelas < 1 || parcelas > 60) return setErro("Parcelas: 1 a 60");

    setSalvando(true);
    const grupoId = parcelas > 1 ? crypto.randomUUID() : null;
    const lista = [];
    const dataBase = new Date(dataVencimento + "T12:00:00");

    for (let i = 0; i < parcelas; i++) {
      const dt = new Date(dataBase);
      dt.setMonth(dt.getMonth() + i);
      const dataStr = dt.toISOString().split("T")[0];
      lista.push({
        user_id: usuarioId,
        descricao: descricao.trim(),
        valor: valorParcela,
        data: dataStr,
        data_vencimento: dataStr,
        status: "pendente",
        parcela_atual: parcelas > 1 ? i + 1 : null,
        parcelas_total: parcelas > 1 ? parcelas : null,
        grupo_parcelamento: grupoId,
        categoria_id: categoriaId || null,
      });
    }

    const { error } = await supabase.from("despesas").insert(lista);
    setSalvando(false);
    if (error) setErro("Erro ao salvar: " + error.message);
    else onSucesso();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-700 rounded-2xl shadow-2xl border border-slate-600 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Nova despesa
          </h2>
          <button onClick={onFechar} className="text-slate-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Campo icone={<FileText className="w-5 h-5" />} label="Descrição">
            <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Monitor 27 polegadas"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </Campo>

          <Campo icone={<DollarSign className="w-5 h-5" />} label="Valor total (R$)">
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums not-italic" />
          </Campo>

          <Campo icone={<Calendar className="w-5 h-5" />}
            label={`Data de vencimento${parcelas > 1 ? " (1ª parcela)" : ""}`}>
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </Campo>

          <Campo icone={<Tag className="w-5 h-5" />} label="Categoria">
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Sem categoria —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icone ? `${c.icone} ` : ""}{c.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo icone={<Layers className="w-5 h-5" />} label="Parcelas">
            <input type="number" min="1" max="60" value={parcelas}
              onChange={(e) => setParcelas(parseInt(e.target.value) || 1)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums not-italic" />
            {parcelas > 1 && valorNum > 0 && (
              <p className="text-xs text-indigo-300 mt-1.5 ml-1 tabular-nums not-italic">
                {parcelas}x de <span className="font-bold">
                  {valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </p>
            )}
          </Campo>

          {erro && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm p-3 rounded-lg">
              {erro}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onFechar}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-slate-200 rounded-lg font-medium transition border border-slate-600">
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ icone, label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-200 mb-1.5 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-300">{icone}</span>
        {children}
      </div>
    </div>
  );
}

function ModalCategorias({ usuarioId, categorias, onFechar, onAtualizar }) {
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [cor, setCor] = useState("#10b981");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const adicionarCategoria = async () => {
    setErro(null);
    if (!nome.trim()) return setErro("Digite o nome da categoria");
    setSalvando(true);
    const { error } = await supabase.from("categorias").insert({
      user_id: usuarioId,
      nome: nome.trim(),
      icone: icone.trim() || null,
      cor: cor || null,
    });
    setSalvando(false);
    if (error) setErro("Erro: " + error.message);
    else { setNome(""); setIcone(""); onAtualizar(); }
  };

  const apagarCategoria = async (id) => {
    if (!confirm("Apagar esta categoria? As despesas vinculadas ficarão sem categoria.")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (!error) onAtualizar();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-700 rounded-2xl shadow-2xl border border-slate-600 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" /> Categorias
          </h2>
          <button onClick={onFechar} className="text-slate-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 mb-4 space-y-3">
          <p className="text-sm text-slate-200 font-medium">Adicionar nova categoria</p>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (ex: Alimentação)"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          <div className="flex gap-2">
            <input type="text" value={icone} onChange={(e) => setIcone(e.target.value)}
              placeholder="🍔" maxLength={2}
              className="w-16 px-2 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
              className="w-12 h-10 bg-slate-800 border border-slate-600 rounded-lg cursor-pointer" />
            <button onClick={adicionarCategoria} disabled={salvando}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </button>
          </div>
          {erro && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs p-2 rounded">
              {erro}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-300 font-medium mb-2">
            Suas categorias ({categorias.length})
          </p>
          {categorias.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Você ainda não tem categorias.
            </p>
          ) : (
            categorias.map((c) => (
              <div key={c.id}
                className="flex items-center justify-between bg-slate-800/40 border border-slate-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.cor || "#64748b" }} />
                  <span className="text-white text-sm">
                    {c.icone && <span className="mr-1">{c.icone}</span>}
                    {c.nome}
                  </span>
                </div>
                <button onClick={() => apagarCategoria(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition"
                  title="Apagar categoria">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button onClick={onFechar}
          className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-slate-200 rounded-lg font-medium transition border border-slate-600">
          Fechar
        </button>
      </div>
    </div>
  );
}

function ModalAdiantarParcelas({ parcelas, onFechar, onConfirmar }) {
  const [selecionadas, setSelecionadas] = useState(new Set());

  const toggle = (id) => {
    const nova = new Set(selecionadas);
    if (nova.has(id)) nova.delete(id); else nova.add(id);
    setSelecionadas(nova);
  };

  const total = parcelas
    .filter((p) => selecionadas.has(p.id))
    .reduce((s, p) => s + Number(p.valor), 0);

  const formatarData = (data) => {
    if (!data) return "—";
    const [a, m, d] = data.split("-");
    return `${d}/${m}/${a}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-700 rounded-2xl shadow-2xl border border-slate-600 max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FastForward className="w-5 h-5 text-indigo-400" /> Adiantar parcelas
          </h2>
          <button onClick={onFechar} className="text-slate-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-200 mb-4">
          Selecione quais parcelas quer marcar como pagas:
        </p>

        <div className="space-y-2 mb-4">
          {parcelas.map((p) => {
            const checked = selecionadas.has(p.id);
            return (
              <label key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  checked ? "bg-indigo-500/20 border-indigo-500/50"
                          : "bg-slate-800/40 border-slate-600 hover:bg-slate-800/70"
                }`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id)}
                  className="w-4 h-4 accent-indigo-500" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-medium tabular-nums not-italic">
                      Parcela {p.parcela_atual}/{p.parcelas_total}
                    </div>
                    <div className="text-xs text-slate-300 tabular-nums not-italic">
                      Vence: {formatarData(p.data_vencimento)}
                    </div>
                  </div>
                  <span className="text-rose-400 font-bold tabular-nums not-italic">
                    {Number(p.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {selecionadas.size > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-200">Total a marcar como pago:</span>
              <span className="text-indigo-300 font-bold tabular-nums not-italic">
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onFechar}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-slate-200 rounded-lg font-medium transition border border-slate-600">
            Cancelar
          </button>
          <button onClick={() => onConfirmar(Array.from(selecionadas))}
            disabled={selecionadas.size === 0}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition">
            Confirmar ({selecionadas.size})
          </button>
        </div>
      </div>
    </div>
  );
}
