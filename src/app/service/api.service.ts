import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of, throwError} from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  readonly GEMINI_API_KEY = "AIzaSyCi3BDcnepy8sBdOBZI_o57uu3n8XbhDs8"
  readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
  constructor(private http: HttpClient) {}

   getPostsByCategory(categoryId: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/skills/category/${categoryId}`);
  }

   createPost(formData: FormData) {
    return this.http.post(`${this.base}/skills/uploadSkill`, formData);
  }

   updatePost(id: number, payload: FormData | any): Observable<any> {
    return this.http.put(`${this.base}/skills/${id}`, payload);
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.base}/skills/${id}`);
  }

  chatAI(userQuery: string): Observable<any> {
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ 
          text: 'I am Fynx, a helpful and friendly AI assistant. I respond concisely and I am well-structured. I always use the first person and I answer in English.'
        }]
      },
    };

    if (!this.GEMINI_API_KEY) {
      return throwError(() => new Error('API Key is missing!'));
    }

    const requestUrl = `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`;

    return this.http.post<any>(requestUrl, payload).pipe(
      retry({
        count: 3, 
        delay: (error, retryCount) => {
          const delayTime = Math.pow(2, retryCount) * 1000;
          console.warn(`Retrying in ${delayTime / 1000}s...`);
          return of(error).pipe(delay(delayTime));
        }
      }),
      catchError(error => {
        console.error('AI API Error in ApiService:', error);
        // מאפשר לקומפוננטה לטפל בשגיאה
        return throwError(() => new Error('AI API request failed: ' + error.statusText));
      })
    );
  }


  getAllPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/skills/all`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/categories/all`); 
  }

  createCategory(payload: { categoryName: string; description: string }): Observable<any> {
    return this.http.post(`${this.base}/categories/add`, payload);
  }

  updateCategory(categoryId: number, payload: { categoryName: string; description: string }): Observable<any> {
    return this.http.put(`${this.base}/categories/${categoryId}`, payload);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete(`${this.base}/categories/${categoryId}`);
  }


}