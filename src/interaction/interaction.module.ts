import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Interaction, InteractionSchema } from 'src/schemas/interaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interaction.name, schema: InteractionSchema },
    ]),
  ],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [MongooseModule],
})
export class InteractionModule {}
