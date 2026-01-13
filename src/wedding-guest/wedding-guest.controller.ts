import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { WeddingGuestService } from './wedding-guest.service';
import { CreateWeddingGuestDto } from './dto/create-wedding-guest.dto';
import { AdminAuthGuard } from '../auth/admin.guard';
import { InvitationStatus } from './entities/wedding-guest.entity';

@Controller('wedding-guests')
export class WeddingGuestController {
  constructor(private readonly weddingGuestService: WeddingGuestService) {}

  @Post()
  create(@Body() createWeddingGuestDto: CreateWeddingGuestDto) {
    return this.weddingGuestService.create(createWeddingGuestDto);
  }

  // Admin Endpoints
  @Get('admin/invites')
  @UseGuards(AdminAuthGuard)
  findAllAdmin() {
    return this.weddingGuestService.findAll();
  }

  @Post('admin/invites/:id/rotate-url')
  @UseGuards(AdminAuthGuard)
  rotateUrl(@Param('id') id: string) {
    return this.weddingGuestService.rotateUrl(id);
  }

  // Public Endpoints
  @Post('invites/visit')
  visit(@Body() body: { token: string }) {
    if (!body.token) throw new UnauthorizedException('Token required');
    return this.weddingGuestService.registerVisit(body.token);
  }

  @Post('invites/rsvp')
  rsvp(@Body() body: { token: string, estado_invitacion: InvitationStatus, plus_ones_selected?: number }) {
    if (!body.token) throw new UnauthorizedException('Token required');
    return this.weddingGuestService.updateRsvp(body.token, body.estado_invitacion, body.plus_ones_selected);
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
