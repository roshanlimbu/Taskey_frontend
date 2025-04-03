import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container d-flex justify-content-center align-items-center" style="height: 100vh">
      <div class="card p-4 text-center" style="width: 400px">
        <div class="mb-3">
          <i class="bi bi-wifi-off" style="font-size: 3rem;"></i>
        </div>
        <h2 class="mb-3">You're Offline</h2>
        <p>
          Don't worry! You can still use most of Taskey's features offline.
          Your changes will sync when you're back online.
        </p>
        <button 
          class="btn btn-primary mt-3" 
          (click)="checkConnection()"
        >
          Check Connection
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class OfflinePageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.addNetworkListeners();
  }

  addNetworkListeners(): void {
    window.addEventListener('online', () => {
      window.location.reload();
    });
  }

  checkConnection(): void {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert('Still offline. Please check your internet connection.');
    }
  }
} 