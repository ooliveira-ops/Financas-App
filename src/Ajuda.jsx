import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ModalBase } from "./ModalBase";

// Conteúdo do botão "Dúvidas" de cada seção — edite os textos aqui sempre que quiser mudar as explicações
export const AJUDA_CONTEUDO = {
  home: {
    titulo: "Como funciona a Home",
    explicacao: "A Home mostra um resumo geral: quanto entrou no mês (receitas), quanto já foi pago no mês, o saldo do mês, quanto ainda falta pagar somando todos os meses, e o saldo acumulado de toda a sua história. Também mostra suas próximas assinaturas e permite gerar um relatório em PDF.",
    passos: [
      "Cadastre suas receitas do mês na aba Receitas para o saldo aparecer aqui.",
      "Conforme você marca despesas como pagas, os cards 'Pago' e 'A pagar' vão se atualizando sozinhos.",
      "O 'Saldo do mês' é só do mês corrente: receitas deste mês menos as despesas pagas neste mês, sem contar o que sobrou de antes.",
      "O 'Saldo acumulado' considera tudo desde o começo: o que sobrou de um mês passa automaticamente para o mês seguinte.",
      "Clique em 'Gerar Relatório do Mês' quando quiser baixar um PDF com tudo o que aconteceu no mês.",
    ],
  },
  despesas: {
    titulo: "Como funciona Despesas",
    explicacao: "Aqui ficam todos os seus gastos, separados em 'Pendentes' (ainda não pagos) e 'Histórico' (já pagos), do mais recente para o mais antigo. As parcelas de um parcelamento aparecem nesta mesma lista. Por padrão aparecem despesas de todos os meses, para nada ficar esquecido — use os botões de mês para filtrar um período.",
    passos: [
      "Clique em 'Nova' e preencha a descrição (ex: Almoço), o valor, a data de vencimento, a categoria e a forma de pagamento (Pix, cartão ou dinheiro).",
      "Crie suas próprias categorias em '+ Categoria' (ex: Faculdade) e escolha uma cor; clique numa categoria para ver só os gastos dela.",
      "Se quiser dividir em várias vezes, mude o campo 'Parcelas' — informe o valor TOTAL e o app divide sozinho. Para acompanhar o progresso parcela a parcela, use 'Parcelado'.",
      "Quando pagar uma despesa, clique no ícone de check (✓) para marcá-la como paga e ela vai para o Histórico.",
      "Use os botões de mês para ver só um período; 'Todos os meses' mostra tudo.",
    ],
  },
  receitas: {
    titulo: "Como funciona Receitas",
    explicacao: "É onde você registra o dinheiro que entra no mês, como salário, freelas ou qualquer outra fonte de renda. É a partir daqui que o app calcula seu saldo.",
    passos: [
      "Clique em 'Nova' e informe de onde veio o dinheiro (ex: Salário) e o valor.",
      "A receita é sempre associada ao mês atual automaticamente.",
      "Repita sempre que receber um novo valor, mesmo que seja mais de uma vez no mês.",
    ],
  },
  assinaturas: {
    titulo: "Como funcionam as Assinaturas",
    explicacao: "Assinaturas são gastos fixos que se repetem todo mês, como streaming ou academia. O app gera automaticamente uma despesa desse valor todo mês, no dia de vencimento que você escolher.",
    passos: [
      "Clique em 'Nova' e informe o nome, o valor e o dia do mês em que ela vence.",
      "A despesa do mês corrente é criada na hora; nos meses seguintes ela aparece sozinha ao abrir o app.",
      "Se cancelar o serviço, é só remover a assinatura daqui que ela para de gerar novas despesas.",
    ],
  },
  parcelamentos: {
    titulo: "Como funcionam os Parcelamentos",
    explicacao: "Parcelamentos servem para compras grandes divididas em várias vezes, como um celular em 10x. Diferente da despesa parcelada simples, aqui você acompanha o progresso de pagamento parcela por parcela.",
    passos: [
      "Clique em 'Novo' e informe a descrição (ex: Monitor), o valor total e em quantas parcelas foi dividido.",
      "Ao salvar, o app já cria uma despesa para cada parcela, com o vencimento de cada mês.",
      "Marque cada parcela como paga na aba Despesas — é por lá que ela entra no saldo.",
      "Aqui você acompanha o progresso: use 'Marcar próxima como paga' para atualizar a barra e a próxima data.",
    ],
  },
  grafico: {
    titulo: "Como funciona o Gráfico",
    explicacao: "Essa aba mostra a evolução das suas finanças nos últimos 6 meses, comparando receitas, despesas pagas, pendentes e assinaturas mês a mês.",
    passos: [
      "Passe o mouse sobre os gráficos para ver os valores exatos de cada mês.",
      "Use o primeiro gráfico para comparar quanto entrou (receitas) com quanto saiu (pagas).",
      "Use o segundo gráfico para ver o quanto ainda está pendente e o peso das assinaturas fixas.",
    ],
  },
  historico: {
    titulo: "Como funciona o Histórico",
    explicacao: "O Histórico reúne, em ordem, tudo que já aconteceu nas suas finanças: despesas pagas, receitas recebidas e parcelas quitadas — uma espécie de linha do tempo.",
    passos: [
      "Use essa aba quando quiser conferir tudo que já foi movimentado, sem precisar entrar em cada seção separada.",
      "É útil para revisar o mês antes de gerar o relatório em PDF na Home.",
    ],
  },
};

export function BotaoAjuda({ topico }) {
  const [aberto, setAberto] = useState(false);
  const conteudo = AJUDA_CONTEUDO[topico];
  if (!conteudo) return null;
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Dúvidas"
        className="w-8 h-8 shrink-0 rounded-full bg-white/[0.05] border border-blue-900/30 text-slate-400/70 hover:text-blue-400 hover:border-blue-500/40 transition flex items-center justify-center"
      >
        <HelpCircle size={15} />
      </button>
      {aberto && (
        <ModalBase titulo={conteudo.titulo} onFechar={() => setAberto(false)}>
          <p className="font-body text-sm text-slate-300 leading-relaxed">{conteudo.explicacao}</p>
          <div className="bg-white/[0.03] border border-blue-900/20 rounded-xl p-4 space-y-3">
            <p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Passo a passo</p>
            {conteudo.passos.map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="font-mono-c text-xs text-blue-400 font-bold mt-0.5">{i + 1}</span>
                <p className="font-body text-sm text-slate-300">{p}</p>
              </div>
            ))}
          </div>
        </ModalBase>
      )}
    </>
  );
}
