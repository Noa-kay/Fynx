import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  constructor() { }

  /**
   * Processes an HTTP error response from the backend.
   * @param error The HttpErrorResponse object.
   * @returns An observable that emits an error.
   */
  public handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client Error: ${error.error.message}`;
      console.error(errorMessage);
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Network connection failed. Please check your internet connection.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please sign in again.';
          break;
        case 404:
          errorMessage = `Resource not found: ${error.url}`;
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          if (error.error && error.error.message) {
             errorMessage = `Error ${error.status}: ${error.error.message}`;
          } else {
             errorMessage = `Server Error (Status: ${error.status}).`;
          }
          break;
      }
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
    }

    this.displayUserMessage(errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Displays a user-friendly error message. 
   * NOTE: In a real Angular app, you would inject a service for Toast/Modal 
   * instead of logging directly.
   * @param message The message to display.
   */
  private displayUserMessage(message: string): void {
    // === IMPORTANT: Replace this with your custom UI implementation (e.g., a Snackbar or Toast) ===
    console.error(`USER MESSAGE DISPLAYED: ${message}`);
    // Example: this.toastService.showError(message);
  }
}