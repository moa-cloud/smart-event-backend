import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from './role.schema';
import mongoose from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop()
  profileImage: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  sex: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  role: Role;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String })
  resetToken: string;

  @Prop({ type: Date })
  resetTokenExpires: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
