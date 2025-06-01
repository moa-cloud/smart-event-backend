import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendation')
export class RecommendationController {
  constructor(private recommendationService: RecommendationService) {}

  @Get(':userId')
  async getRecommendation(
    @Param('userId') userId: string,
  ): Promise<{ recommendedEvents: { eventId: string; score: number }[] }> {
    const result = await this.recommendationService.getRecommendations(userId);
    return { recommendedEvents: result };
  }
}
