import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { app, refCasa } from './firebase';
import type { Pessoa } from '../types';

/**
 * Login com Google.
 * Quem pode usar fica no documento da casa, no campo "membros" ({ email: 'Diego' | 'Eliane' }), e não no código
 * (o código é público no GitHub). No primeiro acesso cada um diz quem é; depois que os dois entraram,
 * qualquer outra conta Google vê "conta não autorizada". As regras do Firestore passam a exigir isso na troca final.
 */
export const auth = getAuth(app);
auth.languageCode = 'pt';

type Estado =
  | { fase: 'carregando' }
  | { fase: 'fora' }
  | { fase: 'escolher'; user: User; livres: Pessoa[] }
  | { fase: 'negado'; user: User }
  | { fase: 'dentro'; user: User; pessoa: Pessoa };

interface Auth { estado: Estado; entrar: () => Promise<void>; sair: () => Promise<void>; sou: (p: Pessoa) => Promise<void>; erro?: string }
const Ctx = createContext<Auth | null>(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('useAuth fora do provider'); return c; };
/** Pessoa da conta logada (só dentro do app). */
export const usePessoaLogada = () => { const { estado } = useAuth(); return estado.fase === 'dentro' ? estado.pessoa : null; };

const normal = (e?: string | null) => (e ?? '').trim().toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [membros, setMembros] = useState<Record<string, Pessoa> | null | undefined>(undefined);
  const [erro, setErro] = useState<string>();

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); if (!u) setMembros(undefined); }), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(refCasa(), s => setMembros((s.data()?.membros as Record<string, Pessoa> | undefined) ?? null),
      e => { setErro(e.message); setMembros(null); });
  }, [user]);

  let estado: Estado = { fase: 'carregando' };
  if (user === null) estado = { fase: 'fora' };
  else if (user && membros !== undefined) {
    const m = membros ?? {};
    const pessoa = m[normal(user.email)];
    if (pessoa) estado = { fase: 'dentro', user, pessoa };
    else {
      const usadas = new Set(Object.values(m));
      const livres = (['Diego', 'Eliane'] as Pessoa[]).filter(p => !usadas.has(p));
      estado = livres.length ? { fase: 'escolher', user, livres } : { fase: 'negado', user };
    }
  }

  const entrar = async () => {
    setErro(undefined);
    const prov = new GoogleAuthProvider();
    prov.setCustomParameters({ prompt: 'select_account' });
    try { await signInWithPopup(auth, prov); }
    catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') await signInWithRedirect(auth, prov);
      else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') setErro(traduzir(code, (e as Error).message));
    }
  };
  const sair = async () => { await signOut(auth); };
  const sou = async (p: Pessoa) => {
    if (!user?.email) return;
    // confere de novo no servidor para os dois não escolherem a mesma pessoa ao mesmo tempo
    const atual = ((await getDoc(refCasa())).data()?.membros ?? {}) as Record<string, Pessoa>;
    if (Object.values(atual).includes(p)) { setErro(`${p} já está ligado a outra conta.`); return; }
    await setDoc(refCasa(), { membros: { [normal(user.email)]: p } }, { merge: true });
  };

  return <Ctx.Provider value={{ estado, entrar, sair, sou, erro }}>{children}</Ctx.Provider>;
}

function traduzir(code: string | undefined, msg: string) {
  switch (code) {
    case 'auth/operation-not-allowed': return 'O login com Google ainda não está ativado no Firebase (Authentication → Método de login → Google).';
    case 'auth/unauthorized-domain': return 'Este endereço ainda não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).';
    case 'auth/network-request-failed': return 'Sem conexão com a internet. Tente de novo.';
    default: return 'Não foi possível entrar: ' + msg;
  }
}
