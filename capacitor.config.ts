import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.salasituacional.app',
  appName: 'Sala Situacional',
  webDir: 'out',
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: false,
    },
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
