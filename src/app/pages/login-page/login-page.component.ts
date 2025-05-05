import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LoginPageComponent {
  constructor(private authService: AuthService) {}

  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }
}

