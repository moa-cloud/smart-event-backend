import { Injectable } from '@nestjs/common';
import { authCredentialDto } from './Dto/authCredentials.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  users = [
    {
      id: 1,
      username: 'moa',
      password: '123',
    },
    {
      id: 2,
      username: 'brad',
      password: '1243',
    },
  ];
  signIn({ username, password }: authCredentialDto) {
    const findUser = this.users.find((user) => user.username === username);
    if (!findUser) {
      return null;
    }
    if (password === findUser.password) {
      const { password, ...user } = findUser;
      return this.jwtService.sign(user);
    }
  }
}
