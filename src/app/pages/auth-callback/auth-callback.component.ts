import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  template: '<div class="loading">Processing login...</div>',
  styles: [
    `
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 1.2rem;
        color: #4a5568;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      console.log('Callback query params:', params);
      if (params['code'] && params['state']) {
        console.log(
          'Initiating handleGithubCallback with code:',
          params['code'],
          'state:',
          params['state'],
        );
        this.authService
          .handleGithubCallback(params['code'], params['state'])
          .subscribe({
            next: (response) => {
              console.log('handleGithubCallback success:', response);
            },
            error: (error: any) => {
              console.error('Authentication failed:', error);
            },
          });
      } else {
        console.error('Missing code or state in callback params');
        this.authService.handleAuthError(
          new Error('Invalid callback parameters'),
        );
      }
    });
  }
}
