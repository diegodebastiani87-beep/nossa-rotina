import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { atualizarGastos, excluirGastos, substituirGastos, trocarFatura, useCasa } from '../data/store';
import { brl, fmtData, idxCurto, idxLongo, idxYm, lerValor, ymIdx } from '../lib/datas';
import { calcularMesFatura, gerarParcelas, novoGrupoId } from '../lib/fatura';
import { comprasParceladas, type Item } from '../lib/consultas';
import { ehCredito, ehParcelado, ehReembolso, FORMAS_PAGAMENTO, PESSOAS, type FormaPagamento, type Gasto, type Pessoa } from '../types';
import { Seg, Sheet, useToast } from '../ui/base';
import { Icone, PessoaRot, Rot } from '../ui/icones';
import { CartaoMini } from '../ui/cartao';
import { corDa, LancSwipe } from './LancRow';

interface Acoes {
  detalhe: (id: string) => void;
  editar: (id: string) => void;
  excluir: (id: string) => void;
  compra: (grupoId: string) => void;
  lista: (titulo: string, itens: Item[], modo: 'compra' | 'fatura') => void;
}
const Ctx = createContext<Acoes | null>(null);
export const useAcoes = () => { const c = useContext(Ctx); if (!c) throw new Error('useAcoes fora do provider'); return c; };

type Aberto =
  | { tipo: 'detalhe' | 'editar' | 'excluir' | 'trocar'; id: string }
  | { tipo: 'compra'; grupoId: string }
  | { tipo: 'lista'; titulo: string; itens: Item[]; modo: 'compra' | 'fatura' }
  | null;

export function AcoesProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState<Aberto>(null);
  const acoes = useMemo<Acoes>(() => ({
    detalhe: id => setAberto({ tipo: 'detalhe', id }),
    editar: id => setAberto({ tipo: 'editar', id }),
    excluir: id => setAberto({ tipo: 'excluir', id }),
    compra: grupoId => setAberto({ tipo: 'compra', grupoId }),
    lista: (titulo, itens, modo) => setAberto({ tipo: 'lista', titulo, itens, modo })
  }), []);
  const fechar = () => setAberto(null);
  return (
    <Ctx.Provider value={acoes}>
      {children}
      {aberto?.tipo === 'detalhe' && <Detalhe id={aberto.id} fechar={fechar} ir={setAberto} />}
      {aberto?.tipo === 'editar' && <Edicao id={aberto.id} fechar={fechar} />}
      {aberto?.tipo === 'excluir' && <Exclusao id={aberto.id} fechar={fechar} />}
      {aberto?.tipo === 'trocar' && <TrocarFatura id={aberto.id} fechar={fechar} />}
      {aberto?.tipo === 'compra' && <CompraSheet grupoId={aberto.grupoId} fechar={fechar} ir={setAberto} />}
      {aberto?.tipo === 'lista' && (
        <Sheet onClose={fechar} titulo={aberto.titulo}>
          <h3>{aberto.titulo}</h3>
          <div className="note">{aberto.itens.length} lançamentos. Deslize para editar ou excluir.</div>
          <div style={{ marginTop: 10 }}>{aberto.itens.map(x => <LancSwipe key={x.id} g={x} modo={aberto.modo} />)}</div>
        </Sheet>
      )}
    </Ctx.Provider>
  );
}

const useGasto = (id: string) => { const { gastos } = useCasa(); return gastos.find(g => g.id === id); };
const useGrupo = (g?: Gasto) => { const { gastos } = useCasa(); return g && ehParcelado(g) ? gastos.filter(x => x.grupoId === g.grupoId).sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1)) : null; };

