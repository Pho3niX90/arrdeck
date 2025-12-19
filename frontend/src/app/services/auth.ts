import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('access_token'));
  isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, pass: string) {
    return this.http.post<AuthResponse>('/api/v1/auth/login', { username, password: pass }).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.access_token);
        this._token.set(res.access_token);
        this.router.navigate(['/']);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    return this._token();
  }
}
