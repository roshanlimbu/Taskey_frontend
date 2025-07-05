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
import { ChatComponent } from '../../components/chat/chat.component';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, FormsModule, DragDropModule, ChatComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  user: any;
  showProfileDropdown = false;
  dashboardData: any;
  selectedProjectId: number | null = null;
  statuses: Array<{
    id: string;
    name: string;
    color: string;
    isCustom: boolean;
    originalId?: number;
  }> = [];

  // Color options for converting hex to CSS classes
  colorOptions = [
    { name: 'Blue', class: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'Green', class: 'bg-green-500', hex: '#10b981' },
    { name: 'Yellow', class: 'bg-yellow-500', hex: '#f59e0b' },
    { name: 'Red', class: 'bg-red-500', hex: '#ef4444' },
    { name: 'Purple', class: 'bg-purple-500', hex: '#8b5cf6' },
    { name: 'Pink', class: 'bg-pink-500', hex: '#ec4899' },
    { name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
    { name: 'Teal', class: 'bg-teal-500', hex: '#14b8a6' },
    { name: 'Indigo', class: 'bg-indigo-500', hex: '#6366f1' },
    { name: 'Cyan', class: 'bg-cyan-500', hex: '#06b6d4' },
    { name: 'Emerald', class: 'bg-emerald-500', hex: '#10b981' },
    { name: 'Lime', class: 'bg-lime-500', hex: '#84cc16' },
    { name: 'Amber', class: 'bg-amber-500', hex: '#f59e0b' },
    { name: 'Rose', class: 'bg-rose-500', hex: '#f43f5e' },
    { name: 'Violet', class: 'bg-violet-500', hex: '#8b5cf6' },
    { name: 'Sky', class: 'bg-sky-500', hex: '#0ea5e9' },
    { name: 'Gray', class: 'bg-gray-500', hex: '#6b7280' },
  ];

  kanban: { [key: string]: any[] } = {};
  showNotificationToast = false;
  notificationToastMessage = '';
  showNotificationDropdown = false;
  notifications: any[] = [];
  notificationFilter: 'all' | 'unread' | 'read' = 'all';
  chatTaskId: number | null = null;

  // Commit hash popup properties
  showCommitHashPopup = false;
  commitHashForm = {
    task_id: 0,
    project_id: 0,
    commit_hash: '',
  };
  pendingTaskStatusChange: {
    task: any;
    event: CdkDragDrop<any[]>;
  } | null = null;

  // Commit hash viewing properties
  showCommitHashView = false;
  selectedTaskForCommits: any = null;
  taskCommitHashes: any[] = [];
  loadingCommitHashes = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    // Load custom statuses first
    this.loadCustomStatuses();

    this.apiService.get('user/dashboard').subscribe({
      next: (res: any) => {
        console.log('Dashboard data received:', res);
        this.dashboardData = res;
        if (this.dashboardData?.projects?.length) {
          this.selectedProjectId = this.dashboardData.projects[0].id;
        }
        console.log('Dashboard tasks:', this.dashboardData?.tasks);
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

  loadCustomStatuses() {
    this.apiService.get('sadmin/status').subscribe({
      next: (res: any) => {
        this.statuses = (res.statuses || []).map((status: any) => ({
          id: status.id.toString(), // Convert numeric ID to string for consistency
          name: status.name,
          color: this.convertHexToClass(status.color),
          isCustom: true,
          originalId: status.id, // Keep original numeric ID for backend operations
        }));
        console.log('Loaded statuses:', this.statuses);
        // Update kanban after statuses are loaded
        this.updateKanban();
      },
      error: (err) => {
        console.error('Failed to load custom statuses:', err);
        // Fallback to localStorage
        const savedStatuses = localStorage.getItem('customStatuses');
        if (savedStatuses) {
          this.statuses = JSON.parse(savedStatuses);
          this.updateKanban();
        } else {
          // If no saved statuses, show empty state
          this.statuses = [];
        }
      },
    });
  }

  private convertHexToClass(hexColor: string): string {
    if (!hexColor || !hexColor.startsWith('#')) {
      return 'bg-blue-500'; // default
    }
    const colorOption = this.colorOptions.find(
      (option) => option.hex === hexColor
    );
    return colorOption ? colorOption.class : 'bg-blue-500';
  }

  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
    this.updateKanban();
  }

  updateKanban() {
    if (!this.dashboardData?.tasks || !this.statuses.length) return;

    const projectTasks = this.dashboardData.tasks.filter((task: any) =>
      this.selectedProjectId ? task.project_id == this.selectedProjectId : true
    );

    this.kanban = {};
    for (const status of this.statuses) {
      this.kanban[status.id] = projectTasks.filter((task: any) => {
        // Handle both cases: task.status as string or task.status as object
        if (typeof task.status === 'string') {
          return task.status === status.id;
        } else if (task.status && task.status.id) {
          // If status is an object, check if the status ID matches
          return task.status.id.toString() === status.id;
        } else if (task.status_id) {
          // If we have status_id, compare with the status ID
          return task.status_id.toString() === status.id;
        }
        return false;
      });
    }
    console.log('Updated kanban:', this.kanban);
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
    const status = this.statuses.find((s) => s.id === statusId);
    if (!status) return 'bg-neutral-50';

    // Convert the color class to a lighter background variant
    const colorMap: { [key: string]: string } = {
      'bg-gray-500': 'bg-gray-50',
      'bg-blue-500': 'bg-blue-50',
      'bg-yellow-500': 'bg-yellow-50',
      'bg-red-500': 'bg-red-50',
      'bg-purple-500': 'bg-purple-50',
      'bg-pink-500': 'bg-pink-50',
      'bg-orange-500': 'bg-orange-50',
      'bg-green-500': 'bg-green-50',
      'bg-teal-500': 'bg-teal-50',
      'bg-indigo-500': 'bg-indigo-50',
      'bg-cyan-500': 'bg-cyan-50',
      'bg-emerald-500': 'bg-emerald-50',
      'bg-lime-500': 'bg-lime-50',
      'bg-amber-500': 'bg-amber-50',
      'bg-rose-500': 'bg-rose-50',
      'bg-violet-500': 'bg-violet-50',
      'bg-sky-500': 'bg-sky-50',
    };

    return colorMap[status.color] || 'bg-neutral-50';
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
      const newStatusId = event.container.id;

      // Check if the task is being moved to completed status
      const targetStatus = this.statuses.find((s) => s.id === newStatusId);
      if (
        targetStatus &&
        targetStatus.name.toLowerCase().includes('completed')
      ) {
        // Store the pending change and show commit hash popup
        this.pendingTaskStatusChange = { task, event };
        this.commitHashForm = {
          task_id: task.id,
          project_id: task.project_id,
          commit_hash: '',
        };
        this.showCommitHashPopup = true;
        return;
      }

      // Normal status change without commit hash requirement
      this.performStatusChange(task, event);
    }
  }

  performStatusChange(task: any, event: CdkDragDrop<any[]>) {
    const oldStatus = task.status;
    task.status = event.container.id;
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.apiService
      .put(`tasks/${task.id}/status`, { status_id: Number(task.status) })
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

    // Don't close menus if user is interacting with popups
    if (
      !this.showCommitHashPopup &&
      !this.showCommitHashView &&
      !this.chatTaskId
    ) {
      this.closeAllMenus();
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

  toggleNeedHelp(task: any) {
    const updated = { need_help: !task.need_help };
    this.apiService.put(`tasks/${task.id}/need-help`, updated).subscribe({
      next: (res: any) => {
        task.need_help = res.task.need_help;
        task.showMenu = false;
        this.updateKanban();
      },
      error: (err) => {
        alert('Failed to update need help flag.');
      },
    });
  }

  openChat(taskId: number) {
    this.chatTaskId = taskId;
  }

  closeChat() {
    this.chatTaskId = null;
  }

  submitCommitHash() {
    if (!this.commitHashForm.commit_hash.trim()) {
      alert('Please enter a commit hash.');
      return;
    }

    // First, submit the commit hash
    this.apiService.post('commit/add', this.commitHashForm).subscribe({
      next: (res: any) => {
        console.log('Commit hash stored successfully:', res);
        // Now perform the status change
        if (this.pendingTaskStatusChange) {
          this.performStatusChange(
            this.pendingTaskStatusChange.task,
            this.pendingTaskStatusChange.event
          );
        }
        this.closeCommitHashPopup();
      },
      error: (err) => {
        console.error('Failed to store commit hash:', err);
        alert('Failed to store commit hash. Please try again.');
      },
    });
  }

  closeCommitHashPopup() {
    this.showCommitHashPopup = false;
    this.commitHashForm = {
      task_id: 0,
      project_id: 0,
      commit_hash: '',
    };
    this.pendingTaskStatusChange = null;
  }

  showTaskCommitHashes(task: any) {
    this.selectedTaskForCommits = task;
    this.showCommitHashView = true;
    this.loadingCommitHashes = true;

    // Close the task menu
    task.showMenu = false;

    const payload = {
      task_id: task.id,
      project_id: task.project_id,
    };
    // Fetch commit hashes for this task
    this.apiService.post(`commit/getcommithash`, payload).subscribe({
      next: (res: any) => {
        this.taskCommitHashes = res || [];
        this.loadingCommitHashes = false;
      },
      error: (err) => {
        console.error('Failed to fetch commit hashes:', err);
        this.taskCommitHashes = [];
        this.loadingCommitHashes = false;
      },
    });
  }

  closeCommitHashView() {
    this.showCommitHashView = false;
    this.selectedTaskForCommits = null;
    this.taskCommitHashes = [];
    this.loadingCommitHashes = false;
  }

  copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show a brief success message
        this.notificationToastMessage = 'Commit hash copied to clipboard!';
        this.showNotificationToast = true;
        setTimeout(() => {
          this.showNotificationToast = false;
        }, 2000);
      })
      .catch(() => {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        this.notificationToastMessage = 'Commit hash copied to clipboard!';
        this.showNotificationToast = true;
        setTimeout(() => {
          this.showNotificationToast = false;
        }, 2000);
      });
  }

  get hasStatuses() {
    return this.statuses.length > 0;
  }
}
