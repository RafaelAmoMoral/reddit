import { Injectable } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { User } from 'src/app/model/iUser';

@Injectable({
  providedIn: 'root'
})
export class InternalStorageService {

  constructor(private nativeStorage: NativeStorage) { }

  /**
     * Método usado para almacenar un usuario en el internal storage.
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

  /**
   * Método usado para devolver el objeto usuario, (si se encuentra) dentro
   * del internal storage.
   */
  public getStoredUser(): Promise<User> {
    return this.nativeStorage.getItem('user');
  }

}
