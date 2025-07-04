import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface DashboardData {
  user_stats: {
    total_users: number;
    active_users: number;
    new_users_this_month: number;
    users_by_role: Array<{
      role: string;
      count: number;
    }>;
  };
  project_stats: {
    total_projects: number;
    active_projects: number;
    projects_this_month: number;
  };
  task_stats: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    overdue_tasks: number;
  };
  growth_analytics: Array<{
    month: string;
    users: number;
    projects: number;
    tasks: number;
  }>;
  recent_activity: {
    users: Array<{
      id: number;
      name: string;
      email: string;
      role: number;
      created_at: string;
    }>;
    projects: Array<{
      id: number;
      name: string;
      description: string;
      created_at: string;
    }>;
  };
  system_health: {
    database_size: string;
    total_storage_used: string;
    average_response_time: string;
    total_companies: number;
    companies: Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
    }>;
  };
}

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss',
})
export class SuperAdminDashboardComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  isLoading = true;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.apiService.get('supersuperadmin/dashboard-data').subscribe({
      next: (response: any) => {
        this.dashboardData = response.data;
        this.isLoading = false;
        console.log('Dashboard data:', this.dashboardData);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      },
    });
  }

  navigateToCompanyDetails(companyId: any) {
    this.router.navigate(['/superadmin/company', companyId]);
  }

  getRoleDisplayName(role: number): string {
    const roleMap: { [key: number]: string } = {
      0: 'Super Admin',
      1: 'Master Admin',
      2: 'Project Admin',
      3: 'User',
    };
    return roleMap[role] || 'Unknown';
  }

  getCompletionPercentage(): number {
    if (!this.dashboardData) return 0;
    const { completed_tasks, total_tasks } = this.dashboardData.task_stats;
    return total_tasks > 0
      ? Math.round((completed_tasks / total_tasks) * 100)
      : 0;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
