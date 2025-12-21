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

export interface RadarrQueueItem {
    movieId: number;
    languages: any[];
    quality: {
        quality: {
            id: number;
            name: string;
        };
        revision: {
            version: number;
            real: number;
            isRepack: boolean;
        };
    };
    size: number;
    title: string;
    sizeleft: number;
    timeleft: string;
    estimatedCompletionTime: string;
    status: string;
    trackedDownloadStatus: string;
    statusMessages: any[];
    downloadId: string;
    protocol: string;
    id: number;
}

export interface RadarrQueueResponse {
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: RadarrQueueItem[];
}
