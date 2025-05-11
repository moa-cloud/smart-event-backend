import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class createBookingDto {
  @IsMongoId()
  event: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'cancelled'])
  status?: string;
}
