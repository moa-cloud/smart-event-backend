import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { bookindSchema, Booking } from 'src/schemas/booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: bookindSchema }]),
  ],
  providers: [BookingService],
  controllers: [BookingController],
})
export class BookingModule {}
