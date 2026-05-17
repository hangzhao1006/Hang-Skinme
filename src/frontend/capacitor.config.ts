import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skinme.app',
  appName: 'SkinMe AI',
  webDir: 'out',
  // For live reload during development, uncomment the server section:
  // server: {
  //   url: 'http://192.168.1.166:3001',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6", // Purple theme color
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#FFFFFF"
    }
  }
};

export default config;
