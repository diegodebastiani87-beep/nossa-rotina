# Lar em Dia (v2)

Nova versão do app de finanças da casa (Diego & Eliane), em Vite + React + TypeScript.
Usa **o mesmo Firebase e os mesmos dados** do app atual (`../index.html`): o documento `casas/{CASA_ID}`
(categorias e cartões) e a subcoleção `gastos`, com os mesmos campos. Os dois apps podem rodar ao mesmo tempo.

## Comandos (dentro desta pasta `app/`)

```
npm install      # uma vez
npm run dev      # abre em http://localhost:5173
npm test         # testes das regras de dinheiro (fatura, parcelas, totais)
npm run build    # gera a pasta dist/ para publicar
npm run icones   # regera os PNGs a partir de public/icon.svg
```

## Onde fica cada coisa

- `src/lib/fatura.ts`: em qual fatura cai a compra, divisão em parcelas, geração dos lançamentos.
- `src/lib/consultas.ts`: totais por mês (da compra ou da fatura), parcelamentos, sugestões, duplicados.
- `src/data/store.tsx`: leitura em tempo real do Firestore e as gravações.
- `src/telas/`: Início, Lançamentos, Lançar, Análise, Faturas/Parcelas, Ajustes e as ações (detalhe, editar, excluir, mudar de fatura).

## Próximas etapas

1. Login Google (Firebase Auth) + regras do Firestore liberando só os e-mails da casa.
2. Publicação automática pelo GitHub Actions.
