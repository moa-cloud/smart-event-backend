import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './role/role.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/users'),
    AuthModule,
    RoleModule,
    EventModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
