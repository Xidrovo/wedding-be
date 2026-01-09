import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WeddingGuestService } from './wedding-guest.service';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';

@Controller('wedding-guests')
export class WeddingGuestController {
  constructor(private readonly weddingGuestService: WeddingGuestService) {}

  @Post()
  create(@Body() createWeddingGuestDto: CreateWeddingGuestDto) {
    return this.weddingGuestService.create(createWeddingGuestDto);
  }

  @Get()
  findAll() {
    return this.weddingGuestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weddingGuestService.findOne(id);
  }
}
