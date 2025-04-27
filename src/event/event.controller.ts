import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { createEventDto } from './dto/createEvent.dto';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';

@Controller('event')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post('newEvent')
  @UseGuards(JwtGuard)
  createEvent(@Body() createEventDto: createEventDto, @Req() req) {
    const userId = req.user.id;
    return this.eventService.createEvent(createEventDto, userId);
  }
}
