// Meses são tratados como um número inteiro (ano*12 + mês-1) para somar/subtrair sem erro de virada de ano.

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const ymIdx = (ym: string) => { const [a, m] = ym.split('-').map(Number); return a * 12 + m - 1; };
export const idxYm = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
export const idxCurto = (i: number) => `${MESES[i % 12]}/${String(Math.floor(i / 12)).slice(2)}`;
export const idxLongo = (i: number) => `${MESES_LONGOS[i % 12]} ${Math.floor(i / 12)}`;
export const nomeMes = (i: number) => MESES_LONGOS[i % 12];

export const isoLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const hojeISO = () => isoLocal();
export const mesDe = (iso: string) => ymIdx(iso.slice(0, 7));
export const diaDe = (iso: string) => Number(iso.slice(8, 10));
export const diasNoMes = (i: number) => new Date(Math.floor(i / 12), (i % 12) + 1, 0).getDate();
export const fmtDiaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const fmtData = (iso: string) => iso.split('-').reverse().join('/');

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const brlCompacto = (v: number) => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')} mil` : brl(v);

/** Lê "1.234,56", "1234.56" ou "R$ 10" como número. */
export function lerValor(s: string): number {
  const t = String(s).replace(/[^\d,.-]/g, '');
  if (t.includes(',')) return Number(t.replace(/\./g, '').replace(',', '.')) || 0;
  return Number(t) || 0;
}
