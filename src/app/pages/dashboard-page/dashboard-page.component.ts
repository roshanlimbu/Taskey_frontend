import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        // localStorage.setItem('authToken', token);
        this.authService.setToken(token);
        // this.router.navigate(['/dashboard']);
      }
    });
  }

  logout() {
    // For now, just redirect back to login (add backend logout later)
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
