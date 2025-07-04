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
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import { DragStateService } from '../../services/drag-state.service';
import { OpenAiService } from '../../services/open-ai.service';

interface User {
  id: number;
  github_id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-project',
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
    AutoScrollDirective,
  ],
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
  dragging = false;
  editTaskDueDate: string = '';
  kanban: { [key: string]: any[] } = {};

  projects: any[] = [];
  selectedProjectId: number | null = null;

  // Custom status management
  showAddStatusModal = false;
  newStatusName = '';
  newStatusColor = 'bg-blue-500';

  statuses: Array<{
    id: string;
    name: string;
    color: string;
    isCustom: boolean;
  }> = [];

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
  ];

  showNewProjectForm = false;
  isSubmitting = false;
  projectForm: FormGroup;

  get connectedDropLists() {
    return this.statuses.map((s) => s.id);
  }

  get hasStatuses() {
    return this.statuses.length > 0;
  }

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    public dragState: DragStateService,
    private fb: FormBuilder,
    public openAiService: OpenAiService
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.projectId = id ? +id : null;
      if (this.projectId) {
        this.fetchProjectDetails(this.projectId);
      }
    });
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }
  ngOnInit() {
    this.loadCustomStatuses();
    this.apiService.get('sadmin/users').subscribe({
      next: (res: any) => {
        this.allUsers = res.users;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      },
    });
    this.apiService.get('sadmin/projects').subscribe({
      next: (res: any) => {
        this.projects = res.projects || [];
        // if (!this.selectedProjectId && this.projectId) {
        //   this.selectedProjectId = this.projectId;
        // }
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
      },
    });
  }

  loadCustomStatuses() {
    this.apiService.get('sadmin/status').subscribe({
      next: (res: any) => {
        this.statuses = res.statuses || [];
        // Mark all loaded statuses as custom and convert hex colors to CSS classes if needed
        this.statuses.forEach((status) => {
          status.isCustom = true;
          // If color is hex, convert to corresponding CSS class for UI display
          if (status.color && status.color.startsWith('#')) {
            const colorOption = this.colorOptions.find(
              (option) => option.hex === status.color
            );
            if (colorOption) {
              status.color = colorOption.class;
            } else {
              // Default to blue if hex doesn't match any predefined color
              status.color = 'bg-blue-500';
            }
          }
        });
      },
      error: (err) => {
        console.error('Failed to load custom statuses:', err);
        // Fallback to localStorage
        const savedStatuses = localStorage.getItem('customStatuses');
        if (savedStatuses) {
          this.statuses = JSON.parse(savedStatuses);
        }
      },
    });
  }

  saveCustomStatuses() {
    // Save to localStorage as backup
    localStorage.setItem('customStatuses', JSON.stringify(this.statuses));
  }

  openAddStatusModal() {
    this.showAddStatusModal = true;
    this.newStatusName = '';
    this.newStatusColor = 'bg-blue-500'; // This will be converted to hex when sending to backend
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

      // Find the selected color option to get hex value
      const selectedColorOption = this.colorOptions.find(
        (color) => color.class === this.newStatusColor
      );
      const colorHex = selectedColorOption
        ? selectedColorOption.hex
        : '#3b82f6'; // default to blue

      const newStatus = {
        id: statusId,
        name: this.newStatusName.trim(),
        color: colorHex, // Send hex value instead of CSS class
        isCustom: true,
      };

      // Save to database
      this.apiService.post('sadmin/status/create', newStatus).subscribe({
        next: (res: any) => {
          // Store the CSS class locally for UI display
          const statusForUI = {
            ...newStatus,
            color: this.newStatusColor, // Keep CSS class for local UI
          };
          this.statuses.push(statusForUI);
          this.saveCustomStatuses();
          this.closeAddStatusModal();
          console.log('Custom status saved to database');
        },
        error: (err) => {
          console.error('Failed to save custom status to database:', err);
          // Fallback to localStorage with CSS class
          const statusForUI = {
            ...newStatus,
            color: this.newStatusColor, // Keep CSS class for local UI
          };
          this.statuses.push(statusForUI);
          this.saveCustomStatuses();
          this.closeAddStatusModal();
        },
      });
    }
  }

  deleteCustomStatus(statusId: string) {
    // Check if any tasks are using this status
    const tasksUsingStatus = this.tasks.filter(
      (task) => task.status === statusId
    );
    if (tasksUsingStatus.length > 0) {
      const confirmDelete = confirm(
        `There are ${tasksUsingStatus.length} tasks using this status. Are you sure you want to delete it? Tasks will be moved to the first available status.`
      );
      if (!confirmDelete) return;

      // Move tasks to first available status
      const firstStatus = this.statuses.find((s) => s.id !== statusId);
      if (firstStatus) {
        tasksUsingStatus.forEach((task) => {
          task.status = firstStatus.id;
          this.apiService
            .put(`tasks/${task.id}/status`, { status: firstStatus.id })
            .subscribe({
              error: (err) => {
                console.error('Failed to update task status:', err);
              },
            });
        });
      }
    }

    // Delete from database
    this.apiService.delete(`sadmin/status/delete/${statusId}`).subscribe({
      next: (res: any) => {
        this.statuses = this.statuses.filter(
          (status) => status.id !== statusId
        );
        this.saveCustomStatuses();
        console.log('Custom status deleted from database');
      },
      error: (err) => {
        console.error('Failed to delete custom status from database:', err);
        // Fallback to localStorage
        this.statuses = this.statuses.filter(
          (status) => status.id !== statusId
        );
        this.saveCustomStatuses();
      },
    });
  }

  fetchProjectDetails(id: number) {
    this.isLoading = true;
    this.error = null;
    this.apiService.get(`sadmin/projects/${id}`).subscribe({
      next: (res: any) => {
        this.project = res.project || res.data || res;
        this.tasks = res.tasks || this.project.tasks || [];
        this.members = res.members || this.project.members || [];
        this.isLoading = false;
        this.updateKanban();
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
      const task = event.previousContainer.data[event.previousIndex];
      const oldStatus = task.status;
      task.status = event.container.id;

      // Move in UI immediately
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Optimistically update backend
      this.apiService
        .put(`tasks/${task.id}/status`, { status: task.status })
        .subscribe({
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
          this.apiService
            .post('send-notification', {
              user_id: member.id,
              title: 'Project Lead Assigned',
              body: `You have been assigned as the lead for project: ${this.project.name}`,
            })
            .subscribe({
              next: () => {
                console.log('Notification sent successfully');
              },
            });
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
    this.editTaskDueDate = task.due_date;
  }

  submitEditTask() {
    if (!this.editingTask || !this.editTaskTitle) return;
    const payload = {
      title: this.editTaskTitle,
      description: this.editTaskDescription,
      due_date: this.editTaskDueDate,
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

  deleteTask(task: any) {
    this.apiService.delete(`sadmin/tasks/${task.id}`).subscribe({
      next: (res: any) => {
        console.log(res);
      },
      error: () => {
        alert('Failed to delete task.');
      },
    });
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
      next: () => {
        this.fetchProjectDetails(this.projectId!);
        this.apiService
          .post('send-notification', {
            user_id: member.id,
            title: 'Task Assigned',
            body: `You have been assigned to task: ${task.title}`,
          })
          .subscribe({
            next: () => {
              console.log('Notification sent successfully');
            },
            error: () => {
              console.error('Failed to send notification');
            },
          });
      },
      error: () => alert('Failed to assign user to task.'),
    });
    task.showAssignMenu = false;
  }

  updateKanban() {
    if (!this.tasks) return;
    const projectTasks = this.tasks.filter((task: any) =>
      this.projectId ? task.project_id == this.projectId : true
    );
    for (const status of this.statuses) {
      if (!this.kanban[status.id]) this.kanban[status.id] = [];
      this.kanban[status.id].splice(
        0,
        this.kanban[status.id].length,
        ...projectTasks.filter((t: any) => t.status === status.id)
      );
    }
  }

  selectProject(projectId: number) {
    this.selectedProjectId = projectId;
    this.fetchProjectDetails(projectId);
  }

  getProjectName(projectId: number): string {
    if (!this.projects?.length) return 'N/A';
    const project = this.projects.find((p: any) => p.id === projectId);
    return project ? project.name : 'N/A';
  }

  openNewProjectForm() {
    this.showNewProjectForm = true;
    this.projectForm.reset();
  }

  closeNewProjectForm() {
    this.showNewProjectForm = false;
    this.isSubmitting = false;
  }

  submitNewProject() {
    if (this.projectForm.invalid) return;
    this.isSubmitting = true;
    const payload = this.projectForm.value;
    this.apiService.post('sadmin/projects', payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.closeNewProjectForm();
        this.apiService.get('sadmin/projects').subscribe({
          next: (res: any) => {
            this.projects = res.projects || [];
          },
        });
      },
      error: () => {
        this.isSubmitting = false;
        alert('Failed to create project.');
      },
    });
  }

  generateProjectReport() {
    if (!this.project || !this.project.id) return;
    this.openAiService
      .generateReport(this.project.id, this.project.name)
      .subscribe({
        next: (res) => {
          if (res.success) {
            alert('Report generated!\n' + res.response);
          } else {
            alert(
              'Failed to generate report: ' + (res.error || 'Unknown error')
            );
          }
        },
        error: (err) => {
          alert(
            'Error generating report: ' +
              (err?.error?.error || err.message || 'Unknown error')
          );
        },
      });
  }
}
