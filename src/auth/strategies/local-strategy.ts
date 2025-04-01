import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-local';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class LocalStratgy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  validate(username: string, password: string) {
    console.log('inside local strategy');
    const user = this.authService.signIn({ username, password });
    if (!user) {
      throw new HttpException('Incorrect credentials', 401);
    }
    return user;
  }
}
