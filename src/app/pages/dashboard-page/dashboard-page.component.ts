import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActivitiesService } from '../../services/activities.service';
import { ActivitiesComponent } from '../../components/activities/activities.component';

interface Project {
  id: number;
  name: string;
  description: string;
  due_date: string;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  members?: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ActivitiesComponent,
  ],
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit {
  repoForm: FormGroup;
  projectForm: FormGroup;
  showNewProjectForm = false;
  isSubmitting = false;

  projects: Project[] = [];

  showContextMenu = false;
  contextMenuIndex: number | null = null;
  contextMenuPosition = { x: 0, y: 0 };

  showEditProjectForm = false;
  isSubmittingEdit = false;
  editProjectForm: FormGroup;
  editingProjectId: number | null = null;
  user: any;
  allVerifiedUsers: any[] = [];
  allUsers: any[] = [];

  showProfileDropdown = false;

  showAllMembersModal = false;

  showAllProjectsModal = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // data for small cards
  totalProjects: number = 0;
  totalMembers: number = 0;
  totalTasks: number = 0;
  totalComments: number = 0;
  totalStatusUpdates: number = 0;
  totalNewTasks: number = 0;

  showNotificationToast = false;
  notificationToastMessage = '';
  showNotificationDropdown = false;
  notifications: any[] = [];
  notificationFilter: 'all' | 'unread' | 'read' = 'all';

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private apiService: ApiService,
    public activitiesService: ActivitiesService,
  ) {
    this.repoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      private: [true],
    });
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      due_date: [''],
      repo_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
    this.editProjectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      due_date: [''],
      repo_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.activitiesService.fetchActivities();

    this.apiService.get('sadmin/verifiedUsers').subscribe({
      next: (res: any) => {
        // Ensure users is an array
        this.allVerifiedUsers = Array.isArray(res.users) ? res.users : [];
        this.totalMembers = this.allVerifiedUsers.length;
        console.log(this.allVerifiedUsers);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.allVerifiedUsers = [];
      },
    });
    console.log(this.user);
    this.apiService.get('sadmin/projects').subscribe({
      next: (res: any) => {
        // Convert projects object to array
        this.projects = res.projects ? Object.values(res.projects) : [];
        this.totalProjects = this.projects.length;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openNewProjectForm() {
    this.showNewProjectForm = true;
    this.projectForm.reset();
  }

  closeNewProjectForm() {
    this.showNewProjectForm = false;
  }

  submitNewProject() {
    if (this.projectForm.invalid) return;
    this.isSubmitting = true;

    this.apiService.post('sadmin/projects', this.projectForm.value).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.closeNewProjectForm();
        this.ngOnInit();
        this.showToastMessage('Project created successfully!', 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToastMessage('Error creating project', 'error');
        console.error('Error creating project:', err);
      },
    });
  }

  showAllUser() {
    this.router.navigate(['/manageUsers']);
  }

  openContextMenu(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.showContextMenu = true;
    this.contextMenuIndex = index;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showContextMenu) {
      this.showContextMenu = false;
      this.contextMenuIndex = null;
    }
    if (this.showProfileDropdown) {
      this.showProfileDropdown = false;
    }
  }

  editProject(project: any) {
    this.showContextMenu = false;
    this.showEditProjectForm = true;
    this.editingProjectId = project.id;
    this.editProjectForm.patchValue({
      name: project.name,
      description: project.description,
      due_date: project.due_date,
      repo_url: project.repo_url || '',
    });
  }

  closeEditProjectForm() {
    this.showEditProjectForm = false;
    this.editingProjectId = null;
  }

  submitEditProject() {
    if (this.editProjectForm.invalid || !this.editingProjectId) return;
    this.isSubmittingEdit = true;
    this.apiService
      .put(
        `sadmin/projects/${this.editingProjectId}`,
        this.editProjectForm.value,
      )
      .subscribe({
        next: (res: any) => {
          this.isSubmittingEdit = false;
          this.closeEditProjectForm();
          this.ngOnInit();
          this.showToastMessage('Project updated successfully!', 'success');
        },
        error: (err) => {
          this.isSubmittingEdit = false;
          this.showToastMessage('Error updating project', 'error');
          console.error('Error editing project:', err);
        },
      });
  }

  deleteProject(project: any) {
    this.apiService.post(`sadmin/projects/${project}`).subscribe({
      next: (res: any) => {
        this.ngOnInit();
        this.showToastMessage('Project deleted successfully!', 'success');
      },
      error: (err) => {
        this.showToastMessage('Error deleting project', 'error');
        console.error('Error deleting project:', err);
      },
    });
  }

  showProfile() {
    this.router.navigate(['/profile']);
  }

  viewAllMembers() {
    this.router.navigate(['/user/dashboard']);
  }

  openAllMembersModal() {
    this.showAllMembersModal = true;
  }

  closeAllMembersModal() {
    this.showAllMembersModal = false;
  }

  openAllProjectsModal() {
    this.showAllProjectsModal = true;
  }

  closeAllProjectsModal() {
    this.showAllProjectsModal = false;
  }

  goToProject(projectId: number) {
    this.router.navigate(['/project', projectId]);
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2000);
  }

  daysUntilDue(dueDate: string): number {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 0;
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  overallCompletion(): number {
    if (!this.projects || !this.projects.length) return 0;
    const total = this.projects.reduce(
      (sum, p) => sum + (p.progress_percentage || 0),
      0,
    );
    return Math.round(total / this.projects.length);
  }
  getTotalCompletedTasks(): number {
    if (!this.projects) return 0;
    return this.projects.reduce(
      (sum, project) => sum + (project.completed_tasks || 0),
      0,
    );
  }

  getTotalRemainingTasks(): number {
    if (!this.projects) return 0;
    return this.projects.reduce((sum, project) => {
      const total = project.total_tasks || 0;
      const completed = project.completed_tasks || 0;
      return sum + (total - completed);
    }, 0);
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

  deleteNotification(notif: any) {
    this.apiService.delete(`notifications/${notif.id}`).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (n) => n.id !== notif.id,
        );
      },
      error: (err) => {
        console.error('Failed to delete notification', err);
      },
    });
  }
}
