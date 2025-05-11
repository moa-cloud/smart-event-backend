import { IsOptional } from 'class-validator';

export class QueryDto {
  @IsOptional()
  catagory?: string;
  @IsOptional()
  search?: string;
  @IsOptional()
  location?: string;
  @IsOptional()
  date?: Date;
}
