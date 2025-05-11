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
import { BookingService } from './booking.service';
import { createBookingDto } from './dto/create.booking.dto';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';
import { RolesGuard } from 'src/public/guard/role.guard';
import { Roles } from 'src/public/decorator/role.decorator';

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('create')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  create(@Body() createBookingDto: createBookingDto, @Req() req) {
    const userId = req.user.id;
    return this.bookingService.create(createBookingDto, userId);
  }

  @Get('allBooking')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.bookingService.findAll();
  }

  @Get('ownedBooking')
  @UseGuards(JwtGuard)
  findByUser(@Req() req) {
    const userId = req.user.id;
    const bookings = this.bookingService.findByUser(userId);
    if (!bookings) throw new NotFoundException('Bookings Empty');
    return bookings;
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer', 'admin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingService.updateStatus(id, status);
  }
}
