import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './Guard/local-guard';
import { Request } from 'express';
import { JwtGuard } from './Guard/jwt-guard';
import { SignUPDto } from './Dto/signUp.Dto';
import { RolesGuard } from 'src/public/guard/role.guard';
import { Roles } from 'src/public/decorator/role.decorator';
import { UpgradeRoleDto } from './Dto/upgradeRole.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('signIn')
  @UseGuards(LocalGuard) // checks if the user exsists  and attaches the user to the req obj, if not throws an exception
  signIn(@Req() req) {
    const user = req.user;
    // console.log(req.user);
    const token = this.authService.generateJwtToken(user); // generates the token using infn from the req obj
    return token;
  }

  @Get('status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  status(@Req() req: Request) {
    console.log('inside the authcontroller status method');
    console.log(req.user);
    return req.user;
  }

  @Post('signUp')
  signUp(@Body() signUp: SignUPDto) {
    return this.authService.signUp(signUp);
  }

  @Post('env')
  env() {
    const env = this.configService.get('CLOUDINARY_API_SECRET');
    console.log(env);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin') // or 'organizer', 'user'
  @Patch('roleUpgrade')
  async upgradeRole(@Body() role: UpgradeRoleDto) {
    return this.authService.upgradeRole(role);
  }
}
