import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
interface User {
  id: number;
  github_id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-project',
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  standalone: true,
})
export class ProjectComponent {
  projectId: number | null = null;
  project: any = null;
  tasks: any[] = [];
  members: any[] = [];
  isLoading = true;
  error: string | null = null;
  showMenu = false;
  showAddTask = false;
  newTaskTitle = '';
  newTaskDescription = '';
  showSuccessToast = false;
  showAddMember = false;
  newMember = '';
  showMemberSuccessToast = false;
  allUsers: User[] = [];
  openMemberMenu: number | null = null;
  project_lead_name: string | null = null;
  editingTask: any = null;
  editTaskTitle: string = '';
  editTaskDescription: string = '';
  deletingTask: any = null;

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

  constructor(private route: ActivatedRoute, private apiService: ApiService) {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.projectId = id ? +id : null;
      if (this.projectId) {
        this.fetchProjectDetails(this.projectId);
      }
    });
  }
  ngOnInit() {
    this.apiService.get('sadmin/users').subscribe({
      next: (res: any) => {
        this.allUsers = res.users;
        // console.log(this.allUsers);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      },
    });
  }

  fetchProjectDetails(id: number) {
    this.isLoading = true;
    this.error = null;
    this.apiService.get(`sadmin/projects/${id}`).subscribe({
      next: (res: any) => {
        this.project = res.project || res.data || res;
        this.project_lead_name = res.project_lead_name;
        this.tasks = res.tasks || this.project.tasks || [];
        this.members = res.members || this.project.members || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load project details.';
        this.isLoading = false;
      },
    });
  }

  onAddTask() {
    if (!this.projectId) return;
    const title = prompt('Enter task title:');
    const description = prompt('Enter task description (optional):') || '';
    const payload = {
      title: title,
      description: description,
    };

    if (!title) return;

    this.apiService
      .post(`sadmin/projects/${this.projectId}/tasks`, payload)
      .subscribe({
        next: (res: any) => {
          this.fetchProjectDetails(this.projectId!);
        },
        error: () => {
          alert('Failed to add task.');
        },
      });
  }

  getTasks(status: string): any[] {
    return this.tasks.filter((task) => task.status === status);
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Update task status in backend
      const task = event.container.data[event.currentIndex];
      const newStatus = event.container.id;
      const payload = {
        status: newStatus,
      };
      this.apiService.put(`sadmin/tasks/${task.id}/status`, payload).subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
        },
        error: () => {
          alert('Failed to update task status');
          this.fetchProjectDetails(this.projectId!);
        },
      });
    }
  }

  submitAddTask() {
    if (!this.projectId || !this.newTaskTitle) return;
    const payload = {
      title: this.newTaskTitle,
      description: this.newTaskDescription,
    };
    this.apiService
      .post(`sadmin/projects/${this.projectId}/tasks`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
          this.showAddTask = false;
          this.newTaskTitle = '';
          this.newTaskDescription = '';
          this.showSuccessToast = true;
          setTimeout(() => (this.showSuccessToast = false), 2000);
        },
        error: () => {
          alert('Failed to add task.');
        },
      });
  }

  submitAddMember() {
    if (!this.projectId || !this.newMember) return;
    const payload = { member_ids: [this.newMember] };
    this.apiService
      .post(`sadmin/projects/${this.projectId}/members`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
          this.showAddMember = false;
          this.newMember = '';
          this.showMemberSuccessToast = true;
          setTimeout(() => (this.showMemberSuccessToast = false), 2000);
        },
        error: () => {
          alert('Failed to add member.');
        },
      });
  }

  toggleMemberMenu(index: number) {
    this.openMemberMenu = this.openMemberMenu === index ? null : index;
  }

  removeMember(member: User) {
    if (!this.projectId) return;
    const payload = { member_ids: [member.id] };
    this.apiService
      .post(`sadmin/projects/${this.projectId}/remove-members`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
        },
        error: () => {
          alert('Failed to remove member.');
        },
      });
  }

  assignLead(member: User) {
    if (!this.projectId) return;
    const payload = { user_id: member.id };
    this.apiService
      .post(`sadmin/projects/${this.projectId}/assign-lead`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
        },
        error: () => {
          alert('Failed to assign lead.');
        },
      });
  }

  removeLead() {
    if (!this.projectId) return;
    this.apiService
      .post(`sadmin/projects/${this.projectId}/remove-lead`, {})
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
        },
        error: () => {
          alert('Failed to remove lead.');
        },
      });
  }

  startEditTask(task: any) {
    this.editingTask = task;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description;
  }

  submitEditTask() {
    if (!this.editingTask || !this.editTaskTitle) return;
    const payload = {
      title: this.editTaskTitle,
      description: this.editTaskDescription,
    };
    this.apiService
      .put(`sadmin/tasks/${this.editingTask.id}`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
          this.editingTask = null;
          this.editTaskTitle = '';
          this.editTaskDescription = '';
        },
        error: () => {
          alert('Failed to edit task.');
        },
      });
  }

  startDeleteTask(task: any) {
    this.deletingTask = task;
  }

  confirmDeleteTask() {
    if (!this.deletingTask) return;
    this.apiService.delete(`sadmin/tasks/${this.deletingTask.id}`).subscribe({
      next: () => {
        this.fetchProjectDetails(this.projectId!);
        this.deletingTask = null;
      },
      error: () => {
        alert('Failed to delete task.');
      },
    });
  }

  toggleAssignMenu(task: any) {
    task.showAssignMenu = !task.showAssignMenu;
  }

  assignTaskToMember(task: any, member: any) {
    if (!task || !task.id || !member || !member.id) return;
    const payload = { user_id: member.id };
    this.apiService.post(`sadmin/tasks/${task.id}/assign`, payload).subscribe({
      next: () => this.fetchProjectDetails(this.projectId!),
      error: () => alert('Failed to assign user to task.'),
    });
    task.showAssignMenu = false;
  }
}
