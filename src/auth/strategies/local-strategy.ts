import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-local';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class LocalStratgy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    console.log('inside local strategy');
    const user = await this.authService.validateUser(email, password);
    console.log(user);
    if (!user) {
      throw new HttpException('Incorrect credentials', 401);
    }
    return user;
  }
}
