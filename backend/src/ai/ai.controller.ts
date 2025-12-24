import {Body, Controller, HttpCode, Post, UseGuards} from '@nestjs/common';
import type {RecommendationRequest} from './ai.service';
import {AiService} from './ai.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {
    }

    @Post('chat')
    async chat(@Body() body: { prompt: string; history?: any[] }) {
        return this.aiService.chat(body.prompt, body.history);
    }

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
