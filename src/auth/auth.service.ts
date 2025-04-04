import { HttpException, Injectable } from '@nestjs/common';
import { logInDto } from './Dto/logIn.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { SignUPDto } from './Dto/signUp.Dto';
import * as aragon from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  users = [
    {
      id: 1,
      email: 'moa@gmail.com',
      password: '123',
    },
    {
      id: 2,
      email: 'brad',
      password: '1243',
    },
  ];
  async signIn({ email, password }: logInDto) {
    const findUser = await this.userModel.findOne({ email }).lean(); // Use lean() for better performance

    if (!findUser) {
      throw new HttpException('Invalid credentials', 401);
    }

    const isPasswordValid = await aragon.verify(findUser.password, password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', 401);
    }

    const payload = { id: findUser._id, email: findUser.email };
    return this.jwtService.sign(payload);
  }

  async signUp(signup: SignUPDto) {
    if (await this.userModel.exists({ email: signup.email })) {
      throw new HttpException('Email already in use', 400);
    }
    signup.password = await aragon.hash(signup.password);

    const user = await this.userModel.create(signup);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithOutPassword } = user;

    return userWithOutPassword;
  }
}
