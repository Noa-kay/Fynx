import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-register',
    standalone: true,
  template: `
  <div class="card">
    <h3>Register</h3>
    <form (ngSubmit)="register()">
      <input (ngModel)="name" name="name" placeholder="Name" required />
      <input (ngModel)="email" name="email" placeholder="Email" required />
      <input (ngModel)="password" name="password" placeholder="Password" required type="password" />
      <button class="button" type="submit">Create account</button>
    </form>
  </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  constructor(private auth: AuthService, private router: Router) {}
  register() {
    this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe(() => {
      this.router.navigate(['/profile']);
    }, () => {
      this.router.navigate(['/profile']);
    });
  }
}
