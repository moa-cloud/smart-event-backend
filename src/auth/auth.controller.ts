import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { logInDto } from './Dto/logIn.dto';
import { AuthService } from './auth.service';
import { LocalGuard } from './Guard/local-guard';
import { Request } from 'express';
import { JwtGuard } from './Guard/jwt-guard';
import { SignUPDto } from './Dto/signUp.Dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @UseGuards(LocalGuard)
  signIn(@Body() authCredentials: logInDto) {
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

  @Post('signUp')
  signUp(@Body() signUp: SignUPDto) {
    return this.authService.signUp(signUp);
  }
}
