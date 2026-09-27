import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alfiin.finexy',
  appName: 'Finexy',
  webDir: 'dist',
  backgroundColor: '#00000000',
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
  },
};

export default config;
