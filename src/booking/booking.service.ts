import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from 'src/schemas/booking.schema';
import { createBookingDto } from './dto/create.booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
  ) {}

  async create(
    createBookingDto: createBookingDto,
    userId: string,
  ): Promise<Booking> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const booking = await this.bookingModel.create({
      user: userId,
      event: createBookingDto.event,
      quantity: createBookingDto.quantity,
      status: createBookingDto.status || 'pending',
    });
    const book = await this.bookingModel
      .findOne({
        event: createBookingDto.event,
      })
      .populate('user')
      .populate('event');
    return book;
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingModel.find().populate('user').populate('event');
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.bookingModel.find({ user: userId }).populate('event');
  }

  async updateStatus(id: string, status: string): Promise<Booking> {
    const booking = await this.bookingModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async markAsPaid(bookingId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const booking = await this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
      },
      { new: true },
    );
  }
}
