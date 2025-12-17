import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private router = inject(Router); 

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    console.error('Session expired. Forcing frontend logout.');
                    localStorage.removeItem('fynx_user'); 
                    this.router.navigate(['/sign-in']);
                    return throwError(() => new Error('Session Expired'));
                }

                return throwError(() => error);
            })
        );
    }
}