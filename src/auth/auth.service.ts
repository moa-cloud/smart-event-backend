import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { SignUPDto } from './Dto/signUp.Dto';
import * as aragon from 'argon2';
import { Role } from 'src/schemas/role.schema';
import { UpgradeRoleDto } from './Dto/upgradeRole.dto';
import * as crypto from 'crypto';
import { Session } from 'src/schemas/session.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
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
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumer,
      sex: user.sex,
    };
    const token = await this.jwtService.sign(payload);

    // Save the session in the database
    // Save the session in the database
    const session = await this.sessionModel.create({
      userId: user._id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
    });
    return session.id;
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
      {
        $set: {
          role: newRole._id,
          organizationName: role.organizationName, // Keep the existing value
          organizationPhoneNumber: role.phoneNumber, // Keep the existing value
          organizationAddress: role.organizationAddress, // Keep the existing value
        },
      },
    );

    return { message: 'User role upgraded successfully', updated };
  }

  async getAll() {
    const users = await this.userModel.find().populate('role').lean();
    return users;
  }

  async getAllUsers() {
    const users = await this.userModel.find().populate('role').lean();
    return users.filter((user) => user.role?.name === 'user');
  }

  async getAllorganizers() {
    const organizers = await this.userModel.find().populate('role').lean();
    return organizers.filter((user) => user.role?.name === 'organizer');
  }

  async getAlladmins() {
    const admins = await this.userModel.find().populate('role').lean();
    return admins.filter((user) => user.role?.name === 'admin');
  }

  // auth.service.ts

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    console.log('Found user:', user);

    if (!user) {
      return { message: 'If your email exists, a reset link has been sent.' };
    }

    // Generate plain token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    // Save hashed token and expiry
    user.resetToken = hashedToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    console.log('Saved hashed token in DB:', hashedToken);

    // Send plain token in the link
    const resetLink = `http://localhost:3000/resetPassword?token=${resetToken}`;
    console.log(`Reset link: ${resetLink}`);

    return { message: 'If your email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await aragon.hash(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  async validateSession(userId: string, token: string): Promise<boolean> {
    const session = await this.sessionModel.findOne({
      userId,
      token,
      expiresAt: { $gt: new Date() }, // Check if the session is not expired
    });
    return !!session; // Returns true if session exists, false otherwise
  }

  // filepath: c:\Users\MR X\Music\smart-event-backend-develop\src\auth\auth.service.ts
  async logout(
    userId: string,
  ): Promise<{ message: string; deletedCount: number }> {
    const result = await this.sessionModel.deleteMany({ userId }).exec();
    return {
      message: 'User logged out successfully',
      deletedCount: result.deletedCount,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.sessionModel
      .findById(sessionId)
      .populate('userId'); // Populate user data
    // console.log(1111111111,session);
    return session;
  }
}
