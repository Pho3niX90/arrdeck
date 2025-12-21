import {AfterViewChecked, Component, ElementRef, EventEmitter, inject, Output, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AiRecommendationsService} from '../../services/ai-recommendations.service';
import {animate, style, transition, trigger} from '@angular/animations';
import {DetailsModalComponent} from '../details-modal/details-modal.component';
import {SearchService} from '../../services/search.service';

interface Recommendation {
  title: string;
  year: number;
  type: 'movie' | 'show';
  reason: string;
  tmdbId?: number;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  recommendations?: Recommendation[];
}

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('slideUpFade', [
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(20px) scale(0.95)'}),
        animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({opacity: 1, transform: 'translateY(0) scale(1)'}))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.16, 1, 0.3, 1)', style({opacity: 0, transform: 'translateY(20px) scale(0.95)'}))
      ])
    ])
  ],
  template: `
    <!-- Toggle Button -->
    <button (click)="toggleChat()"
            class="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center text-white z-50 transition-transform hover:scale-105 active:scale-95 group">
      @if (!isOpen()) {
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:rotate-12 transition-transform" fill="none"
             viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      } @else {
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      }
    </button>

    <!-- Chat Window -->
    @if (isOpen()) {
      <div [@slideUpFade]
           class="fixed bottom-24 right-4 sm:right-6 left-4 sm:left-auto w-auto sm:w-95 h-[60vh] sm:h-150 max-h-[calc(100vh-120px)] bg-[#151621] border border-slate-700/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl">
        <!-- Header -->
        <div class="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span class="font-bold text-white text-sm">ArrDeck AI</span>
          </div>
          <button (click)="clearChat()" class="text-xs text-slate-400 hover:text-white transition-colors">Clear</button>
        </div>

        <!-- Messages -->
        <div #scrollContainer
             class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          @if (messages().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-slate-500 space-y-6">
              <div class="flex flex-col items-center space-y-2 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm">Ask me anything about your library!</p>
              </div>

              <div class="flex flex-wrap gap-2 justify-center px-6">
                @for (prompt of suggestedPrompts; track prompt) {
                  <button (click)="sendMessage(prompt)"
                          class="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-full border border-slate-700/50 hover:border-slate-500 transition-colors backdrop-blur-sm">
                    {{ prompt }}
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track $index) {
            <div class="flex flex-col" [class.items-end]="msg.role === 'user'"
                 [class.items-start]="msg.role === 'model'">
              <span class="text-[10px] text-slate-500 mb-1 px-1">{{ msg.role === 'user' ? 'You' : 'AI' }}</span>
              <div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                   [class.bg-blue-600]="msg.role === 'user'"
                   [class.text-white]="msg.role === 'user'"
                   [class.bg-slate-800]="msg.role === 'model'"
                   [class.text-slate-200]="msg.role === 'model'"
                   [class.rounded-br-sm]="msg.role === 'user'"
                   [class.rounded-bl-sm]="msg.role === 'model'">
                <div [innerHTML]="msg.content"></div>
                <!-- innerHTML for safety line breaks if needed, or stick to interpolation -->
                <!-- Recommendations Cards -->
                @if (msg.recommendations && msg.recommendations.length > 0) {
                  <div class="mt-4 space-y-2">
                    @for (rec of msg.recommendations; track rec.title) {
                      <div (click)="openDetails(rec.title, rec.year, rec.type, rec.tmdbId)"
                           class="block bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 rounded-lg p-3 cursor-pointer transition-all group text-left">
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-white text-sm">{{ rec.title }} <span
                            class="text-xs font-normal opacity-60">({{ rec.year }})</span></span>
                          <span
                            class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300">{{ rec.type }}</span>
                        </div>
                        <p class="text-xs text-slate-400 mb-2 leading-relaxed">{{ rec.reason }}</p>
                        <div
                          class="flex items-center text-[10px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity -ml-1 translate-x-1 group-hover:translate-x-0 duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20"
                               fill="currentColor">
                            <path fill-rule="evenodd"
                                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                  clip-rule="evenodd"/>
                          </svg>
                          Search in ArrDeck
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (isTyping()) {
            <div class="flex flex-col items-start">
              <div class="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <div class="p-3 bg-slate-900/50 border-t border-slate-800">
          <div class="flex gap-2">
            <input type="text"
                   [(ngModel)]="currentInput"
                   (keyup.enter)="sendMessage()"
                   [disabled]="isTyping()"
                   placeholder="Type a message..."
                   class="flex-1 bg-[#0f1016] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50">

            <button (click)="sendMessage()"
                    [disabled]="!currentInput || isTyping()"
                    class="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AiChatWidgetComponent implements AfterViewChecked {
  private aiService = inject(AiRecommendationsService);
  protected searchService = inject(SearchService);
  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  @Output() searchRequest = new EventEmitter<string>();

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentInput = '';
  isTyping = signal(false);

  suggestedPrompts = [
    "Recommend me a movie",
    "What's trending now?",
    "Find 90s action movies",
    "Show me top rated TV shows"
  ];

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  clearChat() {
    this.messages.set([]);
  }

  sendMessage(text?: string) {
    const input = text || this.currentInput;
    if (!input.trim() || this.isTyping()) return;

    const userMsg = input;
    this.currentInput = '';

    // Add user message
    this.messages.update(msgs => [...msgs, {role: 'user', content: userMsg}]);
    this.isTyping.set(true);

    this.aiService.chat(userMsg, this.messages().slice(0, -1)).subscribe({
      next: (res) => {
        let content = res.response;
        let recommendations: Recommendation[] = [];

        if (content.includes('---')) {
          const parts = content.split('---');
          content = parts[0].trim();
          try {
            const jsonPart = parts[1].trim();
            // Attempt to find array start/end if there's extra text
            const start = jsonPart.indexOf('[');
            const end = jsonPart.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
              recommendations = JSON.parse(jsonPart.substring(start, end + 1));
              console.log('Found recommendations:', recommendations);
            }
          } catch (e) {
            console.error('Failed to parse recommendations JSON', e);
          }
        }

        this.messages.update(msgs => [...msgs, {role: 'model', content, recommendations}]);
        this.isTyping.set(false);
      },
      error: () => {
        this.messages.update(msgs => [...msgs, {
          role: 'model',
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
        this.isTyping.set(false);
      }
    });
  }

  triggerSearch(query: string) {
    this.searchRequest.emit(query);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  openDetails(title: string, year: number, type: 'show' | 'movie', tmdbId?: number) {
    console.log('Opening details modal for:', title, year, type, tmdbId);
    this.searchService.eventEmitter.emit({
      title, type, year, tmdbId
    })
  }
}
