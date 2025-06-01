import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Session {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: () => User })
  userId: User;
  @Prop({ required: true })
  token: string;
  @Prop({ required: true, type: Date })
  createdAt: Date;
  @Prop({ type: Date, default: null })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
