import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEventCatagoryDto {
  @IsString()
  @IsNotEmpty()
  catagoryName: string;
  @IsString()
  @IsOptional()
  description?: string;
}
