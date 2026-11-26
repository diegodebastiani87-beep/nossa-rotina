import { useState } from 'react';
import { salvarCartoes, salvarCategorias, useCasa } from '../data/store';
import { CORES_SUGERIDAS } from '../data/padroes';
import type { Cartao, Categoria } from '../types';
import { Seg, useToast } from '../ui/base';

export function Ajustes() {
  const [sub, setSub] = useState<'cartoes' | 'categorias'>('cartoes');
  return <>
    <Seg valor={sub} onChange={setSub} opcoes={[['cartoes', '💳 Cartões'], ['categorias', '📂 Categorias']]} />
    {sub === 'cartoes' ? <Cartoes /> : <Categorias />}
  </>;
}

const dia = (s: string) => { const n = parseInt(s); return n >= 1 && n <= 31 ? n : null; };

function Cartoes() {
  const { cartoes } = useCasa();
  const toast = useToast();
  const [novo, setNovo] = useState({ nome: '', f: '', v: '' });
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const gravar = async (lista: Cartao[], msg?: string, desfazer?: () => unknown) => {
    try { await salvarCartoes(lista); if (msg) toast(msg, desfazer); } catch (e) { toast('Erro: ' + (e as Error).message); }
  };
  const mudar = (i: number, campo: 'fechamento' | 'vencimento', valor: string) => {
    const d = dia(valor); if (!d || cartoes[i][campo] === d) return;
    void gravar(cartoes.map((c, j) => j === i ? { ...c, [campo]: d } : c), `✓ ${campo === 'fechamento' ? 'Fechamento' : 'Vencimento'} de ${cartoes[i].nome} atualizado`);
  };
  return (
    <div className="grid2">
      <div className="card"><h2>Meus cartões</h2>
        {cartoes.length ? cartoes.map((c, i) => (
          <div key={c.nome} className="cartao-row"><span className="cartao-ic" /><div>
            <div className="nm"><span>{c.nome}</span>
              <button className="mini-del" onClick={() => {
                if (confirmar !== i) { setConfirmar(i); return; }
                setConfirmar(null); const antes = cartoes;
                void gravar(cartoes.filter((_, j) => j !== i), `Cartão ${c.nome} excluído`, () => salvarCartoes(antes));
              }}>{confirmar === i ? 'Confirmar exclusão' : 'Excluir'}</button></div>
            <div className="dias">
              <div><label className="l" htmlFor={`cf${i}`}>Fecha dia</label><input className="inp num" id={`cf${i}`} type="number" min={1} max={31} defaultValue={c.fechamento} onBlur={e => mudar(i, 'fechamento', e.target.value)} /></div>
              <div><label className="l" htmlFor={`cv${i}`}>Vence dia</label><input className="inp num" id={`cv${i}`} type="number" min={1} max={31} defaultValue={c.vencimento} onBlur={e => mudar(i, 'vencimento', e.target.value)} /></div>
            </div></div></div>
        )) : <div className="vazio">Nenhum cartão cadastrado.</div>}
        <div className="note" style={{ marginTop: 8 }}>Mudar o fechamento vale para as próximas compras. As já lançadas continuam na fatura em que estão.</div>
      </div>
      <div className="card"><h2>Novo cartão</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <div><label className="l" htmlFor="ncNome">Nome do cartão</label><input className="inp" id="ncNome" placeholder="Ex: C6 Eliane" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} /></div>
          <div className="row2">
            <div><label className="l" htmlFor="ncF">Dia fechamento</label><input className="inp num" id="ncF" type="number" min={1} max={31} placeholder="5" value={novo.f} onChange={e => setNovo({ ...novo, f: e.target.value })} /></div>
            <div><label className="l" htmlFor="ncV">Dia vencimento</label><input className="inp num" id="ncV" type="number" min={1} max={31} placeholder="12" value={novo.v} onChange={e => setNovo({ ...novo, v: e.target.value })} /></div>
          </div>
          <button className="btn" onClick={() => {
            const nome = novo.nome.trim(), f = dia(novo.f), v = dia(novo.v);
            if (!nome || !f || !v) return toast('Preencha nome, fechamento e vencimento (1 a 31).');
            if (cartoes.some(c => c.nome === nome)) return toast('Já existe um cartão com esse nome.');
            setNovo({ nome: '', f: '', v: '' });
            void gravar([...cartoes, { nome, fechamento: f, vencimento: v }], `✓ Cartão ${nome} adicionado`);
          }}>+ Adicionar cartão</button>
        </div>
      </div>
    </div>
  );
}

