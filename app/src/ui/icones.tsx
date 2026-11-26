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
  lixeira: <><path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13" /><path d="M10 11v5.5M14 11v5.5" /></>,
  lapis: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  pasta: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  camadas: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  limpar: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  baixar: <><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></>,
  alerta: <><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  brilho: <><path d="M12 3.5 13.8 9 19.5 11l-5.7 2L12 18.5 10.2 13 4.5 11l5.7-2z" /><path d="M19 3v3M17.5 4.5h3" /></>,
  usuarios: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" /></>,
  paleta: <><path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.5-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="14.5" cy="7" r="1" /></>,
  documento: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  sacola: <><path d="M5 8h14l-1 12H6z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></>,
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

/** Rótulo com ícone na frente (substitui os emojis dos botões e abas). */
export function Rot({ ic, children, tam = 17 }: { ic: string; children?: ReactNode; tam?: number }) {
  return <span className="rot"><Icone nome={ic} tam={tam} traco={2} />{children}</span>;
}

/** Nome da pessoa com o avatar colorido (Diego azul, Eliane rosa). */
export function PessoaRot({ p, tam = 20 }: { p: string; tam?: number }) {
  return <span className="rot"><span className={'pes-av ' + (p === 'Eliane' ? 'e' : 'd')} style={{ width: tam, height: tam }}>{p[0]}</span>{p}</span>;
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

/**
 * Referência visual dos cartões dos principais bancos e carteiras do Brasil (cores da identidade de cada marca,
 * em degradê). Usada para o cartão ficar com a cara do banco no Início, nas Faturas, no Lançar e no cadastro.
 * "chaves" = palavras no nome do cartão que identificam o banco automaticamente.
 */
export interface Banco { id: string; nome: string; chaves: string[]; a: string; b: string; tx?: string }
export const BANCOS: Banco[] = [
  { id: 'nubank', nome: 'Nubank', chaves: ['nubank', 'nu '], a: '#8a05be', b: '#4a0a85' },
  { id: 'inter', nome: 'Inter', chaves: ['inter'], a: '#ff8a00', b: '#e35205' },
  { id: 'mercadopago', nome: 'Mercado Pago', chaves: ['mercado'], a: '#00a6e4', b: '#1e3a8a' },
  { id: 'c6', nome: 'C6 Bank', chaves: ['c6'], a: '#2e2e2e', b: '#0b0b0b' },
  { id: 'itau', nome: 'Itaú', chaves: ['itaú', 'itau'], a: '#f07c00', b: '#b24c00' },
  { id: 'bradesco', nome: 'Bradesco', chaves: ['bradesco'], a: '#e1173f', b: '#8c0020' },
  { id: 'santander', nome: 'Santander', chaves: ['santander'], a: '#ec0000', b: '#9e0000' },
  { id: 'caixa', nome: 'Caixa', chaves: ['caixa'], a: '#0070c0', b: '#003a70' },
  { id: 'bb', nome: 'Banco do Brasil', chaves: ['banco do brasil', 'ourocard', ' bb', 'bb '], a: '#4f63ff', b: '#1d2d8f' },
  { id: 'xp', nome: 'XP', chaves: ['xp'], a: '#2a2a2a', b: '#000000' },
  { id: 'btg', nome: 'BTG Pactual', chaves: ['btg'], a: '#1a3d8f', b: '#001e62' },
  { id: 'picpay', nome: 'PicPay', chaves: ['picpay'], a: '#21c25e', b: '#0c7a3f' },
  { id: 'pagbank', nome: 'PagBank', chaves: ['pagbank', 'pagseguro'], a: '#00a868', b: '#006b45' },
  { id: 'neon', nome: 'Neon', chaves: ['neon'], a: '#00b4ff', b: '#0050c8' },
  { id: 'next', nome: 'Next', chaves: ['next'], a: '#00c853', b: '#00592a' },
  { id: 'will', nome: 'Will Bank', chaves: ['will'], a: '#ffd400', b: '#f2a900', tx: '#1a1a1a' },
  { id: 'nomad', nome: 'Nomad', chaves: ['nomad'], a: '#f5c518', b: '#c99700', tx: '#1a1a1a' },
  { id: 'sicredi', nome: 'Sicredi', chaves: ['sicredi'], a: '#3fa110', b: '#1f5f08' },
  { id: 'sicoob', nome: 'Sicoob', chaves: ['sicoob'], a: '#00ae9d', b: '#003641' },
  { id: 'original', nome: 'Original', chaves: ['original'], a: '#18b26b', b: '#00753a' },
  { id: 'banrisul', nome: 'Banrisul', chaves: ['banrisul'], a: '#1565c0', b: '#003a70' },
  { id: 'porto', nome: 'Porto Bank', chaves: ['porto'], a: '#1f5fd6', b: '#0a2f7a' },
  { id: 'digio', nome: 'Digio', chaves: ['digio'], a: '#1a4fd6', b: '#08245e' },
  { id: 'pan', nome: 'Banco Pan', chaves: ['banco pan', 'pan '], a: '#00aeef', b: '#0063a6' },
  { id: 'bmg', nome: 'BMG', chaves: ['bmg'], a: '#ff6a00', b: '#c43d00' },
  { id: 'agibank', nome: 'Agibank', chaves: ['agibank'], a: '#00b388', b: '#004b87' },
  { id: 'safra', nome: 'Safra', chaves: ['safra'], a: '#2a3a5e', b: '#0b1428' },
  { id: 'credicard', nome: 'Credicard', chaves: ['credicard'], a: '#3a3a3a', b: '#111111' }
];

export const bancoDoNome = (nome: string) => {
  const n = ` ${nome.toLowerCase()} `;
  return BANCOS.find(b => b.chaves.some(k => n.includes(k)));
};

/** Estilo do cartão: banco escolhido no cadastro → banco reconhecido pelo nome → cor fixa calculada do nome. */
export function estiloCartao(nome: string, banco?: string): { a: string; b: string; tx: string } {
  const b = (banco && BANCOS.find(x => x.id === banco)) || bancoDoNome(nome);
  if (b) return { a: b.a, b: b.b, tx: b.tx ?? '#ffffff' };
  let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { a: `hsl(${h} 55% 45%)`, b: `hsl(${(h + 30) % 360} 60% 28%)`, tx: '#ffffff' };
}

/** Variáveis CSS do cartão (para style). */
export const varsCartao = (nome: string, banco?: string) => {
  const s = estiloCartao(nome, banco);
  return { ['--a' as string]: s.a, ['--b' as string]: s.b, ['--tx' as string]: s.tx };
};
