import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'smart-event-mod-1',
    });
  }

  validate(payload: any) {
    console.log('inside jwt strategy validate');
    console.log(payload);
    return payload;
  }
}
