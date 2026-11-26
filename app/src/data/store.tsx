import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, refCasa, refGastos } from './firebase';
import { CARTOES_PADRAO, CATEGORIAS_PADRAO, cartoesDe, categoriasDe } from './padroes';
import type { Cartao, Categoria, Gasto, NovoGasto } from '../types';
import { montarEstabelecimentos, type Estabelecimento } from '../lib/consultas';
import { mesFaturaPadrao } from '../lib/fatura';

export type Status = 'conectando' | 'online' | 'offline' | 'erro';

interface Casa {
  carregado: boolean;
  status: Status;
  erro?: string;
  categorias: Categoria[];
  cartoes: Cartao[];
  gastos: Gasto[];
  estabelecimentos: Map<string, Estabelecimento>;
  hoje: Date;
  /** Fatura "da vez" (índice de mês), regra do app original. */
  faturaAtual: number;
}

const Ctx = createContext<Casa | null>(null);
export const useCasa = () => { const c = useContext(Ctx); if (!c) throw new Error('useCasa fora do provider'); return c; };

export function CasaProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [status, setStatus] = useState<Status>('conectando');
  const [erro, setErro] = useState<string>();
  const [carregado, setCarregado] = useState(false);
  const [hoje, setHoje] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setHoje(new Date()), 60_000);
    const on = () => setStatus(s => (s === 'offline' ? 'online' : s));
    const off = () => setStatus('offline');
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { clearInterval(t); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const u1 = onSnapshot(refCasa(), async snap => {
      const d = snap.data();
      if (!snap.exists() || !d?.categorias || !d?.cartoes) {
        // mesmo comportamento do app original: cria os padrões só se faltarem
        if (!snap.metadata.fromCache) await setDoc(refCasa(), { ...(d?.categorias ? {} : { categorias: CATEGORIAS_PADRAO }), ...(d?.cartoes ? {} : { cartoes: CARTOES_PADRAO }) }, { merge: true });
        return;
      }
      setCategorias(categoriasDe(d.categorias));
      setCartoes(cartoesDe(d.cartoes));
    }, e => { setStatus('erro'); setErro(e.message); });

    const u2 = onSnapshot(query(refGastos(), orderBy('data', 'desc')), { includeMetadataChanges: true }, snap => {
      setGastos(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Gasto, 'id'>) })));
      setCarregado(true);
      setStatus(navigator.onLine === false ? 'offline' : snap.metadata.fromCache ? 'conectando' : 'online');
    }, e => { setStatus('erro'); setErro(e.message); });
    return () => { u1(); u2(); };
  }, []);

  const valor = useMemo<Casa>(() => ({
    carregado, status, erro, categorias, cartoes, gastos, hoje,
    estabelecimentos: montarEstabelecimentos(gastos),
    faturaAtual: mesFaturaPadrao(hoje, cartoes)
  }), [carregado, status, erro, categorias, cartoes, gastos, hoje]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// ===== gravações (mesmo formato do app original) =====
type SemId = Omit<Gasto, 'id'>;
const semId = (g: Gasto): SemId => { const { id: _id, ...resto } = g; return resto; };

/** Cria lançamentos num único lote. Devolve uma função que desfaz. */
export async function adicionarGastos(novos: NovoGasto[]) {
  const b = writeBatch(db);
  const refs = novos.map(n => { const r = doc(refGastos()); b.set(r, { ...n, criadoEm: serverTimestamp() }); return r; });
  await b.commit();
  return async () => { const d = writeBatch(db); refs.forEach(r => d.delete(r)); await d.commit(); };
}

/** Exclui lançamentos. Devolve uma função que os recria com os mesmos ids (desfazer). */
export async function excluirGastos(lista: Gasto[]) {
  const b = writeBatch(db);
  lista.forEach(g => b.delete(doc(refGastos(), g.id)));
  await b.commit();
  return async () => { const d = writeBatch(db); lista.forEach(g => d.set(doc(refGastos(), g.id), semId(g))); await d.commit(); };
}

/** Troca um conjunto de lançamentos por outro (edição que recalcula parcelas). */
export async function substituirGastos(antigos: Gasto[], novos: NovoGasto[], criadoEm?: unknown) {
  const b = writeBatch(db);
  antigos.forEach(g => b.delete(doc(refGastos(), g.id)));
  novos.forEach(n => b.set(doc(refGastos()), { ...n, criadoEm: criadoEm ?? serverTimestamp(), atualizadoEm: serverTimestamp() }));
  await b.commit();
}

export async function atualizarGastos(lista: Gasto[], campos: Partial<SemId>) {
  const b = writeBatch(db);
  lista.forEach(g => b.update(doc(refGastos(), g.id), { ...campos, atualizadoEm: serverTimestamp() }));
  await b.commit();
}

export async function trocarFatura(g: Gasto, para: string, motivo: string) {
  await updateDoc(doc(refGastos(), g.id), {
    mesFatura: para,
    ajusteFatura: { de: g.mesFatura || '', para, motivo, quando: new Date().toISOString() },
    atualizadoEm: serverTimestamp()
  });
}

export const salvarCategorias = (categorias: Categoria[]) => setDoc(refCasa(), { categorias }, { merge: true });
export const salvarCartoes = (cartoes: Cartao[]) => setDoc(refCasa(), { cartoes }, { merge: true });
