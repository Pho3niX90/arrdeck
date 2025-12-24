import {BadRequestException, Inject, Injectable, Logger,} from '@nestjs/common';
import {CACHE_MANAGER} from '@nestjs/cache-manager';
import type {Cache} from 'cache-manager';
import {ConfigService} from '@nestjs/config';
import {SonarrService} from '../integrations/sonarr/sonarr.service';
import {RadarrService} from '../integrations/radarr/radarr.service';
import {ServicesService} from '../services/services.service';
import {ServiceType} from '../services/service.entity';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';

interface AIContextMedia {
    title: string;
    year: number;
    genres: string[];
    overview: string;
    rating: number;
    network: string;
    imdbId: string;
    tmdbId: number;
}

interface AIContextMovie {
    title: string;
    year: number;
    genres: string[];
    keywords: string[]; // specific tags vital for movie recommendations
    overview: string;
    studio: string | null;
    runtime: number; // Important to distinguish Short Films from Features
    certification: string;
    tmdbRating: number | null;
    imdbId: string;
    tmdbId: number;
}

export interface RecommendationRequest {
    serviceId: number;
    type: 'sonarr' | 'radarr';
    prompt?: string;
    forceRefresh?: boolean;
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

    constructor(
        private configService: ConfigService,
        private sonarrService: SonarrService,
        private radarrService: RadarrService,
        private httpService: HttpService,
        private servicesService: ServicesService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
    }

