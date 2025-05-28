import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class EventCatagory {
  @Prop({ type: String, unique: true })
  catagoryName: string;

  @Prop()
  description: string;
}

export const EventCatagorySchema = SchemaFactory.createForClass(EventCatagory);
