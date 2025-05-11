import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { updateUserDto } from 'src/auth/Dto/updateUser.dto';
import { User } from 'src/schemas/user.schema';
import * as aragon from 'argon2';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async updateProfileImage(userId: string, imageUrl: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true },
    );
  }

  async findUserById(eventId) {
    const event = await this.userModel.findOne(eventId);
    return event;
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
    const userWithOutPassword = this.excludePassword(user);
    return userWithOutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).populate('role');
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const userWithOutPassword = this.excludePassword(user);
    return userWithOutPassword;
  }

  excludePassword(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}
