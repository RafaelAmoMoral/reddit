import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private autenticationService: AuthenticationService, private platform:Platform) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    await this.platform.ready();  //USADO PARA COMRPOBAR QUE CORDOVA ESTA DISPONIBLE PARA ACCEDER AL NATIVE STORAGE
    let myRoute: string = route.url.join('');
    if (!this.autenticationService.checked) {
      try{
        await this.autenticationService.checkSession();
      }catch(err){}
    }

    if (this.autenticationService.isLogged()) {
      if (myRoute === 'signin' || myRoute === 'signup') {
        return false;
      } else {
        return true;
      }
    } else {
      if (myRoute === 'signin' || myRoute === 'signup' || myRoute === 'home' || myRoute === 'post' || myRoute === 'user') {
        return true;
      } else {
        return false;
      }
    }
  }

}
