import type { Cartao, NovoGasto } from '../types';
import { idxYm, ymIdx } from './datas';

/**
 * Em qual fatura (mês de vencimento, AAAA-MM) cai uma compra no crédito.
 * Mesma regra do app original: depois do fechamento vai para o mês seguinte;
 * se o vencimento é antes do fechamento (ex.: fecha 28, vence 5) a fatura vence no mês seguinte ao fechamento.
 */
export function calcularMesFatura(dataISO: string, cartao: Cartao | undefined): string {
  if (!cartao) return dataISO.slice(0, 7);
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  let i = ano * 12 + mes - 1;
  if (dia > cartao.fechamento) i++;
  if (cartao.vencimento <= cartao.fechamento) i++;
  return idxYm(i);
}

/** Divide o total em n parcelas com 2 casas; a última absorve a diferença de arredondamento (igual ao app original). */
export function dividirEmParcelas(total: number, n: number): number[] {
  const vp = Number((total / n).toFixed(2));
  const arr: number[] = [];
  let acumulado = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) arr.push(Number((total - acumulado).toFixed(2)));
    else { arr.push(vp); acumulado += vp; }
  }
  return arr;
}

/** Fatura "da vez" na tela de Faturas: depois do maior dia de vencimento, já é a do mês seguinte (regra original). */
export function mesFaturaPadrao(hoje: Date, cartoes: Cartao[]): number {
  let i = hoje.getFullYear() * 12 + hoje.getMonth();
  const dv = cartoes.length ? Math.max(...cartoes.map(c => c.vencimento || 12)) : 12;
  if (hoje.getDate() > dv) i++;
  return i;
}

export const novoGrupoId = () => 'g' + Date.now() + Math.random().toString(36).slice(2, 7);

export interface PlanoParcelas {
  total: number;
  n: number;
  primeiroMes: string;   // AAAA-MM da parcela "desdeParcela"
  desdeParcela?: number; // compra já em andamento: lança só desta parcela em diante
}

/**
 * Gera os lançamentos de uma compra no crédito (1 por parcela) no formato do Firestore.
 * Com desdeParcela = k, as parcelas 1..k-1 não são criadas (já foram pagas antes do cadastro).
 */
export function gerarParcelas(base: Omit<NovoGasto, 'valor' | 'parcelaAtual' | 'parcelaTotal' | 'valorTotalCompra' | 'grupoId' | 'mesFatura'>, plano: PlanoParcelas, grupoId = novoGrupoId()): NovoGasto[] {
  const { total, n } = plano;
  const k = Math.min(Math.max(1, plano.desdeParcela ?? 1), n);
  const vps = dividirEmParcelas(total, n);
  const inicio = ymIdx(plano.primeiroMes) - (k - 1);
  const out: NovoGasto[] = [];
  for (let i = k - 1; i < n; i++) {
    out.push({
      ...base,
      valor: vps[i],
      mesFatura: idxYm(inicio + i),
      parcelaAtual: n > 1 ? i + 1 : null,
      parcelaTotal: n > 1 ? n : null,
      valorTotalCompra: n > 1 ? total : null,
      grupoId: n > 1 ? grupoId : null
    });
  }
  return out;
}
