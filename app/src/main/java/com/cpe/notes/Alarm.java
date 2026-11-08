package com.cpe.notes;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class Alarm extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent i) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel("rem", "Recordatorios", NotificationManager.IMPORTANCE_HIGH));
            b = new Notification.Builder(ctx, "rem");
        } else {
            b = new Notification.Builder(ctx);
        }
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        b.setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle("Cpe Notes")
                .setContentText(i.getStringExtra("t"))
                .setContentIntent(pi)
                .setAutoCancel(true);
        nm.notify(i.getIntExtra("id", 0), b.build());
    }
}
