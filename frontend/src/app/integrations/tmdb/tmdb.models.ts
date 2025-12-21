export interface TmdbCollectionPart {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title: string;
  original_language: string;
  original_title: string;
  overview: string;
  poster_path: string;
  media_type: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  // Enhanced props from our logic
  inLibrary?: boolean;
}

export interface TmdbCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  parts: TmdbCollectionPart[];
  // Enhanced props from our logic
  tmdbId?: number; // sometimes mapped
  monitored?: boolean;
  libraryCount?: number;
}

export interface TmdbCastMember {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id?: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface TmdbCrewMember {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  vote_average: number;
  inLibrary?: boolean;
}

export interface TmdbRecommendations {
  page: number;
  results: TmdbItem[];
  total_pages: number;
  total_results: number;
}
