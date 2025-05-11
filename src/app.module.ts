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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
