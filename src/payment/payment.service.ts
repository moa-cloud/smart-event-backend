import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Booking } from 'src/schemas/booking.schema';
import { Model } from 'mongoose';
import { payment } from 'src/schemas/payment.schema';
import { event } from 'src/schemas/event.schema';
import { QrInputDto } from './dto/qrInput';

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(payment.name) private paymentModel: Model<payment>,
    @InjectModel(event.name) private eventModel: Model<event>,
  ) {}
  async initializePayment(bookingId: string) {
    const tx_ref = uuidv4();

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('event')
      .populate('user');
    if (!booking) {
      throw new BadRequestException('No Such Booking Available');
    }
    const availableTickets = booking.event.availableTicket;
    const amount = booking.quantity;

    if (availableTickets < amount) {
      throw new BadRequestException('Not enough tickets');
    }
    const first_name = booking.user.firstName;
    const price = booking.event.price;
    const last_name = booking.user.lastName;
    const email = booking.user.email;
    const event = booking.event.title;
    const total = price * amount;

    const payload = {
      event: event,
      amount: total,
      currency: 'ETB',
      email: email,
      first_name: first_name,
      last_name: last_name,
      tx_ref: tx_ref,
      callback_url: `${process.env.CHAPA_CALLBACK_URL}?tx_ref=${tx_ref}`,
      // return_url: `http://localhost:3000/payment/success`,
      customization: {
        title: 'Smart Event',
        description: 'Booking payment',
      },
    };

    console.log('🔍 Payload sent to Chapa:', payload);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.chapa.co/v1/transaction/initialize',
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
          },
        ),
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const update = await this.bookingModel.updateOne(
        { _id: bookingId },
        {
          paymentId: tx_ref,
        },
      );
      return response.data.data.checkout_url; // Redirect user to this URL
    } catch (error) {
      console.error('Chapa API Error:', error.response?.data || error.message);
      throw new BadRequestException('Chapa payment initialization failed');
    }
  }

  async verifyPayment(tx_ref: string) {
    console.log('🔑 Using CHAPA_SECRET_KEY:', process.env.CHAPA_SECRET_KEY); // debug tip
    console.log('not even 1st');

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
          },
        ),
      );
      const result = response.data;
      if (result.status === 'success' && result.data.status === 'success') {
        console.log('✅ Payment verified successfully:', result.data);
        console.log('here');

        // return only the data portion of the response
        return response.data.data;
      } else {
        // 🔧 ADDED: Handle failed verification from Chapa
        console.error('❌ Chapa Verification Failed:', result);
        throw new BadRequestException(
          'Payment verification failed: Invalid or expired tx_ref.',
        );
      }
    } catch (error) {
      // 🔧 MODIFIED: Provide clearer error message and fallback
      console.error(
        ' Chapa Verification Error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Payment verification failed.',
      );
    }
  }

  async savePayment(verified: any) {
    const booking = await this.bookingModel
      .findOne({ paymentId: verified.tx_ref })
      .populate('event')
      .populate('user');
    console.log(booking);
    const eventId = booking.event.identification;
    const eventone = await this.eventModel.findOne({ identification: eventId });
    console.log(eventone);
    console.log(eventone.identification);
    const amount = Number(booking.quantity);
    const available = Number(eventone.totalTicket);

    // DEBUG LOGGING
    console.log('booking:', booking);
    console.log('availableTicket:', booking.event.availableTicket);
    console.log('Parsed amount:', amount);
    console.log('Parsed available:', available);

    if (typeof booking.event.availableTicket === 'undefined') {
      throw new BadRequestException('Event availableTicket is missing.');
    }

    const minusTicket1 = available - amount;

    await this.eventModel.updateOne(
      { identification: eventId },
      { availableTicket: minusTicket1 },
    );
    await this.bookingModel.updateOne(
      { paymentId: verified.tx_ref },
      { status: 'Paid' },
    );
    try {
      const paymentData = {
        tx_ref: verified.tx_ref,
        reference: verified.reference,
        amount: verified.amount,
        status: verified.status,
        eventId: booking.event.identification,
        email: verified.email,
        first_name: verified.first_name,
        last_name: verified.last_name,
        mode: verified.mode,
        method: verified.method,
        isScanned: 'false',
      };

      const payment = await this.paymentModel.create(paymentData);
      console.log('💾 Payment saved:', payment);

      return payment;
    } catch (err) {
      // 🔧 MODIFIED: Improved error clarity
      console.error('❌ Payment saving failed:', err.message);
      throw new BadRequestException(`Payment saving failed: ${err.message}`);
    }
  }

  async qrCodeScanner(body: QrInputDto): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventId } = body;

    // Validate input
    if (!eventId) {
      throw new BadRequestException('Event ID is required');
    }

    // Find payment by eventId and populate event
    const found = await this.paymentModel
      .findOne({ eventId: eventId })
      .populate('eventId');
    console.log('herefsdc', found);
    // Check if payment exists
    if (!found) {
      throw new NotFoundException(`No payment found for event ID: ${eventId}`);
    }

    // Check if already scanned (assuming isScanned is on payment model)
    if (found.isScanned) {
      throw new BadRequestException('QR code has already been scanned');
    }

    // Update isScanned to true
    found.isScanned = true;
    found.updated_at = new Date().toISOString();
    await found.save();

    return 'QR code scanned successfully';
  }
}
