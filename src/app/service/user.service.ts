import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from './models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}


  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.baseUrl, { withCredentials: true });
  }

  getCurrentUserProfile(userId: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/${userId}/profile`, { withCredentials: true });
  }

  uploadAvatar(userId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${userId}/avatar`, formData, { withCredentials: true });
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user, { withCredentials: true });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}