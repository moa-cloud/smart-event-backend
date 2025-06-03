import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/payment.dto';
import { QrInputDto } from './dto/qrInput';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  async initialize(@Body() dto: InitializePaymentDto) {
    const checkoutUrl = await this.paymentService.initializePayment(
      dto.bookingId,
    );
    return { url: checkoutUrl };
  }

  @Get('success')
  async success(@Query('tx_ref') tx_ref: string) {
    console.log('verification method');
    // return await this.paymentService.verifyPayment(tx_ref);
    const verified = await this.paymentService.verifyPayment(tx_ref);
    await this.paymentService.savePayment(verified);
  }

  @Post('payment/callback')
  async handleCallback(@Body() body) {
    const tx_ref = body.tx_ref;

    const verified = await this.paymentService.verifyPayment(tx_ref);
    const saved = await this.paymentService.savePayment(verified);

    return { message: 'Payment processed', data: saved };
  }

  @Get('qrCode')
  async getQRData(@Body() body: QrInputDto) {
    const answer = await this.paymentService.qrCodeScanner(body);
    return answer;
  }
}
