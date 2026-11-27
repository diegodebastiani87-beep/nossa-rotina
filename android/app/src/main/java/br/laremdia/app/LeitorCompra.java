package br.laremdia.app;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lê o texto de uma notificação de banco/carteira e tenta achar uma compra: valor, local, banco e final do cartão.
 * Java puro (sem Android) para poder ser testado no computador.
 */
public final class LeitorCompra {

    public static final class Compra {
        public double valor;
        public String local = "";
        public String banco = "";      // id do banco como no app (nubank, inter, ...)
        public String dicaCartao = ""; // nome do cartão citado no texto (ex.: "Inter")
        public String finalCartao = "";
        public boolean debito;
        public boolean localCortado;   // o texto veio truncado ("..")

        @Override public String toString() {
            return String.format(Locale.ROOT, "%.2f|%s|%s|%s|%s|%s", valor, local, banco, dicaCartao, finalCartao, debito ? "debito" : "credito");
        }
    }

    /** trecho do pacote do app → id do banco no Lar em Dia */
    private static final String[][] PACOTES = {
        {"com.nu.production", "nubank"}, {"intermedium", "inter"}, {"mercadopago", "mercadopago"}, {"c6bank", "c6"},
        {"com.itau", "itau"}, {"bradesco.next", "next"}, {"bradesco", "bradesco"}, {"santander", "santander"},
        {"gabba.caixa", "caixa"}, {"br.com.bb.", "bb"}, {"btg", "btg"}, {"picpay", "picpay"}, {"uol.ps", "pagbank"},
        {"neon", "neon"}, {"sicredi", "sicredi"}, {"sicoob", "sicoob"}, {"original", "original"}, {"banrisul", "banrisul"},
        {"digio", "digio"}, {"willbank", "will"}, {"nomad", "nomad"}, {"bancopan", "pan"}, {"agibank", "agibank"}, {"safra", "safra"},
        {"porto", "porto"}, {"credicard", "credicard"}
    };
    /** nome citado no texto (carteiras: "com Inter ••4159") → id do banco */
    private static final String[][] NOMES = {
        {"nubank", "nubank"}, {" nu ", "nubank"}, {"inter", "inter"}, {"mercado pago", "mercadopago"}, {"c6", "c6"}, {"itaú", "itau"}, {"itau", "itau"},
        {"bradesco", "bradesco"}, {"santander", "santander"}, {"caixa", "caixa"}, {"ourocard", "bb"}, {"banco do brasil", "bb"},
        {"btg", "btg"}, {"picpay", "picpay"}, {"pagbank", "pagbank"}, {"neon", "neon"}, {"sicredi", "sicredi"}, {"sicoob", "sicoob"},
        {"digio", "digio"}, {"will", "will"}, {"nomad", "nomad"}, {" xp ", "xp"}, {"porto", "porto"}, {"credicard", "credicard"}
    };
    private static final String[] CARTEIRAS = {"walletnfcrel", "samsung.android.spay", "samsung.android.wallet"};

