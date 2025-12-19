import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { SonarrService } from '../integrations/sonarr/sonarr.service';
import { RadarrService } from '../integrations/radarr/radarr.service';
import { ServicesService } from '../services/services.service';
import { ServiceType } from '../services/service.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RecommendationRequest {
  serviceId: number;
  type: 'sonarr' | 'radarr';
  prompt?: string;
}

export interface RecommendationResponse {
  recommendations: {
    title: string;
    year?: number;
    reason: string;
    overview?: string;
    tmdbId?: number;
  }[];
  provider: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private readonly provider: string;

  constructor(
    private configService: ConfigService,
    private sonarrService: SonarrService,
    private radarrService: RadarrService,
    private httpService: HttpService,
    private servicesService: ServicesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getAiConfig() {
    // Prioritize DB config
    const services = await this.servicesService.findAll();
    const aiService = services.find((s) => s.type === ServiceType.AI);

    if (aiService) {
      this.logger.log(`Found AI Service in DB: ${aiService.name}`);
      const name = aiService.name.toLowerCase();
      const isOllama = name.includes('ollama');

      return {
        provider: isOllama ? 'ollama' : 'gemini',
        apiKey: aiService.apiKey,
        url: aiService.url || (isOllama ? 'http://localhost:11434' : null),
        model: aiService.model || (isOllama ? 'llama3' : 'gemini-1.5-flash'),
      };
    }

    // Fallback to Env
    this.logger.log('Using Env Config for AI');
    const provider = this.configService.get<string>('AI_PROVIDER', 'gemini');
    return {
      provider,
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
      url: this.configService.get<string>(
        'OLLAMA_BASE_URL',
        'http://localhost:11434',
      ),
      model: this.configService.get<string>('OLLAMA_MODEL', 'llama3'),
    };
  }

  async getRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> {
    const { serviceId, type, prompt } = request;

    const isAuto = !prompt || prompt.trim() === '';
    const cacheKey = `ai:recs:${serviceId}:${type}`;

    if (isAuto) {
      const cached =
        await this.cacheManager.get<RecommendationResponse>(cacheKey);
      if (cached) {
        this.logger.log(`Returning cached recommendations for ${cacheKey}`);
        return cached;
      }
    }

    const config = await this.getAiConfig();

    let context = '';
    if (type === 'sonarr') {
      const series = await this.sonarrService.getSeries(serviceId);
      // Get top 50 rated series needed for context, plus 20 recent
      const topRated = series
        .sort((a, b) => b.ratings.value - a.ratings.value)
        .slice(0, 50);
      context = `User's TV Library (Top Rated): ${topRated.map((s) => `${s.title} (${s.year}) - ${s.genres.join(', ')}`).join('; ')}.`;
    } else {
      const movies = await this.radarrService.getMovies(serviceId);
      const topRated = movies
        .sort((a, b) => b.ratings.value - a.ratings.value)
        .slice(0, 50);
      context = `User's Movie Library (Top Rated): ${topRated.map((m) => `${m.title} (${m.year}) - ${m.genres.join(', ')}`).join('; ')}.`;
    }

    const systemPrompt = `You are a movie and TV show recommendation expert.
        Based on the user's library provided below, recommend 2-20 new ${type === 'sonarr' ? 'TV shows' : 'movies'} they might like.
        Do not recommend items already in the library.
        Provide the response in STRICT JSON format with the following structure:
        [
            {
                "title": "Title",
                "year": 2024,
                "reason": "Why you recommended this",
                "overview": "Short plot summary"
                "tmdbId": 123456789,
            }
        ]
        
        Using JSON format is CRITICAL. Do not include markdown formatting like \`\`\`json. Just the raw JSON array.
        `;

    const userPrompt =
      prompt || `Based on my library, what should I watch next?`;

    const fullPrompt = `${systemPrompt}\n\nLibrary Context:\n${context}\n\nUser Request: ${userPrompt}`;

    let resultText = '';

    try {
      if (config.provider === 'ollama') {
        resultText = await this.callOllama(fullPrompt, config);
      } else {
        resultText = await this.callGemini(fullPrompt, config);
      }
      console.log(resultText);

      // Clean up markdown if present
      resultText = resultText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      console.log(resultText);
      const recommendations = JSON.parse(resultText);

      const response: RecommendationResponse = {
        recommendations: Array.isArray(recommendations)
          ? recommendations
          : [recommendations],
        provider: config.provider,
      };

      if (isAuto) {
        // Cache for 24 hours (in milliseconds)
        await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to generate recommendations', error);
      throw new BadRequestException(
        'Failed to generate recommendations from AI provider',
      );
    }
  }

  private async callGemini(prompt: string, config: any): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Gemini API Key not configured');
    }
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model || 'gemini-2.5-flash',
      tools: [
        // @ts-ignore
        { googleSearch: {} },
      ],
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async callOllama(prompt: string, config: any): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${config.url}/api/generate`, {
          model: config.model,
          prompt,
          stream: false,
          format: 'json',
        }),
      );
      return data.response;
    } catch (e) {
      throw e;
    }
  }

  async listModels(
    provider: string,
    credentials: { apiKey?: string; url?: string },
  ): Promise<string[]> {
    if (provider === 'gemini') {
      if (!credentials.apiKey) {
        // Return defaults if no key provided yet, or throw
        return [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash-exp',
          'gemini-2.0-flash',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash-exp-image-generation',
          'gemini-2.0-flash-lite-001',
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash-lite-preview-02-05',
          'gemini-2.0-flash-lite-preview',
          'gemini-exp-1206',
          'gemini-2.5-flash-preview-tts',
          'gemini-2.5-pro-preview-tts',
          'gemma-3-1b-it',
          'gemma-3-4b-it',
          'gemma-3-12b-it',
          'gemma-3-27b-it',
          'gemma-3n-e4b-it',
          'gemma-3n-e2b-it',
          'gemini-flash-latest',
          'gemini-flash-lite-latest',
          'gemini-pro-latest',
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash-image-preview',
          'gemini-2.5-flash-image',
          'gemini-2.5-flash-preview-09-2025',
          'gemini-2.5-flash-lite-preview-09-2025',
          'gemini-3-pro-preview',
          'gemini-3-flash-preview',
          'gemini-3-pro-image-preview',
          'nano-banana-pro-preview',
          'gemini-robotics-er-1.5-preview',
          'gemini-2.5-computer-use-preview-10-2025',
          'deep-research-pro-preview-12-2025',
        ];
      }

      try {
        const { data } = await firstValueFrom(
          this.httpService.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${credentials.apiKey}`,
          ),
        );

        if (data && data.models) {
          return data.models
            .filter((m: any) =>
              m.supportedGenerationMethods?.includes('generateContent'),
            )
            .map((m: any) => m.name.replace('models/', ''));
        }
        return [];
      } catch (error) {
        this.logger.error('Failed to list Gemini models', error);
        // Return defaults on error so UI isn't broken
        return [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash-exp',
          'gemini-2.0-flash',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash-exp-image-generation',
          'gemini-2.0-flash-lite-001',
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash-lite-preview-02-05',
          'gemini-2.0-flash-lite-preview',
          'gemini-exp-1206',
          'gemini-2.5-flash-preview-tts',
          'gemini-2.5-pro-preview-tts',
          'gemma-3-1b-it',
          'gemma-3-4b-it',
          'gemma-3-12b-it',
          'gemma-3-27b-it',
          'gemma-3n-e4b-it',
          'gemma-3n-e2b-it',
          'gemini-flash-latest',
          'gemini-flash-lite-latest',
          'gemini-pro-latest',
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash-image-preview',
          'gemini-2.5-flash-image',
          'gemini-2.5-flash-preview-09-2025',
          'gemini-2.5-flash-lite-preview-09-2025',
          'gemini-3-pro-preview',
          'gemini-3-flash-preview',
          'gemini-3-pro-image-preview',
          'nano-banana-pro-preview',
          'gemini-robotics-er-1.5-preview',
          'gemini-2.5-computer-use-preview-10-2025',
          'deep-research-pro-preview-12-2025',
        ];
      }
    } else if (provider === 'ollama') {
      const url = credentials.url || 'http://localhost:11434';
      try {
        const { data } = await firstValueFrom(
          this.httpService.get(`${url}/api/tags`),
        );
        // Ollama returns { models: [ { name: 'llama3:latest' } ] }
        if (data && data.models) {
          return data.models.map((m: any) => m.name);
        }
        return [];
      } catch (error) {
        this.logger.error('Failed to list Ollama models', error);
        return ['llama3.2', 'mistral']; // fallback
      }
    }

    return [];
  }
}