// ===== detalhe com opções =====
function Detalhe({ id, fechar, ir }: { id: string; fechar: () => void; ir: (a: Aberto) => void }) {
  const { categorias } = useCasa();
  const g = useGasto(id), grupo = useGrupo(g);
  if (!g) return null;
  const reemb = ehReembolso(g);
  const total = grupo ? grupo.reduce((s, x) => s + x.valor, 0) : g.valor;
  return (
    <Sheet onClose={fechar} titulo={g.descricao}>
      <h3>{reemb && <span className="ic-in ok"><Icone nome="estorno" tam={18} /></span>}{g.descricao}</h3>
      <div className="note">{g.usuario} · compra em {fmtData(g.data)}</div>
      <div className="det">
        <div className="full"><div className="k">{grupo ? 'Valor total da compra' : reemb ? 'Estorno' : 'Valor'}</div>
          <div className="v num" style={{ fontSize: '1.4em' }}>{brl(total)}</div>
          {grupo && <div className="note">{g.parcelaTotal}x de {brl(grupo[0].valor)} · {grupo.length < (g.parcelaTotal ?? 0) ? `cadastrada a partir da ${grupo[0].parcelaAtual}ª` : `${idxCurto(ymIdx(grupo[0].mesFatura))} → ${idxCurto(ymIdx(grupo[grupo.length - 1].mesFatura))}`}</div>}
        </div>
        <div><div className="k">Categoria</div><div className="v"><span className="who cat-c" style={{ background: corDa(categorias, g.categoria) }} /> {g.categoria}</div><div className="note">{g.subcategoria || '—'}</div></div>
        <div><div className="k">Pagamento</div><div className="v"><Rot ic={FORMAS_PAGAMENTO.find(f => f.valor === g.formaPagamento)?.icone ?? 'cartao'}>{ehCredito(g) ? g.cartao : g.formaPagamento}</Rot></div>
          {ehCredito(g) && !grupo && <div className="note">fatura de {idxCurto(ymIdx(g.mesFatura))}{g.ajusteFatura ? ' (ajustada)' : ''}</div>}</div>
        {g.observacao && <div className="full"><div className="k">Detalhes</div><div className="v">{g.observacao}</div></div>}
      </div>
      <div className="acts" style={{ marginBottom: 8 }}>
        {grupo && <button className="btn sec2" onClick={() => ir({ tipo: 'compra', grupoId: g.grupoId! })}><Rot ic="parcelas">Ver as parcelas</Rot></button>}
        {ehCredito(g) && !grupo && <button className="btn sec2" onClick={() => ir({ tipo: 'trocar', id })}><Rot ic="calendario">Mudar de fatura</Rot></button>}
      </div>
      <div className="acts2">
        <button className="btn sec2" onClick={() => ir({ tipo: 'editar', id })}><Rot ic="lapis">Editar</Rot></button>
        <button className="btn dan" onClick={() => ir({ tipo: 'excluir', id })}><Rot ic="lixeira">Excluir</Rot></button>
      </div>
    </Sheet>
  );
}

// ===== excluir (parcela: todas ou só esta, como no app original) =====
function Exclusao({ id, fechar }: { id: string; fechar: () => void }) {
  const toast = useToast();
  const g = useGasto(id), grupo = useGrupo(g);
  if (!g) return null;
  const apagar = async (lista: Gasto[], msg: string) => {
    fechar();
    try { const desfazer = await excluirGastos(lista); toast(msg, desfazer); }
    catch (e) { toast('Não foi possível excluir: ' + (e as Error).message); }
  };
  return (
    <Sheet onClose={fechar} titulo="Excluir">
      <h3>Excluir “{g.descricao}”?</h3>
      {grupo ? (
        <>
          <div className="note" style={{ margin: '6px 0 14px' }}>É a parcela {g.parcelaAtual}/{g.parcelaTotal} de uma compra de {brl(grupo.reduce((s, x) => s + x.valor, 0))}.</div>
          <div className="acts">
            <button className="btn dan" onClick={() => apagar(grupo, `${grupo.length} parcelas excluídas`)}>Excluir a compra inteira ({grupo.length} parcelas)</button>
            <button className="btn sec2" onClick={() => apagar([g], 'Parcela excluída')}>Excluir só esta parcela</button>
            <button className="btn sec2" onClick={fechar}>Cancelar</button>
          </div>
        </>
      ) : (
        <div className="acts2" style={{ marginTop: 14 }}>
          <button className="btn sec2" onClick={fechar}>Cancelar</button>
          <button className="btn dan" onClick={() => apagar([g], 'Lançamento excluído')}>Excluir</button>
        </div>
      )}
    </Sheet>
  );
}

// ===== mudar de fatura (app original: abrirTrocarFatura) =====
function TrocarFatura({ id, fechar }: { id: string; fechar: () => void }) {
  const toast = useToast();
  const g = useGasto(id);
  const [mes, setMes] = useState(g ? ymIdx(g.mesFatura) : 0);
  const [motivo, setMotivo] = useState('');
  if (!g) return null;
  return (
    <Sheet onClose={fechar} titulo="Mudar de fatura">
      <h3>Mudar de fatura</h3>
      <div className="note">{g.descricao} · {brl(g.valor)} · {g.cartao}. Use quando o banco lançou em outro mês.</div>
      <div className="form-ed">
        <div><label className="l" htmlFor="tfMes">Fatura</label>
          <div className="mesadj"><button onClick={() => setMes(mes - 1)} aria-label="Mês anterior"><Icone nome="esq" tam={18} /></button><div className="m" id="tfMes">{idxLongo(mes)}<small>atual: {idxCurto(ymIdx(g.mesFatura))}</small></div><button onClick={() => setMes(mes + 1)} aria-label="Próximo mês"><Icone nome="dir" tam={18} /></button></div></div>
        <div><label className="l" htmlFor="tfMot">Motivo (opcional)</label><input className="inp" id="tfMot" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: banco lançou depois do fechamento" /></div>
      </div>
      <div className="acts2"><button className="btn sec2" onClick={fechar}>Cancelar</button>
        <button className="btn" onClick={async () => { fechar(); if (idxYm(mes) === g.mesFatura) return; try { await trocarFatura(g, idxYm(mes), motivo.trim()); toast(`Movido para a fatura de ${idxCurto(mes)}`); } catch (e) { toast('Erro: ' + (e as Error).message); } }}>Salvar</button></div>
    </Sheet>
  );
}

