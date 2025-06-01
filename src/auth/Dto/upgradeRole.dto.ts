import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpgradeRoleDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;
  @IsNotEmpty()
  @IsEmail()
  updatedUser: string;
  @IsOptional()
  organizationName?: string;
  @IsOptional()
  organizationAddress?: string;
  @IsOptional()
  phoneNumber?: string;
}
