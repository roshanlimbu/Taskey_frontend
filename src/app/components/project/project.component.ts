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

@Component({
  selector: 'app-project',
  imports: [CommonModule, DragDropModule],
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

  statuses = [
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
    { id: 'pending', label: 'Pending', color: 'bg-gray-500' },
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

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.projectId = id ? +id : null;
      if (this.projectId) {
        this.fetchProjectDetails(this.projectId);
      }
    });
  }
  ngOnInit() {}

  fetchProjectDetails(id: number) {
    this.isLoading = true;
    this.error = null;
    this.apiService.get(`sadmin/projects/${id}`).subscribe({
      next: (res: any) => {
        this.project = res.project || res.data || res;
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

  onAddMember() {
    // Placeholder for add member logic
    alert('Add Member clicked!');
  }

  // Stubs for future expansion
  onEditTask(task: any) {
    alert('Edit Task: ' + task.title);
  }
  onDeleteTask(task: any) {
    alert('Delete Task: ' + task.title);
  }
  onAssignTask(task: any) {
    alert('Assign Task: ' + task.title);
  }
  onUpdateTaskStatus(task: any) {
    alert('Update Status: ' + task.title);
  }

  getTasks(status: string): any[] {
    return this.tasks.filter((task) => task.status === status);
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
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
}
