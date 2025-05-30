import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivitiesService } from '../../services/activities.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activities',
  imports: [CommonModule, FormsModule],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.scss',
})
export class ActivitiesComponent {
  commentInputs: { [activityId: string]: string } = {};
  openCommentActivityId: string | null = null;

  constructor(public activitiesService: ActivitiesService) {}

  ngOnInit() {
    this.activitiesService.fetchActivities();
  }

  viewAllActivity() {
    this.activitiesService.fetchAllActivities();
  }

  toggleCommentSection(activityId: string) {
    this.openCommentActivityId =
      this.openCommentActivityId === activityId ? null : activityId;
  }

  submitComment(activity: any) {
    const comment = this.commentInputs[activity.id]?.trim();
    if (!comment) return;
    this.activitiesService
      .commentOnActivity(activity.id, comment)
      .subscribe(() => {
        this.commentInputs[activity.id] = '';
        this.activitiesService.fetchActivities();
      });
  }
}
