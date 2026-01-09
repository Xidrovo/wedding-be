import { Module, Global } from '@nestjs/common';
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
        try {
          // TRY 1: Load from service-account.json (Recommended for local dev)
          const serviceAccountPath = require('path').resolve('./service-account.json');
          const fs = require('fs');
          
          if (fs.existsSync(serviceAccountPath)) {
            console.log('✅ Loading credentials from service-account.json');
            const serviceAccount = require(serviceAccountPath);
            return admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          }

          // TRY 2: Fallback to .env (For production/CI)
          console.log('⚠️ service-account.json not found, falling back to .env');
          const firebaseParams = {
            credential: admin.credential.cert({
              projectId: config.projectId,
              privateKey: config.privateKey,
              clientEmail: config.clientEmail,
            }),
          };
          return admin.initializeApp(firebaseParams);
        } catch (error) {
           console.error('❌ Firebase Init Error:', error.message);
           throw error;
        }
      },
      inject: [firebaseConfig.KEY],
    },
    {
        provide: 'FIRESTORE',
        useFactory: (app: admin.app.App) => {
            return app.firestore();
        },
        inject: ['FIREBASE_APP'],
    }
  ],
  exports: ['FIREBASE_APP', 'FIRESTORE'],
})
export class FirebaseModule {}
