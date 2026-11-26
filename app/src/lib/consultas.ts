import { ehCredito, ehParcelado, ehReembolso, type FormaPagamento, type Gasto, type Pessoa } from '../types';
import { diaDe, mesDe, ymIdx } from './datas';

export type ModoMes = 'compra' | 'fatura';

/** Um lançamento como aparece numa lista/total: v já com sinal (estorno negativo) e parcelado colapsado quando for o caso. */
export interface Item extends Gasto { v: number; colapsado?: boolean; numParcelas?: number }

/**
 * Lançamentos de um mês.
 * - "compra": pela data da compra; uma compra parcelada aparece uma vez, pelo total (como colapsarParcelas do app original).
 * - "fatura": pelo mês da fatura; cada parcela no seu mês. Para quem não é crédito, vale o mês da data.
 * ateDia: só compras até esse dia do mês (comparação justa com o mês em andamento).
 */
export function itensDoMes(gastos: Gasto[], mes: number, modo: ModoMes, ateDia?: number | null): Item[] {
  const out: Item[] = [];
  if (modo === 'fatura') {
    for (const g of gastos) {
      const m = ehCredito(g) ? ymIdx(g.mesFatura || g.data.slice(0, 7)) : mesDe(g.data);
      if (m === mes) out.push({ ...g, v: ehReembolso(g) ? -g.valor : g.valor });
    }
    return out;
  }
  const grupos = new Map<string, Gasto[]>();
  for (const g of gastos) {
    if (mesDe(g.data) !== mes) continue;
    if (ateDia && diaDe(g.data) > ateDia) continue;
    if (ehParcelado(g)) { const l = grupos.get(g.grupoId!) ?? []; l.push(g); grupos.set(g.grupoId!, l); }
    else out.push({ ...g, v: ehReembolso(g) ? -g.valor : g.valor });
  }
  for (const ps of grupos.values()) {
    ps.sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1));
    const total = Math.round(ps.reduce((s, x) => s + x.valor, 0) * 100) / 100;
    out.push({ ...ps[0], v: total, colapsado: true, numParcelas: ps[0].parcelaTotal ?? ps.length });
  }
  return out;
}

export const soma = (xs: { v: number }[]) => xs.reduce((s, x) => s + x.v, 0);
export const somaDe = (xs: Item[], quem: Pessoa) => soma(xs.filter(x => x.usuario === quem));

export interface Filtros { categoria?: string; pessoa?: Pessoa | ''; pagamento?: FormaPagamento | ''; cartao?: string }
export const aplicarFiltros = (xs: Item[], f: Filtros) => xs.filter(x =>
  (!f.categoria || x.categoria === f.categoria) && (!f.pessoa || x.usuario === f.pessoa) &&
  (!f.pagamento || x.formaPagamento === f.pagamento) && (!f.cartao || x.cartao === f.cartao));

export interface Grupo { chave: string; categoria: string; d: number; e: number; t: number }
export function agrupar(xs: Item[], nivel: 'cat' | 'sub'): Grupo[] {
  const m = new Map<string, Grupo>();
  for (const x of xs) {
    const chave = nivel === 'sub' ? `${x.categoria} › ${x.subcategoria || 'Sem subcategoria'}` : (x.categoria || 'Outros');
    const g = m.get(chave) ?? { chave, categoria: x.categoria, d: 0, e: 0, t: 0 };
    g.t += x.v; if (x.usuario === 'Diego') g.d += x.v; else g.e += x.v;
    m.set(chave, g);
  }
  return [...m.values()].sort((a, b) => b.t - a.t);
}

// ===== parcelamentos =====
export interface Compra {
  grupoId: string; descricao: string; usuario: Pessoa; cartao: string | null; categoria: string; subcategoria: string;
  n: number; total: number; parcelas: Gasto[]; atual?: Gasto; falta: number; pagas: number; ultimoMes: number; valorParcela: number; ativa: boolean;
}
export function comprasParceladas(gastos: Gasto[], faturaAtual: number): Compra[] {
  const grupos = new Map<string, Gasto[]>();
  for (const g of gastos) if (ehParcelado(g)) { const l = grupos.get(g.grupoId!) ?? []; l.push(g); grupos.set(g.grupoId!, l); }
  return [...grupos.values()].map(ps => {
    ps.sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1));
    const f = ps[0], n = f.parcelaTotal ?? ps.length;
    const futuras = ps.filter(p => ymIdx(p.mesFatura) >= faturaAtual);
    const atual = ps.find(p => ymIdx(p.mesFatura) === faturaAtual);
    return {
      grupoId: f.grupoId!, descricao: f.descricao, usuario: f.usuario, cartao: f.cartao, categoria: f.categoria, subcategoria: f.subcategoria,
      n, total: f.valorTotalCompra ?? ps.reduce((s, x) => s + x.valor, 0), parcelas: ps, atual,
      falta: futuras.reduce((s, p) => s + p.valor, 0), pagas: n - futuras.length,
      ultimoMes: ymIdx(ps[ps.length - 1].mesFatura), valorParcela: (atual ?? futuras[0] ?? f).valor, ativa: futuras.length > 0
    };
  });
}
/** Soma das parcelas por mês de fatura (para o gráfico de compromissos). */
export function parcelasPorMes(gastos: Gasto[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const g of gastos) if (ehParcelado(g) && !ehReembolso(g)) { const i = ymIdx(g.mesFatura); m.set(i, (m.get(i) ?? 0) + g.valor); }
  return m;
}

