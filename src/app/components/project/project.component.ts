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
import { HelpButtonComponent } from '../help-button/help-button.component';
import { VideoChatComponent } from '../video-chat/video-chat.component';

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
    HelpButtonComponent,
    VideoChatComponent,
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  standalone: true,
})
export class ProjectComponent {
  projectId: number | null = null;
  selectedStatusId: any = null;
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
    originalId?: number;
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
    { name: 'Gray', class: 'bg-gray-500', hex: '#6b7280' },
  ];

  showNewProjectForm = false;
  isSubmitting = false;
  projectForm: FormGroup;

  // Video chat properties
  showVideoChat = false;
  videoChatTaskId?: number;
  currentUserName = '';

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
      repo_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }
  ngOnInit() {
    // Initialize current user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserName = user.name || 'User';

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
        this.statuses = (res.statuses || []).map((status: any) => ({
          id: status.id.toString(), // Convert numeric ID to string for consistency
          name: status.name,
          color: this.convertHexToClass(status.color),
          isCustom: true,
          originalId: status.id, // Keep original numeric ID for backend operations
        }));
        console.log('Loaded statuses:', this.statuses);
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

  private convertHexToClass(hexColor: string): string {
    if (!hexColor || !hexColor.startsWith('#')) {
      return 'bg-blue-500'; // default
    }
    const colorOption = this.colorOptions.find(
      (option) => option.hex === hexColor
    );
    return colorOption ? colorOption.class : 'bg-blue-500';
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
          console.log('Status creation response:', res);
          const statusForUI = {
            id: res.status?.id?.toString() || newStatus.id,
            name: newStatus.name,
            color: this.newStatusColor,
            isCustom: true,
            originalId: res.status?.id || undefined, // Store the actual database ID
          };
          this.statuses.push(statusForUI);
          this.saveCustomStatuses();
          this.closeAddStatusModal();
          console.log('Custom status saved to database:', statusForUI);
        },
        error: (err) => {
          console.error('Failed to save custom status to database:', err);
          const statusForUI = {
            id: newStatus.id,
            name: newStatus.name,
            color: this.newStatusColor,
            isCustom: true,
            originalId: undefined, // No database ID available
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
          task.status_id = this.getStatusApiId(firstStatus.id);
          this.apiService
            .put(`tasks/${task.id}/status`, { status_id: task.status_id })
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
        console.log('Project details response:', res);
        this.project = res.project || res.data || res;
        this.tasks = res.tasks || this.project.tasks || [];
        this.members = res.members || this.project.members || [];
        console.log('Tasks loaded:', this.tasks);
        console.log('Statuses available:', this.statuses);
        this.isLoading = false;
        this.updateKanban();
        console.log('Kanban after update:', this.kanban);
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

    if (!title) return;

    // Check if there are no statuses, create default "Pending" and "Completed" statuses first
    if (this.statuses.length === 0) {
      this.createDefaultStatuses()
        .then(() => {
          this.createTaskWithPrompt(title, description);
        })
        .catch(() => {
          // If creating statuses fails, still try to create the task
          this.createTaskWithPrompt(title, description);
        });
    } else {
      this.createTaskWithPrompt(title, description);
    }
  }
  private createTaskWithPrompt(
    title: string,
    description: string,
    statusId?: number
  ) {
    const payload: { title: string; description: string; status_id?: number } =
      {
        title: title,
        description: description,
      };
    if (statusId) {
      payload.status_id = Number(statusId);
    }

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
    const filteredTasks = this.tasks.filter((task) => {
      // Handle both cases: task.status as string or task.status as object
      if (typeof task.status === 'string') {
        return task.status === status;
      } else if (task.status && task.status.id) {
        // If status is an object, check if the status ID matches
        return task.status.id.toString() === status;
      } else if (task.status_id) {
        // If we have status_id, compare with the status ID
        return task.status_id.toString() === status;
      }
      return false;
    });
    console.log(`getTasks for status ${status}:`, filteredTasks);
    return filteredTasks;
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
      const oldStatusId = task.status_id;

      // Update task with new status
      task.status = event.container.id;
      task.status_id = this.getStatusApiId(event.container.id);

      // Move in UI immediately
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Optimistically update backend
      this.apiService
        .put(`tasks/${task.id}/status`, { status_id: task.status_id })
        .subscribe({
          error: () => {
            // Revert the changes on error
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );
            task.status = oldStatus;
            task.status_id = oldStatusId;
            alert('Failed to update task status. Please try again.');
          },
        });
    }
  }

  submitAddTask() {
    if (!this.projectId || !this.newTaskTitle) return;

    // Check if there are no statuses, create default "Pending" and "Completed" statuses first
    if (this.statuses.length === 0) {
      this.createDefaultStatuses()
        .then(() => {
          this.createTask();
        })
        .catch(() => {
          // If creating statuses fails, still try to create the task
          this.createTask();
        });
    } else {
      this.createTask();
    }
  }

  private createDefaultStatuses(): Promise<void> {
    return new Promise((resolve, reject) => {
      const defaultStatuses = [
        {
          id: 'pending',
          name: 'Pending',
          color: '#6b7280', // Gray color hex
          isCustom: true,
        },
        {
          id: 'completed',
          name: 'Completed',
          color: '#10b981', // Green color hex
          isCustom: true,
        },
      ];

      let createdCount = 0;
      let failedCount = 0;

      defaultStatuses.forEach((defaultStatus) => {
        this.apiService.post('sadmin/status/create', defaultStatus).subscribe({
          next: (res: any) => {
            // Add to local statuses array with CSS class for UI
            const statusForUI = {
              id: res.status?.id?.toString() || defaultStatus.id,
              name: defaultStatus.name,
              color:
                defaultStatus.name === 'Pending'
                  ? 'bg-gray-500'
                  : 'bg-green-500', // CSS class for UI
              isCustom: true,
              originalId: res.status?.id || undefined,
            };
            this.statuses.push(statusForUI);
            createdCount++;

            if (createdCount + failedCount === defaultStatuses.length) {
              this.saveCustomStatuses();
              console.log(
                `Created ${createdCount} default statuses: Pending and Completed`
              );
              resolve();
            }
          },
          error: (err) => {
            console.error(
              `Failed to create default status ${defaultStatus.name}:`,
              err
            );
            // Fallback: add to local array even if API fails
            const statusForUI = {
              id: defaultStatus.id,
              name: defaultStatus.name,
              color:
                defaultStatus.name === 'Pending'
                  ? 'bg-gray-500'
                  : 'bg-green-500', // CSS class for UI
              isCustom: true,
              originalId: undefined,
            };
            this.statuses.push(statusForUI);
            failedCount++;

            if (createdCount + failedCount === defaultStatuses.length) {
              this.saveCustomStatuses();
              if (createdCount > 0) {
                resolve();
              } else {
                reject(err);
              }
            }
          },
        });
      });
    });
  }
  private createTask() {
    const payload: { title: string; description: string; status_id?: number } =
      {
        title: this.newTaskTitle,
        description: this.newTaskDescription,
      };
    if (this.selectedStatusId) {
      payload.status_id = this.getStatusApiId(this.selectedStatusId); // Use helper method to get proper API ID
    }

    this.apiService
      .post(`sadmin/projects/${this.projectId}/tasks`, payload)
      .subscribe({
        next: () => {
          this.fetchProjectDetails(this.projectId!);
          this.showAddTask = false;
          this.newTaskTitle = '';
          this.newTaskDescription = '';
          this.selectedStatusId = null; // Reset selected status
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
        ...projectTasks.filter((t: any) => {
          // Handle both cases: task.status as string or task.status as object
          if (typeof t.status === 'string') {
            return t.status === status.id;
          } else if (t.status && t.status.id) {
            // If status is an object, check if the status ID matches
            return t.status.id.toString() === status.id;
          } else if (t.status_id) {
            // If we have status_id, compare with the status ID
            return t.status_id.toString() === status.id;
          }
          return false;
        })
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
    console.log('Creating new project with payload:', payload);
    this.apiService.post('sadmin/projects', payload).subscribe({
      next: (res: any) => {
        console.log('Project created successfully:', res);
        this.isSubmitting = false;
        this.closeNewProjectForm();
        this.apiService.get('sadmin/projects').subscribe({
          next: (res: any) => {
            this.projects = res.projects || [];
          },
        });
      },
      error: (err) => {
        console.error('Failed to create project:', err);
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

  private getStatusApiId(statusId: string): number {
    const status = this.statuses.find((s) => s.id === statusId);
    const apiId = status?.originalId || Number(statusId);
    console.log(
      `Getting API ID for status ${statusId}:`,
      apiId,
      'from status:',
      status
    );
    return apiId;
  }

  // Video chat methods
  onHelpStatusChange(taskId: number, needsHelp: boolean) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const updated = { need_help: needsHelp };
      this.apiService.put(`tasks/${taskId}/need-help`, updated).subscribe({
        next: (res: any) => {
          task.need_help = res.task.need_help;
          this.updateKanban();
        },
        error: (err) => {
          alert('Failed to update need help flag.');
        },
      });
    }
  }

  onVideoCallStart(taskId: number) {
    this.videoChatTaskId = taskId;
    this.showVideoChat = true;
  }

  onVideoCallJoin() {
    this.showVideoChat = true;
  }

  onChatOpen(taskId: number) {
    // Implement chat opening logic here
    // This can integrate with your existing chat component
    console.log('Opening chat for task:', taskId);
  }

  onVideoChatClose() {
    this.showVideoChat = false;
    this.videoChatTaskId = undefined;
  }
}
