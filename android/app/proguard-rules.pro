# Add project specific ProGuard rules here.

# capacitor-firebase/authentication references Facebook SDK optional classes.
# We don't use Facebook login, so suppress missing class errors.
-dontwarn com.facebook.**
-keep class com.facebook.** { *; }

# Capacitor WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep R8 from stripping Capacitor plugin interfaces
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Firebase SDK
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google API Client
-keep class com.google.api.** { *; }
-dontwarn com.google.api.**

# Gson serialization
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.briodo.** { *; }
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
