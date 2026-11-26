package br.laremdia.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** Widget de um botão: abre o Lar em Dia direto na tela "Novo gasto". */
public class WidgetGasto extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager gerente, int[] ids) {
        Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(ctx.getString(R.string.endereco_lancar)));
        abrir.setClass(ctx, LauncherActivity.class);
        abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent toque = PendingIntent.getActivity(ctx, 0, abrir, flags);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_gasto);
            v.setOnClickPendingIntent(R.id.widget_botao, toque);
            gerente.updateAppWidget(id, v);
        }
    }
}
