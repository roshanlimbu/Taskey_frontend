import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  user: any;
  showProfileDropdown = false;
  dashboardData: any;
  constructor(
    private router: Router,
    private apiService: ApiService,
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.apiService.get('user/dashboard').subscribe({
      next: (res: any) => {
        this.dashboardData = res;
        console.log('hhh', this.dashboardData);
      },
      error: (err) => {
        console.error('Error fetching user dashboard data', err);
      },
    });
  }

  showProfile() {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  logout() {
    // Implement logout logic here
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}
