import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
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
import { ResetPasswordDto } from './Dto/resetPassword.dto';

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

  @Post('logout') // checks if the token is valid and attaches the user to the req obj
  @UseGuards(JwtGuard)
  logout(@Req() req) {
    const userId = req.user.id; // Extract user ID from the request
    return this.authService.logout(userId);
  }

  @Get('status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  status(@Req() req: Request) {
    console.log(req.user);
    return req.user;
  }

  @Post('signUp')
  signUp(@Body() signUp: SignUPDto) {
    return this.authService.signUp(signUp);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin') // or 'organizer', 'user'
  @Patch('roleUpgrade')
  async upgradeRole(@Body() role: UpgradeRoleDto) {
    return this.authService.upgradeRole(role);
  }

  @Get('all')
  getAll() {
    return this.authService.getAll();
  }

  @Get('allUsers')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('allOrganizers')
  async getAllOrganizers() {
    return this.authService.getAllorganizers();
  }

  @Get('allAdmins')
  async getAllAdmins() {
    return this.authService.getAlladmins();
  }

  // auth.controller.ts
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('resetPassword')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.authService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Extract user data and token from the session
    const { userId, token } = session;

    return { userId, token }; // Return user and token
  }
}
