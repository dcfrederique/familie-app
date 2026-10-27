package be.declercq.familie;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImmersiefPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
