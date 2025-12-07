import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  loading?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private baseUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<ServiceResponse<any[]>> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(data => ({ data, loading: false })),
      catchError(error => {
        if (typeof window === 'undefined') {
          return of({ data: [], loading: false });
        }
        const message = error.status === 0 
          ? 'שרת ה-API אינו זמין. נסה שוב מאוחר יותר.'
          : `שגיאה בטעינת משתמשים: ${error.message}`;
        return of({ error: message, loading: false });
      })
    );
  }

  addUser(user: any): Observable<any> {
    return this.http.post(this.baseUrl, user);
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
