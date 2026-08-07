import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BotaoAjuda } from "./Ajuda";
import { formatBRL, nomeMesAbrev, ultimosMeses, mesAtual } from "./utils";


export default function GraficoAba({ despesas, receitas, assinaturas }) {
  const dadosPorMes = useMemo(() => {
    const meses = ultimosMeses(6);
    // O valor de assinaturas de cada mês vem das despesas que elas geraram (mesmo nome,
    // sem parcela), e não do total atual — só assim os meses anteriores têm histórico.
    const nomesAssinaturas = new Set(assinaturas.map(a => a.nome));
    return meses.map(m => {
      const pagas = despesas.filter(d => d.status === "paga" && d.data_pagamento?.startsWith(m)).reduce((s, d) => s + parseFloat(d.valor || 0), 0);
      const pendentes = despesas.filter(d => (d.status === "pendente" || !d.status) && (d.data_vencimento || d.data)?.startsWith(m)).reduce((s, d) => s + parseFloat(d.valor || 0), 0);
      const rec = receitas.filter(r => (r.mes || mesAtual()) === m).reduce((s, r) => s + parseFloat(r.valor || 0), 0);
      const assin = despesas
        .filter(d => d.parcela_atual === null && nomesAssinaturas.has(d.descricao) && (d.data_vencimento || d.data)?.startsWith(m))
        .reduce((s, d) => s + parseFloat(d.valor || 0), 0);
      return { mes: nomeMesAbrev(m), Receitas: +rec.toFixed(2), Pagas: +pagas.toFixed(2), Pendentes: +pendentes.toFixed(2), Assinaturas: +assin.toFixed(2) };
    });
  }, [despesas, receitas, assinaturas]);

  const ttStyle = { contentStyle:{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:12,fontFamily:"Inter"}, labelStyle:{color:"#94a3b8",fontSize:12}, itemStyle:{color:"#e2e8f0",fontSize:12} };
  const ultimo = dadosPorMes[dadosPorMes.length - 1];

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center gap-3"><BotaoAjuda topico="grafico"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Visão financeira</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">Gráfico — últimos 6 meses</h2></div></div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
        <h3 className="font-display text-lg italic text-slate-200 mb-6">Receitas vs Despesas Pagas</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dadosPorMes} margin={{top:10,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
              <linearGradient id="gPag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
            <XAxis dataKey="mes" tick={{fill:"#64748b",fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:11,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`}/>
            <Tooltip {...ttStyle} formatter={v=>formatBRL(v)}/>
            <Legend wrapperStyle={{fontFamily:"Inter",fontSize:12,color:"#94a3b8",paddingTop:16}}/>
            <Area type="monotone" dataKey="Receitas" stroke="#34d399" strokeWidth={2} fill="url(#gRec)" dot={{fill:"#34d399",strokeWidth:0,r:4}} activeDot={{r:6}}/>
            <Area type="monotone" dataKey="Pagas" stroke="#60a5fa" strokeWidth={2} fill="url(#gPag)" dot={{fill:"#60a5fa",strokeWidth:0,r:4}} activeDot={{r:6}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
        <h3 className="font-display text-lg italic text-slate-200 mb-6">Pendentes vs Assinaturas</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dadosPorMes} margin={{top:10,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              <linearGradient id="gAss" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
            <XAxis dataKey="mes" tick={{fill:"#64748b",fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:11,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`}/>
            <Tooltip {...ttStyle} formatter={v=>formatBRL(v)}/>
            <Legend wrapperStyle={{fontFamily:"Inter",fontSize:12,color:"#94a3b8",paddingTop:16}}/>
            <Area type="monotone" dataKey="Pendentes" stroke="#f87171" strokeWidth={2} fill="url(#gPend)" dot={{fill:"#f87171",strokeWidth:0,r:4}} activeDot={{r:6}}/>
            <Area type="monotone" dataKey="Assinaturas" stroke="#a78bfa" strokeWidth={2} fill="url(#gAss)" dot={{fill:"#a78bfa",strokeWidth:0,r:4}} activeDot={{r:6}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Receitas (mês)", valor:ultimo?.Receitas, cor:"text-emerald-400"},
          {label:"Pagas (mês)", valor:ultimo?.Pagas, cor:"text-blue-400"},
          {label:"Pendentes (mês)", valor:ultimo?.Pendentes, cor:"text-red-400"},
          {label:"Assinaturas (mês)", valor:ultimo?.Assinaturas, cor:"text-violet-400"},
        ].map(c => (
          <div key={c.label} className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-4">
            <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-2">{c.label}</p>
            <p className={`font-mono-c num-tabular text-xl font-bold ${c.cor}`}>{formatBRL(c.valor)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
