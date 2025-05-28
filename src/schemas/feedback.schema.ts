// feedback.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Schema as MongooseSchema } from 'mongoose';
import { event } from './event.schema';
import { User } from './user.schema';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Feedback {
  @Prop({ required: true, enum: ['success', 'warning', 'error', 'info'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  message: string;

  @Prop({ type: Date })
  time: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'event', required: true })
  eventId: event;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  organizerId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
