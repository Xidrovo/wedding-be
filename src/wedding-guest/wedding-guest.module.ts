import { Module } from '@nestjs/common';
import { WeddingGuestController } from './wedding-guest.controller';
import { WeddingGuestService } from './wedding-guest.service';

@Module({
  controllers: [WeddingGuestController],
  providers: [WeddingGuestService],
})
export class WeddingGuestModule {}
