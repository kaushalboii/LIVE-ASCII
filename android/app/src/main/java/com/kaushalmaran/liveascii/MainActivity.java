package com.kaushalmaran.liveascii;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final int REQUEST_OVERLAY_PERMISSION = 2001;
    private WebView previewWebView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        previewWebView = findViewById(R.id.preview_webview);
        setupPreview();

        Button btnLaunch = findViewById(R.id.btn_launch_widget);
        Button btnStop = findViewById(R.id.btn_stop_widget);

        btnLaunch.setOnClickListener(v -> checkPermissionAndLaunch());
        btnStop.setOnClickListener(v -> stopFloatingWidget());

        // If launched via home screen AppWidget tap
        if (getIntent() != null && getIntent().getBooleanExtra("auto_launch_widget", false)) {
            checkPermissionAndLaunch();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupPreview() {
        WebSettings settings = previewWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        previewWebView.setWebChromeClient(new WebChromeClient());
        previewWebView.setWebViewClient(new WebViewClient());
        previewWebView.setBackgroundColor(0xFF000000);
        previewWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        previewWebView.loadUrl("file:///android_asset/index.html");
    }

    private void checkPermissionAndLaunch() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Please enable 'Display over other apps' to use the floating widget", Toast.LENGTH_LONG).show();
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())
                );
                startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION);
                return;
            }
        }
        startFloatingWidget();
    }

    private void startFloatingWidget() {
        Intent intent = new Intent(this, FloatingWidgetService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
        Toast.makeText(this, "Floating Rose Widget launched! You can drag it anywhere.", Toast.LENGTH_SHORT).show();
        // Minimize activity so user sees the widget on home screen
        moveTaskToBack(true);
    }

    private void stopFloatingWidget() {
        Intent intent = new Intent(this, FloatingWidgetService.class);
        stopService(intent);
        Toast.makeText(this, "Floating Rose Widget closed", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_OVERLAY_PERMISSION) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(this)) {
                    startFloatingWidget();
                } else {
                    Toast.makeText(this, "Permission not granted. Widget cannot float over home screen.", Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (previewWebView != null) {
            previewWebView.destroy();
        }
    }
}
