import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private router = inject(Router); 
    // ניתן להזריק את AuthService אם רוצים להשתמש ב-logout(), אבל נסתפק בניקוי ישיר

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                
                // 🚨 אם יש 401, הסשן פג תוקף / האימות נכשל.
                if (error.status === 401) {
                    console.error('Session expired. Forcing frontend logout.');
                    
                    // 1. נקה את הנתונים השבורים
                    localStorage.removeItem('fynx_user'); 
                    
                    // 2. נתב את המשתמש לדף הכניסה
                    this.router.navigate(['/sign-in']);
                    
                    // 3. עצור את שרשרת ה-Observable
                    return throwError(() => new Error('Session Expired'));
                }

                return throwError(() => error);
            })
        );
    }
}