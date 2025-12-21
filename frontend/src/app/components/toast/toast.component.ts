import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MessageService} from '../../services/message.service';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({transform: 'translateX(100%)', opacity: 0}),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({transform: 'translateX(0)', opacity: 1}))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({transform: 'translateX(100%)', opacity: 0}))
      ])
    ])
  ]
})
export class ToastComponent {
  messageService = inject(MessageService);
}
