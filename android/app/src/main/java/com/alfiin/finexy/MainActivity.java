package com.alfiin.finexy;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        Log.d(FinexySystemBarsPlugin.TAG, "Registering Capacitor plugin");
        registerPlugin(FinexySystemBarsPlugin.class);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);

        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.TRANSPARENT);
        }

        boolean systemDark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        boolean dark = getSharedPreferences(FinexySystemBarsPlugin.PREFERENCES, MODE_PRIVATE)
            .getBoolean(FinexySystemBarsPlugin.DARK_THEME, systemDark);
        FinexySystemBarsPlugin.applyTheme(getWindow(), dark);
    }
}
