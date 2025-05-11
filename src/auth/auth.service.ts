import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { SignUPDto } from './Dto/signUp.Dto';
import * as aragon from 'argon2';
import { Role } from 'src/schemas/role.schema';
import { UpgradeRoleDto } from './Dto/upgradeRole.dto';

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

    const userWithRole = await this.userModel
      .findOne({ _id: user._id })
      .populate('role');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithOutPassword } = userWithRole.toObject();

    console.log(userWithOutPassword);
    return userWithOutPassword;
  }

  async upgradeRole(role: UpgradeRoleDto) {
    const { roleName, updatedUser } = role;

    const user = await this.userModel.findOne({ email: updatedUser });
    if (!user) throw new NotFoundException("Such user doesn't exist");

    const newRole = await this.roleModel.findOne({ name: roleName });
    if (!newRole) throw new NotFoundException('Role not found');

    const updated = await this.userModel.updateOne(
      { _id: user._id },
      { $set: { role: newRole._id } },
    );

    return { message: 'User role upgraded successfully', updated };
  }
}
