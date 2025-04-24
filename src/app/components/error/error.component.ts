import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-error',
  template: `
    <div class="error-container">
      <div class="error-content">
        <h1>Oops! Something went wrong</h1>
        <p>{{ errorMessage }}</p>
        <button (click)="goHome()" class="primary-button">Go Home</button>
      </div>
    </div>
  `,
  styles: [
    `
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
      }

      .error-content {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 90%;
      }

      h1 {
        color: #e53935;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }

      .primary-button {
        background-color: #1976d2;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
      }

      .primary-button:hover {
        background-color: #1565c0;
      }
    `,
  ],
})
export class ErrorComponent implements OnInit {
  errorMessage: string = 'An unexpected error occurred.';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.errorMessage = params['message'];
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
