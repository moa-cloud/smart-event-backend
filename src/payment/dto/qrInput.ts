import { IsString } from 'class-validator';

export class QrInputDto {
  @IsString()
  eventId: string;
  @IsString()
  transactionId: string;
  @IsString()
  name: string;
}
