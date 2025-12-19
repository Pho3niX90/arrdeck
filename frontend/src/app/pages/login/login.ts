import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <div class="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p class="text-slate-400">Sign in to manage your Arrs</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input 
              type="text" 
              formControlName="username"
              class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your username"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input 
              type="password" 
              formControlName="password"
              class="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            >
          </div>

          <div *ngIf="error" class="text-red-400 text-sm text-center">
            {{ error }}
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: ``
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  isLoading = false;
  error = '';

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = '';
      const { username, password } = this.loginForm.value;

      this.authService.login(username!, password!).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Invalid credentials';
        }
      });
    }
  }
}
