// Dados que o APK manda quando a pessoa toca no aviso "Lançar R$ X?" (lidos da notificação do banco).
// Vêm no endereço: #lancar?v=58.38&l=RESTAURANTE&b=inter&c=Inter&f=4159&t=credito&d=2026-11-27
import type { Cartao } from '../types';
import { bancoDoNome } from '../ui/icones';

export interface DadosBanco { valor: number; local: string; banco: string; dica: string; final: string; debito: boolean; data: string }

export function lerDadosBanco(hash: string): DadosBanco | null {
  const i = hash.indexOf('?');
  if (!hash.replace(/^#/, '').startsWith('lancar') || i < 0) return null;
  const q = new URLSearchParams(hash.slice(i + 1));
  const valor = Number(q.get('v'));
  if (!(valor > 0)) return null;
  const d = q.get('d') ?? '';
  return {
    valor, local: (q.get('l') ?? '').trim(), banco: q.get('b') ?? '', dica: q.get('c') ?? '', final: (q.get('f') ?? '').replace(/\D/g, ''),
    debito: q.get('t') === 'debito', data: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
  };
}

/** "RESTAURANTE NO PONTO" → "Restaurante No Ponto" (só quando vem tudo em maiúsculas). */
export function nomeBonito(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLocaleLowerCase('pt-BR').replace(/(^|[\s/-])(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase('pt-BR'));
}

/** Escolhe o cartão cadastrado que combina com o aviso (final do cartão, banco, nome citado; empate → o de quem está usando). */
export function cartaoDoAviso(cartoes: Cartao[], d: DadosBanco, quem: string): Cartao | undefined {
  const bancoDe = (c: Cartao) => c.banco || bancoDoNome(c.nome)?.id || '';
  const alvo = d.banco || bancoDoNome(d.dica)?.id || '';
  let lista = d.final ? cartoes.filter(c => c.nome.includes(d.final)) : [];
  if (!lista.length && alvo) lista = cartoes.filter(c => bancoDe(c) === alvo);
  if (!lista.length) return undefined;
  return lista.find(c => c.nome.toLowerCase().includes(quem.toLowerCase())) ?? lista[0];
}

/** Aberto pelo aviso do banco ou pelo widget: depois de salvar, o app fecha e volta para onde a pessoa estava. */
export function pedeFechar(hash: string): boolean {
  const i = hash.indexOf('?');
  if (!hash.replace(/^#/, '').startsWith('lancar') || i < 0) return false;
  const q = new URLSearchParams(hash.slice(i + 1));
  return q.get('fechar') === '1' || q.has('v');
}

/** Pede ao app Android para ir para o fundo (FecharApp.java); se não houver app, volta ao Início. */
export function enderecoFechar(msg: string, voltar: string): string {
  return 'intent://fechar?m=' + encodeURIComponent(msg) + '#Intent;scheme=laremdia;package=br.laremdia.app;S.browser_fallback_url=' + encodeURIComponent(voltar) + ';end';
}
