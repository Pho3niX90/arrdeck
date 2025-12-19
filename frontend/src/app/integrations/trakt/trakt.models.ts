export interface TraktImage {
    full: string;
    medium: string;
    thumb: string;
}

export interface TraktIds {
    trakt: number;
    slug: string;
    imdb: string;
    tmdb: number;
    tvdb?: number; // Optional as movies might not have it, but shows usually do
}

export interface TraktMovie {
    title: string;
    year: number;
    ids: TraktIds;
    tagline: string;
    overview: string;
    released: string;
    runtime: number;
    rating: number; // Trakt rating
    votes: number;
    genres: string[];
    images?: {
        poster: TraktImage;
        fanart: TraktImage;
    };
}

export interface TraktShow {
    title: string;
    year: number;
    ids: TraktIds;
    overview: string;
    first_aired: string;
    rating: number;
    votes: number;
    genres: string[];
    aired_episodes: number;
    images?: {
        poster: TraktImage;
        fanart: TraktImage;
    };
}

export interface TraktTrendingItem<T> {
    watchers: number;
    movie?: T;
    show?: T;
}
