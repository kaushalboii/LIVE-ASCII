package com.kaushalmaran.liveascii;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class RoseAppWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_rose_layout);

            // Tapping the home screen widget opens MainActivity to play with the live rose
            Intent intent = new Intent(context, MainActivity.class);
            intent.putExtra("auto_launch_widget", true);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.appwidget_container, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
