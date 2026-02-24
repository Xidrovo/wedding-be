import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { InvitationStatus } from '../entities/wedding-guest.entity';

export class CreateWeddingGuestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  plus_ones_allowed?: number;

  @IsEnum(InvitationStatus)
  @IsOptional()
  status?: InvitationStatus;

  @IsString()
  @IsOptional()
  guest_url?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @IsOptional()
  plus_ones_confirmed?: number;
}
