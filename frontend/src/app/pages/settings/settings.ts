import {Component, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ServiceConfig, ServicesService, ServiceType} from '../../services/services';
import {UsersService} from '../../services/users.service';
import {AiRecommendationsService} from '../../services/ai-recommendations.service';
import {MessageService} from '../../services/message.service';
import {ConfirmationModalComponent} from '../../components/confirmation-modal/confirmation-modal.component';
import {InputModalComponent} from '../../components/input-modal/input-modal.component';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent, InputModalComponent],
  templateUrl: './settings.html',
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
  private messageService = inject(MessageService);

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
    tmdb: this.fb.group({
      id: [null as number | null],
      apiKey: ['', Validators.required]
    }),
    jellyfin: this.fb.group({
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

  users = signal<any[]>([]);
  showAddUser = false;

  @ViewChild(ConfirmationModalComponent) confirmationModal!: ConfirmationModalComponent;
  @ViewChild(InputModalComponent) inputModal!: InputModalComponent;
  userToDelete: any = null;
  userToChangePassword: any = null;

  private usersService = inject(UsersService);

  ngOnInit() {
    this.loadServices();
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => console.error('Failed to load users', err)
    });
  }

  changePassword(user: any) {
    this.userToChangePassword = user;
    this.inputModal.open({
      title: 'Change Password',
      message: `Enter new password for ${user.username}:`,
      placeholder: 'New Password',
      confirmText: 'Update'
    });
  }

  confirmChangePassword(newPass: string) {
    if (!this.userToChangePassword) return;

    this.usersService.updateUser(this.userToChangePassword.id, {password: newPass}).subscribe({
      next: () => {
        this.messageService.show('Password updated', 'success');
        this.userToChangePassword = null;
      },
      error: () => {
        this.messageService.show('Failed to update password', 'error');
        this.userToChangePassword = null;
      }
    });
  }

  deleteUser(user: any) {
    this.userToDelete = user;
    this.confirmationModal.open({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.username}?`,
      confirmText: 'Delete'
    });
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;

    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== this.userToDelete.id));
        this.messageService.show('User deleted', 'success');
        this.userToDelete = null;
      },
      error: () => {
        this.messageService.show('Failed to delete user', 'error');
        this.userToDelete = null;
      }
    });
  }

  addUser(username: string, password: string) {
    if (!username || !password) return;

    this.usersService.createUser({username, password} as any).subscribe({
      next: (newUser) => {
        this.users.update(list => [...list, newUser]);
        this.showAddUser = false;
      },
      error: () => this.messageService.show('Failed to create user', 'error')
    });
  }

  loadServices() {
    this.servicesService.getServices().subscribe(services => {
      // Find existing services and patch form
      const sonarr = services.find(s => s.type === ServiceType.SONARR);
      const radarr = services.find(s => s.type === ServiceType.RADARR);
      const tmdb = services.find(s => s.type === ServiceType.TMDB);
      const jellyfin = services.find(s => s.type === ServiceType.JELLYFIN);
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

      if (tmdb) {
        this.settingsForm.get('tmdb')?.patchValue({
          id: tmdb.id || null,
          apiKey: tmdb.apiKey
        });
      }

      if (jellyfin) {
        this.settingsForm.get('jellyfin')?.patchValue({
          id: jellyfin.id || null,
          url: jellyfin.url,
          apiKey: jellyfin.apiKey
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
    this.aiService.getModels('gemini', {apiKey}).subscribe({
      next: (models) => {
        this.geminiModels = models;
        this.isLoadingModels = false;
      },
      error: () => {
        this.isLoadingModels = false;
        this.messageService.show('Failed to fetch models. Check API Key.', 'error');
      }
    });
  }

  onSubmit() {
    if (this.settingsForm.invalid) return;
    this.isSubmitting = true;

    const sonarrVal = this.settingsForm.get('sonarr')?.value;
    const radarrVal = this.settingsForm.get('radarr')?.value;
    const tmdbVal = this.settingsForm.get('tmdb')?.value;
    const jellyfinVal = this.settingsForm.get('jellyfin')?.value;
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

    // TMDB Save
    if (tmdbVal?.apiKey) {
      const payload: ServiceConfig = {
        name: 'TMDB',
        type: ServiceType.TMDB,
        url: 'https://api.themoviedb.org/3',
        apiKey: tmdbVal.apiKey
      };
      if (tmdbVal.id) {
        requests.push(this.servicesService.updateService(tmdbVal.id, payload));
      } else {
        requests.push(this.servicesService.createService(payload));
      }
    }

    // Jellyfin Save
    if (jellyfinVal?.url && jellyfinVal?.apiKey) {
      const payload: ServiceConfig = {
        name: 'Jellyfin',
        type: ServiceType.JELLYFIN,
        url: jellyfinVal.url,
        apiKey: jellyfinVal.apiKey
      };
      if (jellyfinVal.id) {
        requests.push(this.servicesService.updateService(jellyfinVal.id, payload));
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
        this.messageService.show('Settings saved successfully!', 'success');
        this.loadServices(); // Reload ids
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.messageService.show('Failed to save settings.', 'error');
      }
    });
  }
}
