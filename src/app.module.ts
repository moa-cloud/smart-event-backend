import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './role/role.module';
import { EventModule } from './event/event.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
// import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EventcatagoryModule } from './eventcatagory/eventcatagory.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { InteractionModule } from './interaction/interaction.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RecommendationModule } from './recommendation/recommendation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://localhost:27017/users'),
    // CloudinaryModule,
    AuthModule,
    RoleModule,
    EventModule,
    UserModule,
    EventcatagoryModule,
    BookingModule,
    PaymentModule,
    InteractionModule,
    FeedbackModule,
    RecommendationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