    private async getAiConfig() {
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
                model: aiService.model || (isOllama ? 'llama3' : 'gemini-2.5-flash'),
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
        const {serviceId, type, prompt, forceRefresh} = request;

        const isAuto = !prompt || prompt.trim() === '';
        const cacheKey = `ai:recs:${serviceId}:${type}`;

        if (isAuto && !forceRefresh) {
            const cached =
                await this.cacheManager.get<RecommendationResponse>(cacheKey);
            if (cached) {
                this.logger.log(`Returning cached recommendations for ${cacheKey}`);
                return cached;
            }
        }

        const config = await this.getAiConfig();

        let context = '';
        // ... inside getRecommendations method

        let contextData: any[] = [];

        if (type === 'sonarr') {
            const series = await this.sonarrService.getSeries(serviceId);

            const topRated = series
                .sort((a, b) => (b.ratings?.value || 0) - (a.ratings?.value || 0))
                .slice(0, 30)
                .map((s) => this.mapToAIContext(s));

            const recent = series
                .sort(
                    (a, b) => new Date(b.added).getTime() - new Date(a.added).getTime(),
                )
                .slice(0, 20)
                .map((s) => this.mapToAIContext(s));

            const combined = [...topRated, ...recent];
            const unique = new Map(
                combined.map((item) => [item.tmdbId || item.title, item]),
            );
            contextData = Array.from(unique.values());
        } else {
            const movies = await this.radarrService.getMovies(serviceId);

            const topRated = movies
                .sort(
                    (a, b) =>
                        (b.ratings?.tmdb?.value || 0) - (a.ratings?.tmdb?.value || 0),
                )
                .slice(0, 30)
                .map((m) => this.mapMovieToAIContext(m));

            const recent = movies
                .sort(
                    (a, b) => new Date(b.added).getTime() - new Date(a.added).getTime(),
                )
                .slice(0, 20)
                .map((m) => this.mapMovieToAIContext(m));

            const combined = [...topRated, ...recent];
            const unique = new Map(
                combined.map((item) => [item.tmdbId || item.title, item]),
            );
            contextData = Array.from(unique.values());
        }

        const simplifiedContext = contextData
            .map((item) => {
                if ('network' in item) {
                    // TV Show Context
                    return `${item.title} (${item.year}, ${item.network}): [${item.genres.join(', ')}] - Rated: ${item.rating}`;
                } else {
                    const keyTags = item.keywords
                        ? item.keywords.slice(0, 3).join('/')
                        : '';
                    return `${item.title} (${item.year}, ${item.studio}): [${item.genres.join(', ')}] {${keyTags}}`;
                }
            })
            .join('\n');

        console.log(simplifiedContext);
        context = `User's Library Sample (Top Rated & Recent):\n${simplifiedContext}`;

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

            const recommendations = this.parseJsonFromLlm(resultText);

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

    private parseJsonFromLlm(text: string): any {
        let clean = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            clean = clean.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(clean);
    }

    mapToAIContext(sonarrDto: any): AIContextMedia {
        return {
            title: sonarrDto.title,
            year: sonarrDto.year,
            genres: sonarrDto.genres || [],
            overview: sonarrDto.overview,
            network: sonarrDto.network,
            rating: sonarrDto.ratings?.value || 0,
            imdbId: sonarrDto.imdbId,
            tmdbId: sonarrDto.tmdbId,
        };
    }

    mapMovieToAIContext(radarrDto: any): AIContextMovie {
        const tmdbScore = radarrDto.ratings?.tmdb?.value || null;

        return {
            title: radarrDto.title,
            year: radarrDto.year,
            genres: radarrDto.genres || [],
            keywords: radarrDto.keywords || [],
            overview: radarrDto.overview,
            studio: radarrDto.studio || null,
            runtime: radarrDto.runtime,
            certification: radarrDto.certification,
            tmdbRating: tmdbScore,
            imdbId: radarrDto.imdbId,
            tmdbId: radarrDto.tmdbId,
        };
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
                {googleSearch: {}},
            ],
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    private async callOllama(prompt: string, config: any): Promise<string> {
        try {
            const {data} = await firstValueFrom(
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

    private async getLibraryContext(): Promise<string> {
        const cacheKey = 'ai:library_context';
        const cached = await this.cacheManager.get<string>(cacheKey);
        if (cached) return cached;

        try {
            const services = await this.servicesService.findAll();
            const sonarrs = services.filter((s) => s.type === ServiceType.SONARR);
            const radarrs = services.filter((s) => s.type === ServiceType.RADARR);

            const seriesPromises = sonarrs.map((s) =>
                this.sonarrService.getSeries(s.id).catch((e) => {
                    this.logger.warn(`Failed to fetch series from service ${s.id}`, e);
                    return [];
                }),
            );
            const moviePromises = radarrs.map((s) =>
                this.radarrService.getMovies(s.id).catch((e) => {
                    this.logger.warn(`Failed to fetch movies from service ${s.id}`, e);
                    return [];
                }),
            );

            const [seriesResults, movieResults] = await Promise.all([
                Promise.all(seriesPromises),
                Promise.all(moviePromises),
            ]);

            const allSeries = seriesResults.flat();
            const allMovies = movieResults.flat();

            // Deduplicate by title+year
            const uniqueItems = new Set<string>();
            const contextLines: string[] = [];

            allSeries.forEach((s: any) => {
                const key = `${s.title}-${s.year}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.add(key);
                    contextLines.push(`- ${s.title} (${s.year}) [TV Show]`);
                }
            });

            allMovies.forEach((m: any) => {
                const key = `${m.title}-${m.year}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.add(key);
                    contextLines.push(`- ${m.title} (${m.year}) [Movie]`);
                }
            });

            const context = `User's Existing Library:\n${contextLines.join('\n')}`;
            await this.cacheManager.set(cacheKey, context, 10 * 60 * 1000); // 10 mins
            return context;
        } catch (e) {
            this.logger.error('Failed to build library context', e);
            return '';
        }
    }

    async chat(prompt: string, history: any[] = []) {
        const config = await this.getAiConfig();
        const libraryContext = await this.getLibraryContext();

        let systemPrompt = `You are ArrDeck AI, a helpful assistant for a media server.
        You can answer questions about movies and TV shows, provide recommendations, and help the user manage their library.
        Be concise and friendly.
        
        ${libraryContext}
        
        IMPORTANT: If you recommend specific movies or TV shows, please append a JSON block at the VERY END of your response, separated by "---".
        The JSON should be an array of objects with "title", "year" (number), "type" ("movie" or "show"), "reason" (short string).
        
        Example format:
        Here are my recommendations...
        ---
        [
          { "title": "Dune", "year": 2021, "type": "movie", "reason": "Visual masterpiece" }
        ]
        `;

        // format history
        let chatContext = history
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`)
            .join('\n');

        const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatContext}\n\nUser: ${prompt}\nModel:`;

        if (config.provider === 'ollama') {
            const response = await this.callOllama(fullPrompt, config);
            return {response};
        } else {
            if (!config.apiKey) throw new Error('Gemini API Key missing');
            const genAI = new GoogleGenerativeAI(config.apiKey);

            const tools = {
                functionDeclarations: [
                    {
                        name: 'add_movie',
                        description:
                            "Add a movie to the user's Radarr library. Use this when the user explicitly asks to add a movie.",
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                title: {
                                    type: 'STRING',
                                    description: 'The title of the movie',
                                },
                                year: {
                                    type: 'NUMBER',
                                    description: 'The release year of the movie',
                                },
                                tmdbId: {
                                    type: 'NUMBER',
                                    description: 'The TMDB ID of the movie',
                                },
                            },
                            required: ['title', 'tmdbId'],
                        },
                    },
                    {
                        name: 'add_show',
                        description:
                            "Add a TV show to the user's Sonarr library. Use this when the user explicitly asks to add a show.",
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                title: {type: 'STRING', description: 'The title of the show'},
                                year: {
                                    type: 'NUMBER',
                                    description: 'The release year of the show',
                                },
                                tvdbId: {
                                    type: 'NUMBER',
                                    description: 'The TVDB ID of the show',
                                },
                            },
                            required: ['title', 'tvdbId'],
                        },
                    },
                ],
            };

            const model = genAI.getGenerativeModel({
                model: config.model || 'gemini-2.5-flash',
                // @ts-ignore
                tools: [tools],
            });

            const chatSession = model.startChat({
                history: history.map((h) => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{text: h.content}],
                })),
                systemInstruction: systemPrompt,
            });

            let result = await chatSession.sendMessage(prompt);
            let response = await result.response;
            let text = response.text();

            // Handle Function Calls (Multi-turn)
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                this.logger.log(`AI Triggered Tools: ${JSON.stringify(functionCalls)}`);

                const parts: any[] = [];

                for (const call of functionCalls) {
                    let functionResult: any = {error: 'Unknown tool'};

                    try {
                        if (call.name === 'add_movie') {
                            functionResult = await this.toolAddMovie(call.args);
                        } else if (call.name === 'add_show') {
                            functionResult = await this.toolAddShow(call.args);
                        }
                    } catch (e: any) {
                        functionResult = {error: e.message};
                    }

                    parts.push({
                        functionResponse: {
                            name: call.name,
                            response: functionResult,
                        },
                    });
                }

                // Send tool results back to model
                result = await chatSession.sendMessage(parts);
                response = await result.response;
                text = response.text();
            }

            return {response: text};
        }
    }

    private async toolAddMovie(args: any) {
        this.logger.log(`Executing toolAddMovie: ${JSON.stringify(args)}`);
        const {title, year, tmdbId} = args;

        const services = await this.servicesService.findAll();
        const radarr = services.find((s) => s.type === ServiceType.RADARR);

        if (!radarr) return {error: 'No Radarr service configured.'};

        try {
            const searchResults = await this.radarrService.lookup(
                radarr.id,
                `tmdb:${tmdbId}`,
            );
            const match = searchResults.find((m: any) => m.tmdbId === tmdbId);

            if (!match)
                return {error: `Could not find movie metadata for tmdbId ${tmdbId}`};

            const profiles = await this.radarrService.getProfiles(radarr.id);
            const rootFolders = await this.radarrService.getRootFolders(radarr.id);

            const payload = {
                ...match,
                qualityProfileId: profiles[0]?.id || 1,
                rootFolderPath: rootFolders[0]?.path || '/movies',
                monitored: true,
                addOptions: {searchForMovie: true},
            };

            const added = await this.radarrService.addMovie(radarr.id, payload);
            return {success: true, title: added.title, message: 'Added to Radarr'};
        } catch (e: any) {
            return {error: `Failed to add movie: ${e.message}`};
        }
    }

    private async toolAddShow(args: any) {
        this.logger.log(`Executing toolAddShow: ${JSON.stringify(args)}`);
        const {title, year, tvdbId} = args;

        const services = await this.servicesService.findAll();
        const sonarr = services.find((s) => s.type === ServiceType.SONARR);

        if (!sonarr) return {error: 'No Sonarr service configured.'};

        try {
            const searchResults = await this.sonarrService.lookup(
                sonarr.id,
                `tvdb:${tvdbId}`,
            );
            const match = searchResults.find((s: any) => s.tvdbId === tvdbId);

            if (!match)
                return {error: `Could not find show metadata for tvdbId ${tvdbId}`};

            const profiles = await this.sonarrService.getProfiles(sonarr.id);
            const rootFolders = await this.sonarrService.getRootFolders(sonarr.id);

            const payload = {
                ...match,
                qualityProfileId: profiles[0]?.id || 1,
                rootFolderPath: rootFolders[0]?.path || '/tv',
                monitored: true,
                addOptions: {searchForMissingEpisodes: true},
            };

            const added = await this.sonarrService.addSeries(sonarr.id, payload);
            return {success: true, title: added.title, message: 'Added to Sonarr'};
        } catch (e: any) {
            return {error: `Failed to add show: ${e.message}`};
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
                const {data} = await firstValueFrom(
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
                const {data} = await firstValueFrom(
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
