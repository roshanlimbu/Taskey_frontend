import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-manage.component.html',
  styleUrls: ['./user-manage.component.scss'],
})
export class UserManageComponent implements OnInit {
  allUsers: any[] = [];
  isEditModalOpen: boolean = false;
  selectedUser: any = {};

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.apiService.get('sadmin/users').subscribe({
      next: (res: any) => {
        this.allUsers = res.users;
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
        alert('Failed to fetch users.');
      },
    });
  }

  getRoleLabel(role: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'SAdmin',
      2: 'Project Manager',
      3: 'User',
    };
    return roleMap[role] || 'Unknown';
  }

  openEditModal(user: any) {
    // deep copying here
    this.selectedUser = { ...user, is_user_verified: !!user.is_user_verified };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedUser = {};
  }

  updateUser() {
    if (!this.selectedUser.id) return;

    const updatedUser = {
      name: this.selectedUser.name,
      email: this.selectedUser.email,
      role: this.selectedUser.role,
      dev_role: this.selectedUser.dev_role,
      is_user_verified: this.selectedUser.is_user_verified ? 1 : 0,
    };

    this.apiService
      .put(`sadmin/users/update/${this.selectedUser.id}`, updatedUser)
      .subscribe({
        next: () => {
          this.fetchUsers();
          this.closeEditModal();
          alert('User updated successfully.');
        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          alert('Failed to update user.');
        },
      });
  }

  confirmDelete(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.apiService.delete(`sadmin/users/delete/${userId}`).subscribe({
        next: () => {
          this.fetchUsers();
          alert('User deleted successfully.');
        },
        error: (err: any) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user.');
        },
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
