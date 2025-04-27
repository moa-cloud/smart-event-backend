import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { updateUserDto } from './Dto/updateUser.dto';
import mongoose from 'mongoose';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signIn')
  @UseGuards(LocalGuard) // checks if the user exsists  and attaches the user to the req obj, if not throws an exception
  signIn(@Req() req) {
    const user = req.user;
    console.log(req.user);
    const token = this.authService.generateJwtToken(user); // generates the token using infn from the req obj
    return token;
  }

  @Get('status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  status(@Req() req: Request) {
    console.log('inside the authcontroller status method');
    console.log(req.user);
    //return req.user;
  }

  @Post('signUp')
  signUp(@Body() signUp: SignUPDto) {
    return this.authService.signUp(signUp);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin') // or 'organizer', 'user'
  @Get('dashboard')
  getAdminDashboard() {
    return 'Only admins can access this';
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: updateUserDto,
    @Req() req,
  ) {
    const user = req.user;
    if (user.id !== id) throw new HttpException('invalid Id', 400);
    const updatedUser = await this.authService.updateUser(id, updateUserDto);
    return { message: 'User updated successfully', user: updatedUser };
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req) {
    const user = req.user;
    if (user.id !== id) throw new HttpException('invalid Id', 400);
    const deletedUser = await this.authService.deletedUser(id);
    return { message: 'User deleted successfully', user: deletedUser };
  }
}
