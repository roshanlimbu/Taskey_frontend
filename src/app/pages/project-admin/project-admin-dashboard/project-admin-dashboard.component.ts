import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { NotificationService } from '../../../services/notification.service';
import { ChatComponent } from '../../../components/chat/chat.component';

@Component({
  selector: 'app-project-admin-dashboard',
  imports: [CommonModule, FormsModule, DragDropModule, ChatComponent],
  templateUrl: './project-admin-dashboard.component.html',
  styleUrl: './project-admin-dashboard.component.scss',
})
export class ProjectAdminDashboardComponent implements OnInit {
  user: any;
  showProfileDropdown = false;
  dashboardData: any = { projects: [], tasks: [] };
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
  chatTaskId: number | null = null;
  newTaskTitle: string = '';
  newTaskDesc: string = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.apiService.get('sadmin/projects').subscribe({
      next: (res: any) => {
        // Only projects where user is project_lead
        this.dashboardData.projects = (res.projects || []).filter(
          (p: any) => p.project_lead_id === this.user.id
        );
        this.dashboardData.tasks = [];
        if (this.dashboardData.projects.length) {
          this.selectedProjectId = this.dashboardData.projects[0].id;
          if (this.selectedProjectId !== null) {
            this.fetchProjectTasks(this.selectedProjectId);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching admin projects', err);
      },
    });
    this.notificationService.receiveMessage().subscribe((message) => {
      this.notificationToastMessage =
        message.notification?.body || 'New notification!';
      this.showNotificationToast = true;
      setTimeout(() => {
        this.showNotificationToast = false;
      }, 3000);
    });
  }

  fetchProjectTasks(projectId: number) {
    this.apiService.get(`sadmin/projects/${projectId}`).subscribe({
      next: (res: any) => {
        this.dashboardData.tasks = res.tasks || [];
        this.updateKanban();
      },
      error: (err) => {
        console.error('Error fetching project tasks', err);
      },
    });
  }

  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
    this.fetchProjectTasks(projectId);
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

  // Notification logic (same as user)
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
    this.closeAllMenus();
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

  closeAllMenus(exceptTask?: any) {
    for (const status of this.statuses) {
      if (!this.kanban[status.id]) continue;
      for (const t of this.kanban[status.id]) {
        if (t !== exceptTask) {
          t.showMenu = false;
        }
      }
    }
  }

  toggleTaskMenu(task: any, event: MouseEvent) {
    event.stopPropagation();
    this.closeAllMenus(task);
    task.showMenu = !task.showMenu;
  }

  // Management actions for project-admin (to be implemented in the template):
  // - addTask, editTask, deleteTask, addMember, removeMember
  // These will use the sadmin/project endpoints.

  // Example: Add Task
  addTask(projectId: number | null, taskData: any) {
    if (projectId === null) return;
    this.apiService
      .post(`sadmin/projects/${projectId}/tasks`, taskData)
      .subscribe({
        next: (res: any) => {
          this.fetchProjectTasks(projectId);
          this.newTaskTitle = '';
          this.newTaskDesc = '';
        },
        error: (err) => {
          alert('Failed to add task');
        },
      });
  }

  // Example: Edit Task
  editTask(taskId: number, taskData: any) {
    this.apiService.put(`sadmin/tasks/${taskId}`, taskData).subscribe({
      next: (res: any) => {
        this.fetchProjectTasks(this.selectedProjectId!);
      },
      error: (err) => {
        alert('Failed to edit task');
      },
    });
  }

  // Example: Delete Task
  deleteTask(taskId: number) {
    this.apiService.delete(`sadmin/tasks/${taskId}`).subscribe({
      next: (res: any) => {
        this.fetchProjectTasks(this.selectedProjectId!);
      },
      error: (err) => {
        alert('Failed to delete task');
      },
    });
  }

  // Example: Add Member
  addMember(projectId: number, memberIds: number[]) {
    this.apiService
      .post(`sadmin/projects/${projectId}/members`, { member_ids: memberIds })
      .subscribe({
        next: (res: any) => {
          this.ngOnInit();
        },
        error: (err) => {
          alert('Failed to add member');
        },
      });
  }

  // Example: Remove Member
  removeMember(projectId: number, memberIds: number[]) {
    this.apiService
      .post(`sadmin/projects/${projectId}/remove-members`, {
        member_ids: memberIds,
      })
      .subscribe({
        next: (res: any) => {
          this.ngOnInit();
        },
        error: (err) => {
          alert('Failed to remove member');
        },
      });
  }

  // Chat logic
  openChat(taskId: number) {
    this.chatTaskId = taskId;
  }
  closeChat() {
    this.chatTaskId = null;
  }

  // Toggle need help status for a task
  toggleNeedHelp(task: any) {
    const newNeedHelp = !task.need_help;
    this.apiService
      .put(`tasks/${task.id}/need-help`, { need_help: newNeedHelp })
      .subscribe({
        next: (res: any) => {
          task.need_help = newNeedHelp;
        },
        error: (err) => {
          alert('Failed to update need help status');
        },
      });
  }
}
