import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsEnum(['success', 'warning', 'error'])
  type: string;

  @IsString()
  title: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  time?: string;

  @IsMongoId()
  eventId: string;
}
