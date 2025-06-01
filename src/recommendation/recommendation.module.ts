import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { InteractionModule } from 'src/interaction/interaction.module';
import { EventModule } from 'src/event/event.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [InteractionModule, EventModule, AuthModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
