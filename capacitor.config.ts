import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.subkill.app',
  appName: 'SubKill',
  webDir: 'public',
  server: {
    url: 'https://subkill-theta.vercel.app',
    cleartext: false
  }
};

export default config;
