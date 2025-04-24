import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LoginPageComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async loginWithGithub() {
    try {
      await this.authService.loginWithGithub();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
} 