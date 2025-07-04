import { Component, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ProjectComponent } from '../../../components/project/project.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from '../../../components/chat/chat.component';

interface Project {
  id: number;
  name: string;
  description: string;
  due_date: string;
  members?: any;
  project_lead_id?: number;
}
interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  status: string;
  due_date: string;
  project_id: number;
  need_help: boolean;
}

@Component({
  selector: 'app-project-admin-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ChatComponent,
    ProjectComponent,
  ],
  templateUrl: './project-admin-dashboard.component.html',
  styleUrls: ['./project-admin-dashboard.component.scss'],
})
export class ProjectAdminDashboardComponent implements OnInit {
  user: any;
  projects: Project[] = [];
  tasks: Task[] = [];
  members: any[] = [];
  chat: any[] = [];
  chatMessages: any[] = [];

  showNotificationToast = false;
  showNotificationDropdown = false;

  showProfileDropdown = false;

  selectedProjectId: number | null = null;
  dragging = false;

  // Custom status management
  showAddStatusModal = false;
  newStatusName = '';
  newStatusColor = 'bg-blue-500';

  defaultStatuses = [
    { id: 'pending', label: 'Pending', color: 'bg-gray-500', isCustom: false },
    {
      id: 'ready_to_start',
      label: 'Ready to Start',
      color: 'bg-blue-400',
      isCustom: false,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      color: 'bg-yellow-500',
      isCustom: false,
    },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-500', isCustom: false },
    {
      id: 'in_review',
      label: 'In Review',
      color: 'bg-purple-500',
      isCustom: false,
    },
    {
      id: 'testing_qa',
      label: 'Testing/QA',
      color: 'bg-pink-500',
      isCustom: false,
    },
    {
      id: 'awaiting_feedback',
      label: 'Awaiting Feedback',
      color: 'bg-orange-400',
      isCustom: false,
    },
    { id: 'done', label: 'Done', color: 'bg-green-500', isCustom: false },
    {
      id: 'cancelled',
      label: 'Cancelled',
      color: 'bg-neutral-400',
      isCustom: false,
    },
    {
      id: 'deployed_released',
      label: 'Deployed/Released',
      color: 'bg-teal-500',
      isCustom: false,
    },
  ];

  customStatuses: Array<{
    id: string;
    label: string;
    color: string;
    isCustom: boolean;
  }> = [];

  get statuses() {
    return [...this.defaultStatuses, ...this.customStatuses];
  }

  colorOptions = [
    { name: 'Blue', class: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'Green', class: 'bg-green-500', hex: '#22c55e' },
    { name: 'Yellow', class: 'bg-yellow-500', hex: '#eab308' },
    { name: 'Red', class: 'bg-red-500', hex: '#ef4444' },
    { name: 'Purple', class: 'bg-purple-500', hex: '#a21caf' },
    { name: 'Pink', class: 'bg-pink-500', hex: '#ec4899' },
    { name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
    { name: 'Teal', class: 'bg-teal-500', hex: '#14b8a6' },
    { name: 'Indigo', class: 'bg-indigo-500', hex: '#6366f1' },
    { name: 'Cyan', class: 'bg-cyan-500', hex: '#06b6d4' },
    { name: 'Emerald', class: 'bg-emerald-500', hex: '#10b981' },
    { name: 'Lime', class: 'bg-lime-500', hex: '#84cc16' },
    { name: 'Amber', class: 'bg-amber-500', hex: '#f59e42' },
    { name: 'Rose', class: 'bg-rose-500', hex: '#f43f5e' },
    { name: 'Violet', class: 'bg-violet-500', hex: '#8b5cf6' },
    { name: 'Sky', class: 'bg-sky-500', hex: '#0ea5e9' },
  ];

  get connectedDropLists() {
    return this.statuses.map((s) => s.id);
  }
  getTasks(status: string): any[] {
    if (this.selectedProjectId) {
      return this.tasks.filter(
        (task) =>
          task.status === status && task.project_id === this.selectedProjectId
      );
    }
    return this.tasks.filter((task) => task.status === status);
  }
  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
  }
  drop(event: any) {
    if (event.previousContainer === event.container) {
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const oldStatus = task.status;
      task.status = event.container.id;
      this.updateTask(task);
    }
    this.dragging = false;
  }
  toggleMemberMenu(index: number) {
    this.openMemberMenu = this.openMemberMenu === index ? null : index;
  }
  openMemberMenu: number | null = null;

  reportNotFound = false;

  constructor(private apiService: ApiService, private router: Router) {}
  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadCustomStatuses();
    this.apiService.get('padmin/dashboard').subscribe({
      next: (res: any) => {
        this.projects = res[1].projects;
        this.tasks = res[1].tasks;
        this.members = res[1].members;
        this.chat = res[1].chat;
        this.chatMessages = res[1].chatMessages;
      },
    });
  }

  loadCustomStatuses() {
    const savedStatuses = localStorage.getItem('customStatuses');
    if (savedStatuses) {
      this.customStatuses = JSON.parse(savedStatuses);
    }
  }

  saveCustomStatuses() {
    localStorage.setItem('customStatuses', JSON.stringify(this.customStatuses));
  }

  openAddStatusModal() {
    this.showAddStatusModal = true;
    this.newStatusName = '';
    this.newStatusColor = 'bg-blue-500';
  }

  closeAddStatusModal() {
    this.showAddStatusModal = false;
    this.newStatusName = '';
    this.newStatusColor = 'bg-blue-500';
  }

  addCustomStatus() {
    if (this.newStatusName.trim()) {
      const statusId = this.newStatusName.toLowerCase().replace(/\s+/g, '_');

      // Check if status already exists
      const existingStatus = this.statuses.find((s) => s.id === statusId);
      if (existingStatus) {
        alert('A status with this name already exists');
        return;
      }

      const newStatus = {
        id: statusId,
        label: this.newStatusName.trim(),
        color: this.newStatusColor,
        isCustom: true,
      };

      this.customStatuses.push(newStatus);
      this.saveCustomStatuses();
      this.closeAddStatusModal();
    }
  }

  deleteCustomStatus(statusId: string) {
    // Check if any tasks are using this status
    const tasksUsingStatus = this.tasks.filter(
      (task) => task.status === statusId
    );
    if (tasksUsingStatus.length > 0) {
      const confirmDelete = confirm(
        `There are ${tasksUsingStatus.length} tasks using this status. Are you sure you want to delete it? Tasks will be moved to 'Pending' status.`
      );
      if (!confirmDelete) return;

      // Move tasks to pending status
      tasksUsingStatus.forEach((task) => {
        task.status = 'pending';
        this.updateTask(task);
      });
    }

    this.customStatuses = this.customStatuses.filter(
      (status) => status.id !== statusId
    );
    this.saveCustomStatuses();
  }

  showProfile() {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  updateTask(task: Task) {
    this.apiService
      .put(`padmin/tasks/status/update/${task.id}`, { status: task.status })
      .subscribe({
        next: (res: any) => {
          console.log('ddddd', res);
        },
        error: (err: any) => {
          console.log('ddddd', err);
        },
      });
  }

  logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}
