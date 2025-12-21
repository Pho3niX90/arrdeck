import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
           (click)="close()">
        <div
          class="bg-[#151621] border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all"
          (click)="$event.stopPropagation()">

          <h3 class="text-xl font-bold text-white mb-2">{{ title }}</h3>
          <p class="text-slate-300 mb-6 leading-relaxed">{{ message }}</p>

          <div class="flex justify-end gap-3">
            <button (click)="close()"
                    class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
              Cancel
            </button>
            <button (click)="onConfirm()"
                    class="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmationModalComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = false;

  open(config?: { title?: string, message?: string, confirmText?: string }) {
    if (config) {
      if (config.title) this.title = config.title;
      if (config.message) this.message = config.message;
      if (config.confirmText) this.confirmText = config.confirmText;
    }
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.cancelled.emit();
  }

  onConfirm() {
    this.isOpen = false;
    this.confirmed.emit();
  }
}
