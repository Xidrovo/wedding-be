import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateWeddingGuestDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsOptional()
  adicionales?: number;

  @IsString()
  @IsOptional()
  estado_invitacion?: string;

  @IsString()
  @IsOptional()
  estado_aceptacion?: string;

  @IsNumber()
  @IsOptional()
  posible_invitado?: number;
}
