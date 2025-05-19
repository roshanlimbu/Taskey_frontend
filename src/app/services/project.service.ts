import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createProject(data: { name: string; description?: string }) {
    return this.http.post('sadmin/projects', data);
  }
}
