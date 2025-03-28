import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginWithGithub() {
    window.location.href = 'http://localhost:8000/auth/github';
  }
}
