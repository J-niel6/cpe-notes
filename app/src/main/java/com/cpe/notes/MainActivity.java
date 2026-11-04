package com.cpe.notes;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

public class MainActivity extends Activity {

    private static final String NOTIF = "android.permission.POST_NOTIFICATIONS";

    private WebView web;
    private PermissionRequest pending;
    private ValueCallback<Uri[]> fileCb;

    private void js(final String code) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                web.evaluateJavascript(code, null);
            }
        });
    }

    private boolean needNotifPermission() {
        return Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(NOTIF) != PackageManager.PERMISSION_GRANTED;
    }

    class Bridge {
        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(i, "Compartir nota"));
                }
            });
        }

        @JavascriptInterface
        public void setAlarm(int code, String title, String text, String whenMs) {
            try {
                Alarms.schedule(MainActivity.this, code, title, text, Long.parseLong(whenMs));
            } catch (Exception e) {
                // ignorar
            }
        }

        @JavascriptInterface
        public void cancelAlarm(int code) {
            Alarms.cancel(MainActivity.this, code);
        }

        @JavascriptInterface
        public void testNotif() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (needNotifPermission()) {
                        requestPermissions(new String[]{NOTIF}, 3);
                        js("toast('Acepta el permiso y vuelve a probar')");
                    } else {
                        Alarms.show(MainActivity.this, 1, "Cpe Notes", "Las notificaciones funcionan \uD83D\uDD14");
                    }
                }
            });
        }

        @JavascriptInterface
        public void pickPdf() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/pdf");
                    try {
                        startActivityForResult(i, 4);
                    } catch (Exception e) {
                        js("window.onPdfError('no hay selector de archivos')");
                    }
                }
            });
        }
    }

    private String nameOf(Uri uri) {
        String n = "PDF";
        Cursor c = null;
        try {
            c = getContentResolver().query(uri, null, null, null, null);
            if (c != null && c.moveToFirst()) {
                int ix = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (ix >= 0) n = c.getString(ix);
            }
        } catch (Exception e) {
            // nombre por defecto
        } finally {
            if (c != null) c.close();
        }
        return n;
    }

    private void importPdf(final Uri uri) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                PdfRenderer r = null;
                ParcelFileDescriptor fd = null;
                try {
                    File f = new File(getCacheDir(), "import.pdf");
                    InputStream in = getContentResolver().openInputStream(uri);
                    FileOutputStream out = new FileOutputStream(f);
                    byte[] buf = new byte[16384];
                    int n;
                    while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                    in.close();
                    out.close();

                    fd = ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
                    r = new PdfRenderer(fd);
                    int real = r.getPageCount();
                    int total = Math.min(real, 100);
                    js("window.onPdfStart(" + JSONObject.quote(nameOf(uri)) + "," + total + "," + real + ")");

                    for (int i = 0; i < total; i++) {
                        PdfRenderer.Page p = r.openPage(i);
                        int w = 1100;
                        int h = Math.max(1, Math.round((float) w * p.getHeight() / p.getWidth()));
                        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
                        bm.eraseColor(Color.WHITE);
                        p.render(bm, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                        p.close();
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        bm.compress(Bitmap.CompressFormat.JPEG, 82, bo);
                        bm.recycle();
                        String b64 = Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
                        js("window.onPdfPage(" + i + ",\"data:image/jpeg;base64," + b64 + "\")");
                        Thread.sleep(150);
                    }
                } catch (Exception e) {
                    String m = e.getMessage() == null ? "" : e.getMessage();
                    js("window.onPdfError(" + JSONObject.quote(m) + ")");
                } finally {
                    try {
                        if (r != null) r.close();
                        if (fd != null) fd.close();
                    } catch (Exception e) {
                        // nada
                    }
                }
            }
        }).start();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#0F0B1F"));
        getWindow().setNavigationBarColor(Color.parseColor("#0F0B1F"));

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        web.addJavascriptInterface(new Bridge(), "Android");

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                                == PackageManager.PERMISSION_GRANTED) {
                            request.grant(request.getResources());
                        } else {
                            pending = request;
                            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
                        }
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try {
                    startActivityForResult(params.createIntent(), 2);
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });

        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");

        Alarms.restore(this);
        if (needNotifPermission()) {
            requestPermissions(new String[]{NOTIF}, 3);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == 2 && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        }
        if (req == 4 && res == RESULT_OK && data != null && data.getData() != null) {
            importPdf(data.getData());
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == 1 && pending != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                pending.grant(pending.getResources());
            } else {
                pending.deny();
            }
            pending = null;
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onBack&&window.onBack()", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (!"true".equals(v)) finish();
            }
        });
    }
}
