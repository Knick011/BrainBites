# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.brainbites.** { *; }
-keep class com.brainbites.timer.** { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
