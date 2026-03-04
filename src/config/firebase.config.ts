import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => ({
  projectId: process.env.FB_APP_PROJECT_ID,
  privateKey: process.env.FB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FB_APP_CLIENT_EMAIL,
  authDomain: process.env.FB_APP_AUTH_DOMAIN,
  useEmulator: process.env.NODE_ENV === 'development',
  emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080',
}));
