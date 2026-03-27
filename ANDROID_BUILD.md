# Catch'Up — Build Android

## Prerequis

1. **Android Studio** : https://developer.android.com/studio
2. Ouvrir Android Studio, installer **SDK 34** (Android 14)
3. Accepter les licences SDK : `sdkmanager --licenses`
4. **Java 17+** (inclus avec Android Studio)

## Premiere initialisation

```bash
# Ajouter la plateforme Android (cree le dossier android/)
npx cap add android

# Synchroniser les assets web
npx cap sync
```

## Developpement

```bash
# Synchroniser apres chaque modification web
npx cap sync

# Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio :
- Selectionner un emulateur ou appareil connecte
- Cliquer **Run** (triangle vert)

## Build APK (debug)

```bash
# Via le script
bash scripts/build-android.sh

# Ou manuellement
npx cap sync android
cd android
./gradlew assembleDebug
```

APK genere dans : `android/app/build/outputs/apk/debug/app-debug.apk`

## Build Release (Play Store)

1. Ouvrir Android Studio : `npx cap open android`
2. **Build** > **Generate Signed Bundle / APK**
3. Choisir **Android App Bundle** (AAB) pour le Play Store
4. Creer ou selectionner un keystore de signature
5. Choisir la variante **release**
6. Le fichier AAB sera dans `android/app/build/outputs/bundle/release/`

## Installation sur appareil

```bash
# Via USB (debug)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Via USB (release)
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Ressources Android (icones)

Les icones doivent etre placees dans :
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

Pour generer les icones :
- Android Studio > **Image Asset Studio** (clic droit sur `res` > New > Image Asset)
- Ou https://icon.kitchen/ (outil en ligne gratuit)

## Configuration

Le fichier `capacitor.config.ts` a la racine controle :
- `appId` : identifiant unique de l'app (`org.fondationjae.catchup`)
- `server.url` : URL du serveur web (production)
- `plugins` : configuration splash screen, notifications, clavier, barre de statut
- `android` : options specifiques Android

## Architecture

```
capacitor.config.ts          — Configuration Capacitor
src/lib/capacitor-bridge.ts  — Bridge JS pour detecter natif vs web
scripts/build-android.sh     — Script de build automatise
android/                     — Projet Android Studio (genere par cap add)
```
