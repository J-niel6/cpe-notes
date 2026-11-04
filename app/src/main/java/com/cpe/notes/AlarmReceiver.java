package com.cpe.notes;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        int code = i.getIntExtra("code", 0);
        Alarms.show(c, code, i.getStringExtra("title"), i.getStringExtra("text"));
        Alarms.prefs(c).edit().remove("a" + code).apply();
    }
}
