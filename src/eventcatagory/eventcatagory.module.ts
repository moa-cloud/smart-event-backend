import { Module } from '@nestjs/common';
import { EventcatagoryService } from './eventcatagory.service';
import { EventcatagoryController } from './eventcatagory.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventCatagory,
  EventCatagorySchema,
} from 'src/schemas/event.catagory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventCatagory.name, schema: EventCatagorySchema },
    ]),
  ],
  providers: [EventcatagoryService],
  controllers: [EventcatagoryController],
  exports: [MongooseModule],
})
export class EventcatagoryModule {}
