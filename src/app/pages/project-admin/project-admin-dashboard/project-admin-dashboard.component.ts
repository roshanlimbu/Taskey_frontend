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
  get connectedDropLists() {
    return this.statuses.map((s) => s.id);
  }
  getTasks(status: string): any[] {
    if (this.selectedProjectId) {
      return this.tasks.filter(
        (task) =>
          task.status === status && task.project_id === this.selectedProjectId,
      );
    }
    return this.tasks.filter((task) => task.status === status);
  }
  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
  }
  drop(event: any) {
    if (event.previousContainer === event.container) {
      // moveItemInArray is from @angular/cdk/drag-drop
      // Not needed for backend update, just UI
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

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}
  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
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
