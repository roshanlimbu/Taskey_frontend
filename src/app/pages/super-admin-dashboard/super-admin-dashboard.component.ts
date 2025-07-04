import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss',
})
export class SuperAdminDashboardComponent {
  constructor(private apiService: ApiService) {}
  ngOnInit() {
    this.apiService.get('supersuperadmin/dashboard-data').subscribe((data) => {
      console.log('Dashboard data:', data);
    });
  }
}
