import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  catchError,
  Observable,
  switchMap,
  take,
  throwError,
  filter,
} from 'rxjs';
import { AuthserviceService } from '../services/authservice.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshingToken = false;
  private refreshTokenSubject: Observable<any> | null = null;

  constructor(
    private authService: AuthserviceService,
    private toastr: ToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<any> {
    const access_token = this.authService.getToken();
    //console.log("auth inter");

    let clonedRequest = request;

    if (access_token && !request.url.includes('/akv-interns')) {
      clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    }
    //console.log(request.url);
    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // console.log('came inside 1');
          if (!this.refreshingToken) {
            this.refreshingToken = true;
            // console.log(this.refreshingToken);
            // console.log('came inside 2');
            this.refreshTokenSubject = this.authService.refreshToken().pipe(
              switchMap((newToken: any) => {
                // console.log('came inside 3', newToken);
                this.authService.setToken(newToken.access_token);
                this.authService.setRefreshToken(newToken.refresh_token);
                const retryRequest = request.clone({
                  headers: request.headers.set(
                    'Authorization',
                    `Bearer ${newToken.access_token}`
                  ),
                });
                return next.handle(retryRequest);
              })
            );
          }
          return (
            this.refreshTokenSubject?.pipe(
              filter((token) => token !== null),
              take(1),
              switchMap((newAccessToken: string) => {
                // console.log('new', newAccessToken);

                if (!request.url.includes('/akv-interns')) {
                  const updatedRequest = request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newAccessToken}`,
                    },
                  });
                }
                this.toastr.success(
                  'New Access token generated SuccessFully',
                  'Success'
                );
                // console.log('New Access token generated SuccessFully');
                return next.handle(request);
              })
            ) || throwError(() => new Error('Token refresh failed'))
          );
        }
        return throwError(() => error);
      })
    );
  }
}