function Categorias() {
  const { categorias, gastos } = useCasa();
  const toast = useToast();
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [nova, setNova] = useState({ nome: '', cor: '#607d8b' });
  const [novaSub, setNovaSub] = useState<Record<string, string>>({});
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [confCores, setConfCores] = useState(false);
  const gravar = async (lista: Categoria[], msg?: string, desfazer?: () => unknown) => {
    try { await salvarCategorias(lista); if (msg) toast(msg, desfazer); } catch (e) { toast('Erro: ' + (e as Error).message); }
  };
  const troca = (i: number, c: Categoria) => categorias.map((x, j) => j === i ? c : x);
  const podeSugerir = categorias.some(c => CORES_SUGERIDAS[c.nome] && CORES_SUGERIDAS[c.nome] !== c.cor);

  return <>
    <div className="card">
      <h2>Nova categoria</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'end' }}>
        <div><label className="l" htmlFor="nCat">Nome</label><input className="inp" id="nCat" placeholder="Ex: Pets" value={nova.nome} onChange={e => setNova({ ...nova, nome: e.target.value })} /></div>
        <div><label className="l" htmlFor="nCor">Cor</label><input type="color" className="colorin" id="nCor" value={nova.cor} onChange={e => setNova({ ...nova, cor: e.target.value })} /></div>
        <button className="btn sm" onClick={() => {
          const nome = nova.nome.trim(); if (!nome) return toast('Digite o nome da categoria.');
          if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) return toast('Essa categoria já existe.');
          setNova({ nome: '', cor: '#607d8b' }); setAbertas(new Set([...abertas, nome]));
          void gravar([...categorias, { nome, cor: nova.cor, subs: [] }], `✓ Categoria ${nome} criada`);
        }}>Criar</button>
      </div>
    </div>
    <div className="card">
      <h2>Categorias {podeSugerir && <button className="lk" onClick={() => {
        if (!confCores) { setConfCores(true); return; }
        setConfCores(false); const antes = categorias;
        void gravar(categorias.map(c => ({ ...c, cor: CORES_SUGERIDAS[c.nome] ?? c.cor })), '✓ Cores sugeridas aplicadas', () => salvarCategorias(antes));
      }}>{confCores ? 'Confirmar: trocar as cores' : '🎨 Usar cores sugeridas'}</button>}</h2>
      {categorias.map((c, i) => {
        const ab = abertas.has(c.nome);
        return <div key={c.nome} className={'acc' + (ab ? ' open' : '')}>
          <button className="acc-h" onClick={() => { const s = new Set(abertas); if (ab) s.delete(c.nome); else s.add(c.nome); setAbertas(s); }}>
            <i className="cat-c" style={{ background: c.cor }} /><span>{c.nome}</span><span className="c">{c.subs.length}</span><span className="s">›</span></button>
          {ab && <div className="acc-b">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
              <div><label className="l" htmlFor={`cn${i}`}>Nome</label><input className="inp" id={`cn${i}`} defaultValue={c.nome} onBlur={e => {
                const novo = e.target.value.trim(); if (!novo || novo === c.nome) return;
                if (categorias.some(x => x.nome === novo)) { toast('Já existe.'); e.target.value = c.nome; return; }
                setAbertas(new Set([...abertas].map(x => x === c.nome ? novo : x)));
                void gravar(troca(i, { ...c, nome: novo }), '✓ Categoria renomeada. Os lançamentos antigos continuam com o nome anterior.');
              }} /></div>
              <div><label className="l" htmlFor={`cc${i}`}>Cor</label><input type="color" className="colorin" id={`cc${i}`} defaultValue={c.cor} onBlur={e => { if (e.target.value !== c.cor) void gravar(troca(i, { ...c, cor: e.target.value })); }} /></div>
            </div>
            <div><label className="l">Subcategorias</label><div className="subs">
              {c.subs.length ? c.subs.map((s, j) => <span key={s} className="subchip">{s}<button aria-label={`Remover ${s}`} onClick={() => void gravar(troca(i, { ...c, subs: c.subs.filter((_, k) => k !== j) }), `"${s}" removida`, () => salvarCategorias(categorias))}>✕</button></span>)
                : <span className="note">Sem subcategorias</span>}</div></div>
            <form className="addrow" onSubmit={e => { e.preventDefault(); const s = (novaSub[c.nome] ?? '').trim(); if (!s) return;
              if (c.subs.includes(s)) return toast('Essa subcategoria já existe.');
              setNovaSub({ ...novaSub, [c.nome]: '' }); void gravar(troca(i, { ...c, subs: [...c.subs, s] })); }}>
              <input className="inp" placeholder="Nova subcategoria…" value={novaSub[c.nome] ?? ''} onChange={e => setNovaSub({ ...novaSub, [c.nome]: e.target.value })} aria-label="Nova subcategoria" />
              <button className="btn sm" type="submit">+ Add</button>
            </form>
            <button className="mini-del" style={{ justifySelf: 'start' }} onClick={() => {
              if (confirmar !== c.nome) { setConfirmar(c.nome); return; }
              setConfirmar(null); const antes = categorias;
              void gravar(categorias.filter((_, j) => j !== i), `Categoria ${c.nome} excluída`, () => salvarCategorias(antes));
            }}>{confirmar === c.nome ? (() => { const q = gastos.filter(g => g.categoria === c.nome).length; return q ? `Confirmar: ${c.nome} tem ${q} lançamentos` : 'Confirmar exclusão'; })() : '🗑️ Excluir categoria'}</button>
          </div>}
        </div>;
      })}
    </div>
  </>;
}
