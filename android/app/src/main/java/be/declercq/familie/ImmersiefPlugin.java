package be.declercq.familie;

import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Systeembalken verbergen (immersive sticky) of terugzetten; een veeg van de rand toont ze even. */
@CapacitorPlugin(name = "Immersief")
public class ImmersiefPlugin extends Plugin {
    @PluginMethod
    public void zet(PluginCall call) {
        boolean aan = Boolean.TRUE.equals(call.getBoolean("aan", false));
        getActivity().runOnUiThread(() -> {
            Window venster = getActivity().getWindow();
            // setDecorFitsSystemWindows niet aanraken: Capacitor (SystemBars) beheert de randen en het toetsenbord zelf;
            // erin ingrijpen gaf op de ouder-gsm kapotte formulieren en selects.
            WindowInsetsControllerCompat beheer = WindowCompat.getInsetsController(venster, venster.getDecorView());
            if (aan) {
                beheer.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                beheer.hide(WindowInsetsCompat.Type.systemBars());
            } else {
                beheer.show(WindowInsetsCompat.Type.systemBars());
            }
            call.resolve();
        });
    }
}
