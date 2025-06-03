import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './role/role.module';
import { EventModule } from './event/event.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EventcatagoryModule } from './eventcatagory/eventcatagory.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { InteractionModule } from './interaction/interaction.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { MailerModule } from '@nestjs-modules/mailer';
import 'dotenv/config'; // Automatically loads variables from your .env file

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
      }),
    }),
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
