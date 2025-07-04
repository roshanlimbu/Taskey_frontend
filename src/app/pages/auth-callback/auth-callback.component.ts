import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
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
    private notificationService: NotificationService,
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (window.location.href.includes('error=')) {
      const errorMessage = 'GitHub authentication failed. Please try again.';
      this.router.navigate(['/error'], {
        queryParams: { message: errorMessage },
      });
      return;
    }

    this.route.queryParams.subscribe((params) => {
      console.log('Callback query params:', params);

      if (params['token'] && params['user']) {
        try {
          // store the token
          this.authService.setToken(params['token']);

          // parse and store user info if needed
          const user = JSON.parse(decodeURIComponent(params['user']));
          console.log('User info:', user);
          localStorage.setItem('user', JSON.stringify(user));

          this.notificationService.requestPermission();

          // Check if user has a company_id
          if (
            user.company_id === null ||
            user.company_id === undefined ||
            user.company_id === ''
          ) {
            // User is not associated with any company, redirect to company form
            console.log(
              'User has no company association, redirecting to company form'
            );
            this.router.navigate(['/company-form']);
            return;
          }

          // User has a company, proceed with normal role-based navigation
          switch (user.role) {
            case 0:
              this.router.navigate(['/super/dashboard']);
              break;
            case 1:
              this.router.navigate(['/dashboard']);
              break;
            case 2:
              this.router.navigate(['/admin/dashboard']);
              break;
            case 3:
              this.router.navigate(['/user/dashboard']);
              break;
            default:
              this.router.navigate(['/login']);
          }
        } catch (error) {
          console.error('Error processing authentication:', error);
          this.router.navigate(['/error'], {
            queryParams: {
              message:
                'Could not process authentication data. Please try again.',
            },
          });
        }
      } else if (params['error']) {
        console.error('GitHub OAuth error:', params['error']);
        this.router.navigate(['/error'], {
          queryParams: {
            message: `GitHub OAuth error: ${
              params['error_description'] || params['error']
            }`,
          },
        });
      } else {
        console.error('Missing token or user in callback params');
        this.router.navigate(['/error'], {
          queryParams: {
            message:
              'Authentication failed - missing token data. Please try again.',
          },
        });
      }
    });
  }
}
