import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-[#111827] rounded-[2rem] overflow-hidden flex flex-col relative group">
      <!-- Header -->
      <div class="px-6 pt-6 pb-2 flex justify-between items-start">
        <div class="flex flex-col">
            <div class="flex items-center gap-2 mb-1">
                <ng-content select="[header-icon]"></ng-content>
                <span class="text-sm font-medium" [ngClass]="accentColor()">{{ subtitle() }}</span>
            </div>
            <h3 class="text-xl font-bold text-white tracking-wide">
              {{ title() }}
            </h3>
        </div>
        <div class="flex items-center gap-2">
            <ng-content select="[header-actions]"></ng-content>
            <button class="text-slate-400 hover:text-white transition mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
      </div>
      
      <!-- Body -->
      <div class="flex-1 overflow-hidden min-h-0 relative flex flex-col">
         <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: ``
})
export class WidgetCardComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  accentColor = input<string>('text-blue-400');
}
