import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  activities: any[] = [];
  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchActivities();
  }
  fetchActivities() {
    this.apiService.get('activities/recent').subscribe({
      next: (res: any) => {
        console.log('Fetched activities:', res.activities);
        this.activities = res.activities;
      },
      error: (err) => {
        console.error('Error fetching activities', err);
      },
    });
  }

  fetchAllActivities() {
    this.apiService.get('activities/all').subscribe({
      next: (res: any) => {
        this.activities = res.activities;
      },
      error: (err) => {
        console.error('Error fetching activities', err);
      },
    });
  }

  commentOnActivity(activityId: string, comment: string) {
    return this.apiService.post('activities/comment', {
      activity_id: activityId,
      comment: comment,
    });
  }
  parseComments(comments: any) {
    if (!comments) return [];
    try {
      const parsedComments = JSON.parse(comments);
      if (Array.isArray(parsedComments)) return parsedComments;
      return [parsedComments];
    } catch (err) {
      console.error('Error parsing comments', err);
      return [];
    }
  }
}
