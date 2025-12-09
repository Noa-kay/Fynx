// //למחוק את הקומפוננטה הזאת ! 
// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { AuthService } from '../service/auth.service';

// @Component({
//   selector: 'app-signin',
//     standalone: true,
//   template: `
//   <div class="card">
//     <h3>Signin</h3>
//     <form (ngSubmit)="signin()">
//       <input (ngModel)="email" name="email" placeholder="Email" required />
//       <input (ngModel)="password" name="password" placeholder="Password" required type="password" />
//       <button class="button" type="submit">Sign in</button>
//     </form>
//   </div>
//   `
// })
// export class SigninComponent {
//   email = '';
//   password = '';
//   constructor(private auth: AuthService, private router: Router) {}
//   signin() {
//     this.auth.signin({ email: this.email, password: this.password }).subscribe(() => {
//       this.router.navigate(['/profile']);
//     }, () => {
//       this.router.navigate(['/profile']);
//     });
//   }
// }
