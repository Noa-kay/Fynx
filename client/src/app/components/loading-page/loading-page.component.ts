import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root', 
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingPageComponent {
  private router = inject(Router);

  goToSignIn() {
    console.log('Navigating to Sign In...');
    this.router.navigate(['/sign-in']); 
  }

  onSignUpSubmit() {
    console.log('Navigating to Sign Up...');
    this.router.navigate(['/sign-up']);
  }
}