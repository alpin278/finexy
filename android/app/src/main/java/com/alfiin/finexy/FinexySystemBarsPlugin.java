package com.alfiin.finexy;

import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FinexySystemBars")
public class FinexySystemBarsPlugin extends Plugin {

    static final String TAG = "FinexySystemBars";
    static final String PREFERENCES = "finexy-system-bars";
    static final String DARK_THEME = "dark-theme";

    @PluginMethod
    public void setTheme(PluginCall call) {
        boolean dark = call.getBoolean("dark", false);
        Log.d(TAG, "Plugin method invoked");
        Log.d(TAG, "Received theme=" + (dark ? "dark" : "light"));
        getContext().getSharedPreferences(PREFERENCES, 0).edit().putBoolean(DARK_THEME, dark).apply();

        getBridge().executeOnMainThread(() -> {
            applyTheme(getActivity().getWindow(), dark);
            call.resolve();
        });
    }

    static void applyTheme(Window window, boolean dark) {
        int color = Color.TRANSPARENT;

        Log.d(TAG, "SDK=" + Build.VERSION.SDK_INT);
        Log.d(TAG, "Applying statusBarColor=transparent");
        Log.d(TAG, "Applying navigationBarColor=transparent");

        window.setStatusBarColor(color);
        window.setNavigationBarColor(color);

        int bg = dark ? Color.parseColor("#121210") : Color.parseColor("#FAFAF8");
        window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(bg));
        window.getDecorView().setBackgroundColor(bg);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }
}
