import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface CompanyDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  user_stats: {
    total_users: number;
    active_users: number;
    users_by_role: Array<{
      role: string;
      count: number;
    }>;
  };
  project_stats: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
  };
  task_stats: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    overdue_tasks: number;
  };
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
}

@Component({
  selector: 'app-company-details',
  imports: [CommonModule],
  templateUrl: './company-details.component.html',
  styleUrl: './company-details.component.scss',
})
export class CompanyDetailsComponent implements OnInit {
  companyDetails: CompanyDetails | null = null;
  companyId: number | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.companyId = +params['id'];
      if (this.companyId) {
        this.loadCompanyDetails();
      }
    });
  }

  public loadCompanyDetails() {
    this.isLoading = true;
    this.error = null;

    this.apiService.get(`api/company/details/${this.companyId}`).subscribe({
      next: (response: any) => {
        this.companyDetails = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading company details:', error);

        // For demo purposes, create mock data if API is not available
        if (error.status === 404 || error.status === 500) {
          this.createMockCompanyData();
        } else {
          this.error = 'Failed to load company details';
          this.isLoading = false;
        }
      },
    });
  }

  private createMockCompanyData() {
    // Mock data for demonstration
    this.companyDetails = {
      id: this.companyId!,
      name: 'Test Company',
      email: 'testcompany@gmail.com',
      phone: '9876543210',
      address: 'lalvitti',
      created_at: '2025-07-04T11:08:50.000000Z',
      user_stats: {
        total_users: 5,
        active_users: 3,
        users_by_role: [
          { role: 'Master Admin', count: 1 },
          { role: 'Project Admin', count: 1 },
          { role: 'User', count: 3 },
        ],
      },
      project_stats: {
        total_projects: 3,
        active_projects: 2,
        completed_projects: 1,
      },
      task_stats: {
        total_tasks: 15,
        completed_tasks: 5,
        pending_tasks: 8,
        in_progress_tasks: 2,
        overdue_tasks: 0,
      },
      recent_activity: {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 3,
            created_at: '2025-07-04T11:26:30.000000Z',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 2,
            created_at: '2025-07-03T10:15:20.000000Z',
          },
        ],
        projects: [
          {
            id: 1,
            name: 'Frontend Development',
            description: 'Building modern web interface',
            created_at: '2025-07-04T11:27:31.000000Z',
          },
          {
            id: 2,
            name: 'API Integration',
            description: 'Connecting frontend with backend services',
            created_at: '2025-07-03T09:45:15.000000Z',
          },
        ],
      },
    };
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/superadmin/dashboard']);
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
    if (!this.companyDetails) return 0;
    const { completed_tasks, total_tasks } = this.companyDetails.task_stats;
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
