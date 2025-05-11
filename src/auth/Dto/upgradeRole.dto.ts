import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpgradeRoleDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;
  @IsNotEmpty()
  @IsEmail()
  updatedUser: string;
}
