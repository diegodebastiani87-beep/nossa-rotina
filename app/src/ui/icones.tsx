import type { ReactNode } from 'react';

// Ícones de traço (24×24), desenhados aqui para não depender de biblioteca. Herdam a cor do texto.
const P: Record<string, ReactNode> = {
  inicio: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11h13V9" /><path d="M10 20v-5.5h4V20" /></>,
  lista: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  grafico: <><path d="M3 20h18" /><rect x="5" y="11" width="3" height="6" rx="1" /><rect x="10.5" y="6" width="3" height="11" rx="1" /><rect x="16" y="13" width="3" height="4" rx="1" /></>,
  cartao: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></>,
  ajustes: <><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="17" r="2" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  dir: <path d="m9 6 6 6-6 6" />,
  esq: <path d="m15 6-6 6 6 6" />,
  sobe: <path d="M7 17 17 7M9 7h8v8" />,
  desce: <path d="M7 7l10 10M17 9v8H9" />,
  parcelas: <><path d="M17 2.5 20.5 6 17 9.5" /><path d="M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5" /><path d="M7 21.5 3.5 18 7 14.5" /><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5" /></>,
  estorno: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  calendario: <><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
  olho: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  olhoFechado: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.9 3.8M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  semNet: <><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M2 9.5a15 15 0 0 1 4.5-2.8M14 10.3a10 10 0 0 1 5 2.7M10.5 5.1A15 15 0 0 1 22 9.5" /><circle cx="12" cy="20" r=".8" /></>,
  sync: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 3.5V8h4.5" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20.5V16h-4.5" /></>,
  // categorias
  casa: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11h13V9" /></>,
  carrinho: <><circle cx="9" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /><path d="M2.5 3.5H5l2.6 11.6a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 7.5H6" /></>,
  carro: <><path d="M3.5 13.5 5.3 8a2 2 0 0 1 1.9-1.4h9.6A2 2 0 0 1 18.7 8l1.8 5.5V18h-17z" /><path d="M5.5 18v2M18.5 18v2M3.5 13.5h17" /><circle cx="7.5" cy="15.8" r=".9" /><circle cx="16.5" cy="15.8" r=".9" /></>,
  coracao: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z" />,
  livro: <><path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" /><path d="M4 20a2 2 0 0 0 2 1h14v-3" /></>,
  ingresso: <><path d="M3 8.5V5h18v3.5a2.5 2.5 0 0 0 0 5V19H3v-5.5a2.5 2.5 0 0 0 0-5z" /><path d="M14 5v2M14 11v2M14 17v2" /></>,
  camisa: <path d="M8 3.5 3 6.5l2 4 2-1V20.5h10V9.5l2 1 2-4-5-3a4 4 0 0 1-8 0z" />,
  pessoa: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  presente: <><rect x="3" y="8" width="18" height="4.5" rx="1" /><path d="M5 12.5V21h14v-8.5M12 8v13" /><path d="M12 8C9 8 7 7 7.5 5s3.5-1.5 4.5 3c1-4.5 4-5 4.5-3S15 8 12 8z" /></>,
  pontos: <><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>,
  pix: <><path d="M12 3.5 20.5 12 12 20.5 3.5 12z" /><path d="M8.5 9.5 12 13l3.5-3.5" /></>,
  banco: <><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" /></>,
  talher: <><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5" /><path d="M17 21V3c-2 1.5-3 4-3 7v4h3" /></>
};

export function Icone({ nome, tam = 22, traco = 1.8 }: { nome: keyof typeof P | string; tam?: number; traco?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[nome] ?? P.pontos}
    </svg>
  );
}

/** Ícone para cada categoria padrão; categorias novas usam a inicial. */
const POR_CATEGORIA: Record<string, string> = {
  'moradia': 'casa', 'alimentação': 'carrinho', 'alimentacao': 'carrinho', 'transporte': 'carro', 'saúde': 'coracao', 'saude': 'coracao',
  'educação': 'livro', 'educacao': 'livro', 'lazer': 'ingresso', 'vestuário': 'camisa', 'vestuario': 'camisa',
  'contas pessoais': 'pessoa', 'presentes': 'presente', 'outros': 'pontos'
};
export function IconeCategoria({ nome, cor, tam = 40 }: { nome: string; cor: string; tam?: number }) {
  const ic = POR_CATEGORIA[(nome || '').toLowerCase()];
  return (
    <span className="cat-ic" style={{ width: tam, height: tam, ['--c' as string]: cor }}>
      {ic ? <Icone nome={ic} tam={Math.round(tam * 0.5)} traco={2} /> : <b>{(nome || '?')[0]}</b>}
    </span>
  );
}

export const ICONE_PAGAMENTO: Record<string, string> = { 'Dinheiro/PIX': 'pix', 'Cartão Crédito': 'cartao', 'Cartão Débito': 'banco', 'Vale Alimentação': 'talher' };

/** Cor de cada cartão no estilo do banco (pelo nome); cartões desconhecidos ganham uma cor fixa calculada do nome. */
export function estiloCartao(nome: string): { a: string; b: string } {
  const n = nome.toLowerCase();
  if (n.includes('nubank') || n.includes('nu ')) return { a: '#8a05be', b: '#4b0a8a' };
  if (n.includes('inter')) return { a: '#ff8a00', b: '#e85d04' };
  if (n.includes('mercado')) return { a: '#00a6e4', b: '#2d3277' };
  if (n.includes('c6')) return { a: '#2b2b2b', b: '#0d0d0d' };
  if (n.includes('itaú') || n.includes('itau')) return { a: '#ec7000', b: '#003399' };
  if (n.includes('bradesco')) return { a: '#cc092f', b: '#7a0019' };
  if (n.includes('santander')) return { a: '#ec0000', b: '#8c0000' };
  if (n.includes('caixa')) return { a: '#005ca9', b: '#003a70' };
  if (n.includes('brasil') || n.includes('bb')) return { a: '#3a5fa8', b: '#1b2f6b' };
  if (n.includes('xp')) return { a: '#1f1f1f', b: '#000' };
  if (n.includes('picpay')) return { a: '#21c25e', b: '#11823d' };
  let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { a: `hsl(${h} 55% 45%)`, b: `hsl(${(h + 30) % 360} 60% 28%)` };
}
