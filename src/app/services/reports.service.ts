import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private apiService: ApiService) {}
  getAllReports() {
    return this.apiService.get('sadmin/reports');
  }

  getReportByProject(ProjectId: number) {
    return this.apiService.get(`sadmin/reports/${ProjectId}`);
  }
}
