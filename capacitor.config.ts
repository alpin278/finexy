import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alfiin.finexy',
  appName: 'Finexy',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
      style: 'DEFAULT',
      hidden: false,
    },
  },
};

export default config;
