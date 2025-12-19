export interface SonarrImage {
    coverType: 'banner' | 'poster' | 'fanart' | 'screenshot' | 'headshot';
    url: string;
    remoteUrl: string;
}

export interface SonarrSeason {
    seasonNumber: number;
    monitored: boolean;
    statistics?: {
        episodeFileCount: number;
        episodeCount: number;
        totalEpisodeCount: number;
        sizeOnDisk: number;
        percentOfEpisodes: number;
    };
}

export interface SonarrSeries {
    id: number;
    title: string;
    sortTitle: string;
    status: 'continuing' | 'ended' | 'upcoming';
    ended: boolean;
    overview: string;
    network: string;
    airTime: string;
    images: SonarrImage[];
    seasons: SonarrSeason[];
    year: number;
    path: string;
    qualityProfileId: number;
    languageProfileId: number;
    monitored: boolean;
    added: string; // ISO Date
    ratings?: {
        votes: number;
        value: number;
    };
    genres: string[];
    tmdbId?: number;
    tvdbId?: number;
}

export interface SonarrEpisode {
    id: number;
    seriesId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate: string;
    airDateUtc: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    series?: SonarrSeries; // Optional as it might be sparse in some calls
}
