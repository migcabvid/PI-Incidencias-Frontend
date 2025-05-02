import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/login`,
      { username, password },
      { withCredentials: true }
    );
  }

  logout() {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }
}