// ===== edição completa (mesmas opções do app original + parcelas livres) =====
function Edicao({ id, fechar }: { id: string; fechar: () => void }) {
  const { categorias, cartoes } = useCasa();
  const toast = useToast();
  const g = useGasto(id), grupo = useGrupo(g);
  const primeira = grupo?.[0] ?? g;
  const [f, setF] = useState(() => ({
    descricao: g?.descricao ?? '', valor: (grupo ? grupo.reduce((s, x) => s + x.valor, 0) : g?.valor ?? 0).toFixed(2).replace('.', ','),
    categoria: g?.categoria ?? '', subcategoria: g?.subcategoria ?? '', observacao: g?.observacao ?? '', usuario: (g?.usuario ?? 'Diego') as Pessoa,
    formaPagamento: (g?.formaPagamento ?? 'Dinheiro/PIX') as FormaPagamento, cartao: g?.cartao ?? cartoes[0]?.nome ?? '', data: g?.data ?? '',
    parcelado: !!grupo, n: String(g?.parcelaTotal ?? 2), reembolso: g ? ehReembolso(g) : false,
    mesFatura: primeira ? ymIdx(primeira.mesFatura || primeira.data.slice(0, 7)) : 0, mesManual: false
  }));
  if (!g || !primeira) return null;
  const set = (p: Partial<typeof f>) => setF(o => {
    const n = { ...o, ...p };
    // como no original: mês da fatura acompanha data/cartão até ser escolhido à mão
    if (!n.mesManual && ('data' in p || 'cartao' in p) && n.formaPagamento === 'Cartão Crédito')
      n.mesFatura = ymIdx(calcularMesFatura(n.data, cartoes.find(c => c.nome === n.cartao)));
    return n;
  });
  const cred = f.formaPagamento === 'Cartão Crédito';
  const subs = categorias.find(c => c.nome === f.categoria)?.subs ?? [];

  const salvar = async () => {
    const valor = lerValor(f.valor), n = parseInt(f.n);
    if (!(valor > 0)) return toast('Informe um valor válido.');
    if (!f.descricao.trim()) return toast('Informe o local.');
    if (!f.data) return toast('Informe a data.');
    if (cred && !cartoes.some(c => c.nome === f.cartao)) return toast('Escolha um cartão cadastrado.');
    const parcelar = cred && f.parcelado && !f.reembolso;
    if (parcelar && !(n >= 2 && n <= 99)) return toast('Número de parcelas entre 2 e 99.');
    const base = { usuario: f.usuario, data: f.data, descricao: f.descricao.trim(), categoria: f.categoria, subcategoria: f.subcategoria, observacao: f.observacao.trim(), formaPagamento: f.formaPagamento };
    try {
      if (parcelar) {
        const k = grupo ? Math.min(primeira.parcelaAtual ?? 1, n) : 1;
        const novos = gerarParcelas({ ...base, cartao: f.cartao, tipoLancamento: 'gasto' }, { total: valor, n, primeiroMes: idxYm(f.mesFatura), desdeParcela: k }, grupo ? g.grupoId! : novoGrupoId());
        await substituirGastos(grupo ?? [g], novos, primeira.criadoEm);
      } else if (grupo) {
        await substituirGastos(grupo, [{ ...base, cartao: cred ? f.cartao : null, valor, mesFatura: cred ? idxYm(f.mesFatura) : f.data.slice(0, 7), parcelaAtual: null, parcelaTotal: null, valorTotalCompra: null, grupoId: null, tipoLancamento: cred && f.reembolso ? 'reembolso' : 'gasto' }], primeira.criadoEm);
      } else {
        await atualizarGastos([g], { ...base, valor, cartao: cred ? f.cartao : null, mesFatura: cred ? idxYm(f.mesFatura) : f.data.slice(0, 7), tipoLancamento: cred && f.reembolso ? 'reembolso' : 'gasto' });
      }
      fechar(); toast(`Alterações salvas. ${f.usuario === 'Diego' ? 'Eliane' : 'Diego'} já vê.`);
    } catch (e) { toast('Erro ao salvar: ' + (e as Error).message); }
  };

  return (
    <Sheet onClose={fechar} titulo="Editar">
      <h3>Editar {grupo ? 'compra parcelada' : 'gasto'}</h3>
      <div className="form-ed">
        <div><label className="l" htmlFor="eDesc">Local / Estabelecimento</label><input className="inp" id="eDesc" value={f.descricao} onChange={e => set({ descricao: e.target.value })} /></div>
        <div className="row2"><div><label className="l" htmlFor="eVal">{f.parcelado && cred ? 'Valor total' : 'Valor'}</label><input className="inp num" id="eVal" inputMode="decimal" value={f.valor} onChange={e => set({ valor: e.target.value })} /></div>
          <div><label className="l" htmlFor="eData">Data da compra</label><input className="inp" type="date" id="eData" value={f.data} onChange={e => set({ data: e.target.value })} /></div></div>
        <div className="row2"><div><label className="l" htmlFor="eCat">Categoria</label><select className="inp" id="eCat" value={f.categoria} onChange={e => set({ categoria: e.target.value, subcategoria: '' })}>{categorias.map(c => <option key={c.nome}>{c.nome}</option>)}</select></div>
          <div><label className="l" htmlFor="eSub">Subcategoria</label><select className="inp" id="eSub" value={f.subcategoria} onChange={e => set({ subcategoria: e.target.value })}><option value="">—</option>{subs.map(s => <option key={s}>{s}</option>)}</select></div></div>
        <div><label className="l" htmlFor="eObs">Detalhes (opcional)</label><input className="inp" id="eObs" value={f.observacao} onChange={e => set({ observacao: e.target.value })} /></div>
        <div><label className="l">Quem</label><Seg className="tog" valor={f.usuario} opcoes={PESSOAS.map(p => [p, <PessoaRot key={p} p={p} />])} onChange={v => set({ usuario: v })} /></div>
        <div><label className="l">Pagamento</label><Seg className="tog" valor={f.formaPagamento} opcoes={FORMAS_PAGAMENTO.map(p => [p.valor, <Rot key={p.valor} ic={p.icone}>{p.curto}</Rot>])} onChange={v => set({ formaPagamento: v, data: f.data })} /></div>
        {cred && <>
          <div><label className="l">Cartão</label><div className="cc-pick">{cartoes.map(c => <CartaoMini key={c.nome} nome={c.nome} banco={c.banco} selecionado={c.nome === f.cartao} onClick={() => set({ cartao: c.nome })} />)}</div></div>
          <div className="row2">
            <div><label className="l">{f.parcelado && !f.reembolso ? '1ª parcela na fatura de' : 'Fatura'}</label>
              <div className="mesadj"><button onClick={() => set({ mesFatura: f.mesFatura - 1, mesManual: true })} aria-label="Mês anterior"><Icone nome="esq" tam={18} /></button><div className="m">{idxCurto(f.mesFatura)}<small>{f.mesManual ? 'ajustado' : 'pelo fechamento'}</small></div><button onClick={() => set({ mesFatura: f.mesFatura + 1, mesManual: true })} aria-label="Próximo mês"><Icone nome="dir" tam={18} /></button></div></div>
            <div><label className="l">Forma</label><Seg className="tog" valor={f.reembolso ? 'reemb' : f.parcelado ? 'parc' : 'vista'} opcoes={[['vista', 'À vista'], ['parc', 'Parcelado'], ['reemb', 'Estorno']]} onChange={v => set({ parcelado: v === 'parc', reembolso: v === 'reemb' })} /></div>
          </div>
          {f.parcelado && !f.reembolso && <div className="parc-in" style={{ marginTop: 0 }}><label className="l" htmlFor="eN" style={{ margin: 0 }}>Número de parcelas</label><input className="inp num" id="eN" type="number" min={2} max={99} value={f.n} onChange={e => set({ n: e.target.value })} /><span className="hint">recalcula todas as parcelas</span></div>}
        </>}
      </div>
      <div className="acts2"><button className="btn sec2" onClick={fechar}>Cancelar</button><button className="btn" onClick={salvar}>Salvar</button></div>
    </Sheet>
  );
}

