import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.initializeAuth();
    this.authService.checkAuthStatus().subscribe({
      error: (error) => {
        console.error('Auth check failed:', error);
        // Continue showing the app even if auth check fails
      },
    });
  }

  loginWithGitHub() {
    this.authService.loginWithGithub();
  }
}
