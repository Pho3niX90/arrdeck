import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-slate-950">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div class="p-6">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            ArrDeck
          </h1>
        </div>
        
        <nav class="flex-1 px-4 space-y-2">
          <a routerLink="/" 
             routerLinkActive="bg-white/10 text-white" 
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <span>Dashboard</span>
          </a>
          <a routerLink="/services" 
             routerLinkActive="bg-white/10 text-white"
             class="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <span>Services</span>
          </a>
          <a routerLink="/settings" 
             routerLinkActive="bg-white/10 text-white"
             class="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <span>Settings</span>
          </a>
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button (click)="logout()" class="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition">
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        <div class="p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: ``
})
export class Layout {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
