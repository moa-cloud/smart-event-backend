import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BookingModule } from '../booking/booking.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { payment, paymentSchema } from 'src/schemas/payment.schema';

@Module({
  imports: [
    BookingModule,
    HttpModule,
    MongooseModule.forFeature([{ name: payment.name, schema: paymentSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
