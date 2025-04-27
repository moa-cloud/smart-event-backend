import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { event, eventSchema } from 'src/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: event.name, schema: eventSchema }]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
