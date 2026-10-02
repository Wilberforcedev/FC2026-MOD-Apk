import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wilberforcedev.fc2026',
  appName: 'FC 2026 Soccer',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#0a0d14',
    allowMixedContent: false,
  },
};

export default config;
