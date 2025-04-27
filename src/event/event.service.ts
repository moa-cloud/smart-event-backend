import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { event } from 'src/schemas/event.schema';
import { createEventDto } from './dto/createEvent.dto';

@Injectable()
export class EventService {
  constructor(@InjectModel(event.name) private eventModel: Model<event>) {}

  createEvent(createEventDto: createEventDto, userId) {
    const event = this.eventModel.create({
      ...createEventDto,
      organizer: userId,
    });

    return event;
  }
}
