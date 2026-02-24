import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
  rsvp(
    @Body()
    body: {
      token: string;
      status?: InvitationStatus;
      estado_invitacion?: InvitationStatus;
      plus_ones_confirmed?: number;
      plus_ones_selected?: number;
    },
  ) {
    if (!body.token) throw new UnauthorizedException('Token required');

    const status = body.status || body.estado_invitacion;
    if (!status) {
        throw new BadRequestException('Status (status or estado_invitacion) is required');
    }

    const confirmed = body.plus_ones_confirmed ?? body.plus_ones_selected;

    return this.weddingGuestService.updateRsvp(
      body.token,
      status,
      confirmed,
    );
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
