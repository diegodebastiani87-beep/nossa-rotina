import { BANCOS, bancoDoNome, Icone, varsCartao } from './icones';

/** Cartão pequeno no estilo do banco: usado para escolher o cartão no Lançar e na lista de Ajustes. */
export function CartaoMini({ nome, banco, linha, selecionado, onClick }: { nome: string; banco?: string; linha?: string; selecionado?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={'cc-mini' + (selecionado ? ' sel' : '')} style={varsCartao(nome, banco)} onClick={onClick} aria-pressed={selecionado}>
      <span className="ccm-top"><b>{nome}</b>{selecionado ? <span className="ccm-ok"><Icone nome="check" tam={13} traco={3} /></span> : <span className="cc-chip" />}</span>
      {linha && <small>{linha}</small>}
    </button>
  );
}

/** Prévia grande do cartão (cadastro). */
export function CartaoPrevia({ nome, banco, fechamento, vencimento }: { nome: string; banco?: string; fechamento?: number | null; vencimento?: number | null }) {
  const b = (banco && BANCOS.find(x => x.id === banco)) || bancoDoNome(nome);
  return (
    <div className="cc cc-prev" style={varsCartao(nome || 'Novo cartão', banco)}>
      <div className="cc-top"><b>{nome || 'Nome do cartão'}</b><span className="cc-chip" /></div>
      <div className="cc-k">{b ? b.nome : 'Cor automática'}</div>
      <div className="cc-v">•••• •••• ••••</div>
      <div className="cc-bot"><span>Fecha dia {fechamento || '–'}</span><span>Vence dia {vencimento || '–'}</span></div>
    </div>
  );
}

/** Grade para escolher o banco do cartão; "Automático" usa o nome do cartão para reconhecer. */
export function EscolherBanco({ valor, nome, onChange }: { valor: string; nome: string; onChange: (id: string) => void }) {
  const auto = bancoDoNome(nome);
  return (
    <div className="bancos" role="radiogroup" aria-label="Banco do cartão">
      <button type="button" role="radio" aria-checked={!valor} className={'banco-op' + (!valor ? ' sel' : '')} onClick={() => onChange('')}>
        <span className="bo-sw" style={varsCartao(nome || 'x', auto?.id)} /><span>Automático{auto ? ` (${auto.nome})` : ''}</span>
      </button>
      {BANCOS.map(b => (
        <button key={b.id} type="button" role="radio" aria-checked={valor === b.id} className={'banco-op' + (valor === b.id ? ' sel' : '')} onClick={() => onChange(b.id)}>
          <span className="bo-sw" style={{ background: `linear-gradient(135deg, ${b.a}, ${b.b})` }} /><span>{b.nome}</span>
        </button>
      ))}
    </div>
  );
}
