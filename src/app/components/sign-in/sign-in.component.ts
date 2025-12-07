import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { UserDTO } from '../../service/models/auth.model'; 

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    HttpClientModule,
    CommonModule,
    RouterModule
  ]
})
export class SignInComponent implements OnInit {
  
  private authService = inject(AuthService);
  private router = inject(Router);

  signInData = {
    username: '',
    password: ''
  };

  errorMessage: string | null = null; 
  loading: boolean = false; 
  showPassword: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  onSignInSubmit(form: NgForm) {
    this.errorMessage = null;
    this.loading = true;

    if (form.invalid) {
        this.loading = false;
        this.errorMessage = 'Please enter valid credentials.';
        return;
    }

    const credentials = {
      username: this.signInData.username,
      password: this.signInData.password
    };

    this.authService.signin(credentials).subscribe({
      next: (response : UserDTO) => {
        this.loading = false;
      if (response.username && response.userId) { 
            localStorage.setItem('fynx_user', JSON.stringify({ 
                username: response.username, 
                userId: response.userId,
                email: response.email
            }));
          
          console.log('Sign In Successful! Welcome back.', response);
          this.router.navigate(['/profile']);
        } else {
          this.errorMessage = 'Sign in failed. Server returned incomplete user data (Status 200).'; 
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server error. Please try again.';
      }
    });
  }
  
    signInWithGoogle() {
      this.loading = true;
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

  goToSignUp() {
    console.log('Navigating to Sign Up...');
    this.router.navigate(['/sign-up']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}