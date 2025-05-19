import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface Project {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit {
  repoForm: FormGroup;
  projectForm: FormGroup;
  showNewProjectForm = false;
  isSubmitting = false;

  projects: Project[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private apiService: ApiService,
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
  }

  ngOnInit() {
    this.apiService.get('sadmin/projects').subscribe({
      next: (res: any) => {
        this.projects = res.projects;
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
}
