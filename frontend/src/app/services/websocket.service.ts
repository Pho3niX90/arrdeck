import {Injectable, OnDestroy} from '@angular/core';
import {io, Socket} from 'socket.io-client';
import {fromEvent, Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io({
      transports: ['websocket', 'polling'], // Try websocket first
      path: '/socket.io'
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  on<T>(eventName: string): Observable<T> {
    return fromEvent<T>(this.socket, eventName).pipe(shareReplay(1));
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
