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
      resize: 'native',
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
    webContentsDebuggingEnabled: false,
    initialFocus: true,
    overrideUserAgent: 'CatchUp-Android',
  },
};

export default config;
