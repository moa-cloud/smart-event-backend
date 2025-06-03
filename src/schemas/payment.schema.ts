import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { event } from './event.schema';

@Schema()
export class payment {
  @Prop({ type: String, required: true, unique: true })
  tx_ref: string;

  @Prop({ type: String, required: true })
  reference: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true, default: 'ETB' })
  currency: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'event' })
  eventId: event;

  @Prop({ type: String, required: true })
  first_name: string;

  @Prop({ type: String, required: true })
  last_name: string;

  @Prop({ type: String, required: false })
  phoneNumber?: string;

  @Prop({ type: String, required: true, enum: ['test', 'live'] })
  mode: string;

  @Prop({
    type: String,
    required: true,
    enum: ['card', 'mobile_money', 'bank_transfer', 'test'],
  })
  method: string;

  @Prop({ type: Date, default: Date.now })
  created_at: string;

  @Prop({ type: Date, default: Date.now })
  updated_at: string;

  @Prop({ type: Boolean })
  isScanned: boolean;
}

export const paymentSchema = SchemaFactory.createForClass(payment);
