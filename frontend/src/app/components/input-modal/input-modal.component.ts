import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-input-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
      @if (isOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
             (click)="close()">
          <div
            class="bg-[#151621] border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all"
            (click)="$event.stopPropagation()">

            <h3 class="text-xl font-bold text-white mb-2">{{ title }}</h3>
            <p class="text-slate-300 mb-4 leading-relaxed">{{ message }}</p>

            <input type="password" [(ngModel)]="value"
                   (keyup.enter)="onConfirm()"
                   [placeholder]="placeholder"
                   class="w-full bg-[#1e2030] border border-slate-700 rounded-lg text-white px-4 py-2 mb-6 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none">

            <div class="flex justify-end gap-3">
              <button (click)="close()"
                      class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
                Cancel
              </button>
              <button (click)="onConfirm()"
                      [disabled]="!value"
                      class="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors font-medium">
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      }
    `
})
export class InputModalComponent {
    @Input() title = 'Enter Value';
    @Input() message = '';
    @Input() placeholder = '';
    @Input() confirmText = 'Submit';

    @Output() confirmed = new EventEmitter<string>();
    @Output() cancelled = new EventEmitter<void>();

    isOpen = false;
    value = '';

    open(config?: { title?: string, message?: string, placeholder?: string, confirmText?: string }) {
        if (config) {
            if (config.title) this.title = config.title;
            if (config.message) this.message = config.message;
            if (config.placeholder) this.placeholder = config.placeholder;
            if (config.confirmText) this.confirmText = config.confirmText;
        }
        this.value = '';
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
        this.cancelled.emit();
    }

    onConfirm() {
        if (!this.value) return;
        this.isOpen = false;
        this.confirmed.emit(this.value);
    }
}
