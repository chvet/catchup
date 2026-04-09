import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.jaeprive.catchup',
  appName: "Catch'Up",
  webDir: 'out',
  server: {
    url: 'https://catchup.jaeprive.fr',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1A2E',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#6C63FF',
      overlaysWebView: false,
    },
  },
  android: {
    backgroundColor: '#1A1A2E',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,  // debug via chrome://inspect
    initialFocus: true,
    // Pas d'override user-agent : garde le user-agent Chrome natif
    // (nécessaire pour la détection iOS dans le code visio et la compatibilité WebRTC)
    appendUserAgent: 'CatchUp-Android',  // ajoute au lieu de remplacer
  },
};

export default config;
