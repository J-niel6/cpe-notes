package com.cpe.notes;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONObject;

import java.util.Map;

public class Alarms {

    static final String CH = "cpe_reminders";
    static final String PREFS = "cpe_alarms";

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static PendingIntent pi(Context c, int code, String title, String text) {
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction("com.cpe.notes.ALARM." + code);
        i.putExtra("code", code);
        i.putExtra("title", title);
        i.putExtra("text", text);
        return PendingIntent.getBroadcast(c, code, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c, int code, String title, String text, long when) {
        if (when <= System.currentTimeMillis()) return;
        try {
            JSONObject o = new JSONObject();
            o.put("t", title);
            o.put("x", text);
            o.put("w", when);
            prefs(c).edit().putString("a" + code, o.toString()).apply();
        } catch (Exception e) {
            // se programa igualmente
        }
        set(c, code, title, text, when);
    }

    static void set(Context c, int code, String title, String text, long when) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent p = pi(c, code, title, text);
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, p);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, when, p);
            }
        } catch (SecurityException e) {
            // sin permiso de alarma exacta: se usa una alarma normal (puede retrasarse unos minutos)
            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, p);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, when, p);
            }
        }
    }

    static void cancel(Context c, int code) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pi(c, code, "", ""));
        prefs(c).edit().remove("a" + code).apply();
    }

    static void restore(Context c) {
        SharedPreferences p = prefs(c);
        Map<String, ?> all = p.getAll();
        long now = System.currentTimeMillis();
        for (Map.Entry<String, ?> e : all.entrySet()) {
            String k = e.getKey();
            if (!k.startsWith("a")) continue;
            try {
                int code = Integer.parseInt(k.substring(1));
                JSONObject o = new JSONObject((String) e.getValue());
                long w = o.getLong("w");
                if (w > now) {
                    set(c, code, o.getString("t"), o.getString("x"), w);
                } else {
                    show(c, code, o.getString("t"), o.getString("x"));
                    p.edit().remove(k).apply();
                }
            } catch (Exception ex) {
                p.edit().remove(k).apply();
            }
        }
    }

    @SuppressWarnings("deprecation")
    static void show(Context c, int code, String title, String text) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (title == null) title = "Cpe Notes";
        if (text == null) text = "";
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CH, "Recordatorios de notas",
                    NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Avisos de tus notas con fecha y hora");
            ch.enableVibration(true);
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pin = PendingIntent.getActivity(c, code, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, CH)
                : new Notification.Builder(c);
        b.setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(pin);
        if (Build.VERSION.SDK_INT < 26) {
            b.setPriority(Notification.PRIORITY_HIGH);
            b.setDefaults(Notification.DEFAULT_ALL);
        }
        nm.notify(code, b.build());
    }
}
