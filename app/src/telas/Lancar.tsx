import { useEffect, useMemo, useRef, useState } from 'react';
import { adicionarGastos, useCasa } from '../data/store';
import { brl, hojeISO, idxCurto, idxYm, ymIdx } from '../lib/datas';
import { calcularMesFatura, dividirEmParcelas, gerarParcelas } from '../lib/fatura';
import { buscarDuplicata, buscarSugestoes, normalizarChave, parcelasPorMes, type Estabelecimento } from '../lib/consultas';
import { FORMAS_PAGAMENTO, PESSOAS, type FormaPagamento, type Gasto, type Pessoa } from '../types';
import { Seg, useToast } from '../ui/base';
import { GraficoParcelas } from './Parcelas';

const LS_QUEM = 'lar-em-dia:quem';
const lerQuem = (): Pessoa => { try { return (localStorage.getItem(LS_QUEM) as Pessoa) || 'Diego'; } catch { return 'Diego'; } };

export function Lancar({ aoSalvar }: { aoSalvar: () => void }) {
  const { categorias, cartoes, gastos, estabelecimentos, faturaAtual } = useCasa();
  const toast = useToast();
  const [quem, setQuem] = useState<Pessoa>(lerQuem);
  const [centavos, setCentavos] = useState(0);
  const [desc, setDesc] = useState('');
  const [categoria, setCategoria] = useState('');
  const [sub, setSub] = useState('');
  const [obs, setObs] = useState('');
  const [verObs, setVerObs] = useState(false);
  const [pag, setPag] = useState<FormaPagamento>('Cartão Crédito');
  const [cartao, setCartao] = useState('');
  const [dataSimples, setDataSimples] = useState(hojeISO());
  const [dataCompra, setDataCompra] = useState(hojeISO());
  const [mesManual, setMesManual] = useState<number | null>(null);
  const [parcelado, setParcelado] = useState(false);
  const [nTxt, setNTxt] = useState('');
  const [modoValor, setModoValor] = useState<'total' | 'parcela'>('total');
  const [andamento, setAndamento] = useState(false);
  const [k, setK] = useState(2);
  const [reemb, setReemb] = useState(false);
  const [dup, setDup] = useState<Gasto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [sugIdx, setSugIdx] = useState(-1);
  const [sugAberta, setSugAberta] = useState(false);
  const nRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(LS_QUEM, quem); } catch { /* sem armazenamento */ } }, [quem]);
  useEffect(() => { if (!categoria && categorias.length) setCategoria(categorias[0].nome); }, [categorias, categoria]);
  useEffect(() => { if (!cartoes.some(c => c.nome === cartao) && cartoes.length) setCartao(cartoes[0].nome); }, [cartoes, cartao]);

  const cred = pag === 'Cartão Crédito';
  const nNum = parseInt(nTxt);
  const n = cred && !reemb && parcelado && nNum >= 2 && nNum <= 99 ? nNum : 1;
  const nInvalido = parcelado && nTxt !== '' && !(nNum >= 2 && nNum <= 99);
  const c = cartoes.find(x => x.nome === cartao);
  const mesAuto = ymIdx(calcularMesFatura(dataCompra || hojeISO(), c));
  const prim = mesManual ?? mesAuto;
  const v = centavos / 100;
  const total = modoValor === 'parcela' && n > 1 ? Math.round(v * n * 100) / 100 : v;
  const kEf = andamento && n > 1 ? Math.min(k, n) : 1;
  const vps = n > 1 ? dividirEmParcelas(total, n) : [total];
  const ultimo = prim + (n - kEf);
  const subs = categorias.find(x => x.nome === categoria)?.subs ?? [];
  const sugestoes = useMemo(() => buscarSugestoes(estabelecimentos, desc), [estabelecimentos, desc]);
  const atalhos = useMemo(() => [...estabelecimentos.values()].filter(e => e.categoria && e.count >= 2).sort((a, b) => b.count - a.count).slice(0, 6), [estabelecimentos]);
  const compromisso = useMemo(() => parcelasPorMes(gastos), [gastos]);

  const aplicar = (e: Estabelecimento) => {
    setDesc(e.nome); setSugAberta(false);
    if (e.categoria && categorias.some(x => x.nome === e.categoria)) { setCategoria(e.categoria); setSub(e.subcategoria ?? ''); }
    if (e.formaPagamento) { setPag(e.formaPagamento); if (e.cartao && cartoes.some(x => x.nome === e.cartao)) setCartao(e.cartao); }
    if (e.valorMedio && !centavos) setCentavos(Math.round(e.valorMedio * 100));
  };

  const limpar = () => {
    setCentavos(0); setDesc(''); setObs(''); setVerObs(false); setSub(''); setParcelado(false); setNTxt(''); setModoValor('total');
    setAndamento(false); setReemb(false); setMesManual(null); setDup(null);
  };

  const salvar = async (forcar = false) => {
    if (!desc.trim()) return toast('Informe o local.');
    if (!(total > 0)) return toast('Informe o valor.');
    if (cred && !c) return toast('Cadastre um cartão em Ajustes → Cartões.');
    if (parcelado && cred && !reemb && n === 1) { nRef.current?.focus(); return toast('Digite o número de parcelas (2 a 99).'); }
    const data = cred ? dataCompra : dataSimples;
    if (!forcar) { const d = buscarDuplicata(gastos, data, total, desc, cred ? cartao : null, reemb); if (d) { setDup(d); return; } }
    const base = { usuario: quem, data, descricao: desc.trim(), categoria: categoria || 'Outros', subcategoria: sub, observacao: obs.trim(), formaPagamento: pag };
    const novos = cred
      ? reemb
        ? [{ ...base, cartao, valor: total, mesFatura: idxYm(prim), parcelaAtual: null, parcelaTotal: null, valorTotalCompra: null, grupoId: null, tipoLancamento: 'reembolso' as const }]
        : gerarParcelas({ ...base, cartao, tipoLancamento: 'gasto' }, { total, n, primeiroMes: idxYm(prim), desdeParcela: kEf })
      : [{ ...base, cartao: null, valor: total, mesFatura: data.slice(0, 7), parcelaAtual: null, parcelaTotal: null, valorTotalCompra: null, grupoId: null, tipoLancamento: 'gasto' as const }];
    setSalvando(true);
    try {
      const desfazer = await adicionarGastos(novos);
      const outro = quem === 'Diego' ? 'Eliane' : 'Diego';
      toast(reemb ? '✓ Estorno lançado' : novos.length > 1 ? `✓ ${novos.length} parcelas criadas. ${outro} já vê.` : `✓ Gasto lançado. ${outro} já vê.`, desfazer);
      limpar(); aoSalvar();
    } catch (e) { toast('Não foi possível salvar: ' + (e as Error).message); }
    finally { setSalvando(false); }
  };

  const hojeV = compromisso.get(faturaAtual) ?? 0;
  const extra = new Map<number, number>();
  if (n > 1) for (let i = kEf - 1; i < n; i++) extra.set(prim + (i - (kEf - 1)), vps[i]);

  return (
    <div className="card">
      <div className="sec">
        <div className="sec-t"><span className="n">1</span>Quem gastou</div>
        <Seg className="tog" valor={quem} opcoes={PESSOAS.map(p => [p, <span key={p} className={p === 'Diego' ? 'd' : 'e'}>{p === 'Diego' ? '👨 Diego' : '👩 Eliane'}</span>])} onChange={setQuem} />
      </div>
      <div className="sec">
        <div className="sec-t"><span className="n">2</span>Quanto</div>
        <input className="inp valor num" inputMode="numeric" autoComplete="off" aria-label="Valor" value={brl(centavos / 100)}
          onChange={e => setCentavos(Number(e.target.value.replace(/\D/g, '').slice(0, 11)) || 0)} />
        {n > 1 && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <Seg className="minitog" valor={modoValor} opcoes={[['total', 'Valor total'], ['parcela', 'Valor de cada parcela']]}
            onChange={m => { setCentavos(m === 'parcela' ? Math.round(centavos / n) : centavos * n); setModoValor(m); }} />
        </div>}
      </div>
      <div className="sec">
        <div className="sec-t"><span className="n">3</span>Onde foi</div>
        <label className="l" htmlFor="desc">Local / Estabelecimento</label>
        <div className="campo-sug">
          <input className="inp" id="desc" autoComplete="off" placeholder="Ex: Havan, Posto Tigrão, Super Viza" value={desc}
            onChange={e => { setDesc(e.target.value); setSugAberta(true); setSugIdx(-1); }} onFocus={() => setSugAberta(true)} onBlur={() => setTimeout(() => setSugAberta(false), 150)}
            onKeyDown={e => {
              if (!sugAberta || !sugestoes.length) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx(i => Math.min(i + 1, sugestoes.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx(i => Math.max(i - 1, -1)); }
              else if (e.key === 'Enter' && sugIdx >= 0) { e.preventDefault(); aplicar(sugestoes[sugIdx]); }
              else if (e.key === 'Escape') setSugAberta(false);
            }} />
          {sugAberta && sugestoes.length > 0 && normalizarChave(desc) !== normalizarChave(sugestoes[0].nome) && (
            <div className="sugestoes">{sugestoes.map((s, i) => (
              <button key={s.nome} type="button" className={i === sugIdx ? 'on' : ''} onMouseDown={e => { e.preventDefault(); aplicar(s); }}>
                <span><b>{s.nome}</b><small>{[s.categoria, s.subcategoria, s.formaPagamento, s.cartao].filter(Boolean).join(' · ')}</small></span><em>{s.count}x</em>
              </button>))}</div>
          )}
        </div>
        {!desc && atalhos.length > 0 && <div className="atalhos">{atalhos.map(a => <button key={a.nome} type="button" onClick={() => aplicar(a)}>{a.nome}</button>)}</div>}
        <div className="row2 st" style={{ marginTop: 12 }}>
          <div><label className="l" htmlFor="cat">Categoria</label><select className="inp" id="cat" value={categoria} onChange={e => { setCategoria(e.target.value); setSub(''); }}>{categorias.map(x => <option key={x.nome}>{x.nome}</option>)}</select></div>
          <div><label className="l" htmlFor="sub">Subcategoria</label><select className="inp" id="sub" value={sub} onChange={e => setSub(e.target.value)}><option value="">—</option>{subs.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <button type="button" className="linkbtn" aria-expanded={verObs} onClick={() => setVerObs(!verObs)}>{verObs ? '− Ocultar detalhes' : '+ Adicionar detalhes (opcional)'}</button>
        {verObs && <div style={{ marginTop: 8 }}><label className="l" htmlFor="obs">Detalhes (o que foi)</label><input className="inp" id="obs" autoFocus value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Abastecimento Carro, Presente para o fulano" /></div>}
      </div>
      <div className="sec">
        <div className="sec-t"><span className="n">4</span>Como pagou</div>
        <Seg className="tog" valor={pag} opcoes={FORMAS_PAGAMENTO.map(f => [f.valor, `${f.emoji} ${f.curto}`])} onChange={setPag} />
      </div>
      {!cred && (
        <div className="sec"><div className="sec-t"><span className="n">5</span>Quando</div>
          <input type="date" className="inp" aria-label="Data" value={dataSimples} onChange={e => setDataSimples(e.target.value)} /></div>
      )}
      {cred && (
        <div className="credito">
          <div><label className="l">Cartão</label>
            {cartoes.length ? <Seg className="tog" valor={cartao} opcoes={cartoes.map(x => [x.nome, <span key={x.nome}>{x.nome}<span className="sub">fecha {x.fechamento} · vence {x.vencimento}</span></span>])} onChange={v => { setCartao(v); setMesManual(null); }} />
              : <div className="note">Cadastre um cartão em Ajustes → Cartões.</div>}</div>
          <div className="row2 st">
            <div><label className="l" htmlFor="dc">Data da compra</label><input type="date" className="inp" id="dc" value={dataCompra} onChange={e => { setDataCompra(e.target.value); setMesManual(null); }} /></div>
            <div><label className="l">{reemb ? 'Desconta na fatura de' : '1ª parcela cai na fatura de'}</label>
              <div className="mesadj"><button type="button" onClick={() => setMesManual(prim - 1)} aria-label="Mês anterior">‹</button>
                <div className="m">{idxCurto(prim)}<small>{mesManual != null && mesManual !== mesAuto ? <span className="tag warn">ajustado</span> : 'pelo fechamento do cartão'}</small></div>
                <button type="button" onClick={() => setMesManual(prim + 1)} aria-label="Próximo mês">›</button></div></div>
          </div>
          {!reemb && <div>
            <label className="l">Forma</label>
            <Seg className="tog" valor={parcelado ? 'p' : 'v'} opcoes={[['v', 'À vista'], ['p', '🔁 Parcelado']]} onChange={x => { setParcelado(x === 'p'); if (x !== 'p' && modoValor === 'parcela') { setCentavos(centavos * n); setModoValor('total'); } }} />
            {parcelado && <div className="parc-in">
              <label className="l" htmlFor="nParc" style={{ margin: 0 }}>Número de parcelas</label>
              <input ref={nRef} id="nParc" autoFocus className={'inp num' + (nInvalido ? ' erro' : '')} type="number" min={2} max={99} inputMode="numeric" placeholder="Ex: 17" value={nTxt} onChange={e => setNTxt(e.target.value)} />
              <span className="hint">de 2 a 99</span></div>}
          </div>}
          {n > 1 && <div>
            <label className="switch"><input type="checkbox" checked={andamento} onChange={e => setAndamento(e.target.checked)} /><span className="sw" />Compra que já está sendo paga</label>
            {andamento && <div className="indent">
              <div className="stepper"><span>A próxima fatura traz a parcela</span>
                <div className="box"><button type="button" onClick={() => setK(Math.max(1, kEf - 1))}>−</button><input type="number" value={kEf} onChange={e => setK(Number(e.target.value) || 1)} aria-label="Parcela atual" /><button type="button" onClick={() => setK(Math.min(n, kEf + 1))}>+</button></div>
                <span>de <b>{n}</b></span></div>
              <div className="note">Entram só as parcelas <b>{kEf} a {n}</b> ({n - kEf + 1} lançamentos). As {kEf - 1} já pagas ficam de fora para não mexer em faturas passadas.</div>
            </div>}
          </div>}
          <div><label className="switch"><input type="checkbox" checked={reemb} onChange={e => setReemb(e.target.checked)} /><span className="sw" />É um estorno / reembolso</label></div>
          {c && total > 0 && (
            <div className="prev" aria-live="polite">
              {reemb ? <div className="prev-h"><div className="big num" style={{ color: 'var(--success)' }}>↩︎ {brl(total)}</div><div className="side2">Descontado da fatura de <b>{idxCurto(prim)}</b></div></div>
                : n === 1 ? <div className="prev-h"><div className="big num">{brl(total)} <span>à vista</span></div><div className="side2">Cai na fatura de <b>{idxCurto(prim)}</b></div></div>
                : <>
                  <div className="prev-h"><div className="big num">{n}x {brl(vps[0])}</div><div className="side2">Total <b className="num">{brl(total)}</b><br />{idxCurto(prim)} → <b>{idxCurto(ultimo)}</b></div></div>
                  <LinhaDoTempo prim={prim} ultimo={ultimo} k={kEf} n={n} vps={vps} />
                  <div className="note">
                    {modoValor === 'parcela' && <>Total: <b>{n} × {brl(vps[0])} = {brl(total)}</b>.<br /></>}
                    {vps[n - 1] !== vps[0] && <>A última parcela fica em <b>{brl(vps[n - 1])}</b> para fechar o total exato.<br /></>}
                    💳 {c.nome} fecha dia {c.fechamento} e vence dia {c.vencimento}.
                  </div>
                  <div className="impacto">
                    <div className="note" style={{ marginBottom: 10 }}>Parcelas de todos os cartões na fatura de {idxCurto(faturaAtual)}: <b className="num">{brl(hojeV)}</b> → <b className="num">{brl(hojeV + (extra.get(faturaAtual) ?? 0))}</b></div>
                    <GraficoParcelas inicio={faturaAtual} extra={extra} altura={80} />
                  </div>
                </>}
            </div>
          )}
        </div>
      )}
      {dup && (
        <div className="aviso warn" style={{ marginBottom: 12 }}>
          ⚠️ Já existe <b>{dup.descricao}</b> de <b>{brl(dup.valorTotalCompra ?? dup.valor)}</b> nesta data, lançado por {dup.usuario}. Confira antes de lançar de novo.
          <div className="acts2" style={{ marginTop: 10 }}><button className="btn sec2 sm" onClick={() => setDup(null)}>Cancelar</button><button className="btn sm" onClick={() => { setDup(null); void salvar(true); }}>Lançar mesmo assim</button></div>
        </div>
      )}
      <button className="btn" disabled={salvando} onClick={() => salvar()}>
        {salvando ? 'Salvando…' : !cred ? '✓ Adicionar gasto' : reemb ? '✓ Lançar estorno' : n > 1 ? `✓ Lançar ${n - kEf + 1} parcelas` : '✓ Adicionar gasto'}
      </button>
    </div>
  );
}

function LinhaDoTempo({ prim, ultimo, k, n, vps }: { prim: number; ultimo: number; k: number; n: number; vps: number[] }) {
  const anos = new Map<number, Map<number, number>>();
  for (let i = k - 1; i < n; i++) { const m = prim + (i - (k - 1)); const a = Math.floor(m / 12); if (!anos.has(a)) anos.set(a, new Map()); anos.get(a)!.set(m % 12, i + 1); }
  return (
    <div className="tl">
      <div className="tl-ano"><span /><div className="tl-cells">{'JFMAMJJASOND'.split('').map((x, i) => <span key={i} className="tl-m">{x}</span>)}</div></div>
      {[...anos.entries()].map(([a, ms]) => (
        <div key={a} className="tl-ano"><span>{a}</span><div className="tl-cells">
          {Array.from({ length: 12 }, (_, m) => { const p = ms.get(m), i = a * 12 + m;
            return p ? <div key={m} className={'cell p' + (i === prim ? ' first' : '') + (i === ultimo ? ' last' : '')} title={`${idxCurto(i)} · parcela ${p}/${n} · ${brl(vps[p - 1])}`}>{p}</div> : <div key={m} className="cell" />; })}
        </div></div>
      ))}
    </div>
  );
}
