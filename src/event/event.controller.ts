import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventService } from './event.service';
import { createEventDto } from './dto/createEvent.dto';
import { JwtGuard } from 'src/auth/Guard/jwt-guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerEventImageOptions } from 'src/multer.config';
import { updateEventDto } from './dto/updateEvent.dto';
import { OwnershipGuard } from 'src/public/guard/ownership.guard';
import { CheckOwnership } from 'src/public/decorator/check-ownership.decorator';
import { QueryDto } from './dto/query.dto';
import { RolesGuard } from 'src/public/guard/role.guard';
import { Roles } from 'src/public/decorator/role.decorator';
import { CreateEventCatagoryDto } from './dto/create.Event.Catagory.Dto';

@Controller('event')
export class EventController {
  constructor(
    private eventService: EventService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('create')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer')
  @UseInterceptors(FilesInterceptor('eventImages', 5, multerEventImageOptions)) // Accept up to 5 images
  async createEvent(
    @UploadedFiles() files: Express.Multer.File[], // Handle multiple files
    @Body() createEventDto: createEventDto,
    @Req() req,
  ) {
    console.log('before uploading');
    const uploadedImages =
      await this.cloudinaryService.uploadMultipleImagesToCloudinary(files);

    const userId = req.user.id;
    const eventCreated = await this.eventService.createEvent(
      createEventDto,
      uploadedImages,
      userId,
    );
    return { message: 'event created successfully', event: eventCreated };
  }

  @Post('createCatagory')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('organizer')
  createEventCatagory(@Body() catagory: CreateEventCatagoryDto) {
    const eventcatagoryCreated =
      this.eventService.createEventCatagory(catagory);

    if (!eventcatagoryCreated)
      throw new NotFoundException(' Event catagory not created ');
    return {
      message: 'event catagory created successfully',
      event: eventcatagoryCreated,
    };
  }

  @Get('allEvents')
  async getAllPublicEvents(@Query() query: QueryDto) {
    const events = await this.eventService.getAllPublicEvents(query);

    if (!events) throw new NotFoundException(" Event Doesn't exsist ");
    return events;
  }

  @Get('ownedEvents/:id')
  @UseGuards(JwtGuard, OwnershipGuard, RolesGuard)
  @CheckOwnership('event')
  @Roles('organizer')
  async getAllOwnedEvent(@Req() req) {
    const sub = req.user.id;
    const events = await this.eventService.getAllOwnedEvent(sub);
    if (!events) throw new NotFoundException(" Event Doesn't exsist ");
    return events;
  }

  @UseGuards(JwtGuard)
  @Get(':eventById')
  async getEventById(@Body('eventById') eventId: string, @Req() req) {
    const userId = req.user.id;
    return this.eventService.findEventById(eventId, userId);
  }

  @Patch('updateEvent/:id')
  @UseGuards(JwtGuard, OwnershipGuard, RolesGuard)
  @CheckOwnership('event')
  @Roles('organizer')
  async updateEvent(
    @Param('id') eventId: string,
    @Body() updateEventDto: updateEventDto,
  ) {
    const updatedEvent = this.eventService.updateEvent(eventId, updateEventDto);
    return { message: 'event updated successfully', event: updatedEvent };
  }

  @Delete(':id')
  @UseGuards(JwtGuard, OwnershipGuard, RolesGuard)
  @CheckOwnership('event')
  @Roles('organizer')
  async deleteEvent(@Param('id') eventId: string) {
    const deletedEvent = await this.eventService.deleteEvent(eventId);
    return { message: 'event deleted successfully', event: deletedEvent };
  }
}
