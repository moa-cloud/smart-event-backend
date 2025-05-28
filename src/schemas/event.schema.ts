import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';
import { EventCatagory } from './event.catagory.schema';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  identification: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: () => User })
  createdBy: User;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  totalTicket: number;

  @Prop({ type: Number })
  availableTicket: number;

  @Prop()
  attendeeLimit: number;

  @Prop({ default: [], type: [String] })
  eventImage: string[];

  @Prop({ default: [], type: [String] })
  tag: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EventCatagory' })
  eventCatagory: EventCatagory;

  @Prop({ default: true })
  isActive: boolean;
}

export const eventSchema = SchemaFactory.createForClass(event);
