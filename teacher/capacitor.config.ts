import type { CapacitorConfig } from '@capacitor/cli';

// A separate app id from the student app on purpose: a teacher and a student
// may share a phone, and both apps must be installable side by side.
const config: CapacitorConfig = {
  appId: 'com.vidya.teacher',
  appName: 'Vidya Teacher',
  webDir: 'dist'
};

export default config;
