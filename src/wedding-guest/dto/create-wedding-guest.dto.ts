import { IsBoolean, IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateWeddingGuestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  @IsOptional()
  confirmed?: boolean;
  
  @IsString()
  @IsOptional()
  plusOne?: string;
}
