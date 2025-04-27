import { HttpException, Injectable } from '@nestjs/common';
import { logInDto } from './Dto/logIn.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { SignUPDto } from './Dto/signUp.Dto';
import * as aragon from 'argon2';
import { Role } from 'src/schemas/role.schema';
import { updateUserDto } from './Dto/updateUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
  ) {}

  async validateUser(email, password) {
    const findUser = await this.userModel
      .findOne({ email })
      .populate('role')
      .lean(); // Use lean() for better performance

    if (!findUser) {
      return null;
    }

    const isPasswordValid = await aragon.verify(findUser.password, password);
    if (!isPasswordValid) {
      return null;
    }

    return findUser;
  }

  async generateJwtToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role.name,
    };
    return this.jwtService.sign(payload);
  }

  async signUp(signup: SignUPDto) {
    if (await this.userModel.exists({ email: signup.email })) {
      throw new HttpException('Email already in use', 400);
    }
    signup.password = await aragon.hash(signup.password);

    const defaulRole = await this.roleModel.findOne({ name: 'user' });

    if (!defaulRole) {
      throw new HttpException('Default role not found', 500);
    }

    const user = await this.userModel.create({
      ...signup,
      role: defaulRole.id,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithOutPassword } = user.toObject();

    console.log(userWithOutPassword);
    return userWithOutPassword;
  }

  async updateUser(id: string, updateUserDto: updateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await aragon.hash(updateUserDto.password);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true,
      })
      .populate('role');
    // console.log(user);
    return user;
  }

  async deletedUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).populate('role');
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    // console.log(user);
    return user;
  }
}
