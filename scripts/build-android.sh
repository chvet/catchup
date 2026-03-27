#!/bin/bash
echo "=== Building Catch'Up Android ==="

# 1. Sync web assets to Android project
echo "[1/3] Syncing Capacitor..."
npx cap sync android

# 2. Build the APK
echo "[2/3] Building APK..."
cd android
./gradlew assembleDebug

# 3. Output location
echo "[3/3] Done!"
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To install on a connected device:"
echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
