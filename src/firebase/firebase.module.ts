import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import * as admin from 'firebase-admin';
import firebaseConfig from '../config/firebase.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(firebaseConfig)],
  providers: [
    {
      provide: 'FIREBASE_APP',
      useFactory: (config: ConfigType<typeof firebaseConfig>) => {
        const logger = new Logger('FirebaseModule');
        try {
          if (config.useEmulator) {
            process.env.FIRESTORE_EMULATOR_HOST =
              config.emulatorHost || '127.0.0.1:8080';
            const EMULATOR_PROJECT_ID =
              config.projectId || 'demo-wedding-project';

            return admin.initializeApp(
              { projectId: EMULATOR_PROJECT_ID },
              'EMULATOR_APP',
            );
          }

          if (config.projectId && config.privateKey && config.clientEmail) {
            logger.log('✅ Firebase initialized with .env credentials');
            return admin.initializeApp({
              credential: admin.credential.cert({
                projectId: config.projectId,
                privateKey: config.privateKey,
                clientEmail: config.clientEmail,
              }),
            });
          }

          logger.log('✅ Firebase initialized with Default App Credentials');
          return admin.initializeApp();
        } catch (error: any) {
          logger.error('❌ Firebase Init Error:', error.message);
          throw error;
        }
      },
      inject: [firebaseConfig.KEY],
    },
    {
      provide: 'FIRESTORE',
      useFactory: (
        app: admin.app.App,
        config: ConfigType<typeof firebaseConfig>,
      ) => {
        const firestore = app.firestore();

        // Connect to emulator explicitly if in development mode
        if (config.useEmulator) {
          firestore.settings({
            host: '127.0.0.1:8080',
            ssl: false,
          });
        }

        return firestore;
      },
      inject: ['FIREBASE_APP', firebaseConfig.KEY],
    },
  ],
  exports: ['FIREBASE_APP', 'FIRESTORE'],
})
export class FirebaseModule {}
