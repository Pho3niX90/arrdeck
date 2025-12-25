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
    if (this._token() && this.isTokenValid(this._token()!)) {
      this.refreshProfile();
    } else {
      this.logout();
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      return false;
    }
  }

  refreshProfile() {
    this.http.get('/api/v1/users/me').subscribe({
      next: (user) => this.currentUser.set(user),
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      }
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
