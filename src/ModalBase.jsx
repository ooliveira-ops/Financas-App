import React, { useEffect } from "react";
import { X, AlertTriangle, ChevronDown, Loader2 } from "lucide-react";

// `[color-scheme:dark]` faz o seletor de data nativo usar ícone e calendário claros no tema escuro.
export const inputCls = "w-full bg-white/[0.03] border border-blue-900/40 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.05] transition-colors [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed";
// O `bg` das <option> é herdado do sistema em alguns navegadores; o [&>option] força o tema escuro.
const selectCls = inputCls + " appearance-none cursor-pointer pr-10 [&>option]:bg-[#0d1829] [&>option]:text-slate-100";

const TONS = {
  azul: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  verde: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  ambar: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  vermelho: "bg-red-500/15 text-red-300 border-red-500/25",
};

// No celular abre como folha presa à base da tela (mais perto do polegar); a partir de
// `sm`, centralizado. Com `onSubmit`, o conteúdo vira <form> e o Enter salva.
export function ModalBase({ titulo, subtitulo, icone: Icone, tom = "azul", onFechar, onSubmit, rodape, children }) {
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === "Escape") onFechar?.(); };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);
  const Corpo = onSubmit ? "form" : "div";
  const aoEnviar = onSubmit ? (e) => { e.preventDefault(); onSubmit(); } : undefined;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm" onClick={onFechar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className="bg-[#0d1829] border border-blue-900/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col shadow-2xl shadow-black/50" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-blue-900/30">
          {Icone && <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${TONS[tom] || TONS.azul}`}><Icone size={18}/></div>}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl italic text-slate-100 leading-tight">{titulo}</h3>
            {subtitulo && <p className="font-body text-xs text-slate-400/70 mt-1">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onFechar} className="p-2 -m-1 rounded-lg text-slate-400/60 hover:text-slate-100 hover:bg-white/5 transition" aria-label="Fechar"><X size={18}/></button>
        </div>
        <Corpo onSubmit={aoEnviar} className="flex flex-col min-h-0">
          <div className="px-6 py-5 space-y-4 overflow-y-auto">{children}</div>
          {rodape && <div className="px-6 pt-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] sm:pb-5 border-t border-blue-900/30 bg-[#0b1524] rounded-b-2xl">{rodape}</div>}
        </Corpo>
      </div>
    </div>
  );
}

export function Campo({ rotulo, dica, children, className = "" }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block font-body text-xs font-medium text-slate-300/80">{rotulo}</span>
      {children}
      {dica && <span className="block font-body text-[11px] text-slate-400/60 leading-relaxed">{dica}</span>}
    </label>
  );
}

export function InputValor({ value, onChange, disabled, autoFocus, placeholder = "0,00" }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-c text-sm text-slate-400/60 pointer-events-none">R$</span>
      <input type="number" inputMode="decimal" step="0.01" value={value} onChange={onChange} disabled={disabled} autoFocus={autoFocus} placeholder={placeholder} className={inputCls + " pl-11 font-mono-c num-tabular"}/>
    </div>
  );
}

export function Selecao({ value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} disabled={disabled} className={selectCls}>{children}</select>
      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400/60 pointer-events-none"/>
    </div>
  );
}

export function Aviso({ tom = "azul", icone: Icone, children }) {
  const cores = { azul: "text-sky-300/90 bg-sky-500/10 border-sky-500/20", ambar: "text-amber-300/90 bg-amber-500/10 border-amber-500/20" };
  return (
    <div className={`font-body text-xs leading-relaxed border rounded-xl px-3 py-2.5 flex items-start gap-2 ${cores[tom] || cores.azul}`}>
      {Icone && <Icone size={14} className="shrink-0 mt-0.5"/>}<span>{children}</span>
    </div>
  );
}

// Rodapé padrão: "Cancelar" à esquerda e a ação principal ocupando o resto.
export function Rodape({ onCancelar, textoConfirmar = "Salvar", salvando, desabilitado, perigo, onConfirmar }) {
  const principal = perigo
    ? "bg-red-500/15 border border-red-500/35 text-red-200 hover:bg-red-500/25"
    : "bg-blue-600 hover:bg-blue-500 text-white";
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancelar} className="px-5 py-3 rounded-xl font-body text-sm bg-white/[0.04] border border-blue-900/40 text-slate-300 hover:bg-white/[0.08] transition">Cancelar</button>
      <button type={onConfirmar ? "button" : "submit"} onClick={onConfirmar} disabled={salvando || desabilitado} className={`flex-1 py-3 rounded-xl font-body text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${principal}`}>
        {salvando ? <><Loader2 size={15} className="animate-spin"/>Salvando...</> : textoConfirmar}
      </button>
    </div>
  );
}

// Usado em toda ação que pede confirmação; `perigo` pinta o botão de vermelho
// (remoções, que não têm "desfazer").
export function ModalConfirmar({ mensagem, textoConfirmar = "Apagar", perigo = true, onConfirmar, onCancelar }) {
  return (
    <ModalBase titulo="Confirmar" icone={AlertTriangle} tom={perigo ? "vermelho" : "ambar"} onFechar={onCancelar}
      rodape={<Rodape onCancelar={onCancelar} onConfirmar={onConfirmar} textoConfirmar={textoConfirmar} perigo={perigo}/>}>
      <p className="font-body text-sm text-slate-300 leading-relaxed">{mensagem}</p>
    </ModalBase>
  );
}
