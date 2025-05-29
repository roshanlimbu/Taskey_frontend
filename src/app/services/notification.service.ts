import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { ApiService } from './api.service';
import { CustomNotificationService } from './custom-notification.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  firebaseConfig = {
    apiKey: 'AIzaSyCk2LEXYTNhgrZiY3KXlsjylZdDD1KA13k',
    authDomain: 'tsky-28991.firebaseapp.com',
    projectId: 'tsky-28991',
    storageBucket: 'tsky-28991.firebasestorage.app',
    messagingSenderId: '666432440443',
    appId: '1:666432440443:web:b50fa0df3b0a422d087ade',
    measurementId: 'G-L5N0H3DKZ0',
    vapidKey:
      'BPkplQGD-komTJjC4mNImzb8PH8xhtd29_DYSLpqqu93r8MIzNkRJf8eYRYaZi4K_FTWiDaZ0HtiNGFr_y_hPr0',
  };

  app: any;
  messaging: any;
  private _token: string = '';
  private tokenPromise: Promise<string> | null = null;
  private listenerInitialized = false;
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private customNotificationService: CustomNotificationService
  ) {
    this.app = initializeApp(this.firebaseConfig);
    this.messaging = getMessaging(this.app);
  }

  async requestPermission(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: this.firebaseConfig.vapidKey,
        });
        if (token) {
          console.log('FCM Token:', token);
          this.tokenSubject.next(token);
          // Send token to Laravel backend
          const payload = { fcm_token: token };
          this.api.post('subscribe', payload).subscribe({
            next: () => {
              console.log('Token sent to backend successfully');
            },
            error: (err: any) => {
              console.error('Error sending token to backend:', err);
            },
          });
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.error('Notification permission not granted.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }

  // receive incoming message
  receiveMessage(): Observable<any> {
    return new Observable((observer) => {
      onMessage(this.messaging, (payload) => {
        observer.next(payload);
      });
    });
  }
  // get current token
  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }
}
