import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  // List of endpoints that have component-specific error handling
  // to prevent duplicate error messages
  const skipGenericErrorEndpoints = [
    '/coupons/validate',
    '/admin/products/upload-picture',
    '/admin/products',
    '/admin/users/create-admin',
    '/admin/users/',
    '/admin/orders/refund/',
    '/admin/delivery-methods',
    '/admin/products/brands/',
    '/admin/products/types/',
    '/account/register',
    '/account/address',
    '/checkout',
    '/orders'
  ];

  // Check if this request should skip generic error handling
  const shouldSkipGenericError = skipGenericErrorEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 400) {
        if (err.error.errors) {  //if there are validation errors
          const modelStateErrors = [];
          for (const key in err.error.errors) {
            if (err.error.errors[key]) {
              modelStateErrors.push(err.error.errors[key]);
            }
          }
          throw modelStateErrors.flat();
        } else {
          // Skip showing generic error for endpoints with component-specific handling
          if (!shouldSkipGenericError) {
            // Check for message first, then title, then fallback to the error object
            const errorMessage = err.error.message || err.error.title || err.error;
            snackbar.error(errorMessage);
          }
        }
      }
      if (err.status === 401) {
        if (!shouldSkipGenericError) {
          snackbar.error(err.error.title || err.error);
        }
      }
      if (err.status === 403) {
        if (!shouldSkipGenericError) {
          snackbar.error('Forbidden - You do not have permission to access this resource.');
        }
      }
      if (err.status === 404) {
        router.navigateByUrl('/not-found');
      }
      if (err.status === 500) {
        const navigationExtras: NavigationExtras = {state: {error: err.error}}
        router.navigateByUrl('/server-error', navigationExtras);
      }
      return throwError(() => err);
    })
  )
};
