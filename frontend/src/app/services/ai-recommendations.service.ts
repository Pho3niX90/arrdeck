import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
    providedIn: 'root'
})
export class AiRecommendationsService {
    private apiUrl = '/api/ai/recommendations';

    constructor(private http: HttpClient) { }

    getRecommendations(serviceId: number, type: 'sonarr' | 'radarr', prompt?: string): Observable<RecommendationResponse> {
        return this.http.post<RecommendationResponse>(this.apiUrl, { serviceId, type, prompt });
    }

    chat(prompt: string, history: any[]): Observable<{ response: string }> {
        return this.http.post<{ response: string }>('/api/ai/chat', { prompt, history });
    }

    getModels(provider: string, credentials: { apiKey?: string; url?: string }): Observable<string[]> {
        return this.http.post<string[]>('/api/ai/models', { provider, ...credentials });
    }
}
