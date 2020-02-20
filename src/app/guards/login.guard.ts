import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication/authentication.service';
import { async } from '@angular/core/testing';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private autenticationService: AuthenticationService, private router: Router) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    let myRoute: string = route.url.join('');
    if (!this.autenticationService.checked) {
      await this.autenticationService.checkSession();
    }

    if (this.autenticationService.isLogged()) {
      if (myRoute === 'signin' || myRoute === 'signup') {
        return false;
      } else {
        return true;
      }
    } else {
      if (myRoute === 'signin' || myRoute === 'signup' || myRoute === 'home' || myRoute === 'post') {
        return true;
      } else {
        return false;
      }
    }
  }

}
