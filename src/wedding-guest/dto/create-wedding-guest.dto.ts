import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { InvitationStatus } from '../entities/wedding-guest.entity';

export class CreateWeddingGuestDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsOptional()
  adicionales?: number;

  @IsEnum(InvitationStatus)
  @IsOptional()
  estado_invitacion?: InvitationStatus;

  @IsString()
  @IsOptional()
  guest_url?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @IsOptional()
  posible_invitado?: number;
  
  // Backwards compatibility or specific override
  @IsString()
  @IsOptional()
  estado_aceptacion?: string;
}
