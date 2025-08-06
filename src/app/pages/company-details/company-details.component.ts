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
  website?: string;
  created_at: string;
  updated_at: string;
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

interface ApiResponse {
  company: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    website?: string;
    created_at: string;
    updated_at: string;
  };
  users: Array<{
    id: number;
    github_id: string;
    name: string;
    email: string;
    role: number;
    dev_role: string;
    profile_image: string;
    password?: string;
    created_at: string;
    updated_at: string;
    is_user_verified: number;
    company_id: number;
  }>;
  projects: Array<{
    id: number;
    company_id: number;
    name: string;
    description: string;
    project_lead_id?: number;
    created_at: string;
    updated_at: string;
    members?: any;
    due_date?: string;
  }>;
  tasks: Array<any>;
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
  companyOwner: any = null;
  loadingOwnerVerification = false;

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
        this.loadCompanyOwner();
      }
    });
  }

  public loadCompanyDetails() {
    this.isLoading = true;
    this.error = null;

    this.apiService.get(`company/details/${this.companyId}`).subscribe({
      next: (response: any) => {
        this.companyDetails = this.processApiResponse(response as ApiResponse);
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

  public loadCompanyOwner() {
    if (!this.companyId) return;

    // First try to get owner from company details API which includes user data
    this.apiService.get(`company/details/${this.companyId}`).subscribe({
      next: (response: any) => {
        // Extract owner from users array where role = 1 (company owner)
        if (response.users && Array.isArray(response.users)) {
          this.companyOwner = response.users.find(
            (user: any) => user.role === 1
          );
        }
      },
      error: (error) => {
        console.error('Error loading company details for owner:', error);
        // If that fails, try the dedicated owner endpoint (might not exist yet)
        this.apiService.get(`company/owner/${this.companyId}`).subscribe({
          next: (ownerResponse: any) => {
            this.companyOwner =
              ownerResponse.owner || ownerResponse.data || ownerResponse;
          },
          error: (ownerError) => {
            console.error('Error loading company owner:', ownerError);
            // Create mock owner for testing
            this.companyOwner = {
              id: 1,
              name: 'Test Owner',
              email: 'owner@testcompany.com',
              role: 1,
              is_user_verified: 0,
            };
          },
        });
      },
    });
  }
  public toggleOwnerVerification() {
    if (!this.companyOwner || this.loadingOwnerVerification) return;

    this.loadingOwnerVerification = true;
    const userId = this.companyOwner.id;

    this.apiService
      .put(`supersuperadmin/company-owners/${userId}/toggle-verification`, {})
      .subscribe({
        next: (response: any) => {
          // Toggle the verification status locally
          this.companyOwner.is_user_verified = this.companyOwner
            .is_user_verified
            ? 0
            : 1;
          this.loadingOwnerVerification = false;

          console.log('Owner verification toggled successfully');
        },
        error: (error) => {
          console.error('Error toggling owner verification:', error);
          this.loadingOwnerVerification = false;
        },
      });
  }

  private processApiResponse(response: ApiResponse): CompanyDetails {
    const { company, users, projects, tasks } = response;

    // Calculate user stats
    const userStats = this.calculateUserStats(users);

    // Calculate project stats
    const projectStats = this.calculateProjectStats(projects);

    // Calculate task stats
    const taskStats = this.calculateTaskStats(tasks);

    // Get recent activity
    const recentActivity = this.getRecentActivity(users, projects);

    return {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      website: company.website,
      created_at: company.created_at,
      updated_at: company.updated_at,
      user_stats: userStats,
      project_stats: projectStats,
      task_stats: taskStats,
      recent_activity: recentActivity,
    };
  }

  private calculateUserStats(users: any[]): CompanyDetails['user_stats'] {
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => user.is_user_verified === 1
    ).length;

    // Count users by role
    const roleCount: { [key: string]: number } = {};
    users.forEach((user) => {
      const roleName = this.getRoleDisplayName(user.role);
      roleCount[roleName] = (roleCount[roleName] || 0) + 1;
    });

    const usersByRole = Object.entries(roleCount).map(([role, count]) => ({
      role,
      count,
    }));

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      users_by_role: usersByRole,
    };
  }

  private calculateProjectStats(
    projects: any[]
  ): CompanyDetails['project_stats'] {
    const totalProjects = projects.length;
    const activeProjects = projects.length;
    // Todo: For now, assume all projects are active since we don't have status field
    const completedProjects = 0; // This would need to be determined based on project status

    return {
      total_projects: totalProjects,
      active_projects: activeProjects,
      completed_projects: completedProjects,
    };
  }

  private calculateTaskStats(tasks: any[]): CompanyDetails['task_stats'] {
    const totalTasks = tasks.length;
    const completedTasks = 0;
    const pendingTasks = 0;
    const inProgressTasks = 0;
    const overdueTasks = 0;

    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
    };
  }

  private getRecentActivity(
    users: any[],
    projects: any[]
  ): CompanyDetails['recent_activity'] {
    // Sort users by created_at and take the most recent ones
    const recentUsers = users
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      }));

    // Sort projects by created_at and take the most recent ones
    const recentProjects = projects
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
      .map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        created_at: project.created_at,
      }));

    return {
      users: recentUsers,
      projects: recentProjects,
    };
  }

  private createMockCompanyData() {
    // Mock data for demonstration
    this.companyDetails = {
      id: this.companyId!,
      name: 'Test Company',
      email: 'testcompany@gmail.com',
      phone: '9876543210',
      address: 'lalvitti',
      website: undefined,
      created_at: '2025-07-04T11:08:50.000000Z',
      updated_at: '2025-07-04T11:08:50.000000Z',
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
      0: 'Master Admin',
      1: 'Company Owner',
      2: 'Project Lead',
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
