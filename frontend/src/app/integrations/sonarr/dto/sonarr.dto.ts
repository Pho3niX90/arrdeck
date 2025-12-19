export interface SonarrSeriesDto {
  title: string
  alternateTitles: AlternateTitle[]
  sortTitle: string
  status: string
  ended: boolean
  overview: string
  nextAiring: string
  previousAiring: string
  network: string
  airTime: string
  images: Image[]
  originalLanguage: OriginalLanguage
  seasons: Season[]
  year: number
  path: string
  qualityProfileId: number
  seasonFolder: boolean
  monitored: boolean
  monitorNewItems: string
  useSceneNumbering: boolean
  runtime: number
  tvdbId: number
  tvRageId: number
  tvMazeId: number
  tmdbId: number
  firstAired: string
  lastAired: string
  seriesType: string
  cleanTitle: string
  imdbId: string
  titleSlug: string
  rootFolderPath: string
  certification: string
  genres: string[]
  tags: any[]
  added: string
  ratings: Ratings
  statistics: Statistics2
  languageProfileId: number
  id: number
}

export interface AlternateTitle {
  title: string
  seasonNumber: number
}

export interface Image {
  coverType: string
  url: string
  remoteUrl: string
}

export interface OriginalLanguage {
  id: number
  name: string
}

export interface Season {
  seasonNumber: number
  monitored: boolean
  statistics: Statistics
}

export interface Statistics {
  episodeFileCount: number
  episodeCount: number
  totalEpisodeCount: number
  sizeOnDisk: number
  releaseGroups: string[]
  percentOfEpisodes: number
  previousAiring?: string
  nextAiring?: string
}

export interface Ratings {
  votes: number
  value: number
}

export interface Statistics2 {
  seasonCount: number
  episodeFileCount: number
  episodeCount: number
  totalEpisodeCount: number
  sizeOnDisk: number
  releaseGroups: string[]
  percentOfEpisodes: number
}
