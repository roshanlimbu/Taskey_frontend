import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LoginPageComponent {
  constructor(public authService: AuthService) {}

  loginWithGithub() {
    this.authService.loginWithGithub();
  }
}
