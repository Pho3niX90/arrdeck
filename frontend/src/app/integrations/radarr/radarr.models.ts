export interface RadarrImage {
    coverType: string;
    url: string;
    remoteUrl: string;
}

export interface RadarrRating {
    votes: number;
    value: number;
}

export interface RadarrMovie {
    id: number;
    title: string;
    sortTitle: string;
    sizeOnDisk: number;
    status: string;
    overview: string;
    inCinemas: string; // ISO Date
    physicalRelease: string; // ISO Date
    digitalRelease: string; // ISO Date
    images: RadarrImage[];
    website: string;
    year: number;
    hasFile: boolean;
    monitored: boolean;
    added: string; // ISO Date
    ratings: RadarrRating;
    genres: string[];
    tmdbId: number;
}
