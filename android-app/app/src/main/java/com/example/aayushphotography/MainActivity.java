package com.example.aayushphotography;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "AayushPhotographyApp";

    // Default LAN URL pointing to your laptop running the React Frontend Vite server.
    public static final String DEFAULT_SERVER_URL = "http://192.168.1.7:5173";
    private static final String PREFS_NAME = "AayushPhotoPrefs";
    private static final String KEY_SERVER_URL = "server_url";

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout layoutError;
    private TextView tvCurrentUrl;
    private TextView tvErrorMessage;
    private Button btnRetry;
    private Button btnChangeUrl;

    private SharedPreferences preferences;
    private ValueCallback<Uri[]> filePathCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        preferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // Sanitize any previously saved invalid localhost URL
        sanitizeSavedUrl();

        initViews();
        setupInsets();
        setupFileChooser();
        setupWebView();
        setupBackNavigation();

        loadAppUrl();
    }

    /**
     * Checks if a URL points to localhost or loopback addresses which are invalid on a physical phone
     */
    public static boolean isInvalidLocalhost(String url) {
        if (url == null || url.trim().isEmpty()) return true;
        String lower = url.trim().toLowerCase();
        return lower.contains("localhost") || lower.contains("127.0.0.1") || lower.contains("10.0.2.2");
    }

    /**
     * Removes localhost/127.0.0.1 or stale offline IPs from SharedPreferences if previously saved
     */
    private void sanitizeSavedUrl() {
        String saved = preferences.getString(KEY_SERVER_URL, null);
        if (saved != null && (isInvalidLocalhost(saved) || saved.contains("10.228.26.123"))) {
            preferences.edit().remove(KEY_SERVER_URL).commit();
            Log.w(TAG, "Sanitized and removed invalid/stale IP entry from SharedPreferences: " + saved);
        }
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        layoutError = findViewById(R.id.layoutError);
        tvCurrentUrl = findViewById(R.id.tvCurrentUrl);
        tvErrorMessage = findViewById(R.id.tvErrorMessage);
        btnRetry = findViewById(R.id.btnRetry);
        btnChangeUrl = findViewById(R.id.btnChangeUrl);

        tvCurrentUrl.setText(getServerUrl());

        btnRetry.setOnClickListener(v -> loadAppUrl());
        btnChangeUrl.setOnClickListener(v -> showChangeUrlDialog());
    }

    private void setupInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }

    /**
     * File chooser launcher for handling <input type="file"> on Android
     */
    private void setupFileChooser() {
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (filePathCallback == null) return;

                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        if (result.getData().getClipData() != null) {
                            int count = result.getData().getClipData().getItemCount();
                            results = new Uri[count];
                            for (int i = 0; i < count; i++) {
                                results[i] = result.getData().getClipData().getItemAt(i).getUri();
                            }
                        } else if (result.getData().getData() != null) {
                            results = new Uri[]{result.getData().getData()};
                        }
                    }
                    filePathCallback.onReceiveValue(results);
                    filePathCallback = null;
                }
        );
    }

    /**
     * Configures the WebView for React single-page app (SPA), including DOM Storage for auth tokens
     */
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();

        // 1. Enable JavaScript execution
        webSettings.setJavaScriptEnabled(true);

        // 2. Enable DOM Storage (localStorage & sessionStorage) - Essential for JWT tokens and login
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);

        // 3. Enable file and content access for image/file uploads
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);

        // 4. Viewport & display settings for responsive mobile rendering
        webSettings.setUseWideViewPort(false);
        webSettings.setLoadWithOverviewMode(false);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);

        // Native feel: Disable horizontal scrolling, disable overscroll glow, set dark theme background
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.parseColor("#090909"));

        // 5. Allow Mixed Content (HTTP API calls inside WebView)
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // 6. Cookies support
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Configure WebViewClient to keep navigation inside the app and handle errors
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                layoutError.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                Log.d(TAG, "Page loading started: " + url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                Log.d(TAG, "Page loading finished: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // Only show full error screen if the main frame page itself failed to load
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    webView.setVisibility(View.GONE);
                    layoutError.setVisibility(View.VISIBLE);
                    String currentUrl = getServerUrl();
                    tvCurrentUrl.setText(currentUrl);
                    tvErrorMessage.setText("Could not reach " + currentUrl + "\nError: " + error.getDescription()
                            + "\n\nMake sure your laptop and mobile phone are on the same Wi-Fi network and Vite is running.");
                    Log.e(TAG, "MainFrame Load Error: " + error.getDescription() + " on " + currentUrl);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Open external links (tel, mailto, whatsapp) in external native apps
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Log.e(TAG, "Cannot launch external intent for: " + url, e);
                        return true;
                    }
                }

                // Handle standard HTTP/HTTPS links within the WebView
                return false;
            }
        });

        // Configure WebChromeClient for loading progress, console logs, and file inputs
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("WebConsole", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    fileChooserLauncher.launch(intent);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Cannot open file picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });
    }

    /**
     * Intercepts Android hardware back button so the WebView navigates back in browser history
     * instead of quitting the application.
     */
    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    /**
     * Retrieves the saved server URL or default LAN URL.
     * Prevents ever returning localhost or 127.0.0.1 on a physical device.
     */
    private String getServerUrl() {
        String saved = preferences.getString(KEY_SERVER_URL, null);
        if (saved == null || isInvalidLocalhost(saved) || saved.contains("192.168.1.7")) {
            if (saved != null) {
                preferences.edit().remove(KEY_SERVER_URL).commit();
            }
            return DEFAULT_SERVER_URL;
        }
        return saved.trim();
    }

    /**
     * Loads the target URL into the WebView
     */
    private void loadAppUrl() {
        String url = getServerUrl();
        Log.i(TAG, "Loading URL: " + url);
        if (tvCurrentUrl != null) {
            tvCurrentUrl.setText(url);
        }
        webView.loadUrl(url);
    }

    /**
     * Allows user to easily update the laptop's LAN IP address from their phone without re-compiling!
     */
    private void showChangeUrlDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Configure Server URL");
        builder.setMessage("Active USB Tethering IP: http://10.228.26.123:5173\nWi-Fi IP (when on Wi-Fi): http://192.168.1.7:5173\n\nEnter server URL:");

        final EditText input = new EditText(this);
        String current = getServerUrl();
        input.setText(current);
        input.setSelection(input.getText().length());
        builder.setView(input);

        builder.setPositiveButton("Save & Connect", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (newUrl.isEmpty()) {
                Toast.makeText(this, "URL cannot be empty", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                newUrl = "http://" + newUrl;
            }
            if (isInvalidLocalhost(newUrl)) {
                Toast.makeText(this, "Localhost points to this phone, not your laptop. Please enter your laptop's Wi-Fi IP (e.g. http://192.168.1.7:5173)", Toast.LENGTH_LONG).show();
                return;
            }

            boolean saved = preferences.edit().putString(KEY_SERVER_URL, newUrl).commit();
            Log.i(TAG, "Server URL saved (" + saved + "): " + newUrl);
            if (tvCurrentUrl != null) {
                tvCurrentUrl.setText(newUrl);
            }
            Toast.makeText(this, "Saved: " + newUrl, Toast.LENGTH_SHORT).show();
            loadAppUrl();
        });

        builder.setNegativeButton("Reset to Default", (dialog, which) -> {
            preferences.edit().remove(KEY_SERVER_URL).commit();
            if (tvCurrentUrl != null) {
                tvCurrentUrl.setText(DEFAULT_SERVER_URL);
            }
            Toast.makeText(this, "Reset to: " + DEFAULT_SERVER_URL, Toast.LENGTH_SHORT).show();
            loadAppUrl();
        });

        builder.setNeutralButton("Cancel", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}