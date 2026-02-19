import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-wrapper">
      <div class="posts-grid">
        <div class="post-item" *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]">
          <img [src]="'https://picsum.photos/400/300?nature&random=' + i" alt="nature">
        </div>
      </div>
      
      <div class="brand-overlay"></div>

      <div class="floating-icons">
        <i class="fa-solid fa-camera icon i1"></i>
        <i class="fa-solid fa-music icon i2"></i>
        <i class="fa-solid fa-code icon i3"></i>
        <i class="fa-solid fa-lightbulb icon i4"></i>
        <i class="fa-solid fa-palette icon i5"></i>
      </div>

      <div class="glass-card">
        <div class="brand-identity">
          <img src="assets/images/Logo.png" alt="Logo" class="main-logo-img">
          <h1 class="brand-name-full">Fynx</h1>
        </div>
        
        <p class="tagline">Connect, Share, Discover</p>
        
        <div class="separator"></div>

        <p class="description">
          Join a vibrant community where creators, developers, designers, and artists share their passion and knowledge.
        </p>
        
        <div class="buttons">
          <button class="btn btn-primary" (click)="router.navigate(['/sign-up'])">Get Started</button>
          <button class="btn btn-outline" (click)="router.navigate(['/sign-in'])">Sign In</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* צבע לבן גורף לכל הטקסט והאייקונים */
    .glass-card, .brand-name-full, .tagline, .description, .icon {
      color: #ffffff !important;
    }

    .home-wrapper { 
      position: relative; height: 100vh; width: 100%; 
      display: flex; justify-content: center; align-items: center; 
      overflow: hidden; background: #0b0b0d; 
    }

    .posts-grid { 
      position: absolute; inset: -5%; display: grid; 
      grid-template-columns: repeat(5, 1fr); gap: 20px; 
      transform: rotate(-2deg) scale(1.1); z-index: 1; 
    }

    .post-item img { width: 100%; height: 230px; object-fit: cover; border-radius: 30px; opacity: 0.3; }

    /* התיקון לרקע מחליף הצבעים */
    .brand-overlay { 
      position: absolute; inset: 0; 
      background: linear-gradient(135deg, #00bcd4, #8e44ad, #ff4d94, #ff9933); 
      background-size: 400% 400%; /* הגדלנו כדי שיהיה לאנימציה לאן לזוז */
      z-index: 2; 
      opacity: 0.8;
      animation: gradientMove 12s ease infinite alternate; /* האנימציה חזרה! */
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* אייקונים צפים */
    .icon {
      position: absolute; font-size: 2.5rem; opacity: 0.6; z-index: 3;
      animation: floatIcon 6s infinite ease-in-out alternate;
    }

    @keyframes floatIcon {
      from { transform: translateY(0) rotate(0deg); }
      to { transform: translateY(-20px) rotate(10deg); }
    }

    .i1 { top: 15%; left: 10%; }
    .i2 { top: 25%; right: 12%; }
    .i3 { bottom: 20%; left: 15%; }
    .i4 { top: 10%; left: 45%; }
    .i5 { bottom: 15%; right: 10%; }

    .brand-identity {
      display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;
    }

    .main-logo-img {
      width: 120px; height: 120px; object-fit: contain; margin-bottom: 15px;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
    }

    .brand-name-full { font-size: 4.2rem; font-weight: 900; margin: 0; letter-spacing: -1px; line-height: 1; }

    .tagline { font-size: 1.4rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 15px 0; }

    .separator { width: 50px; height: 2px; background: rgba(255,255,255,0.4); margin: 25px auto; }

    .glass-card {
      position: relative; z-index: 20; width: 550px; padding: 60px 40px;
      background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(30px);
      border-radius: 60px; border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center; box-shadow: 0 40px 80px rgba(0,0,0,0.4);
    }

    .description { font-size: 1.15rem; line-height: 1.6; margin-bottom: 40px; opacity: 0.9; }

    .buttons { display: flex; gap: 20px; justify-content: center; }
    
    .btn { padding: 16px 40px; border-radius: 50px; font-weight: 800; cursor: pointer; border: none; transition: 0.3s; font-size: 0.9rem; text-transform: uppercase; }

    .btn-primary { background: #ffffff !important; color: #1a1a1a !important; }
    .btn-outline { background: transparent !important; border: 2px solid #ffffff !important; color: #ffffff !important; }

    .btn:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
  `]
})
export class HomeComponent {
  constructor(public router: Router) {}
}