    private static final Pattern VALOR = Pattern.compile("R\\$\\s?(\\d{1,3}(?:\\.\\d{3})+,\\d{2}|\\d+,\\d{2})");
    private static final Pattern FINAL = Pattern.compile("(?:final|terminado em|\\u2022{2,}|\\*{2,})\\s*(\\d{4})", Pattern.CASE_INSENSITIVE);
    private static final Pattern CARTEIRA_TXT = Pattern.compile(
        "R\\$\\s?[\\d.,]+\\s+(?:com|no|via)\\s+(?:o\\s+)?(?:cart[aã]o\\s+)?(.+?)\\s*(?:\\u2022|\\*|final|$)", Pattern.CASE_INSENSITIVE);
    private static final Pattern LOCAL = Pattern.compile(
        "(?:\\bem|\\bna loja|\\bno estabelecimento)\\s+(.+?)(?=\\s+(?:para o|no cart|com o cart|com seu|com cart|foi\\b|[àa]s \\d|em \\d{1,2}/|valor)|\\.{2,}|\\u2026|[.,;!](?:\\s|$)|\\n|$)",
        Pattern.CASE_INSENSITIVE);
    private static final Pattern NAO_E_COMPRA = Pattern.compile(
        "recebe|recebid|estorn|reembols|devolu|dep[oó]sito|cr[eé]dito em conta|fatura (?:fechou|fechada|dispon|venc)|sua fatura|boleto|limite|cashback|rendimento|investi|resgate|pix (?:recebido|enviado)|transfer[eê]ncia|cancelad|negad|recusad|n[aã]o autorizad",
        Pattern.CASE_INSENSITIVE);
    private static final Pattern EH_COMPRA = Pattern.compile("compra|comprou|aprovad|transa[cç][aã]o|gasto|pagamento (?:aprovado|realizado)", Pattern.CASE_INSENSITIVE);
    private static final Pattern DEBITO = Pattern.compile("d[eé]bito", Pattern.CASE_INSENSITIVE);
    private static final Pattern CREDITO = Pattern.compile("cr[eé]dito", Pattern.CASE_INSENSITIVE);

    private LeitorCompra() {}

    /** @return a compra encontrada, ou null se a notificação não parece ser uma compra */
    public static Compra ler(String pacote, String titulo, String texto) {
        if (pacote == null) pacote = "";
        if (titulo == null) titulo = "";
        if (texto == null) texto = "";
        String tudo = (titulo + "\n" + texto).trim();
        Matcher mv = VALOR.matcher(tudo);
        if (!mv.find()) return null;
        if (NAO_E_COMPRA.matcher(tudo).find()) return null;

        Compra c = new Compra();
        c.valor = Double.parseDouble(mv.group(1).replace(".", "").replace(",", "."));
        if (c.valor <= 0) return null;
        String pac = pacote.toLowerCase(Locale.ROOT);
        boolean carteira = false;
        for (String w : CARTEIRAS) if (pac.contains(w)) carteira = true;

        if (carteira) {
            // Google/Samsung Wallet: título = local, texto = "R$ 58,38 com Inter ••4159"
            Matcher mc = CARTEIRA_TXT.matcher(texto);
            if (!mc.find()) return null;
            c.dicaCartao = mc.group(1).trim();
            c.banco = bancoPorNome(c.dicaCartao);
            c.local = titulo.trim();
        } else {
            boolean banco = false;
            for (String[] p : PACOTES) if (pac.contains(p[0])) { c.banco = p[1]; banco = true; break; }
            if (!banco) return null; // só lê apps de bancos conhecidos (evita mensagens, promoções etc.)
            if (!EH_COMPRA.matcher(tudo).find()) return null;
            Matcher ml = LOCAL.matcher(texto);
            while (ml.find()) {
                String l = ml.group(1).trim();
                if (l.isEmpty() || l.matches("(?i)\\d.*|seu .*|sua .*|r\\$.*")) continue;
                c.local = l;
                int fim = ml.end();
                c.localCortado = texto.startsWith("..", fim) || texto.startsWith("\u2026", fim);
                break;
            }
        }
        c.local = limpar(c.local);
        Matcher mf = FINAL.matcher(tudo);
        if (mf.find()) c.finalCartao = mf.group(1);
        c.debito = DEBITO.matcher(tudo).find() && !CREDITO.matcher(tudo).find();
        return c;
    }

    static String bancoPorNome(String s) {
        String t = " " + s.toLowerCase(Locale.forLanguageTag("pt-BR")) + " ";
        for (String[] n : NOMES) if (t.contains(n[0])) return n[1];
        return "";
    }

    static String limpar(String s) {
        return s.replace("\u2026", "").replaceAll("\\.{2,}$", "").replaceAll("\\s+", " ").trim();
    }
}
