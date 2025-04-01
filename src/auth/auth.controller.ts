import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { authCredentialDto } from './Dto/authCredentials.dto';
import { AuthService } from './auth.service';
import { LocalGuard } from './Guard/local-guard';
import { Request } from 'express';
import { JwtGuard } from './Guard/jwt-guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @UseGuards(LocalGuard)
  signIn(@Body() authCredentials: authCredentialDto) {
    const user = this.authService.signIn(authCredentials);
    if (!user) {
      throw new HttpException('Incorrect credentials', 401);
    }
    return user;
  }

  @Get('status')
  @UseGuards(JwtGuard)
  status(@Req() req: Request) {
    console.log('inside the authcontroller status method');
    console.log(req.user);
    return req.user;
  }
}
