package biz.todoest.app;

import android.app.KeyguardManager;
import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LockScreen")
public class LockScreenPlugin extends Plugin {

    @PluginMethod
    public void isLocked(PluginCall call) {
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        boolean locked = km != null && km.isKeyguardLocked();
        JSObject ret = new JSObject();
        ret.put("locked", locked);
        call.resolve(ret);
    }
}
