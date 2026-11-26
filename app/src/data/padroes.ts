import type { Cartao, Categoria } from '../types';

// Usados só se o documento da casa ainda não tiver categorias/cartões (mesmo comportamento do app original).
export const CATEGORIAS_PADRAO: Categoria[] = [
  { nome: 'Moradia', cor: '#64748b', subs: ['Financiamento', 'Energia', 'Água', 'Internet', 'Gás', 'IPTU', 'Manutenção', 'Seguros'] },
  { nome: 'Alimentação', cor: '#475569', subs: ['Supermercado', 'Restaurante', 'Delivery'] },
  { nome: 'Transporte', cor: '#0f766e', subs: ['Combustível', 'Público', 'Uber', 'Estacionamento', 'Manutenção', 'IPVA', 'Seguros'] },
  { nome: 'Saúde', cor: '#b91c1c', subs: ['Plano', 'Farmácia', 'Consultas', 'Exames', 'Dentista', 'Academia'] },
  { nome: 'Educação', cor: '#6d28d9', subs: ['Escola', 'Cursos', 'Livros', 'Material'] },
  { nome: 'Lazer', cor: '#c2410c', subs: ['Streaming', 'Cinema', 'Viagens', 'Bares', 'Hobbies'] },
  { nome: 'Vestuário', cor: '#be185d', subs: ['Roupas', 'Calçados', 'Acessórios'] },
  { nome: 'Contas Pessoais', cor: '#4338ca', subs: ['Celular', 'Salão', 'Unha', 'Cabelo/Barba'] },
  { nome: 'Presentes', cor: '#047857', subs: ['Aniversário', 'Data Comemorativa'] },
  { nome: 'Outros', cor: '#6b7280', subs: ['Rifa', 'Loteria', 'Doação/Ajuda'] }
];

export const CARTOES_PADRAO: Cartao[] = [
  { nome: 'Nubank Diego', fechamento: 5, vencimento: 12 },
  { nome: 'Nubank Eliane', fechamento: 5, vencimento: 12 },
  { nome: 'Inter', fechamento: 15, vencimento: 22 }
];

/** Cores sugeridas, bem distintas entre si. Só são aplicadas se vocês tocarem em "Usar cores sugeridas" em Ajustes. */
export const CORES_SUGERIDAS: Record<string, string> = {
  'Moradia': '#5b6ee1', 'Alimentação': '#e8833a', 'Transporte': '#14a38b', 'Saúde': '#e5484d', 'Educação': '#8b5cf6',
  'Lazer': '#d9a300', 'Vestuário': '#d6409f', 'Contas Pessoais': '#3b9be8', 'Presentes': '#2f9e44', 'Outros': '#8a94a6'
};

// Formato antigo (objeto por nome) → lista. Igual a migrarParaArray do app original.
export function categoriasDe(raw: unknown): Categoria[] {
  if (Array.isArray(raw)) return raw as Categoria[];
  if (!raw || typeof raw !== 'object') return CATEGORIAS_PADRAO;
  const o = raw as Record<string, { cor: string; subs?: string[] }>;
  return Object.keys(o).map(nome => ({ nome, cor: o[nome].cor, subs: o[nome].subs ?? [] }));
}
export function cartoesDe(raw: unknown): Cartao[] {
  if (Array.isArray(raw)) return raw as Cartao[];
  if (!raw || typeof raw !== 'object') return CARTOES_PADRAO;
  const o = raw as Record<string, { fechamento: number; vencimento: number }>;
  return Object.keys(o).map(nome => ({ nome, fechamento: o[nome].fechamento, vencimento: o[nome].vencimento }));
}
