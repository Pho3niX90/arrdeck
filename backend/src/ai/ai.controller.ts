import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import type { RecommendationRequest } from './ai.service';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  @HttpCode(200)
  async getRecommendations(@Body() request: RecommendationRequest) {
    return this.aiService.getRecommendations(request);
  }

  @Post('models')
  @HttpCode(200)
  async listModels(
    @Body() body: { provider: string; apiKey?: string; url?: string },
  ) {
    return this.aiService.listModels(body.provider, {
      apiKey: body.apiKey,
      url: body.url,
    });
  }
}
