import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'tmdbImage',
  standalone: true
})
export class TmdbImagePipe implements PipeTransform {
  private readonly baseUrl = 'https://image.tmdb.org/t/p/';

  transform(path: string | null | undefined, size: string = 'w500', type: 'poster' | 'backdrop' | 'profile' | 'still' = 'poster'): string {
    if (!path) {
      return ''; // Or return a placeholder image URL
    }
    if (path.includes('trakt.tv')) {
      return `https://${path}`;
    }

    // Optimization: if it's already a TMDB URL, resize it
    if (path.includes('image.tmdb.org')) {
      // Regex to match size segment (w\d+, original, h\d+)
      return path.replace(/\/p\/(original|w\d+|h\d+)\//, `/p/${size}/`);
    }

    if (path.startsWith('http')) {
      return path;
    }

    // Ensure path starts with / if not present (though TMDB usually provides it)
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${this.baseUrl}${size}${cleanPath}`;
    // Size examples:
    // Poster: w92, w154, w185, w342, w500, w780, original
    // Backdrop: w300, w780, w1280, original
    // Profile: w45, w185, h632, original
    // Still: w92, w185, w300, original
  }
}
