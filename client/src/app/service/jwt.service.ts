import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private tokenKey = 'log_in_token';

  setToken(token: string) {
    document.cookie = `${this.tokenKey}=${token}; path=/`;
  }

  getToken(): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + this.tokenKey + '=([^;]+)'));
    return match ? match[2] : null;
  }

  removeToken() {
    document.cookie = `${this.tokenKey}=; Max-Age=0; path=/`;
  }
}
