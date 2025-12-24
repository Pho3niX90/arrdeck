import {computed, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs/operators';
import {Router} from '@angular/router';

interface AuthResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('access_token'));
  isAuthenticated = computed(() => !!this._token());

  // Signal to hold the current user's profile
  readonly currentUser = signal<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    if (this._token()) {
      this.refreshProfile();
    }
  }

  refreshProfile() {
    this.http.get('/api/v1/users/me').subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.logout() // Token likely invalid
    });
  }

  login(username: string, pass: string) {
    return this.http.post<AuthResponse>('/api/v1/auth/login', {username, password: pass}).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.access_token);
        this._token.set(res.access_token);
        this.refreshProfile(); // Fetch profile after login
        this.router.navigate(['/']);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this._token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    return this._token();
  }
}