// ===== sugestões de estabelecimento (mesma lógica de reconstruirEstabelecimentos do app original) =====
export interface Estabelecimento {
  nome: string; count: number; ultimoUso: string; valorMedio: number;
  categoria?: string; subcategoria?: string; formaPagamento?: FormaPagamento; cartao?: string;
}
const topChave = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0];
export const normalizarChave = (s: string) => String(s || '').trim().toLowerCase();

export function montarEstabelecimentos(gastos: Gasto[]): Map<string, Estabelecimento> {
  type Acc = { nome: string; count: number; ultimoUso: string; valores: number[]; cat: Record<string, number>; sub: Record<string, number>; pag: Record<string, number>; car: Record<string, number> };
  const mapa = new Map<string, Acc>();
  for (const g of [...gastos].sort((a, b) => a.data.localeCompare(b.data))) {
    const k = normalizarChave(g.descricao);
    if (!k || ehReembolso(g) || (g.parcelaTotal && g.parcelaAtual && g.parcelaAtual > 1)) continue;
    const e = mapa.get(k) ?? { nome: g.descricao.trim(), count: 0, ultimoUso: g.data, valores: [], cat: {}, sub: {}, pag: {}, car: {} };
    e.count++; e.nome = g.descricao.trim(); e.ultimoUso = g.data; e.valores.push(g.valorTotalCompra ?? g.valor);
    e.cat[g.categoria] = (e.cat[g.categoria] ?? 0) + 1;
    if (g.subcategoria) e.sub[g.subcategoria] = (e.sub[g.subcategoria] ?? 0) + 1;
    if (g.formaPagamento) e.pag[g.formaPagamento] = (e.pag[g.formaPagamento] ?? 0) + 1;
    if (g.cartao) e.car[g.cartao] = (e.car[g.cartao] ?? 0) + 1;
    mapa.set(k, e);
  }
  const out = new Map<string, Estabelecimento>();
  for (const [k, e] of mapa) {
    const ult = e.valores.slice(-5);
    out.set(k, { nome: e.nome, count: e.count, ultimoUso: e.ultimoUso, valorMedio: ult.reduce((s, v) => s + v, 0) / ult.length,
      categoria: topChave(e.cat), subcategoria: topChave(e.sub), formaPagamento: topChave(e.pag) as FormaPagamento | undefined, cartao: topChave(e.car) });
  }
  return out;
}
function casa(termo: string, texto: string): number {
  termo = termo.toLowerCase(); texto = texto.toLowerCase();
  if (texto.includes(termo)) return 1;
  let i = 0; for (let j = 0; j < texto.length && i < termo.length; j++) if (texto[j] === termo[i]) i++;
  return i === termo.length ? 2 : 0;
}
export function buscarSugestoes(estab: Map<string, Estabelecimento>, termo: string): Estabelecimento[] {
  const t = termo.trim(); if (!t) return [];
  return [...estab.values()].map(e => ({ e, s: casa(t, e.nome) })).filter(x => x.s > 0)
    .sort((a, b) => a.s - b.s || b.e.count - a.e.count || b.e.ultimoUso.localeCompare(a.e.ultimoUso)).slice(0, 6).map(x => x.e);
}

/** Mesmo critério do app original: mesma data, mesmo local, mesmo tipo, mesmo cartão e valor igual (tolerância de 1 centavo). */
export function buscarDuplicata(gastos: Gasto[], data: string, valor: number, descricao: string, cartao: string | null, reembolso: boolean) {
  const k = normalizarChave(descricao);
  return gastos.find(g => g.data === data && normalizarChave(g.descricao) === k && ehReembolso(g) === reembolso &&
    !(cartao && g.cartao && g.cartao !== cartao) && Math.abs(((ehParcelado(g) ? g.valorTotalCompra : g.valor) ?? g.valor) - valor) < 0.01);
}

/** Quando o lançamento foi feito (criadoEm pode vir como Timestamp do Firebase ou texto ISO); sem isso, usa a data da compra. */
export function momento(g: Gasto): number {
  const c = g.criadoEm as unknown as { toMillis?: () => number; seconds?: number } | string | undefined;
  if (typeof c === 'string') { const t = Date.parse(c); if (!isNaN(t)) return t; }
  else if (c?.toMillis) return c.toMillis();
  else if (typeof c?.seconds === 'number') return c.seconds * 1000;
  return new Date(g.data + 'T00:00:00').getTime();
}
/** Lançado há menos de 30 minutos (ganha a etiqueta "novo" nas listas). */
export const ehNovo = (g: Gasto, agora = Date.now()) => { const m = momento(g); return agora - m >= 0 && agora - m < 30 * 60 * 1000 && typeof g.criadoEm !== 'undefined'; };
