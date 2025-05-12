import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BookingModule } from '../booking/booking.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { payment, paymentSchema } from 'src/schemas/payment.schema';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [
    BookingModule,
    HttpModule,
    EventModule,
    MongooseModule.forFeature([{ name: payment.name, schema: paymentSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
