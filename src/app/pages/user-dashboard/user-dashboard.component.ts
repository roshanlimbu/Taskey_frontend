import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  user: any;
  showProfileDropdown = false;
  dashboardData: any;
  selectedProjectId: number | null = null;
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
  showNotificationToast = false;
  notificationToastMessage = '';
  showNotificationDropdown = false;
  notifications: any[] = [];
  notificationFilter: 'all' | 'unread' | 'read' = 'all';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.apiService.get('user/dashboard').subscribe({
      next: (res: any) => {
        this.dashboardData = res;
        if (this.dashboardData?.projects?.length) {
          this.selectedProjectId = this.dashboardData.projects[0].id;
        }
        this.updateKanban();
      },
      error: (err) => {
        console.error('Error fetching user dashboard data', err);
      },
    });

    this.notificationService.receiveMessage().subscribe((message) => {
      console.log('new message received.', message);
      this.notificationToastMessage =
        message.notification?.body || 'New notification!';
      this.showNotificationToast = true;
      setTimeout(() => {
        this.showNotificationToast = false;
      }, 3000);
    });
  }

  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
    this.updateKanban();
  }

  updateKanban() {
    if (!this.dashboardData?.tasks) return;
    const projectTasks = this.dashboardData.tasks.filter((task: any) =>
      this.selectedProjectId ? task.project_id == this.selectedProjectId : true
    );
    this.kanban = {};
    for (const status of this.statuses) {
      this.kanban[status.id] = projectTasks.filter(
        (t: any) => t.status === status.id
      );
    }
  }

  showProfile() {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  logout() {
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

  get connectedDropLists() {
    return this.statuses.map((s) => s.id);
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const oldStatus = task.status;
      task.status = event.container.id;
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.apiService
        .put(`tasks/${task.id}/status`, { status: task.status })
        .subscribe({
          next: () => this.updateKanban(),
          error: () => {
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );
            task.status = oldStatus;
            alert('Failed to update task status. Please try again.');
          },
        });
    }
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    this.apiService.get('notifications').subscribe({
      next: (res: any) => {
        this.notifications = res.data || [];
      },
      error: (err) => {
        console.error('Error fetching notifications', err);
        this.notifications = [];
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (
      this.showNotificationDropdown &&
      !this.eRef.nativeElement.contains(event.target)
    ) {
      this.showNotificationDropdown = false;
    }
  }

  markAsRead(notif: any) {
    if (notif.read === 1) return;
    this.apiService
      .post(`notifications/${notif.id}/read`, { read: 1 })
      .subscribe({
        next: () => {
          notif.read = 1;
        },
        error: (err) => {
          console.error('Failed to mark notification as read', err);
        },
      });
  }

  deleteNotification(notif: any) {
    this.apiService.delete(`notifications/${notif.id}`).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (n) => n.id !== notif.id
        );
      },
      error: (err) => {
        console.error('Failed to delete notification', err);
      },
    });
  }

  get unreadNotificationsExists(): boolean {
    return (
      Array.isArray(this.notifications) &&
      this.notifications.some((n) => n.read === 0)
    );
  }
}
