import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, Observable, throwError, switchMap } from 'rxjs';
import { AuthserviceService } from './../../auth/services/authservice.service';
import { Router } from '@angular/router';

@Injectable()
export class HttpInterceptorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthserviceService, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const currentUser = this.authService.getToken();

    if (!request.url.includes('s3.ap-south-1.amazonaws.com')) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${currentUser}` },
      });
    }

    console.log('HTTP Request:', {
      url: request.url,
      method: request.method,
      body: request.body,
      headers: request.headers,
    });

    return next.handle(request).pipe(
      catchError((error) => {
        let errorMessage = '';

        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 404:
              errorMessage = `Resource not found at ${request.url}. Please check if the endpoint is correct.`;
              console.error('404 Error:', errorMessage);
              break;
            case 401:
              const isRef = confirm('Session Expired.. Do you want to continue?');
              if (isRef) {
                return this.authService.refreshToken().pipe(
                  switchMap(() => {
                    const accessToken = sessionStorage.getItem('access_token');
                    const newRequest = request.clone({
                      setHeaders: { Authorization: `Bearer ${accessToken}` },
                    });
                    return next.handle(newRequest);
                  })
                );
              } else {
                this.router.navigate(['/login']);
              }
              break;
            case 500:
              errorMessage = 'Internal server error.';
              break;
            case 0:
              errorMessage = 'Network error. Please check your connection.';
              break;
            default:
              errorMessage = error.message || 'An error occurred. Please try again.';
          }
          console.error('Error occurred:', errorMessage);
        } else {
          console.error('An unexpected error occurred:', error);
          errorMessage = 'An unexpected error occurred.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
