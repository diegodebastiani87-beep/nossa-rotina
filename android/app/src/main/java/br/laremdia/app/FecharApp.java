package br.laremdia.app;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

/**
 * Chamado pelo app (laremdia://fechar?m=...) depois de salvar um lançamento que veio do aviso do banco ou do widget:
 * mostra a confirmação e manda o Lar em Dia para o fundo, voltando para o que a pessoa estava fazendo.
 */
public class FecharApp extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Uri u = getIntent().getData();
        String msg = u != null ? u.getQueryParameter("m") : null;
        if (msg != null && !msg.isEmpty()) Toast.makeText(getApplicationContext(), msg, Toast.LENGTH_SHORT).show();
        moveTaskToBack(true);
        finish();
    }
}
