package br.laremdia.app;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** Toque no aviso "Lançar R$ X?" (no texto ou no botão): apaga o aviso e abre o Novo gasto preenchido. Não aparece na tela. */
public class AbrirLancamento extends Activity {
    static final String EXTRA_URL = "url";
    static final String EXTRA_AVISO = "aviso";

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Intent i = getIntent();
        int aviso = i.getIntExtra(EXTRA_AVISO, -1);
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (aviso >= 0 && nm != null) nm.cancel(aviso);
        String url = i.getStringExtra(EXTRA_URL);
        if (url != null) {
            Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            abrir.setClass(this, LauncherActivity.class);
            abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(abrir);
        }
        finish();
    }
}
