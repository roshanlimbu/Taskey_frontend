import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  userProfile: any;
  editMode = false;
  profileForm: FormGroup;
  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.profileForm = this.fb.group({
      dev_role: [''],
    });
  }

  ngOnInit() {
    this.userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    this.profileForm.patchValue({
      dev_role: this.userProfile.dev_role || '',
    });
  }

  enableEdit() {
    this.editMode = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  saveProfile() {
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    const payload = {
      github_id: this.userProfile.id,
      dev_role: this.profileForm.value.dev_role,
      role: this.userProfile.role,
    };
    console.log(payload);
    this.apiService.put('sadmin/profile/update', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.editMode = false;
        this.successMsg = 'Profile updated!';
        this.userProfile.dev_role = this.profileForm.value.dev_role;
        localStorage.setItem('user', JSON.stringify(this.userProfile));
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = 'Update failed!';
      },
    });
  }

  RoleMap = {
    1: 'Super Admin',
    2: 'Admin',
    3: 'User',
  };
  RoleMapString = Object.values(this.RoleMap).join(', ');
}
