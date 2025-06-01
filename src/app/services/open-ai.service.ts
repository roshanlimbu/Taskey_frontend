import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
interface OpenAIResponse {
  success: boolean;
  report_id?: number;
  response?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpenAiService {
  constructor(private apiService: ApiService) {}

  generateReport(
    projectId: number,
    title?: string
  ): Observable<OpenAIResponse> {
    return this.apiService.post<OpenAIResponse>('sadmin/reports/generate', {
      project_id: projectId,
      title,
    });
  }
}
