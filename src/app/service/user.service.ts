

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

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // 🚀 המתודה החסרה: העלאת אווטאר
  uploadAvatar(userId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/${userId}/avatar`, 
      formData,
      { withCredentials: true } // חשוב לאבטחה
    );
  }



getCurrentUserProfile(userId: number) {
    return this.http.get<UserDTO>(
        // 🚨 תיקון: החלף את apiUrl/users/users ב-baseUrl
        `${this.baseUrl}/${userId}/profile`, // התוצאה תהיה: /api/users/193/profile
        { withCredentials: true } 
    );
}



}