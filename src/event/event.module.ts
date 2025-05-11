import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { event, eventSchema } from 'src/schemas/event.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { OwnershipGuard } from 'src/public/guard/ownership.guard';
import { UserModule } from 'src/user/user.module';
import { EventcatagoryModule } from 'src/eventcatagory/eventcatagory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: event.name, schema: eventSchema }]),
    UserModule,
    EventcatagoryModule,
  ],
  controllers: [EventController],
  providers: [EventService, CloudinaryService, OwnershipGuard],
  exports: [EventService],
})
export class EventModule {}
