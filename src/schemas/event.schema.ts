import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';

@Schema()
export class event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: () => User })
  organizer: User;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  attendeeLimit: number;

  @Prop()
  eventImage: string;

  @Prop({ default: [], type: [String] })
  tag: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const eventSchema = SchemaFactory.createForClass(event);
