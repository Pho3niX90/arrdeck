import {Injectable, signal} from '@angular/core';

export interface DetailsModalConfig {
  tmdbId?: number;
  traktId?: number;
  tvdbId?: number;
  type: 'movie' | 'show';
  // Optional context if needed later
}

export interface DetailsModalState extends DetailsModalConfig {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DetailsModalService {
  // Initial state closed
  readonly state = signal<DetailsModalState>({
    isOpen: false,
    type: 'movie'
  });

  open(config: DetailsModalConfig) {
    this.state.set({
      isOpen: true,
      ...config
    });
  }

  close() {
    this.state.update(s => ({...s, isOpen: false}));
  }
}
