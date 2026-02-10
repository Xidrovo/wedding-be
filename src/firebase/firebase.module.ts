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
            process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

            const EMULATOR_PROJECT_ID = 'demo-wedding-project';

            Logger.log(
              `Firestore Emulator connected to project: ${EMULATOR_PROJECT_ID}`,
            );

            const app = admin.initializeApp(
              {
                projectId: EMULATOR_PROJECT_ID,
              },
              'EMULATOR_APP',
            );

            return app;
          }

          const serviceAccountPath = require('path').resolve(
            './service-account.json',
          );
          const fs = require('fs');

          if (fs.existsSync(serviceAccountPath)) {
            logger.log('✅ Loading credentials from service-account.json');
            const serviceAccount = require(serviceAccountPath);
            return admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          }

          logger.warn(
            '⚠️ service-account.json not found, falling back to .env',
          );

          // Fallback to .env
          const firebaseParams = {
            credential: admin.credential.cert({
              projectId: config.projectId,
              privateKey: config.privateKey,
              clientEmail: config.clientEmail,
            }),
          };
          return admin.initializeApp(firebaseParams);
        } catch (error) {
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
