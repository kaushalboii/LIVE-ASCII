package com.kaushalmaran.liveascii;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {

    private static final String CHANNEL_ID = "live_ascii_widget_channel";
    private static final int NOTIFICATION_ID = 1001;

    private WindowManager windowManager;
    private View floatingView;
    private WindowManager.LayoutParams params;

    private View expandedView;
    private View collapsedView;
    private WebView webView;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @SuppressLint({"InflateParams", "SetJavaScriptEnabled", "ClickableViewAccessibility"})
    @Override
    public void onCreate() {
        super.onCreate();

        startInForeground();

        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        floatingView = LayoutInflater.from(this).inflate(R.layout.layout_floating_widget, null);

        int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 80;
        params.y = 160;

        expandedView = floatingView.findViewById(R.id.widget_expanded_view);
        collapsedView = floatingView.findViewById(R.id.widget_collapsed_view);
        webView = floatingView.findViewById(R.id.widget_webview);

        setupWebView();
        setupDragAndControls();

        windowManager.addView(floatingView, params);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        webView.setBackgroundColor(0xFF000000);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.loadUrl("file:///android_asset/index.html");
    }

    @SuppressLint("ClickableViewAccessibility")
    private void setupDragAndControls() {
        View dragBar = floatingView.findViewById(R.id.widget_drag_bar);
        dragBar.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(floatingView, params);
                        return true;
                }
                return false;
            }
        });

        // Close button
        floatingView.findViewById(R.id.btn_close).setOnClickListener(v -> stopSelf());

        // Minimize button (collapses to small badge)
        floatingView.findViewById(R.id.btn_minimize).setOnClickListener(v -> {
            expandedView.setVisibility(View.GONE);
            collapsedView.setVisibility(View.VISIBLE);
        });

        // Click badge to expand back
        collapsedView.setOnClickListener(v -> {
            collapsedView.setVisibility(View.GONE);
            expandedView.setVisibility(View.VISIBLE);
        });

        // Drag badge across screen
        collapsedView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private boolean isClick = true;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isClick = true;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        int dx = (int) (event.getRawX() - initialTouchX);
                        int dy = (int) (event.getRawY() - initialTouchY);
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) isClick = false;
                        params.x = initialX + dx;
                        params.y = initialY + dy;
                        windowManager.updateViewLayout(floatingView, params);
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (isClick) v.performClick();
                        return true;
                }
                return false;
            }
        });
    }

    private void startInForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "LIVE ASCII Rose Floating Widget",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("LIVE ASCII Rose Active")
                .setContentText("Touch or drag the floating widget on your screen")
                .setSmallIcon(R.drawable.ic_stat_rose)
                .setContentIntent(pendingIntent)
                .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingView != null && windowManager != null) {
            windowManager.removeView(floatingView);
        }
        if (webView != null) {
            webView.destroy();
        }
    }
}
