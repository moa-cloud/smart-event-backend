import {
  Body,
  Controller,
  Delete,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerProfileImageOptions } from 'src/multer.config';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';
import { OwnershipGuard } from 'src/public/guard/ownership.guard';
import { CheckOwnership } from 'src/public/decorator/check-ownership.decorator';
import { updateUserDto } from 'src/auth/Dto/updateUser.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload-profile-image')
  @UseGuards(JwtGuard, OwnershipGuard)
  @CheckOwnership('user')
  @UseInterceptors(FileInterceptor('profileImage', multerProfileImageOptions))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user.sub; // assuming you extract user ID from JWT

    const imageUrl = await this.cloudinaryService.uploadImageToCloudinary(file);

    return this.userService.updateProfileImage(userId, imageUrl);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: updateUserDto,
    @Req() req,
  ) {
    const user = req.user;
    if (user.id !== id) throw new HttpException('invalid Id', 400);
    const updatedUser = await this.userService.updateUser(id, updateUserDto);
    return { message: 'User updated successfully', user: updatedUser };
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req) {
    const user = req.user;
    if (user.id !== id) throw new HttpException('invalid Id', 400);
    const deletedUser = await this.userService.deleteUser(id);
    return { message: 'User deleted successfully', user: deletedUser };
  }
}
