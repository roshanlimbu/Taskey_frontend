import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from 'firebase/messaging';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private messaging: Messaging | null = null;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public currentMessage = new BehaviorSubject<any>(null);

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

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    const app = initializeApp(this.firebaseConfig);
    this.messaging = getMessaging(app);
  }

  // request permission and get FCM token
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!this.messaging) return null;
    try {
      const token = await getToken(this.messaging, {
        vapidKey: this.firebaseConfig.vapidKey,
      });
      this.tokenSubject.next(token);
      return token;
    } catch (err) {
      this.tokenSubject.next(null);
      return null;
    }
  }

  // listen for foreground messages
  listenForMessages() {
    if (!this.messaging) return;
    onMessage(this.messaging, (payload) => {
      this.currentMessage.next(payload);
    });
  }

  // observable for token
  getTokenObservable() {
    return this.tokenSubject.asObservable();
  }

  // observable for messages
  getMessageObservable() {
    return this.currentMessage.asObservable();
  }
}
