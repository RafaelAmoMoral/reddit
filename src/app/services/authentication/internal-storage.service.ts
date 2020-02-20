import { Injectable } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { User } from 'src/app/model/iUser';
//import { UserService } from '../user.service';
import { Utils } from './Utils';

@Injectable({
  providedIn: 'root'
})
export class InternalStorageService {

  constructor(private nativeStorage: NativeStorage) { }

  /**
     * Usado al hacer login y al cerrar sesión.
     * @param user Usuario almacenado y en caso de por defecto,
     * se elimina el usuario. Se emplea cuando cerramos la sesión
     */
  public async saveSession(user?: User): Promise<void> {
    if (user) {
      await this.nativeStorage.setItem('user', user);
    } else {
      await this.nativeStorage.remove('user');
    }
  }

  public async getStoredUser(): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        let storedUser = await this.nativeStorage.getItem('user');
        if (storedUser) {
          // this.checkSession(storedUser)
          //.then(isUserChecked => {
          /* if (isUserChecked) {
             resolve(storedUser);
           } else {*/
          resolve(storedUser)
          //}
          // })
          // .catch(err => reject(err))
        }
      } catch (err) {
        reject();
      }
    })
  }

  /*private checkSession(storedUser: User) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        let storedSessionKey = await Utils.createUserSessionToken(storedUser.idToken);
        this.userService.getUserSessionKey(storedUser.id)
          .then(async (actualSessionKey) => {
            if (actualSessionKey !== storedSessionKey) {
              resolve(false);
            } else {
              resolve(true);
            }
          })
          .catch(err => { console.log(err) })
      } catch (err) {
        reject();
      }
    })
  }*/

}
