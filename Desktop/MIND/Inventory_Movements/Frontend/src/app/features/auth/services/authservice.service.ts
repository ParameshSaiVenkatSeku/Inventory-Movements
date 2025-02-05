import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EncryptionService } from '../../../core/services/encryption.service'; // Import EncryptionService
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class AuthserviceService {
  private apiUrl = environment.Url;
  authSer: any;

  constructor(private http: HttpClient) {}

  secret_key: string = 'akriviaautomation';

  signup(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Observable<any> {
    const encryptedEmail = CryptoJS.AES.encrypt(
      email,
      this.secret_key
    ).toString();
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      this.secret_key
    ).toString();

    const body = {
      first_name: firstName,
      last_name: lastName,
      email: encryptedEmail,
      password: encryptedPassword,
    };

    return this.http
      .post(`${this.apiUrl}/api/v1/auth/signup`, body)
      .pipe(catchError(this.handleError));
  }

  login(email: string, password: string): Observable<any> {
    const data = { email, password };
    const encryptedEmail = CryptoJS.AES.encrypt(
      email,
      this.secret_key
    ).toString();
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      this.secret_key
    ).toString();

    const body = {
      email: encryptedEmail,
      password: encryptedPassword,
    };
    console.log(email, password, body);
    return this.http
      .post(`${this.apiUrl}/api/v1/auth/login`, body)
      .pipe(catchError(this.handleError));
  }

  getAllUsers(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/api/v1/user/getAll`)
      .pipe(catchError(this.handleError));
  }

  isBrowser(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.sessionStorage !== 'undefined'
    );
  }

  setToken(token: string): void {
    if (this.isBrowser()) {
      sessionStorage.setItem('access_token', token);
    }
  }

  setRefreshToken(token: string): void {
    if (this.isBrowser()) {
      sessionStorage.setItem('refresh_token', token);
    }
  }

  getToken(): any {
    if (this.isBrowser()) {
      // console.log(sessionStorage.getItem('access_token'));
      return sessionStorage.getItem('access_token');
    }
    return null;
  }

  refreshToken(): Observable<any> {
    const refreshToken = sessionStorage.getItem('refresh_token');
    return this.http
      .post<any>(`${this.apiUrl}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem('access_token', response.access_token);
        })
      );
  }

  logout(): void {}

  isAuth(): boolean {
    return this.isBrowser() && !!this.getToken();
  }

  private user: any;

  setUser(user: any) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  getUserInfo(): Observable<any> {
    const token = this.authSer.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(`${this.apiUrl}/api/v1/user/userdata`, {
      headers,
    });
  }

  private handleError(error: any): Observable<any> {
    console.error(error);
    throw error;
  }
}
