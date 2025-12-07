import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms'; 
import { Router, RouterModule } from '@angular/router'; 
import { AuthService } from '../../service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserDTO } from '../../service/models/auth.model';

interface SignUpModel {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  
  private router = inject(Router);
  private authService = inject(AuthService); 

  signUpData: SignUpModel = {};
  errorMessage: string | null = null;
  loading: boolean = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor() {}

  passwordsAreIdentical(): boolean {
      return !!this.signUpData.password && 
             !!this.signUpData.confirmPassword && 
             this.signUpData.password === this.signUpData.confirmPassword;
  }
  
  onSignUpSubmit(form: NgForm): void {
    console.log('--- Attempting to submit form! ---'); 
    
    if (!this.passwordsAreIdentical() || !this.signUpData.username || !this.signUpData.email || !this.signUpData.password) 
    {
      console.error('Form submission blocked: Missing or invalid data.');
      this.loading = false;
      this.errorMessage = 'Please ensure all fields are correctly filled and passwords match.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.register({
      username: this.signUpData.username,
      email: this.signUpData.email,
      password: this.signUpData.password
    }).subscribe({
      next: (response: UserDTO) => { 
        this.loading = false;
        console.log('Sign Up Successful! User:', response.username, response);
        
        // לאחר רישום מוצלח, עדיף לנווט לכניסה או לפרופיל
        this.router.navigateByUrl('/profile'); 
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Sign Up failed:', err);
        
        if (err instanceof HttpErrorResponse) {
          if (err.status === 409) {
            this.errorMessage = 'User already exists. Please try signing in.';
          } else if (err.status === 400) {
            this.errorMessage = 'Invalid data. Please check your inputs.';
          } else {
            this.errorMessage = err.error?.message || 'Sign Up failed. Please try again.';
          }
        } else {
          this.errorMessage = 'Sign Up failed. Please try again.';
        }
      }
    });
  }
  

   signInWithGoogle(): void {
    this.loading = true;
    this.errorMessage = null;
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Google sign-in failed';
        console.error('Google sign-in error:', err);
      }
    });
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}