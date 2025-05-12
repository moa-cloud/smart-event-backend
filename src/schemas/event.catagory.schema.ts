import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class EventCatagory {
  @Prop({ type: String, unique: true })
  catagoryName: string;

  @Prop()
  description: string;
}

export const EventCatagorySchema = SchemaFactory.createForClass(EventCatagory);
