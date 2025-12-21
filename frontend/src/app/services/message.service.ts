import {Injectable, signal} from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messages = signal<ToastMessage[]>([]);
  private counter = 0;

  show(text: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = this.counter++;
    const message: ToastMessage = {id, text, type, duration};

    this.messages.update(msgs => [...msgs, message]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  remove(id: number) {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }
}
