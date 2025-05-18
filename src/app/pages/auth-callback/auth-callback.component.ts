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
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const user = params['user'];
      const error = params['error'];

      if (token && user) {
        this.authService.setToken(token);
        const userData = JSON.parse(decodeURIComponent(user));
        console.log('User data:', userData);

        // Store the role
        this.authService.setRole(userData.role);

        // Route based on role
        switch (userData.role) {
          case 1: // Super Admin
            this.router.navigate(['/dashboard']);
            break;
          case 2: // Admin
            this.router.navigate(['/adminDash']);
            break;
          case 3: // User
            this.router.navigate(['/userDash']);
            break;
          default:
            this.router.navigate(['/login']);
            break;
        }
      } else if (error) {
        console.error('Login error:', decodeURIComponent(error));
        this.router.navigate(['/login']);
      }
    });
  }
}
