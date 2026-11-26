import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icone } from './icones';

// ===== Logo (cada cópia com seu próprio id de gradiente) =====
export function Logo() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f46e5" /><stop offset="1" stopColor="#8b3cf0" /></linearGradient></defs>
      <rect width="512" height="512" rx="116" fill={`url(#${id})`} />
      <path d="M256 108 L414 236 H378 V372 Q378 400 350 400 H162 Q134 400 134 372 V236 H98 Z" fill="#fff" stroke="#fff" strokeWidth="28" strokeLinejoin="round" />
      <path d="M190 312 L238 358 L328 262" fill="none" stroke="#4f46e5" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ===== Toast com "Desfazer" =====
type Desfazer = () => unknown;
const ToastCtx = createContext<(msg: string, desfazer?: Desfazer) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; desfazer?: Desfazer; k: number } | null>(null);
  const timer = useRef<number>();
  const mostrar = useCallback((msg: string, desfazer?: Desfazer) => {
    window.clearTimeout(timer.current);
    setT({ msg, desfazer, k: Date.now() });
    timer.current = window.setTimeout(() => setT(null), desfazer ? 6000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      {t && (
        <div className="toast" role="status" key={t.k}>
          <span>{t.msg}</span>
          {t.desfazer && <button onClick={() => { const d = t.desfazer!; setT(null); void d(); }}>Desfazer</button>}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

// ===== Painel (bottom sheet no celular, janela central na web) =====
export function Sheet({ onClose, titulo, children }: { onClose: () => void; titulo?: string; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="ov" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

// ===== Controle segmentado / chips =====
export function Seg<T extends string>({ valor, opcoes, onChange, className = 'seg' }: { valor: T; opcoes: [T, ReactNode][]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={className} role="tablist">
      {opcoes.map(([v, rot]) => (
        <button key={v} type="button" role="tab" aria-selected={v === valor} className={v === valor ? 'on' : ''} onClick={() => onChange(v)}>{rot}</button>
      ))}
    </div>
  );
}
export function Chips<T extends string>({ valor, opcoes, onChange }: { valor: T; opcoes: [T, ReactNode][]; onChange: (v: T) => void }) {
  return (
    <div className="chips">
      {opcoes.map(([v, rot]) => <button key={v} type="button" className={'chip' + (v === valor ? ' on' : '')} onClick={() => onChange(v)}>{rot}</button>)}
    </div>
  );
}

// ===== Item com deslizar: → revela Excluir, ← revela Editar (igual ao app original). Toque/clique abre as opções. =====
const SW_MAX = 96, SW_LIM = 64;
let abertoAtual: (() => void) | null = null;

export function SwipeItem({ children, onAbrir, onEditar, onExcluir }: { children: ReactNode; onAbrir: () => void; onEditar: () => void; onExcluir: () => void }) {
  const [x, setX] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const st = useRef<{ x0: number; y0: number; base: number; dir: 'h' | 'v' | null; f: number; pid: number } | null>(null);
  const moveu = useRef(false);
  const fechar = useCallback(() => setX(0), []);

  const down = (e: React.PointerEvent) => {
    if (e.button > 0) return;
    if (abertoAtual && abertoAtual !== fechar) abertoAtual();
    st.current = { x0: e.clientX, y0: e.clientY, base: x, dir: null, f: x, pid: e.pointerId };
    moveu.current = false;
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current; if (!s) return;
    const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
    if (!s.dir) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { s.dir = 'h'; setArrastando(true); (e.currentTarget as HTMLElement).setPointerCapture(s.pid); }
      else if (Math.abs(dy) > 10) { st.current = null; return; }
      else return;
    }
    moveu.current = true;
    let f = s.base + dx;
    if (f > SW_MAX) f = SW_MAX + (f - SW_MAX) * 0.3;
    if (f < -SW_MAX) f = -SW_MAX + (f + SW_MAX) * 0.3;
    s.f = f; setX(f);
  };
  const up = () => {
    const s = st.current; st.current = null; setArrastando(false);
    if (!s || s.dir !== 'h') return;
    const alvo = s.f > SW_LIM ? SW_MAX : s.f < -SW_LIM ? -SW_MAX : 0;
    setX(alvo); abertoAtual = alvo ? fechar : null;
  };
  const click = () => {
    if (moveu.current) { moveu.current = false; return; }
    if (x !== 0) { setX(0); return; }
    onAbrir();
  };
  return (
    <div className={'sw-c' + (x !== 0 || arrastando ? ' mov' : '')}>
      <div className="sw-a del"><button type="button" onClick={() => { setX(0); onExcluir(); }}><span><Icone nome="lixeira" tam={22} /></span>Excluir</button></div>
      <div className="sw-a edt"><button type="button" onClick={() => { setX(0); onEditar(); }}><span><Icone nome="lapis" tam={22} /></span>Editar</button></div>
      <div className={'sw-i' + (arrastando ? ' arrastando' : '')} style={{ transform: x ? `translateX(${x}px)` : undefined }}
        role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onAbrir(); }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click}>
        {children}
      </div>
    </div>
  );
}
