# ✍️ Handwriting Font Studio — React Native

A beautiful skeuomorphic app for capturing your handwriting as a personal font set.
Draw each letter of the alphabet and save it to your collection.

---

## 📋 Prerequisites

Install these on your machine before building:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| JDK | 17 | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |
| React Native CLI | Latest | `npm install -g react-native-cli` |

---

## 🚀 Build Steps

### 1. Install dependencies
```bash
cd HandwritingFontStudio
npm install
```

### 2. Install Android SDK (via Android Studio)
- Open Android Studio → SDK Manager
- Install **Android SDK Platform 34**
- Install **Android SDK Build-Tools 34**
- Install **NDK 26.1.10909125**

### 3. Set environment variables
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 4. Build the debug APK
```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Install on your phone
Enable **USB Debugging** on your Android device, then:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 Build Release APK (for distribution)

### Generate a signing keystore
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Add to `android/gradle.properties`
```
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=yourpassword
MYAPP_UPLOAD_KEY_PASSWORD=yourpassword
```

### Update `android/app/build.gradle` release signingConfig
Change `signingConfig signingConfigs.debug` to `signingConfig signingConfigs.release` in the release buildType.

### Build release APK
```bash
cd android
./gradlew assembleRelease
```

APK at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 Run on Emulator (optional)

```bash
# Start metro bundler
npx react-native start

# In another terminal
npx react-native run-android
```

---

## 🗂 Project Structure

```
HandwritingFontStudio/
├── index.js                  # App entry point
├── src/
│   └── App.tsx               # Main app (all screens + drawing canvas)
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/handwritingfontstudio/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── MainApplication.kt
│   │   │   └── res/values/
│   │   │       ├── strings.xml
│   │   │       └── styles.xml
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
├── package.json
└── README.md
```

---

## ✨ Features

- Draw A–Z in uppercase and lowercase (52 total characters)
- SVG-based freehand drawing canvas with baseline guide
- Characters saved with AsyncStorage (persists across app restarts)
- Mini SVG previews of captured characters
- Progress tracker
- Skeuomorphic dark green UI with animated toasts

---

## 🛠 Troubleshooting

**Gradle build fails?**
```bash
cd android && ./gradlew clean && ./gradlew assembleDebug
```

**`react-native-svg` not linking?**
```bash
npx react-native link react-native-svg
```

**Metro bundler port conflict?**
```bash
npx react-native start --port 8082
```
