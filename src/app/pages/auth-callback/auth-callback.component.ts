import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['code'] && params['state']) {
        this.authService
          .handleGithubCallback(params['code'], params['state'])
          .subscribe({
            next: (response) => {
              // Check if user is super admin and navigate accordingly
              if (response.user && response.user.is_super_admin === 1) {
                this.router.navigate(['/dashboard']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: (error: any) => {
              console.error('Authentication failed:', error);
              this.router.navigate(['/login']);
            },
          });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}

