import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { event } from './event.schema';
import mongoose from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Interaction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'event', required: true })
  eventId: event;

  @Prop({ required: true })
  interactionType: string; // e.g., 'book', 'view', 'rate'

  @Prop({ required: true })
  weight: number;

  @Prop({ type: Date, default: Date.now, name: 'created_at' })
  created_at: Date;
}

export const InteractionSchema = SchemaFactory.createForClass(Interaction);
