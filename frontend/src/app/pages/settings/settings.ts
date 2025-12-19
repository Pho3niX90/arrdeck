import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicesService, ServiceType, ServiceConfig } from '../../services/services';
import { AiRecommendationsService } from '../../services/ai-recommendations.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 pb-12">
      <div class="flex items-center space-x-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">ArrDeck Settings</h1>
          <p class="text-slate-400 text-sm">Configure your integrations and AI preferences</p>
        </div>
      </div>

      <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()">

        <!-- Integrations Section -->
        <section class="space-y-4 mb-8">
          <h2 class="text-lg font-medium text-slate-200 ml-1">Integrations</h2>

          <!-- Sonarr -->
          <div class="bg-[#1e2030] border border-slate-700/50 rounded-xl p-6" formGroupName="sonarr">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center">
                <img src="images/sonarr.png" alt="Sonarr" class="w-8 h-8 object-contain">
              </div>
              <span class="text-white font-semibold">Sonarr</span>
              <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">TV Shows</span>
            </div>

            <div class="space-y-4">
               <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5">URL</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </span>
                    <input type="text" formControlName="url"
                        class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        placeholder="http://localhost:8989">
                  </div>
               </div>
               <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5">API Key</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.5 2.5 0 01-1.768.732H7.536a2.5 2.5 0 01-1.768-.732l-1.414-1.414a2.5 2.5 0 01-.732-1.768V14.5a2.5 2.5 0 01.732-1.768l.964-.964A6 6 0 1017 9z" />
                        </svg>
                    </span>
                    <input type="password" formControlName="apiKey"
                        class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        placeholder="••••••••••••••••••••••••••••••••">
                  </div>
               </div>
            </div>
          </div>

          <!-- Radarr -->
          <div class="bg-[#1e2030] border border-slate-700/50 rounded-xl p-6" formGroupName="radarr">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center">
                <img src="images/radarr.png" alt="Radarr" class="w-8 h-8 object-contain">
              </div>
              <span class="text-white font-semibold">Radarr</span>
              <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Movies</span>
            </div>

            <div class="space-y-4">
               <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5">URL</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </span>
                    <input type="text" formControlName="url"
                        class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        placeholder="http://localhost:7878">
                  </div>
               </div>
               <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5">API Key</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-slate-500">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.5 2.5 0 01-1.768.732H7.536a2.5 2.5 0 01-1.768-.732l-1.414-1.414a2.5 2.5 0 01-.732-1.768V14.5a2.5 2.5 0 01.732-1.768l.964-.964A6 6 0 1017 9z" />
                        </svg>
                    </span>
                    <input type="password" formControlName="apiKey"
                        class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                        placeholder="••••••••••••••••••••••••••••••••">
                  </div>
               </div>
            </div>
          </div>
        </section>

        <!-- Artificial Intelligence -->
        <section class="space-y-4">
          <h2 class="text-lg font-medium text-slate-200 ml-1">Artificial Intelligence</h2>
          <div class="bg-[#1e2030] border border-slate-700/50 rounded-xl p-6" formGroupName="ai">

            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center">
                         <img src="images/gemini.png" *ngIf="aiProvider() === 'gemini'" alt="Gemini" class="w-8 h-8 object-contain">
                         <img src="images/ollama.png" *ngIf="aiProvider() === 'ollama'" alt="Ollama" class="w-8 h-8 rounded-full object-contain bg-white">
                    </div>
                    <div>
                        <span class="text-white font-semibold block">AI Recommendations</span>
                        <span class="text-xs text-slate-400">Generate personalized suggestions</span>
                    </div>
                </div>

                <div class="flex bg-[#151621] p-1 rounded-lg border border-slate-800">
                    <button type="button" (click)="setAiProvider('gemini')"
                        [class.bg-blue-600]="aiProvider() === 'gemini'"
                        [class.text-white]="aiProvider() === 'gemini'"
                        [class.text-slate-400]="aiProvider() !== 'gemini'"
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2">
                         <img src="images/gemini.png" class="w-4 h-4 object-contain">
                         Gemini
                    </button>
                    <button type="button" (click)="setAiProvider('ollama')"
                        [class.bg-blue-600]="aiProvider() === 'ollama'"
                        [class.text-white]="aiProvider() === 'ollama'"
                        [class.text-slate-400]="aiProvider() !== 'ollama'"
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2">
                        <img src="images/ollama.png" class="w-4 h-4 object-contain rounded-full bg-white">
                        Ollama
                    </button>
                </div>
            </div>

            <div class="space-y-4">
                 <!-- Gemini Fields -->
                 <ng-container *ngIf="aiProvider() === 'gemini'">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5">Gemini API Key</label>
                        <div class="relative">
                             <span class="absolute left-3 top-2.5 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.5 2.5 0 01-1.768.732H7.536a2.5 2.5 0 01-1.768-.732l-1.414-1.414a2.5 2.5 0 01-.732-1.768V14.5a2.5 2.5 0 01.732-1.768l.964-.964A6 6 0 1017 9z" />
                                </svg>
                            </span>
                             <input type="password" formControlName="apiKey"
                                class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                placeholder="••••••••••••••••••••••••••••••••">
                        </div>
                    </div>
                </ng-container>

                <!-- Ollama Fields -->
                <ng-container *ngIf="aiProvider() === 'ollama'">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5">Ollama URL</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2.5 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </span>
                            <input type="text" formControlName="url"
                                class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                placeholder="http://localhost:11434">
                        </div>
                    </div>
                </ng-container>

                 <!-- Model Selection -->
                 <div>
                    <div class="flex justify-between items-center mb-1.5">
                         <label class="block text-xs font-medium text-slate-400">Model</label>
                         <button type="button"
                             *ngIf="aiProvider() === 'gemini'"
                             (click)="fetchModels()"
                             [disabled]="isLoadingModels || !getAiControl('apiKey').value"
                             class="text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors uppercase tracking-wider font-semibold">
                             {{ isLoadingModels ? 'Loading...' : 'Refresh' }}
                         </button>
                    </div>

                    <ng-container *ngIf="aiProvider() === 'gemini'; else textInput">
                        <div class="relative">
                             <!-- Custom arrow -->
                             <span class="absolute right-3 top-3 text-slate-500 pointer-events-none">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                             </span>
                             <select formControlName="model" class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all">
                                 <option *ngFor="let m of geminiModels" [value]="m">{{ m }}</option>
                             </select>
                        </div>
                    </ng-container>

                    <ng-template #textInput>
                         <input type="text" formControlName="model"
                            class="w-full bg-[#151621] border border-slate-700 rounded-lg text-white px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="e.g. llama3">
                    </ng-template>
                 </div>
            </div>
          </div>
        </section>

        <!-- Save Button -->
        <div class="mt-8 flex justify-end">
            <button type="submit"
                [disabled]="isSubmitting || settingsForm.invalid"
                class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-12 rounded-xl shadow-lg shadow-blue-600/20 transform transition active:scale-95 disabled:opacity-50 disabled:transform-none">
                {{ isSubmitting ? 'Saving Configuration...' : 'Save Settings' }}
            </button>
        </div>

      </form>
    </div>
  `,
  styles: `
    select {
        background-color: #151621;
    }
  `
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private servicesService = inject(ServicesService);
  private aiService = inject(AiRecommendationsService);

  isSubmitting = false;
  isLoadingModels = false;
  aiProvider = signal<'gemini' | 'ollama'>('gemini');

  geminiModels = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemini-1.5-pro-001',
    'gemini-pro'
  ];

  settingsForm = this.fb.group({
    sonarr: this.fb.group({
      id: [null as number | null],
      url: ['', Validators.required],
      apiKey: ['', Validators.required]
    }),
    radarr: this.fb.group({
      id: [null as number | null],
      url: ['', Validators.required],
      apiKey: ['', Validators.required]
    }),
    ai: this.fb.group({
      id: [null as number | null],
      provider: ['gemini'],
      url: ['https://generativelanguage.googleapis.com'],
      apiKey: [''],
      model: ['gemini-1.5-flash']
    })
  });

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.servicesService.getServices().subscribe(services => {
      // Find existing services and patch form
      const sonarr = services.find(s => s.type === ServiceType.SONARR);
      const radarr = services.find(s => s.type === ServiceType.RADARR);
      const ai = services.find(s => s.type === ServiceType.AI);

      if (sonarr) {
        this.settingsForm.get('sonarr')?.patchValue({
          id: sonarr.id || null,
          url: sonarr.url,
          apiKey: sonarr.apiKey
        });
      }

      if (radarr) {
        this.settingsForm.get('radarr')?.patchValue({
          id: radarr.id || null,
          url: radarr.url,
          apiKey: radarr.apiKey
        });
      }

      if (ai) {
        const isOllama = ai.name.toLowerCase().includes('ollama');
        this.aiProvider.set(isOllama ? 'ollama' : 'gemini');

        this.settingsForm.get('ai')?.patchValue({
          id: ai.id || null,
          provider: isOllama ? 'ollama' : 'gemini',
          url: ai.url,
          apiKey: ai.apiKey,
          model: ai.model || null
        });
      }
    });
  }

  setAiProvider(provider: 'gemini' | 'ollama') {
    this.aiProvider.set(provider);
    const aiGroup = this.settingsForm.get('ai');

    if (provider === 'gemini') {
      aiGroup?.patchValue({
        provider: 'gemini',
        url: 'https://generativelanguage.googleapis.com',
        model: 'gemini-1.5-flash'
      } as any);
    } else {
      aiGroup?.patchValue({
        provider: 'ollama',
        url: 'http://localhost:11434',
        model: 'llama3'
      } as any);
    }
  }

  getAiControl(name: string) {
    return this.settingsForm.get('ai')?.get(name)!;
  }

  fetchModels() {
    const apiKey = this.getAiControl('apiKey').value;
    if (!apiKey) return;

    this.isLoadingModels = true;
    this.aiService.getModels('gemini', { apiKey }).subscribe({
      next: (models) => {
        this.geminiModels = models;
        this.isLoadingModels = false;
      },
      error: () => {
        this.isLoadingModels = false;
        alert('Failed to fetch models. Check API Key.');
      }
    });
  }

  onSubmit() {
    if (this.settingsForm.invalid) return;
    this.isSubmitting = true;

    const sonarrVal = this.settingsForm.get('sonarr')?.value;
    const radarrVal = this.settingsForm.get('radarr')?.value;
    const aiVal = this.settingsForm.get('ai')?.value;

    const requests = [];

    // Sonarr Save
    if (sonarrVal?.url && sonarrVal?.apiKey) {
      const payload: ServiceConfig = {
        name: 'Sonarr',
        type: ServiceType.SONARR,
        url: sonarrVal.url,
        apiKey: sonarrVal.apiKey
      };
      if (sonarrVal.id) {
        requests.push(this.servicesService.updateService(sonarrVal.id, payload));
      } else {
        requests.push(this.servicesService.createService(payload));
      }
    }

    // Radarr Save
    if (radarrVal?.url && radarrVal?.apiKey) {
      const payload: ServiceConfig = {
        name: 'Radarr',
        type: ServiceType.RADARR,
        url: radarrVal.url,
        apiKey: radarrVal.apiKey
      };
      if (radarrVal.id) {
        requests.push(this.servicesService.updateService(radarrVal.id, payload));
      } else {
        requests.push(this.servicesService.createService(payload));
      }
    }

    // AI Save
    if (aiVal?.url) { // AI might not need API Key if Ollama
      const payload: ServiceConfig = {
        name: this.aiProvider() === 'gemini' ? 'Gemini' : 'Ollama',
        type: ServiceType.AI,
        url: aiVal.url || '',
        apiKey: aiVal.apiKey || '',
        model: aiVal.model || ''
      };
      if (aiVal.id) {
        requests.push(this.servicesService.updateService(aiVal.id, payload));
      } else {
        requests.push(this.servicesService.createService(payload));
      }
    }

    if (requests.length === 0) {
      this.isSubmitting = false;
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Settings saved successfully!');
        this.loadServices(); // Reload ids
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        alert('Failed to save settings.');
      }
    });
  }
}
