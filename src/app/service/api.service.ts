import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
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

  chatAI(text:string){
    return of({ reply: 'Demo AI reply for: ' + text });
  }
  getAllPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/all`);
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



 /*
// ...
  getImageUrl(imagePath: string): string {
    // 🛑 בניית ה-URL המלא: שימוש בנתיב הראשי של ה-SkillController + הנתיב של הקובץ
    return `${this.base}/skills/files/${imagePath}`;
  }
// ...
*/

}