import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { bookindSchema, Booking } from 'src/schemas/booking.schema';
import { InteractionModule } from 'src/interaction/interaction.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: bookindSchema }]),
    InteractionModule,
  ],
  providers: [BookingService],
  controllers: [BookingController],
  exports: [MongooseModule, BookingService],
})
export class BookingModule {}
