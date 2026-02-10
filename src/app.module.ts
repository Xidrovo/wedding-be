import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { WeddingGuestModule } from './wedding-guest/wedding-guest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    WeddingGuestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
