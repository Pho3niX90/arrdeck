import {Injectable, Logger} from '@nestjs/common';
import {ServicesService} from '../services/services.service';
import {TmdbService} from '../integrations/tmdb/tmdb.service';
import {TraktService} from '../integrations/trakt/trakt.service';

export interface ResolvedIds {
    tmdb?: number;
    trakt?: number;
    tvdb?: number;
    imdb?: string;
}

export interface NormalizedDetails {
    title: string;
    year: number;
    overview: string;
    runtime: number;
    rating: number; // 0-10
    genres: string[];
    poster_path?: string;
    backdrop_path?: string;
    certification?: string;
    collection?: { id: number; name: string; poster_path?: string; backdrop_path?: string };
    ids: ResolvedIds;
    original_language?: string;
    seasons?: any[];
    images?: any;
    keywords?: string[];
    status?: string;
}

@Injectable()
export class MetadataService {
    private readonly logger = new Logger(MetadataService.name);

    constructor(
        private servicesService: ServicesService,
        private tmdbService: TmdbService,
        private traktService: TraktService,
    ) {
    }

    async resolveAndFetch(ids: ResolvedIds, type: 'movie' | 'show'): Promise<NormalizedDetails> {
        const services = await this.servicesService.findAll();
        const tmdbService = services.find((s) => s.type === 'tmdb');
        const traktService = services.find((s) => s.type === 'trakt');

        // Prioritize TMDB if we have ID and Service
        if (tmdbService && ids.tmdb) {
            try {
                const data = type === 'movie'
                    ? await this.tmdbService.getMovie(tmdbService.id, ids.tmdb)
                    : await this.tmdbService.getTv(tmdbService.id, ids.tmdb);
                return this.normalizeTmdb(data);
            } catch (e) {
                this.logger.warn(`Failed to fetch from TMDB with ID ${ids.tmdb}`, e);
            }
        }

        // Fallback to Trakt if ID and Service available
        if (traktService && ids.trakt) {
            try {
                let details: NormalizedDetails;
                if (type === 'movie') {
                    const data = await this.traktService.getMovie(traktService.id, ids.trakt);
                    details = this.normalizeTrakt(data);
                } else {
                    // Fetch show and seasons in parallel
                    const [show, seasons] = await Promise.all([
                        this.traktService.getShow(traktService.id, ids.trakt),
                        this.traktService.getShowSeasons(traktService.id, ids.trakt)
                    ]);
                    details = this.normalizeTrakt(show, seasons);
                }

                // Try to upgrade to TMDB if fetchable
                if (tmdbService && details.ids.tmdb) {
                    try {
                        const tmdbData = type === 'movie'
                            ? await this.tmdbService.getMovie(tmdbService.id, details.ids.tmdb)
                            : await this.tmdbService.getTv(tmdbService.id, details.ids.tmdb);
                        return this.normalizeTmdb(tmdbData);
                    } catch (e) {
                        // Ignore failure and return Trakt details
                    }
                }
                return details;
            } catch (e) {
                this.logger.warn(`Failed to fetch from Trakt with ID ${ids.trakt}`, e);
            }
        }

        // Search logic (External IDs)
        if (traktService && (ids.tvdb || ids.imdb)) {
            const idType = ids.tvdb ? 'tvdb' : 'imdb';
            const idValue = ids.tvdb ? ids.tvdb.toString() : ids.imdb!;

            try {
                const results = await this.traktService.search(traktService.id, idType, idValue, type);
                const result = results[0];
                if (result) {
                    const item = type === 'movie' ? result.movie : result.show;

                    // Try to upgrade to TMDB
                    if (tmdbService && item.ids.tmdb) {
                        try {
                            const tmdbData = type === 'movie'
                                ? await this.tmdbService.getMovie(tmdbService.id, item.ids.tmdb)
                                : await this.tmdbService.getTv(tmdbService.id, item.ids.tmdb);
                            return this.normalizeTmdb(tmdbData);
                        } catch (e) {
                        }
                    }

                    // Fallback to fetch from Trakt
                    if (type === 'movie') {
                        const data = await this.traktService.getMovie(traktService.id, item.ids.trakt);
                        return this.normalizeTrakt(data);
                    } else {
                        const [show, seasons] = await Promise.all([
                            this.traktService.getShow(traktService.id, item.ids.trakt),
                            this.traktService.getShowSeasons(traktService.id, item.ids.trakt)
                        ]);
                        return this.normalizeTrakt(show, seasons);
                    }
                }
            } catch (e) {
                this.logger.warn(`Failed to resolve via Trakt search`, e);
            }
        }

        throw new Error('Could not resolve metadata');
    }

    private normalizeTmdb(data: any): NormalizedDetails {
        return {
            title: data.title || data.name,
            year: new Date(data.release_date || data.first_air_date).getFullYear(),
            overview: data.overview,
            runtime: data.runtime || (data.episode_run_time?.length ? data.episode_run_time[0] : 0),
            rating: data.vote_average,
            genres: data.genres?.map((g: any) => g.name) || [],
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            keywords: (data.keywords?.keywords || data.keywords?.results || []).map((k: any) => k.name),
            certification: undefined,
            collection: data.belongs_to_collection,
            ids: {tmdb: data.id, imdb: data.imdb_id},
            original_language: data.original_language,
            seasons: data.seasons
                ? data.seasons.filter((s: any) => s.season_number > 0).sort((a: any, b: any) => a.season_number - b.season_number)
                : [],
            status: data.status,
        };
    }

    private normalizeTrakt(data: any, seasons: any[] = []): NormalizedDetails {
        const poster = data.images?.poster;
        const backdrop = data.images?.fanart;
        let poster_path: string | undefined = undefined;
        let backdrop_path: string | undefined = undefined;

        if (Array.isArray(poster)) poster_path = poster[0];
        else if (poster && typeof poster === 'object') poster_path = poster.medium || poster.full;
        else if (typeof poster === 'string') poster_path = poster;

        if (Array.isArray(backdrop)) backdrop_path = backdrop[0];
        else if (backdrop && typeof backdrop === 'object') backdrop_path = backdrop.full || backdrop.medium;
        else if (typeof backdrop === 'string') backdrop_path = backdrop;

        return {
            title: data.title,
            year: data.year,
            overview: data.overview,
            runtime: data.runtime || 0,
            rating: data.rating,
            genres: data.genres || [],
            images: data.images,
            certification: data.certification,
            ids: data.ids,
            poster_path,
            backdrop_path,
            original_language: data.language,
            seasons: seasons.map(s => ({
                season_number: s.number,
                id: s.ids.trakt,
                name: s.title || `Season ${s.number}`,
                images: s.images,
                episode_count: s.episode_count,
                air_date: s.first_aired,
                poster_path: s.images?.poster?.[0]
            })).sort((a: any, b: any) => a.season_number - b.season_number)
        };
    }
}
