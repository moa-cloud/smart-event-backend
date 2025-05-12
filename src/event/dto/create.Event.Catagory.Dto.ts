import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEventCatagoryDto {
  @IsString()
  @IsNotEmpty()
  eventCatagory: string;
  @IsString()
  @IsOptional()
  description?: string;
}
