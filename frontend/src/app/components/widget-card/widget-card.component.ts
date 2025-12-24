import {Component, input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-card.component.html',
  styles: ``
})
export class WidgetCardComponent {
  title = input.required<string>();
  subtitle = input.required<string | undefined>();
  accentColor = input<string>('text-blue-400');
}
