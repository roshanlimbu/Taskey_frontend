import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LoginPageComponent {
  constructor(private authService: AuthService, private router: Router) {}

  async loginWithGithub() {
    try {
      await this.authService.loginWithGithub();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  ngOnInit() {
    this.authService.initializeAuth();
  }
} 