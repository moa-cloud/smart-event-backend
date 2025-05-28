import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EventcatagoryService } from './eventcatagory.service';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';
import { RolesGuard } from 'src/public/guard/role.guard';
import { Roles } from 'src/public/decorator/role.decorator';
import { CreateEventCatagoryDto } from 'src/event/dto/create.Event.Catagory.Dto';

@Controller('eventcatagory')
export class EventcatagoryController {
  constructor(private eventcatagoryService: EventcatagoryService) {}

  @Post('createCatagory')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer', 'admin')
  createEventCatagory(@Body() catagory: CreateEventCatagoryDto) {
    const eventcatagoryCreated =
      this.eventcatagoryService.createEventCatagory(catagory);

    if (!eventcatagoryCreated)
      throw new NotFoundException(' Event catagory not created ');
    return {
      message: 'event catagory created successfully',
      event: eventcatagoryCreated,
    };
  }

  @Post('createCatagory')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer', 'admin')
  async getAllCatagories() {
    return this.eventcatagoryService.allCatagories();
  }
}
