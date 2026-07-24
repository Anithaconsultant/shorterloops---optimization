import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<any>(null);

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip modification for auth requests
        if (request.url.includes('/auth/')) {
            return next.handle(request);
        }

        const token = this.authService.getAccessToken();
        const authReq = this.addTokenToRequest(request, token);

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 && !authReq.url.includes('/auth/refresh')) {
                    return this.handle401Error(authReq, next);
                }
                return throwError(error);
            })
        );
    }

    private addTokenToRequest(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
        return token
            ? request.clone({
                setHeaders: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            : request;
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((tokenPair: any) => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject.next(tokenPair.access);
                    return next.handle(this.addTokenToRequest(request, tokenPair.access));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    this.authService.logout();
                    this.router.navigate(['/login']);
                    return throwError(err);
                })
            );
        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(token => {
                    return next.handle(this.addTokenToRequest(request, token));
                })
            );
        }
    }
}
