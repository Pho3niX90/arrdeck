import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService, ServiceConfig, ServiceType } from '../../services/services';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ServiceWithStatus extends ServiceConfig {
    status?: 'online' | 'offline' | 'unknown' | 'loading';
    version?: string;
    error?: string;
}

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6">
      <div class="flex items-center space-x-3 mb-8">
        <div class="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">Services Status</h1>
          <p class="text-slate-400 text-sm">Monitor the health and status of your integrations</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (service of services(); track service.id) {
          <div class="bg-[#1e2030] border border-slate-700/50 rounded-xl p-6 transition-all hover:border-slate-600">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-[#151621] border border-slate-700/50 flex items-center justify-center p-2">
                  <img [src]="getIcon(service.type)" [alt]="service.name" class="w-full h-full object-contain">
                </div>
                <div>
                  <h3 class="font-semibold text-white">{{ service.name }}</h3>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {{ service.type | titlecase }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center">
                @switch (service.status) {
                  @case ('online') {
                    <span class="flex h-3 w-3 relative">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  }
                  @case ('offline') {
                    <span class="h-3 w-3 rounded-full bg-red-500 box-shadow-glow-red"></span>
                  }
                  @case ('loading') {
                     <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  }
                  @default {
                    <span class="h-3 w-3 rounded-full bg-slate-600"></span>
                  }
                }
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center text-sm py-2 border-t border-slate-800/50">
                <span class="text-slate-400">Status</span>
                <span class="font-medium" [ngClass]="{
                  'text-emerald-400': service.status === 'online',
                  'text-red-400': service.status === 'offline',
                  'text-slate-400': service.status === 'unknown'
                }">{{ (service.status || 'unknown') | titlecase }}</span>
              </div>

              <div class="flex justify-between items-center text-sm py-2 border-t border-slate-800/50">
                <span class="text-slate-400">URL</span>
                <a [href]="service.url" target="_blank" class="text-blue-400 hover:text-blue-300 truncate max-w-[150px]">
                  {{ service.url }}
                </a>
              </div>

              @if (service.version) {
                <div class="flex justify-between items-center text-sm py-2 border-t border-slate-800/50">
                  <span class="text-slate-400">Version</span>
                  <span class="text-slate-200 font-mono text-xs">{{ service.version }}</span>
                </div>
              }
            </div>

            @if (service.error) {
               <div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-200">
                  {{ service.error }}
               </div>
            }
          </div>
        } @empty {
           <div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-[#1e2030]/50 rounded-xl border border-slate-800 border-dashed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p class="text-lg font-medium">No Services Configured</p>
              <p class="text-sm">Go to settings to add your integrations.</p>
           </div>
        }
      </div>
    </div>
  `,
    styles: ``
})
export class Services implements OnInit {
    private servicesService = inject(ServicesService);

    services = signal<ServiceWithStatus[]>([]);

    ngOnInit() {
        this.loadServices();
    }

    loadServices() {
        this.servicesService.getServices().subscribe(services => {
            // Initialize with loading status
            const initialServices: ServiceWithStatus[] = services.map(s => ({
                ...s,
                status: 'loading'
            }));
            this.services.set(initialServices);

            // fetch status for each
            initialServices.forEach(s => {
                this.refreshStatus(s);
            });
        });
    }

    refreshStatus(service: ServiceWithStatus) {
        this.servicesService.getSystemStatus(service).pipe(
            catchError(err => of({ error: err }))
        ).subscribe((res: any) => {
            this.services.update(current =>
                current.map(s => {
                    if (s.id === service.id) {
                        if (res.error) {
                            return { ...s, status: 'offline', error: 'Failed to connect' };
                        }

                        return {
                            ...s,
                            status: 'online',
                            version: res.version || res.appName // Some APIs return appName with version
                        };
                    }
                    return s;
                })
            );
        });
    }

    getIcon(type: ServiceType): string {
        switch (type) {
            case ServiceType.SONARR: return 'images/sonarr.png';
            case ServiceType.RADARR: return 'images/radarr.png';
            case ServiceType.TRAKT: return 'images/trakt.svg';
            case ServiceType.AI:

                return 'images/gemini.png'; // dynamic logic can be improved
            default: return 'icons/generic.svg'; // fallback
        }
    }
}
