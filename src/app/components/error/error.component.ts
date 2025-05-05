import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container">
      <div class="error-content">
        <h1>Authentication Error</h1>
        <p [innerHTML]="errorMessage"></p>
        <div class="details" *ngIf="errorDetails">
          <h3>Technical Details:</h3>
          <pre>{{ errorDetails }}</pre>
        </div>
        <div class="actions">
          <button (click)="tryAgain()" class="primary-button">Try Again</button>
          <button (click)="goHome()" class="secondary-button">Go Home</button>
        </div>
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
        padding: 1rem;
      }

      .error-content {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        width: 100%;
      }

      h1 {
        color: #e53935;
        margin-bottom: 1rem;
      }

      p {
        color: #333;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }

      .details {
        text-align: left;
        margin: 1.5rem 0;
        padding: 1rem;
        background-color: #f8f8f8;
        border-radius: 4px;
        border-left: 4px solid #ccc;
      }

      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.85rem;
        color: #666;
        margin: 0;
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }

      .primary-button,
      .secondary-button {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
        border: none;
      }

      .primary-button {
        background-color: #1976d2;
        color: white;
      }

      .primary-button:hover {
        background-color: #1565c0;
      }

      .secondary-button {
        background-color: #e0e0e0;
        color: #333;
      }

      .secondary-button:hover {
        background-color: #d5d5d5;
      }
    `,
  ],
})
export class ErrorComponent implements OnInit {
  errorMessage: string =
    'An unexpected error occurred with GitHub authentication.';
  errorDetails: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.errorMessage = this.formatErrorMessage(params['message']);

        // Extract technical details if present
        if (params['message'].includes(':')) {
          const parts = params['message'].split(':');
          if (parts.length > 1) {
            this.errorDetails = parts.slice(1).join(':').trim();
          }
        }
      }
    });
  }

  // Format error message to be more user-friendly
  private formatErrorMessage(message: string): string {
    if (message.toLowerCase().includes('state parameter')) {
      return 'GitHub authentication security validation failed.<br><br>This could be due to an expired session or browser cache issue.';
    } else if (message.toLowerCase().includes('invalid_client')) {
      return 'GitHub OAuth app configuration error.<br><br>The client ID or client secret may be invalid.';
    } else if (message.toLowerCase().includes('redirect_uri_mismatch')) {
      return "GitHub OAuth redirect URL mismatch.<br><br>The callback URL registered with GitHub doesn't match the one used by the application.";
    }
    return message;
  }

  tryAgain() {
    this.router.navigate(['/login']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
