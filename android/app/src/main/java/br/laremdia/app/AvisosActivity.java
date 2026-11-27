package br.laremdia.app;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

/** Tela nativa simples para ligar a leitura das notificações do banco (aberta pelo atalho ou por Ajustes no app). */
public class AvisosActivity extends Activity {
    private TextView status;
    private Switch ativo;
    private Button permitir;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        float dp = getResources().getDisplayMetrics().density;
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Color.parseColor("#0b0d14"));
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (22 * dp);
        l.setPadding(pad, (int) (36 * dp), pad, pad);
        sv.addView(l);

        l.addView(texto("Lançar a partir do banco", 22, true, "#ffffff"));
        l.addView(texto("Quando o Inter, Nubank, Mercado Pago ou a carteira do Google avisarem uma compra, o Lar em Dia mostra \"Lançar R$ X?\". Tocando, o lançamento abre com valor, local e cartão preenchidos; é só conferir a categoria e salvar.\n\nO texto das notificações fica só no seu celular.", 15, false, "#a3a9bf"));

        status = texto("", 15, true, "#ffffff");
        l.addView(status);

        permitir = botao("Permitir leitura das notificações", true);
        permitir.setOnClickListener(v -> startActivity(new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")));
        l.addView(permitir);

        l.addView(texto("Se o Android disser \"Configuração restrita\": toque no botão abaixo, depois no menu ⋮ (canto de cima) › \"Permitir configurações restritas\", e volte aqui.", 13, false, "#8b91a8"));
        Button info = botao("Abrir informações do app", false);
        info.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))));
        l.addView(info);

        ativo = new Switch(this);
        ativo.setText("Mostrar o aviso \"Lançar?\"");
        ativo.setTextColor(Color.WHITE);
        ativo.setTextSize(16);
        ativo.setPadding(0, (int) (18 * dp), 0, (int) (8 * dp));
        ativo.setOnCheckedChangeListener((v, on) -> getSharedPreferences(LeitorNotificacoes.PREFS, MODE_PRIVATE).edit().putBoolean("ativo", on).apply());
        l.addView(ativo);

        Button testar = botao("Testar com uma compra de exemplo", false);
        testar.setOnClickListener(v -> {
            pedirPermissaoDeAviso();
            LeitorCompra.Compra c = LeitorCompra.ler("com.google.android.apps.walletnfcrel", "RESTAURANTE EXEMPLO", "R$ 12,34 com Inter ••0000");
            if (c != null) LeitorNotificacoes.avisar(this, c, System.currentTimeMillis(), 1234);
        });
        l.addView(testar);

        Button abrirApp = botao("Abrir o Lar em Dia", false);
        abrirApp.setOnClickListener(v -> { startActivity(new Intent(this, com.google.androidbrowserhelper.trusted.LauncherActivity.class)); finish(); });
        l.addView(abrirApp);

        setContentView(sv);
        pedirPermissaoDeAviso();
    }

    @Override
    protected void onResume() {
        super.onResume();
        boolean ok = leituraLiberada();
        status.setText(ok ? "✓ Leitura das notificações ativada" : "Leitura das notificações desativada");
        status.setTextColor(Color.parseColor(ok ? "#34d399" : "#fbbf24"));
        permitir.setText(ok ? "Rever permissão de leitura" : "Permitir leitura das notificações");
        ativo.setChecked(getSharedPreferences(LeitorNotificacoes.PREFS, MODE_PRIVATE).getBoolean("ativo", true));
    }

    private boolean leituraLiberada() {
        String s = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        return s != null && s.contains(new ComponentName(this, LeitorNotificacoes.class).flattenToString());
    }

    private void pedirPermissaoDeAviso() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
    }

    private TextView texto(String s, int tam, boolean negrito, String cor) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(tam);
        t.setTextColor(Color.parseColor(cor));
        if (negrito) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setLineSpacing(0, 1.15f);
        int p = (int) (8 * getResources().getDisplayMetrics().density);
        t.setPadding(0, p, 0, p);
        return t;
    }

    private Button botao(String s, boolean principal) {
        Button bt = new Button(this);
        bt.setText(s);
        bt.setAllCaps(false);
        bt.setTextSize(15);
        bt.setTextColor(Color.WHITE);
        bt.setGravity(Gravity.CENTER);
        GradientDrawable fundo = new GradientDrawable();
        fundo.setCornerRadius(14 * getResources().getDisplayMetrics().density);
        fundo.setColor(Color.parseColor(principal ? "#4f46e5" : "#232838"));
        bt.setBackground(fundo);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (int) (52 * getResources().getDisplayMetrics().density));
        lp.topMargin = (int) (10 * getResources().getDisplayMetrics().density);
        bt.setLayoutParams(lp);
        bt.setStateListAnimator(null);
        bt.setVisibility(View.VISIBLE);
        return bt;
    }
}
