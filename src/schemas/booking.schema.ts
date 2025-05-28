import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';
import { event } from './event.schema';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Booking {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'event' })
  event: event;

  @Prop({ default: 1 })
  quantity: number;

  @Prop()
  status: string;

  @Prop()
  paymentId: string;
}

export const bookindSchema = SchemaFactory.createForClass(Booking);
