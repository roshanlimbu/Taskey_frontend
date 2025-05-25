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

interface Project {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
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
  totalProjects: number = 0;
  user: any;
  allUsers: any[] = [];

  showProfileDropdown = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.repoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      private: [true],
    });
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
    this.editProjectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.apiService.get('sadmin/users').subscribe({
      next: (res: any) => {
        this.allUsers = res.users;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });
    console.log(this.user);
    this.apiService.get('sadmin/projects').subscribe({
      next: (res: any) => {
        this.projects = res.projects;
        this.totalProjects = res.projects.length;
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
      next: (res: any) => {
        if (res.status === 201) {
          this.isSubmitting = false;
          this.closeNewProjectForm();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating project:', err);
      },
    });
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
        this.editProjectForm.value
      )
      .subscribe({
        next: (res: any) => {
          this.isSubmittingEdit = false;
          this.closeEditProjectForm();
          this.ngOnInit();
        },
        error: (err) => {
          this.isSubmittingEdit = false;
          console.error('Error editing project:', err);
        },
      });
  }

  deleteProject(project: any) {
    this.showContextMenu = false;
    this.apiService.delete(`sadmin/projects/${project}`).subscribe({
      next: (res: any) => {
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Error deleting project:', err);
      },
    });
  }

  showProfile() {
    this.router.navigate(['/profile']);
  }
}
