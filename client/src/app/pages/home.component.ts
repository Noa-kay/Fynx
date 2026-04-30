import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-wrapper">
      <div class="bubble-bg">
        <div class="bubble bubble1"></div>
        <div class="bubble bubble2"></div>
        <div class="bubble bubble3"></div>
        <div class="bubble bubble4"></div>
      </div>

      <div class="content">
        <h1>Fynx</h1>
        <p class="tagline">Connect, Share, Discover — Your Creative Community</p>
        <p class="description">
          Join a vibrant community where creators, developers, designers, and artists share their passion and knowledge.
        </p>

        <div class="buttons">
          <button class="btn primary" (click)="router.navigate(['/sign-in'])">Sign In</button>
          <button class="btn secondary" (click)="router.navigate(['/sign-up'])">Sign Up</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #00bcd4, #8e44ad, #ff9933, #ff4d94);
      font-family: 'Inter', 'Arial', sans-serif;
      overflow: hidden;
    }

    .home-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .bubble-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.08;
      mix-blend-mode: overlay;
    }

    .bubble1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 5%;
      background: rgba(255,255,255,0.1);
      animation: float 20s ease-in-out infinite;
    }

    .bubble2 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
      background: rgba(255,255,255,0.08);
      animation: float 25s ease-in-out infinite reverse;
    }

    .bubble3 {
      width: 180px;
      height: 180px;
      bottom: 5%;
      left: 20%;
      background: rgba(255,255,255,0.1);
      animation: float 22s ease-in-out infinite;
    }

    .bubble4 {
      width: 120px;
      height: 120px;
      top: 30%;
      right: 20%;
      background: rgba(255,255,255,0.06);
      animation: float 18s ease-in-out infinite reverse;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-30px) translateX(20px); }
    }

    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 600px;
      color: white;
    }

    h1 {
      font-size: 4rem;
      font-weight: 800;
      margin: 0 0 12px 0;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
      letter-spacing: -0.02em;
    }

    .tagline {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 16px 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .description {
      font-size: 1.1rem;
      line-height: 1.6;
      margin: 0 0 32px 0;
      color: rgba(255,255,255,0.9);
      text-shadow: 0 1px 5px rgba(0,0,0,0.2);
    }

    .buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 14px 32px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }

    .btn.primary {
      background: linear-gradient(90deg, #ff9933, #ff4d94);
      color: white;
    }

    .btn.primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(255,153,51,0.4);
    }

    .btn.secondary {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 2px solid rgba(255,255,255,0.5);
      backdrop-filter: blur(10px);
    }

    .btn.secondary:hover {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.8);
      transform: translateY(-3px);
    }

    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
      .tagline { font-size: 1.3rem; }
      .description { font-size: 0.95rem; }
      .buttons { gap: 12px; }
      .btn { padding: 12px 24px; font-size: 0.9rem; }
    }
  `]
})
export class HomeComponent {
  constructor(public router: Router) {}
}
