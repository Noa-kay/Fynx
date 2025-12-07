import { Component, OnInit } from '@angular/core';
import { JwtService } from '../service/jwt.service';

@Component({
  selector: 'app-jwt',
  templateUrl: './jwt.component.html',
  styleUrls: ['./jwt.component.css']
})
export class JwtComponent implements OnInit {

  token: string | null = null;

  constructor(private jwtService: JwtService) { }

  ngOnInit(): void {
    this.token = this.jwtService.getToken();
    console.log('JWT Token:', this.token);
  }

  signOut(): void {
    this.jwtService.removeToken();
  }
}
