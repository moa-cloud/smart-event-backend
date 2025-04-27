import { IsEmail, IsOptional } from 'class-validator';

export class updateUserDto {
  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  sex?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  password?: string;
}
