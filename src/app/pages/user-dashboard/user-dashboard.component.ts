import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  user: any;
  showProfileDropdown = false;
  constructor(private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
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
