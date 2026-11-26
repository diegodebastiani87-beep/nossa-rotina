import { describe, expect, it } from 'vitest';
import { calcularMesFatura, dividirEmParcelas, gerarParcelas, mesFaturaPadrao } from './fatura';
import { buscarDuplicata, comprasParceladas, itensDoMes, soma } from './consultas';
import { lerValor, ymIdx } from './datas';
import type { Gasto } from '../types';

const nubank = { nome: 'Nubank Diego', fechamento: 5, vencimento: 12 };
const inter = { nome: 'Inter', fechamento: 15, vencimento: 22 };
const c6 = { nome: 'C6', fechamento: 28, vencimento: 5 };

describe('calcularMesFatura (regra do app original)', () => {
  it('até o dia do fechamento cai na fatura do mesmo mês', () => {
    expect(calcularMesFatura('2026-11-05', nubank)).toBe('2026-11');
    expect(calcularMesFatura('2026-11-15', inter)).toBe('2026-11');
  });
  it('depois do fechamento vai para o mês seguinte', () => {
    expect(calcularMesFatura('2026-11-26', nubank)).toBe('2026-12');
    expect(calcularMesFatura('2026-11-16', inter)).toBe('2026-12');
  });
  it('vira o ano corretamente', () => {
    expect(calcularMesFatura('2026-12-20', nubank)).toBe('2027-01');
  });
  it('vencimento antes do fechamento: vence no mês seguinte ao fechamento', () => {
    expect(calcularMesFatura('2026-11-10', c6)).toBe('2026-12');
    expect(calcularMesFatura('2026-11-29', c6)).toBe('2027-01');
  });
  it('sem cartão usa o mês da data', () => {
    expect(calcularMesFatura('2026-11-26', undefined)).toBe('2026-11');
  });
});

describe('dividirEmParcelas', () => {
  it('soma sempre o total exato', () => {
    for (const [t, n] of [[4590, 17], [100, 3], [6559.98, 21], [0.05, 2], [1234.56, 99]] as const) {
      const p = dividirEmParcelas(t, n);
      expect(p).toHaveLength(n);
      expect(Number(p.reduce((s, v) => s + v, 0).toFixed(2))).toBe(t);
    }
  });
  it('a última parcela absorve o arredondamento', () => {
    expect(dividirEmParcelas(100, 3)).toEqual([33.33, 33.33, 33.34]);
  });
});

describe('gerarParcelas', () => {
  const base = { usuario: 'Diego' as const, data: '2026-11-26', descricao: 'Mobly', categoria: 'Moradia', subcategoria: '', observacao: '', formaPagamento: 'Cartão Crédito' as const, cartao: 'Nubank Diego', tipoLancamento: 'gasto' as const };
  it('17x a partir de dez/26 termina em abr/28', () => {
    const ps = gerarParcelas(base, { total: 4590, n: 17, primeiroMes: '2026-12' }, 'g1');
    expect(ps).toHaveLength(17);
    expect(ps[0]).toMatchObject({ parcelaAtual: 1, parcelaTotal: 17, mesFatura: '2026-12', valor: 270, valorTotalCompra: 4590, grupoId: 'g1' });
    expect(ps[16]).toMatchObject({ parcelaAtual: 17, mesFatura: '2028-04' });
  });
  it('compra em andamento lança só as parcelas que faltam', () => {
    const ps = gerarParcelas(base, { total: 1200, n: 12, primeiroMes: '2026-12', desdeParcela: 5 }, 'g2');
    expect(ps).toHaveLength(8);
    expect(ps[0]).toMatchObject({ parcelaAtual: 5, mesFatura: '2026-12' });
    expect(ps[7]).toMatchObject({ parcelaAtual: 12, mesFatura: '2027-07' });
  });
  it('à vista gera um lançamento sem dados de parcela', () => {
    const ps = gerarParcelas(base, { total: 99.9, n: 1, primeiroMes: '2026-12' });
    expect(ps).toEqual([expect.objectContaining({ valor: 99.9, parcelaAtual: null, parcelaTotal: null, grupoId: null, mesFatura: '2026-12' })]);
  });
});

describe('mesFaturaPadrao', () => {
  it('depois do maior vencimento mostra a fatura do mês seguinte', () => {
    expect(mesFaturaPadrao(new Date(2026, 10, 26), [nubank, inter])).toBe(ymIdx('2026-12'));
    expect(mesFaturaPadrao(new Date(2026, 10, 20), [nubank, inter])).toBe(ymIdx('2026-11'));
  });
});

describe('consultas', () => {
  const g = (o: Partial<Gasto>): Gasto => ({ id: Math.random().toString(), usuario: 'Diego', data: '2026-11-10', mesFatura: '2026-11', descricao: 'X', categoria: 'Outros', subcategoria: '', observacao: '', formaPagamento: 'Dinheiro/PIX', cartao: null, valor: 10, parcelaAtual: null, parcelaTotal: null, valorTotalCompra: null, grupoId: null, tipoLancamento: 'gasto', ...o });
  const parc = [1, 2, 3].map(i => g({ grupoId: 'p', parcelaAtual: i, parcelaTotal: 3, valorTotalCompra: 300, valor: 100, formaPagamento: 'Cartão Crédito', cartao: 'Inter', mesFatura: ['2026-11', '2026-12', '2027-01'][i - 1] }));
  const lista = [g({ valor: 50 }), g({ valor: 20, tipoLancamento: 'reembolso', formaPagamento: 'Cartão Crédito', cartao: 'Inter', mesFatura: '2026-12' }), ...parc];

  it('mês da compra: parcelado conta uma vez pelo total e estorno subtrai', () => {
    const it = itensDoMes(lista, ymIdx('2026-11'), 'compra');
    expect(it.filter(x => x.colapsado)).toHaveLength(1);
    expect(soma(it)).toBe(50 - 20 + 300);
  });
  it('mês da fatura: cada parcela no seu mês', () => {
    expect(soma(itensDoMes(lista, ymIdx('2026-11'), 'fatura'))).toBe(50 + 100);
    expect(soma(itensDoMes(lista, ymIdx('2026-12'), 'fatura'))).toBe(100 - 20);
  });
  it('até o mesmo dia ignora compras posteriores', () => {
    const l = [g({ data: '2026-10-05' }), g({ data: '2026-10-28' })];
    expect(itensDoMes(l, ymIdx('2026-10'), 'compra', 26)).toHaveLength(1);
  });
  it('parcelamentos: quanto falta e quando termina', () => {
    const [c] = comprasParceladas(lista, ymIdx('2026-12'));
    expect(c).toMatchObject({ n: 3, pagas: 1, falta: 200, ultimoMes: ymIdx('2027-01') });
  });
  it('duplicata pelo valor total da compra parcelada', () => {
    expect(buscarDuplicata(lista, '2026-11-10', 300, 'x', 'Inter', false)).toBeTruthy();
    expect(buscarDuplicata(lista, '2026-11-10', 301, 'x', 'Inter', false)).toBeUndefined();
  });
});

describe('lerValor', () => {
  it('entende formato brasileiro', () => {
    expect(lerValor('1.234,56')).toBe(1234.56);
    expect(lerValor('R$ 4.590,00')).toBe(4590);
    expect(lerValor('12.5')).toBe(12.5);
  });
});
