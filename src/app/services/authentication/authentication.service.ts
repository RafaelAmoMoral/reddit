import { Injectable } from '@angular/core';
import { User } from '../../model/iUser';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Facebook } from '@ionic-native/facebook/ngx';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable, Subject } from 'rxjs';
import { UserService } from '../user.service';
import { InternalStorageService } from './internal-storage.service';
import { Utils } from './Utils';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private _user: User
  private _userState: Subject<any>;
  private _fireAuth: firebase.auth.Auth;
  private _checked: boolean;

  constructor(private google: GooglePlus, private firebase: AngularFireAuth,
    private fb: Facebook, private userService: UserService,
    private internalStorageService: InternalStorageService) {
    this._fireAuth = this.firebase.auth;
    this._checked = false;
  }

  /**
  * No devuelvo nada porque no trato con ninguno de los atributos que me pueden
  * dar las credenciales del usuario, aunque alguno de ellos son interesantes,
  * como por ejemplo saber si el usuario ha verificado su email.
  * @param userdata Datos del usuario que sera registrado.
  */
  signUp(userdata: User): Promise<void> {
    return new Promise((resolve, reject) => {
      this._fireAuth.createUserWithEmailAndPassword(userdata.email, userdata.password)
        .then(async (userCredential) => {
          this._user = {
            email: userCredential.user.email,
            idToken: await Utils.createUserSessionToken(await userCredential.user.getIdToken())
          }

          userCredential.user.updateProfile({ displayName: 'u/' + userdata.name })
            .then(() => {
              this._user.name = 'u/' + userdata.name;
              this._user.isNewUser = true;
              this.userService.addUser(this._user, userCredential.user.uid)
                .then(async () => {
                  this._user.id = userCredential.user.uid;
                  this._user.idToken = await userCredential.user.getIdToken();
                  await this.internalStorageService.saveSession(this._user);
                  resolve()
                })
                .catch(err => reject(err))
            })
            .catch(err => {
              this._user.isNewUser = true;
              reject(err) //Resuelvo porque realmente cree el usuario, pero no pude cambiar su nombre, excepcion propia?
            })
        },
          error => reject(error)
        ).catch(error => { reject(error) });
    });
  }

  login(userdata: User): Promise<void> {
    let promiseUserCredentials: Promise<void>;
    if (userdata) {
      promiseUserCredentials = new Promise((resolve, reject) => {
        this._fireAuth.signInWithEmailAndPassword(userdata.email, userdata.password)
          .then(async (userCredential) => {
            try {
              this._user = {
                id: userCredential.user.uid,
                email: userCredential.user.email,
                name: userCredential.user.displayName,
                isNewUser: userCredential.additionalUserInfo.isNewUser,
                idToken: await Utils.createUserSessionToken(await userCredential.user.getIdToken()) //Fuerzo a refrescar el token
              }
              this.userService.setUserOauthToken(this._user.id, this._user.idToken)
                .then(() => {
                  this.userService.getUserByOauthKey(this._user)
                    .then(async () => {
                      try {
                        this._user.idToken = await userCredential.user.getIdToken();
                        await this.internalStorageService.saveSession(this._user);
                        await this.checkSession();
                        resolve();
                      } catch (err) {
                        reject(err);
                      }
                    })
                    .catch(err => {
                      reject(err)
                    })
                })
                .catch(err => { })
            } catch (err) {
              reject(err);
            }
          },
            error => reject(error)
          ).catch(error => reject(error));
      });
    }
    return promiseUserCredentials;
  }


  public logOut(): Promise<boolean> {
    return this._fireAuth.signOut()
      .then(async () => {
        this._user = null;
        await this.internalStorageService.saveSession();
        return true;
      })
      .catch(async (err) => {
        return false;
      })
  }

  public loginGoogle(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.google.login({})
        .then(async (data) => {
          if (data && data.email) {
            let user: User = {
              email: data.email,
              name: data.displayName,
              image: data.imageUrl,
              idToken: await Utils.createUserSessionToken(data.accessToken),  //Fuerzo a refrescar el token
            }
            this.userService.addUser(this._user, data.userId)
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
          reject()
        })
    });
  }

  public loginFacebook() {
    return this.fb.login([])
      .then(response => {
      }).catch((error) => { console.log(error) });
  }

  get checked(): boolean {
    return this._checked;
  }

  async checkSession() {
    if (this.checked)
      return;

    try {
      let storedUser = await this.internalStorageService.getStoredUser();
      if (storedUser) {
        if (storedUser) {
          let tokenWithUUID = await this.userService.getUserSessionKey(storedUser.id);
          console.log(tokenWithUUID);
          console.log(await Utils.createUserSessionToken(storedUser.idToken));

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

  isLogged(): boolean {
    return this._user ? true : false;
  }

}
