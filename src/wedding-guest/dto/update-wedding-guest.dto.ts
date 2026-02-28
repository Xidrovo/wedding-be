import { PartialType } from '@nestjs/mapped-types';
import { CreateWeddingGuestDto } from './create-wedding-guest.dto';

export class UpdateWeddingGuestDto extends PartialType(CreateWeddingGuestDto) {}
