import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create.feedback.dto';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';
import { RolesGuard } from 'src/public/guard/role.guard';
import { Roles } from 'src/public/decorator/role.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  @Post('createFeedBack')
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req) {
    const request = req.user.id;
    const feedback = await this.feedbackService.createFeedback(
      createFeedbackDto,
      request,
    );
    return feedback;
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user')
  @Get('userFeedBack')
  getAllFeedBackOfUser(@Req() req) {
    const request = req.user.id;
    return this.feedbackService.getAllFeedBackOfUser(request);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer')
  @Get(':eventId')
  getAllFeedBackForEventById(@Param('eventId') eventId: string) {
    console.log(eventId);
    return this.feedbackService.getAllFeedBackForEventById(eventId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('user', 'admin')
  @Delete('deleteFeedBack')
  deleteFeedback(@Body('feedbackId') feedbackId: string) {
    return this.feedbackService.deleteFeedBack(feedbackId);
  }
}
