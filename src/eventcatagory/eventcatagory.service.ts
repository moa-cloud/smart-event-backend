import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventCatagoryDto } from 'src/event/dto/create.Event.Catagory.Dto';
import { EventCatagory } from 'src/schemas/event.catagory.schema';

@Injectable()
export class EventcatagoryService {
  constructor(
    @InjectModel(EventCatagory.name)
    private eventCatagoryModel: Model<EventCatagory>,
  ) {}

  async createEventCatagory(Catagory: CreateEventCatagoryDto) {
    const { eventCatagory, description } = Catagory;
    const catagoryExsists = await this.eventCatagoryModel.findOne({
      catagoryName: eventCatagory,
    });
    if (!catagoryExsists) {
      const catagory = await this.eventCatagoryModel.create({
        catagoryName: eventCatagory,
        description,
      });
      return catagory;
    }
    return catagoryExsists;
  }
}
