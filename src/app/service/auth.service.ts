import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UserDTO } from './models/auth.model'; 


function getCookie(name:string){
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;
  private currentUserData: UserDTO | null = null;
  
  private http = inject(HttpClient); 

  constructor() {
    this.loadUserFromStorage();
  }


private loadUserFromStorage() {
    try {
        const userData = localStorage.getItem('fynx_user');
        if (userData) {
            let loadedUser: UserDTO = JSON.parse(userData) as UserDTO;
            
            if (loadedUser && loadedUser.username) {
                // התיקון הקריטי: אנחנו שומרים על userAvatarUrl המקורי מה-DB!
                // ורק אם הוא באמת ריק, אנחנו מייצרים Placeholder
                const realPath = loadedUser.userAvatarUrl; 
                const defaultAvatarUrl = `https://placehold.co/130x130/8e44ad/ffffff?text=${loadedUser.username.charAt(0).toUpperCase()}`;

                this.currentUserData = {
                    ...loadedUser,
                    userAvatarUrl: realPath || null, 
                    // אם יש נתיב אמיתי, נשתמש בו. אם לא, נשתמש ב-Placeholder
                    avatarUrl: (realPath && realPath !== 'null') ? realPath : defaultAvatarUrl 
                };
            }
            console.log('Loaded user from storage (Revalidated):', this.currentUserData);
        }
    } catch (e) {
        console.error('Error loading user from storage:', e);
    }
}

updateCurrentUser(user: UserDTO): void {
    this.setAndSaveUser(user); 
}


private setAndSaveUser(response: UserDTO): void {
    // אנחנו שומרים על המבנה המקורי מהשרת בלי "לנקות" נתיבים מראש
    this.currentUserData = { 
        ...response
    };
    
    try {
        localStorage.setItem('fynx_user', JSON.stringify(this.currentUserData));
        console.log('Saved user to storage:', this.currentUserData);
    } catch (e) {
        console.error('Error saving user to storage:', e);
    }
}


  signin(creds:any): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.base + '/users/signin', creds)
      .pipe(
        tap(response => {
          this.setAndSaveUser(response);
        })
      );
  }

  register(data:any): Observable<UserDTO> { 
    return this.http.post<UserDTO>(this.base + '/users/signup', data)
      .pipe(
        tap(response => {
           console.log('User registered successfully:', response.username);
           this.setAndSaveUser(response);
        })
      );
  }

  loginWithGoogle(): Observable<any> {
    const demoUser: UserDTO = { 
      username: 'google_user',
      userId: 9999,
      email: 'google_user@fynx.app',
      avatarUrl: 'https://placehold.co/130x130/00bcd4/ffffff?text=G'
    };
    this.currentUserData = demoUser;
    try {
      localStorage.setItem('fynx_user', JSON.stringify(this.currentUserData));
    } catch {}
    return of({ token: 'demo-jwt-token' });
  }

  getToken(){ return getCookie('fynx_token'); }

  getCurrentUserData(): UserDTO | null { 
    return this.currentUserData;
  }

currentUser(): UserDTO | null { 
    if (!this.currentUserData) {
        this.loadUserFromStorage();
    }
    return this.currentUserData; 
}

  logout(){ 
    document.cookie = 'fynx_token=; Max-Age=0; path=/'; 
    try {
      localStorage.removeItem('fynx_user');
    } catch (e) {
      console.error('Error removing user from storage:', e);
    }
    this.currentUserData = null;
  }

getFullAvatarUrl(): string {
    const user = this.currentUserData;
    if (!user) return 'https://placehold.co/130x130/ff9933/ffffff?text=U';

    // 1. בדיקה אם יש לנו שם קובץ אמיתי מה-DB
    const hasRealFile = user.userAvatarUrl && 
                        user.userAvatarUrl !== 'null' && 
                        user.userAvatarUrl !== '';

    if (hasRealFile) {
        // אם זה שם קובץ (כמו image.jpg), נוסיף לו את כתובת השרת
        if (!user.userAvatarUrl!.startsWith('http')) {
            return `http://localhost:8080/api/files/${user.userAvatarUrl}`;
        }
        // אם זה כבר נתיב מלא (מגוגל למשל), נחזיר אותו
        return user.userAvatarUrl!;
    }

    // 2. אם אין קובץ אמיתי, ניצור פלייסהולדר לפי האות הראשונה של השם
    const initial = user.username?.charAt(0).toUpperCase() || 'U';
    return `https://placehold.co/130x130/8e44ad/ffffff?text=${initial}`;
}



}