// ===== compra parcelada: parcelas, antecipar, excluir =====
function CompraSheet({ grupoId, fechar, ir }: { grupoId: string; fechar: () => void; ir: (a: Aberto) => void }) {
  const { gastos, faturaAtual } = useCasa();
  const toast = useToast();
  const c = comprasParceladas(gastos.filter(g => g.grupoId === grupoId), faturaAtual)[0];
  const [antec, setAntec] = useState(false);
  const futuras = c ? c.parcelas.filter(p => ymIdx(p.mesFatura) > faturaAtual) : [];
  const [qtd, setQtd] = useState(futuras.length);
  const somaUlt = (k: number) => futuras.slice(-k).reduce((s, p) => s + p.valor, 0);
  const [pago, setPago] = useState(somaUlt(futuras.length).toFixed(2).replace('.', ','));
  if (!c) return null;
  const mudaQtd = (k: number) => { const q = Math.max(1, Math.min(futuras.length, k)); setQtd(q); setPago(somaUlt(q).toFixed(2).replace('.', ',')); };
  const antecipar = async () => {
    const alvo = futuras.slice(-qtd), v = lerValor(pago) || somaUlt(qtd), fator = v / somaUlt(qtd);
    let ac = 0;
    try {
      // cada parcela antecipada vai para a fatura atual, com o desconto distribuído; marcada para aparecer como "antecipada"
      for (let i = 0; i < alvo.length; i++) {
        const valor = i === alvo.length - 1 ? Number((v - ac).toFixed(2)) : Number((alvo[i].valor * fator).toFixed(2)); ac += valor;
        await atualizarGastos([alvo[i]], { mesFatura: idxYm(faturaAtual), valor, antecipada: true } as Partial<Gasto>);
      }
      fechar(); toast(`${qtd} parcela${qtd > 1 ? 's' : ''} antecipada${qtd > 1 ? 's' : ''} para ${idxCurto(faturaAtual)}`);
    } catch (e) { toast('Erro: ' + (e as Error).message); }
  };
  return (
    <Sheet onClose={fechar} titulo={c.descricao}>
      <h3>{c.descricao}</h3>
      <div className="note">{c.usuario} · {c.categoria}{c.subcategoria ? ` › ${c.subcategoria}` : ''} · {c.cartao} · {c.n}x de {brl(c.valorParcela)} · total {brl(c.total)}</div>
      <div className="plist">
        {c.parcelas.map(p => { const i = ymIdx(p.mesFatura); const ant = (p as Gasto & { antecipada?: boolean }).antecipada;
          return <div key={p.id} className={'pl' + (i === faturaAtual ? ' cur' : '')}><b className="num">{p.parcelaAtual}/{c.n}</b><span>{idxCurto(i)}</span>
            <span className="st" style={{ color: ant ? 'var(--warning)' : i < faturaAtual ? 'var(--success)' : i === faturaAtual ? 'var(--primary)' : 'var(--text-muted)' }}>{ant ? 'antecipada' : i < faturaAtual ? 'paga' : i === faturaAtual ? 'esta fatura' : 'a vencer'}</span>
            <span className="num">{brl(p.valor)}</span></div>; })}
      </div>
      {c.parcelas[0].parcelaAtual! > 1 && <div className="note">Cadastrada a partir da parcela {c.parcelas[0].parcelaAtual}.</div>}
      {antec && (
        <div className="antec"><b>Antecipar parcelas</b><div className="note">As últimas parcelas saem dos meses futuros e entram de uma vez na fatura de {idxCurto(faturaAtual)}.</div>
          <div className="stepper"><span>Quantas</span><div className="box"><button onClick={() => mudaQtd(qtd - 1)}>−</button><input type="number" value={qtd} onChange={e => mudaQtd(Number(e.target.value))} /><button onClick={() => mudaQtd(qtd + 1)}>+</button></div><span>de {futuras.length}</span></div>
          <div><label className="l" htmlFor="aVal">Valor cobrado (com desconto)</label><input className="inp num" id="aVal" inputMode="decimal" value={pago} onChange={e => setPago(e.target.value)} /></div>
          <button className="btn" onClick={antecipar}>Confirmar antecipação</button></div>
      )}
      <div className="acts">
        {futuras.length > 0 && !antec && <button className="btn sec2" onClick={() => setAntec(true)}>⏩ Antecipar parcelas</button>}
        <button className="btn sec2" onClick={() => ir({ tipo: 'editar', id: c.parcelas[0].id })}><Rot ic="lapis">Editar compra</Rot></button>
        <button className="btn dan" onClick={() => ir({ tipo: 'excluir', id: c.parcelas[0].id })}><Rot ic="lixeira">Excluir</Rot></button>
      </div>
    </Sheet>
  );
}
