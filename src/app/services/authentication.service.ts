import { Injectable } from '@angular/core';
import { User } from '../model/iUser';
//import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Facebook } from '@ionic-native/facebook/ngx';
import { AngularFireAuth } from 'angularfire2/auth';
import { UserService } from './user.service';
import { InternalStorageService } from './internal-storage.service';
import { Utils } from './Utils';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private _user: User
  private _fireAuth: firebase.auth.Auth;
  private _checked: boolean;

  constructor(private firebase: AngularFireAuth,
    private fb: Facebook, private userService: UserService,
    private internalStorageService: InternalStorageService) {
    this._fireAuth = this.firebase.auth;
    this._checked = false;
  }

  /**
  * En primer lugar da de alta a un usuario en fire Auth. Posteriormente,
  * llamo al método addUser del servicio userService para que añada a la 
  * colección de 'user' el nuevo usuario.
  * Una vez hecho esto, guardo al usuario en el internal storage.
  * @param userdata Usuario que será insertado en la base de datos.
  */
  signUp(userdata: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this._fireAuth.createUserWithEmailAndPassword(userdata.email, userdata.password)
        .then(async (userCredential) => {
          try {
            userdata.idToken = await userCredential.user.getIdToken();
          } catch (err) {
            //Debería de reintentar este bloque un mínimo de veces hasta hacer reject() con su consecuente borrado del usuario creado ya que el auth no tiene transacciones.
            reject();
          }
          userdata.id = userCredential.user.uid;
          this.userService.addUser(userdata)
            .then(async () => {
              try {
                userdata.idToken = await userCredential.user.getIdToken();  //Ya que al insertar el usuario cambie el idToken con el del dispositivo
                await this.internalStorageService.saveSession(userdata);
              } catch (err) {
                //Debería de reintentar este bloque un mínimo de veces hasta hacer reject() con su consecuente borrado del usuario creado en auth y coleccion user.
                reject(err)
              }

              this._user = userdata;
              resolve()
            })
            .catch(err => reject(err))
        },
          err => reject(err)
        ).catch(err => reject(err));
    });
  }

  /**
   * En primer lugar inicia sesión en el auth de firebase. Posteriormente modifica
   * la sesión en la colección de user. Una vez modificada la sesión obtiene el usuario
   * de la colección user y lo guarda en el native storage.
   * @param userdata Usuario a loguear.
   */
  login(userdata: User): Promise<void> {
    return new Promise((resolve, reject) => {
      if (userdata) {
        this._fireAuth.signInWithEmailAndPassword(userdata.email, userdata.password)
          .then(async (userCredential) => {
            try {
              try {
                userdata.idToken = await userCredential.user.getIdToken();
              } catch (err) {
                //Debería de reintentar este bloque un mínimo de veces hasta hacer reject().
                reject();
              }
              userdata.id = userCredential.user.uid;
              this.userService.setUserOauthToken(userdata)
                .then(() => {
                  this.userService.setUserWithUserCollectionData(userdata)
                    .then(async () => {
                      try {
                        userdata.idToken = await userCredential.user.getIdToken();  //Ya que al insertar el usuario cambie el idToken con el del dispositivo
                        await this.internalStorageService.saveSession(userdata);
                      } catch (err) {
                        reject(err);
                      }
                      this._user = userdata;
                      resolve();
                    })
                    .catch(err => {
                      reject(err)
                    })
                })
                .catch(err => { reject(err) })
            } catch (err) {
              reject(err);
            }
          })
          .catch(error => reject(error));
      } else {
        reject();
      }
    });
  }

  /**
   * En primer lugar desloguea al usuario del auth de firebase. A continuación, 
   * elimina al usuario del native storage y por último elimina la variable del usuario.
   */
  public logOut(): Promise<boolean> {
    return this._fireAuth.signOut()
      .then(async () => {
        await this.internalStorageService.saveSession();
        this._user = null;
        return true;
      })
      .catch(err => {
        return false;
      })
  }

  public loginGoogle(): Promise<boolean> {
    return
    /*return new Promise((resolve, reject) => {
      this.google.login({})
        .then(async (data) => {
          if (data && data.email) {
            let user: User = {
              email: data.email,
              name: data.displayName,
              image: data.imageUrl,
              idToken: await Utils.createUserSessionToken(data.accessToken),
            }
            this.userService.addUser(this._user)
              .then(async () => {
                this._user.id = data.userId;
                this._user = user;
                await this.internalStorageService.saveSession(user);
                resolve(true);
              })
              .catch(err => reject(err))
          } else {
            reject()
          }
        })
        .catch(err => {
          reject(err)
        })
    });*/
  }

  public loginFacebook() {
    return this.fb.login(['email'])
      .then(response => {
        console.log(response)
      }).catch((error) => { console.log(error) });
  }

  /**
   * Método usado para devolver si se comprobo que la sesión que se encuentra en el usuario almacenado 
   * localmente, es la misma que la que se encuentra en firebase.
   */
  get checked(): boolean {
    return this._checked;
  }

  /**
   * Método usado para comprobar si la sesión del usuario que se encuentra en el internal storage
   *  es igual a la que se encuentra en firebase. 
   * Si la sesión es la misma, el usuario de la aplicación pasa a ser el del native storage.
   * Si la sesión es distinta, el usuario es deslogueado.
   */
  async checkSession() {
    if (this.checked)
      return;

    try {
      let storedUser = await this.internalStorageService.getStoredUser();
      if (storedUser) {
        if (storedUser) {
          let tokenWithUUID = await (await this.userService.getUser(storedUser.id)).idToken;
          if (tokenWithUUID == await Utils.createUserSessionToken(storedUser.idToken)) {
            this._user = storedUser;
          }
        } else {
          await this.logOut();
          await this.internalStorageService.saveSession();
          this._user = null;
        }
      }
    } catch (err) {
      await this.logOut();
      await this.internalStorageService.saveSession();
      this._user = null;
    } finally {
      this._checked = true;
    }
  }

  /**
   * Método que devuelve el actual usuario de la aplicación.
   */
  getAuthenticatedUser() {
    return this._user;
  }

  /**
   * Método usado para devolver el estado del usuario. 
   * @returns True si esta logeado, false sino.
   */
  isLogged(): boolean {
    return this._user ? true : false;
  }

}
