import { Injectable } from '@angular/core';
import { User } from '../model/iUser';
import { AngularFirestoreCollection, AngularFirestore, DocumentData } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
import { FireSQL } from 'firesql';
import { Post } from '../model/iPost';
import { MediaService } from './media.service';
import { InternalStorageService } from './internal-storage.service';
import { Utils } from './Utils';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _userCollection: AngularFirestoreCollection;

  constructor(private fireStore: AngularFirestore, private media: MediaService,
    private internalStorage: InternalStorageService) {
    this._userCollection = this.fireStore.collection('user');
  }

  /**
   * Método usado para añadir a un usuario a la colección user.
   * Antes de ser guardado en la colección, se crea el token de la sesión
   * concatenando el UUID del dispositivo y el actual token de la sesión. 
   * @param user Usuario, previamente añadido al oauth de firebase.
   */
  addUser(user: User): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (user) {
        try {
          user.idToken = await Utils.createUserSessionToken(user.idToken);
        } catch (err) {
          //Deberia de reintentar
          reject(err);
        }
        this._userCollection.doc(user.id).set(
          {
            idToken: user.idToken,
            email: user.email || null,
            name: 'u/' + user.name || null,
            image: user.image || null,
            phone: user.phone || null,
            isNewUser: true,
          }
        )
          .then(() => {
            resolve()
          }
          ).catch(error => {
            reject(error)
          })
      } else {
        reject();
      }
    });
  }

  /**
  * Usado para obtener la sesión del usuario en la colección user.
  * @param userId id del usuario
  */
  getUser(userId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this._userCollection.doc(userId).get().toPromise()
        .then(docData => {
          let data: DocumentData = docData.data();
          let user: User = {
            id: userId,
            name: data.name,
            email: data.email,
            isNewUser: data.isNewUser,
            idToken: data.idToken,
            description: data.description,
            phone: data.phone,
            likedPosts: data.likedPosts,
            image: data.image,
            userPosts: data.userPosts,
          }
          resolve(user);
        })
        .catch(error => {
          reject(error);
        });
    })
  }

  /**
   * Método usado para modificar los valores de la colección de user
   * en la base de datos.
   * Si la modificación el la colección fue exitosa, el usuario
   * es guardado en el internal storage para persistir los cambios a nivel local.
   * @param user Usuario a modificar.
   */
  async updateUser(user: User): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      this._userCollection.doc(user.id).set(
        {
          email: user.email || null,
          name: user.name || null,
          description: user.description || null,
          image: user.image || null,
          phone: user.phone || null,
          isNewUser: user.isNewUser || null,
          likedPosts: user.likedPosts || null,
          userPosts: user.userPosts || null
        },
        { merge: true }
      )
        .then(async () => {
          try {
            await this.internalStorage.saveSession(user);
            resolve();
          } catch (err) {
            //Deberia de reintentar este bloque hasta reject()
            reject(err)
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Método llamado al hacer loguin en el oauth de firebase para así, poder 
   * obtener la colección del usuario que se logueo.
   * @param user Usuario a modificar con los datos de la coleccion user.
   */
  setUserWithUserCollectionData(user: User): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      this._userCollection.doc(user.id).get().toPromise() //Posible ya que la subscripcion en este caso hace complete
        .then(docData => {
          let data: DocumentData = docData.data();
          user.name = data.name;
          user.description = data.description;
          user.phone = data.phone;
          user.likedPosts = data.likedPosts;
          user.image = data.image;
          user.userPosts = data.userPosts;
          resolve();
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Modifica la sesión del usuario en la colección user.
   * @param appUser Usuario actual de la aplicación.
   */
  async setUserOauthToken(appUser: User) {
    if (appUser) {
      try {
        appUser.idToken = await Utils.createUserSessionToken(appUser.idToken);
      } catch (err) {
        //Deberia de reintentar
        throw err;
      }
      return this._userCollection.doc(appUser.id).set({
        idToken: appUser.idToken
      },
        { merge: true }
      )
    }
  }

  /**
   * Añade una imágen en base64 al storage de firebase. Posteriormente obteniendo
   * la url de la imágen insertada, añade esta a la coleeción del usuario.
   * @param image Imágen en base 64 a añadir al usuario en la bbdd.
   */
  setUserImage(base64Image: string, appUser: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.media.firebaseStorage.ref('users/' + appUser.id + ".jpeg").putString(base64Image, 'base64', { contentType: 'image/jpeg' })
        .then(data => {
          data.ref.getDownloadURL()
            .then(url => {
              this._userCollection.doc(appUser.id).set({
                image: url
              },
                { merge: true }
              )
                .then(() => {
                  appUser.image = url;
                  this.internalStorage.saveSession(appUser)
                    .then(() => {
                      resolve()
                    })
                    .catch(err => { reject() })
                })
                .catch(err => {
                  reject(err)
                })
            })
            .catch(err => {
              reject(err)
            })
        })
        .catch(err => { console.log(err) })
    })
  }


  /**
   * 
   * @param userApp 
   */
  getPosts(userApp: User): Promise<Post[]> {
    return new Promise<Post[]>((resolve, reject) => {
      if (userApp && userApp.userPosts) {
        let fireSQL = new FireSQL(firebase.firestore());
        //__name__ se refiere al id del documento
        let query: string = "SELECT * FROM post WHERE __name__ IN ('";
        userApp.userPosts.forEach(element => {
          query += element + "','";
        });
        query = query.slice(0, -2);//Elimino ',
        query += ')';
        fireSQL.query(query, { includeId: 'id' }) //Especifico que se devuelva el id con alias 'id'
          .then(dbLikedPosts => {
            let likedPosts: Post[] = [];
            if (dbLikedPosts) {
              dbLikedPosts.forEach(post => {
                if (post) {
                  let p: Post = {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    video: post.video,
                    image: post.image,
                    nLikes: post.nLikes,
                    usersLikes: post.usersLikes,
                    date: post.date.toDate(),
                    userId: post.userId,
                    userName: post.userName
                  }
                  likedPosts.push(p);
                }
              });
              resolve(likedPosts)
            } else {
              resolve();
            }
          })
          .catch(err => reject(err))
      } else {
        resolve();
      }
    })
  }

  /**
     * Método usado para obetener los post gustados del usuario, para esta tarea utilizo la librería de firebase
     * para cerar sentencias SQL.
     * Para crear la senetencia obtengo el array con los id's de post que le han gustado al usuario y
     * concaten cada id el el argumento IN de la consulta.  
     * @param userApp Usuario actual de la app.
     */
  getLikedPosts(userId: string): Promise<Post[]> {
    return new Promise<Post[]>((resolve, reject) => {
      let fireSQL = new FireSQL(firebase.firestore());
      this.getUser(userId)
        .then((user: User) => {
          if (user && user.likedPosts && user.likedPosts.length > 0) {
            //__name__ se refiere al id del documento
            let query: string = "SELECT * FROM post WHERE __name__ IN ('";
            user.likedPosts.forEach(element => {
              query += element + "','";
            });
            query = query.slice(0, -2);//Elimino ',
            query += ')';
            fireSQL.query(query, { includeId: 'id' }) //Especifico que se devuelva el id con alias 'id'
              .then(dbLikedPosts => {
                let likedPosts: Post[] = [];
                if (dbLikedPosts) {
                  dbLikedPosts.forEach(post => {
                    if (post) {
                      let p: Post = {
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        nLikes: post.nLikes,
                        usersLikes: post.usersLikes,
                        date: post.date.toDate(),
                        userId: post.userId,
                        userName: post.userName
                      }
                      likedPosts.push(p);
                    }
                  });
                  resolve(likedPosts)
                } else {
                  resolve();
                }
              })
              .catch(err => reject(err))
          } else {
            resolve();
          }
        })
    })
  }

  /**
   * Comprueba si el post se encuentra en el array de posts gustados por el usuario.
   * @param userId Identicador del usuario.
   * @param postId Identificador del post gustado.
   */
  isPostLiked(userId: string, postId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._userCollection.doc(userId).get().toPromise()
        .then(docData => {
          if (docData) {
            let data = docData.data();
            let likedPosts: string[] = data.likedPosts;
            if (likedPosts) {
              for (let i = 0; i < likedPosts.length; i++) {
                if (likedPosts[i] === postId) {
                  resolve(true);
                }
              }
              resolve(false);
            } else {
              resolve(false);
            }
          }
        })
        .catch(err => resolve(false));
    })
  }

}






