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
            console.log('RAW JSON from localStorage:', userData); 
            
            let loadedUser: UserDTO = JSON.parse(userData) as UserDTO;
            
            // 🚨 בדיקה אם שדות האווטאר חסרים
            if (loadedUser && loadedUser.username && !loadedUser.userAvatarUrl && !loadedUser.avatarUrl) {
                
                // אם חסר - זה אומר שהנתונים נמחקו / שוכתבו על ידי DTO חלקי.
                // הפתרון המהיר: אנחנו לא יכולים לשחזר את ה-UUID האמיתי מ-localStorage 
                // כי הוא נמחק, אז נצטרך להסתמך על תמונת ה-Placeholder.
                
                // הנתונים ב-loadedUser הם חלקיים, אנו בונים מחדש DTO תקין
                const defaultAvatarUrl = ('https://placehold.co/130x130/8e44ad/ffffff?text=' + loadedUser.username.charAt(0).toUpperCase());

                this.currentUserData = {
                    ...loadedUser,
                    userAvatarUrl: null, // אין לנו את ה-UUID, אז נשאר null
                    avatarUrl: defaultAvatarUrl // נאלצים להשתמש ב-Placeholder
                };
                
                // 🚨 🚨 פעולת חירום: שכתוב הנתונים המלאים (גם אם חלקיים) מיד לאחר טעינה
                // זה מונע מ-setAndSaveUser לרוץ שוב ומנסה לייצב את ה-DTO הנוכחי
                // localStorage.setItem('fynx_user', JSON.stringify(this.currentUserData)); // 🛑 ודא ששורה זו אינה מופעלת כאן! (כדי לא לשבור את ה-localStorage)
                
            } else if (loadedUser && loadedUser.username) {
                // 💡 אם ה-JSON הגיע מלא (כפי שאמור לקרות לאחר Sign In ראשוני)
                const cleanPath = loadedUser.userAvatarUrl || loadedUser.avatarUrl; 
                const defaultAvatarUrl = ('https://placehold.co/130x130/8e44ad/ffffff?text=' + loadedUser.username.charAt(0).toUpperCase());
                
                this.currentUserData = {
                    ...loadedUser,
                    userAvatarUrl: cleanPath || null, 
                    avatarUrl: cleanPath ? cleanPath : defaultAvatarUrl 
                };
            } else {
                this.currentUserData = null;
            }
            
            console.log('Loaded user from storage (Revalidated):', this.currentUserData);
        } else {
            this.currentUserData = null;
        }
    } catch (e) {
        console.error('Error loading user from storage (Data corrupted/incomplete):', e);
        localStorage.removeItem('fynx_user'); 
        this.currentUserData = null;
    }
}

updateCurrentUser(user: UserDTO): void {
    // קורא ל-setAndSaveUser שדואג למלא את כל השדות הנחוצים (כולל userAvatarUrl)
    this.setAndSaveUser(user); 
}


// פונקציה פרטית שמבצעת את שמירת המשתמש והגדרת ה-avatar באופן עקבי
private setAndSaveUser(response: UserDTO): void {
    
    // 1. נסה למצוא את הנתיב הנקי מתוך התגובה
    const cleanPath = response.userAvatarUrl || response.avatarUrl; 
    
    // 2. בניית תמונת ברירת המחדל
    const defaultAvatarUrl = response.username ? 
        ('https://placehold.co/130x130/8e44ad/ffffff?text=' + response.username.charAt(0).toUpperCase()) : 
        'https://placehold.co/130x130/8e44ad/ffffff?text=U';
        
    // 3. יצירת אובייקט UserDTO מלא עם עקביות בשמות
    this.currentUserData = { 
        ...response, // העתקת שדות בסיסיים (userId, username, email)
        
        // ✅ שמירת הנתיב הנקי (ה-UUID) בשדה שבו השרת שומר אותו
        userAvatarUrl: cleanPath || null, 
        
        // ✅ שמירת הנתיב הנקי/ברירת המחדל בשדה הראשי של הפרונט
        avatarUrl: cleanPath || defaultAvatarUrl 
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
          // ✅ שמירת המשתמש לאחר כניסה
          this.setAndSaveUser(response);
        })
      );
  }

  register(data:any): Observable<UserDTO> { 
    return this.http.post<UserDTO>(this.base + '/users/signup', data)
      .pipe(
        tap(response => {
           console.log('User registered successfully:', response.username);
           // ✅ שמירת המשתמש החדש ל-AuthService ול-localStorage
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
    // ✅ תיקון 3 (ניקיון): שיטה זו משמשת ב-category-posts.component.ts.
    // היא קוראת את המשתנה השמור בזיכרון המיידי.
    return this.currentUserData;
  }

currentUser(): UserDTO | null { 
    if (!this.currentUserData) {
        // אם אין נתונים בזיכרון, טען אותם מה-localStorage.
        // זה יחזיר את נתוני המשתמש המלאים (כולל התמונה).
        this.loadUserFromStorage();
    }
    
    // אם ה-Token פג תוקף, קריאת API עתידית תיכשל (401), ושם ה-Interceptor
    // יטפל בניקוי הנתונים.
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
}