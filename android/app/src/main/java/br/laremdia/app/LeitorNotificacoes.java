package br.laremdia.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

import java.net.URLEncoder;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Escuta as notificações dos apps de banco e da carteira do Google/Samsung. Quando parece uma compra,
 * mostra o aviso "Lançar R$ X?" que abre o Lar em Dia com valor, local e cartão preenchidos.
 * Nada é enviado para fora do celular: o texto só vai para o app quando a pessoa toca no aviso.
 */
public class LeitorNotificacoes extends NotificationListenerService {
    static final String CANAL = "compras";
    static final String PREFS = "avisos";
    private static final long JANELA_MS = 5 * 60 * 1000; // banco + carteira avisam a mesma compra: junta em 5 min

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
            if (!getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("ativo", true)) return;
            Notification n = sbn.getNotification();
            if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
            Bundle ex = n.extras;
            if (ex == null) return;
            String titulo = texto(ex.getCharSequence(Notification.EXTRA_TITLE));
            String corpo = texto(ex.getCharSequence(Notification.EXTRA_BIG_TEXT));
            if (corpo.isEmpty()) corpo = texto(ex.getCharSequence(Notification.EXTRA_TEXT));
            LeitorCompra.Compra c = LeitorCompra.ler(sbn.getPackageName(), titulo, corpo);
            if (c == null) return;
            juntarEAvisar(this, c, sbn.getPostTime());
        } catch (Exception ignorado) {
            // nunca derrubar o serviço por causa de uma notificação estranha
        }
    }

    private static String texto(CharSequence s) { return s == null ? "" : s.toString(); }

    /** Junta avisos da mesma compra (mesmo valor em poucos minutos) e mostra/atualiza um único aviso. */
    static synchronized void juntarEAvisar(Context ctx, LeitorCompra.Compra c, long quando) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, MODE_PRIVATE);
        long centavos = Math.round(c.valor * 100);
        boolean mesma = p.getLong("ult_centavos", -1) == centavos && Math.abs(quando - p.getLong("ult_quando", 0)) < JANELA_MS;
        if (mesma) {
            String localAnt = p.getString("ult_local", "");
            boolean cortadoAnt = p.getBoolean("ult_cortado", false);
            if (c.local.isEmpty() || (c.localCortado && !cortadoAnt) || (!cortadoAnt && !localAnt.isEmpty() && c.localCortado == cortadoAnt && localAnt.length() >= c.local.length())) {
                c.local = localAnt; c.localCortado = cortadoAnt;
            }
            if (c.banco.isEmpty()) c.banco = p.getString("ult_banco", "");
            if (c.dicaCartao.isEmpty()) c.dicaCartao = p.getString("ult_dica", "");
            if (c.finalCartao.isEmpty()) c.finalCartao = p.getString("ult_final", "");
        }
        p.edit().putLong("ult_centavos", centavos).putLong("ult_quando", mesma ? p.getLong("ult_quando", quando) : quando)
            .putString("ult_local", c.local).putBoolean("ult_cortado", c.localCortado).putString("ult_banco", c.banco)
            .putString("ult_dica", c.dicaCartao).putString("ult_final", c.finalCartao).apply();
        avisar(ctx, c, quando, (int) (centavos % 1000000));
    }

    static void avisar(Context ctx, LeitorCompra.Compra c, long quando, int id) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CANAL) == null) {
            NotificationChannel ch = new NotificationChannel(CANAL, "Compras para lançar", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Aviso para lançar uma compra que o banco acabou de notificar");
            nm.createNotificationChannel(ch);
        }
        String valor = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(c.valor);
        String local = c.local.isEmpty() ? "Compra" : capitalizar(c.local);
        String cartao = c.dicaCartao.isEmpty() ? nomeBanco(c.banco) : c.dicaCartao;
        if (!c.finalCartao.isEmpty()) cartao = (cartao + " ••" + c.finalCartao).trim();
        String linha = cartao.isEmpty() ? local : local + " · " + cartao;

        Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(endereco(ctx, c, quando)));
        abrir.setClass(ctx, LauncherActivity.class);
        abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent toque = PendingIntent.getActivity(ctx, id, abrir, flags);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CANAL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_notificacao)
            .setColor(0xFF4F46E5)
            .setContentTitle("Lançar " + valor + "?")
            .setContentText(linha)
            .setContentIntent(toque)
            .setAutoCancel(true)
            .setWhen(quando)
            .setShowWhen(true)
            .addAction(new Notification.Action.Builder(0, "Lançar", toque).build());
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH);
        try { nm.notify(id, b.build()); } catch (SecurityException semPermissao) { /* Android 13+ sem permissão de aviso */ }
    }

    static String endereco(Context ctx, LeitorCompra.Compra c, long quando) {
        String base = ctx.getString(R.string.endereco_lancar); // .../v2/#lancar
        StringBuilder s = new StringBuilder(base).append('?');
        s.append("v=").append(String.format(Locale.ROOT, "%.2f", c.valor));
        if (!c.local.isEmpty()) s.append("&l=").append(cod(c.local));
        if (!c.banco.isEmpty()) s.append("&b=").append(cod(c.banco));
        if (!c.dicaCartao.isEmpty()) s.append("&c=").append(cod(c.dicaCartao));
        if (!c.finalCartao.isEmpty()) s.append("&f=").append(c.finalCartao);
        s.append("&t=").append(c.debito ? "debito" : "credito");
        s.append("&d=").append(new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date(quando)));
        return s.toString();
    }

    private static String cod(String s) {
        try { return URLEncoder.encode(s, "UTF-8"); } catch (Exception e) { return ""; }
    }

    static String capitalizar(String s) {
        StringBuilder r = new StringBuilder();
        for (String w : s.toLowerCase(Locale.forLanguageTag("pt-BR")).split(" ")) {
            if (w.isEmpty()) continue;
            if (r.length() > 0) r.append(' ');
            r.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
        }
        return r.toString();
    }

    private static String nomeBanco(String id) {
        switch (id) {
            case "nubank": return "Nubank";
            case "inter": return "Inter";
            case "mercadopago": return "Mercado Pago";
            case "c6": return "C6";
            case "itau": return "Itaú";
            case "bradesco": return "Bradesco";
            case "santander": return "Santander";
            case "caixa": return "Caixa";
            case "bb": return "Banco do Brasil";
            default: return "";
        }
    }
}
