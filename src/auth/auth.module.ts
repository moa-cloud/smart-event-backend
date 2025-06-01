import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalStratgy } from './strategies/local-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schemas/user.schema';
import { RoleModule } from 'src/role/role.module';
import { Session, SessionSchema } from 'src/schemas/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.register({
      secret: 'smart-event-mod-1',
      signOptions: { expiresIn: '1h' },
    }),
    RoleModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStratgy, JwtStrategy],
  exports: [MongooseModule],
})
export class AuthModule {}
