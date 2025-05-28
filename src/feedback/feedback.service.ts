import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback } from 'src/schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create.feedback.dto';
import { EventService } from 'src/event/event.service';
import { event } from 'src/schemas/event.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
    private eventService: EventService,
    @InjectModel(event.name) private eventModel: Model<event>,
  ) {}

  async createFeedback(dto: CreateFeedbackDto, req: string): Promise<Feedback> {
    const { eventId } = dto;
    const event = await this.eventService.findEventByIdForGuard(eventId);
    console.log(event);
    if (!event) throw new NotFoundException('Event not found');
    const feedback = this.feedbackModel.create({
      ...dto,
      userId: req,
      organizerId: event.createdBy,
    });
    return feedback;
  }

  async getAllFeedBackForEventById(eventId) {
    const feedbacks = await this.feedbackModel.find({ eventId: eventId });
    return feedbacks;
  }

  async getAllFeedBackOfUser(Id) {
    const feedbacks = await this.feedbackModel.find({ userId: Id });
    return feedbacks;
  }

  async deleteFeedBack(feedbackId) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const deleted = await this.feedbackModel.findByIdAndDelete(feedbackId);
    return 'Feedback deleted successfully';
  }
}
