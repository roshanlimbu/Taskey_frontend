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
  statuses = [
    { id: 'pending', label: 'Pending', color: 'bg-gray-500' },
    { id: 'ready_to_start', label: 'Ready to Start', color: 'bg-blue-400' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-500' },
    { id: 'in_review', label: 'In Review', color: 'bg-purple-500' },
    { id: 'testing_qa', label: 'Testing/QA', color: 'bg-pink-500' },
    {
      id: 'awaiting_feedback',
      label: 'Awaiting Feedback',
      color: 'bg-orange-400',
    },
    { id: 'done', label: 'Done', color: 'bg-green-500' },
    { id: 'cancelled', label: 'Cancelled', color: 'bg-neutral-400' },
    {
      id: 'deployed_released',
      label: 'Deployed/Released',
      color: 'bg-teal-500',
    },
  ];

  kanban: { [key: string]: any[] } = {};

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.apiService.get('user/dashboard').subscribe({
      next: (res: any) => {
        this.dashboardData = res;
        const userId = this.user?.id;
        console.log('hhhh', userId);
        console.log('dashboardData', this.dashboardData);
        const userTasks = (this.dashboardData?.tasks || []).filter(
          (task: any) => task.assigned_to == userId
        );
        this.kanban = {
          todo: userTasks.filter((t: any) => t.status === 'todo'),
          inprogress: userTasks.filter((t: any) => t.status === 'inprogress'),
          done: userTasks.filter((t: any) => t.status === 'done'),
          blocked: userTasks.filter((t: any) => t.status === 'blocked'),
        };
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

  getProjectName(projectId: number): string {
    if (!this.dashboardData?.projects) return 'N/A';
    const project = this.dashboardData.projects.find(
      (p: any) => p.id === projectId
    );
    return project ? project.name : 'N/A';
  }

  getTaskBgColor(statusId: string): string {
    switch (statusId) {
      case 'pending':
        return 'bg-gray-50';
      case 'ready_to_start':
        return 'bg-blue-50';
      case 'in_progress':
        return 'bg-yellow-50';
      case 'blocked':
        return 'bg-red-50';
      case 'in_review':
        return 'bg-purple-50';
      case 'testing_qa':
        return 'bg-pink-50';
      case 'awaiting_feedback':
        return 'bg-orange-50';
      case 'done':
        return 'bg-green-50';
      case 'cancelled':
        return 'bg-neutral-100';
      case 'deployed_released':
        return 'bg-teal-50';
      default:
        return 'bg-neutral-50';
    }
  }
}
