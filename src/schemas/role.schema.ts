import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [String] })
  permisions?: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
