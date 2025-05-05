import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  createRepo(data: { name: string; description?: string; private?: boolean }) {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    });
    return this.http.post('http://localhost:8000/api/projects', data, {
      headers,
    });
  }

  createRepoInOrg(
    data: { name: string; description?: string; private?: boolean },
    org: string
  ) {
    const privateKey = this.authService.privateKey;
    const appId = this.authService.appId;
    const jwtToken = jwt.sign(
      {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
        iss: appId,
      },
      privateKey,
      { algorithm: 'RS256' }
    );

    const headers = new HttpHeaders({
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
    });
    return this.http.post(`https://api.github.com/orgs/${org}/repos`, data, {
      headers,
    });
  }
}
