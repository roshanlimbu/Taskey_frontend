import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomNotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();
  constructor() {}

  showSuccess(message: string, title?: string) {
    this.showNotification({ type: 'success', message, title });
  }
  showError(message: string, title?: string) {
    this.showNotification({ type: 'error', message, title });
  }
  showInfo(message: string, title?: string) {
    this.showNotification({ type: 'info', message, title });
  }

  showWarning(message: string, title?: string) {
    this.showNotification({ type: 'warning', message, title });
  }

  private showNotification(notification: Notification) {
    this.notificationSubject.next(notification);
  }
}
