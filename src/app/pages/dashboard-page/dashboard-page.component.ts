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

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit {
  repoForm: FormGroup;
  showNewProjectForm = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private projectService: ProjectService,
  ) {
    this.repoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      private: [true],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.authService.setToken(token);
      }
    });
  }

  onCreateRepo() {
    if (this.repoForm.valid) {
      const formValue = this.repoForm.value;
      this.projectService
        .createRepo({
          name: formValue.name as string,
          description: formValue.description || '',
          private: formValue.private ?? true,
        })
        .subscribe({
          next: () => {
            this.showNewProjectForm = false;
            this.repoForm.reset({ private: true });
          },
          error: (err) => {
            // Show error message
          },
        });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
