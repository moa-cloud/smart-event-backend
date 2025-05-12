import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { event } from 'src/schemas/event.schema';
import { createEventDto } from './dto/createEvent.dto';
import { updateEventDto } from './dto/updateEvent.dto';
import { QueryDto } from './dto/query.dto';
import { CreateEventCatagoryDto } from './dto/create.Event.Catagory.Dto';
import { EventCatagory } from 'src/schemas/event.catagory.schema';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(event.name) private eventModel: Model<event>,
    @InjectModel(EventCatagory.name)
    private eventCatagoryModel: Model<EventCatagory>,
  ) {}

  async createEvent(
    createEventDto: createEventDto,
    imageUrls: string[],
    userId,
  ) {
    const { eventCatagory, attendeeLimit, totalTicket } = createEventDto;
    const catagoryExsists = await this.eventCatagoryModel.findOne({
      catagoryName: eventCatagory,
    });
    const catName = eventCatagory;
    console.log(eventCatagory);
    console.log(catagoryExsists);

    if (!catagoryExsists) {
      console.log(eventCatagory);
      await this.eventCatagoryModel.create({
        catagoryName: catName,
      });
    }

    const catagoryExsists1 = await this.eventCatagoryModel.findOne({
      catagoryName: eventCatagory,
    });

    const event = await this.eventModel.create({
      ...createEventDto,
      organizer: userId,
      eventImage: imageUrls,
      eventCatagory: catagoryExsists1._id,
      totalTicket: createEventDto.totalTicket,
      availableTicket: attendeeLimit,
    });

    const eventId = event.id;

    await this.eventModel.findByIdAndUpdate(
      eventId,
      { identification: eventId, availableTicket: totalTicket },
      { new: true },
    );

    const populatedEvent = await this.eventModel
      .findById(event.id)
      .populate('eventCatagory');

    return populatedEvent;
  }

  async createEventCatagory(eventCatagory: CreateEventCatagoryDto) {
    const catagory = await this.eventCatagoryModel.create(eventCatagory);
    return catagory;
  }

  async getAllPublicEvents(query: QueryDto) {
    const { catagory, search, date, location } = query;

    const filter: any = {};

    if (catagory) {
      filter.catagory = catagory;
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    if (date) {
      filter.date = { $gte: new Date(date) }; // events on/after this date
    }

    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const events = await this.eventModel
      .find(filter)
      .sort({ date: 1 })
      .populate('eventCatagory', 'createdBy'); // soonest events first
    return events;
  }

  async getAllOwnedEvent(ownerId) {
    const ownedEvents = await this.eventModel
      .find({ createdBy: ownerId })
      .populate('eventCatagory', 'createdBy');
    return ownedEvents;
  }

  async findEventById(eventId) {
    const event = await this.eventModel
      .findOne(eventId)
      .populate('eventCatagory', 'createdBy');
    return event;
  }

  async updateEvent(eventId: string, updateEventDto: updateEventDto) {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(eventId, updateEventDto, { new: true })
      .populate('eventCatagory', 'createdBy');

    return updatedEvent;
  }

  async deleteEvent(eventId: string) {
    const event = await this.eventModel
      .findByIdAndDelete(eventId)
      .populate('eventCatagory', 'createdBy');
    if (!event) {
      throw new HttpException('event not found', 404);
    }
    return event;
  }
}
