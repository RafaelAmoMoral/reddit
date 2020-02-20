import { Injectable, Injector } from '@angular/core';
import { User } from '../model/iUser';
import { AngularFirestoreCollection, AngularFirestore, DocumentData } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
import { FireSQL } from 'firesql';
import { Post } from '../model/iPost';
import { MediaService } from './media.service';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { InternalStorageService } from './authentication/internal-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userCollection: AngularFirestoreCollection;

  constructor(private fireStore: AngularFirestore, private media: MediaService,
    private internalStorage: InternalStorageService) {
    this.userCollection = this.fireStore.collection('user');
  }

  /**
   * Método usado para añadir a un usuario a la coleeción user.
   * Este métood es llamado a posteriori de haberlo insertado en el oauth de
   * firebase. 
   * @param user Usuario, previamente añadido al oauth de firebase.
   */
  addUser(user: User, userId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.userCollection.doc(userId).set(user)
        .then(() => {
          resolve()
        }
        ).catch(error => {
          reject(error)
        })
    });
  }

  /**
   * Método llamado al hacer loguin en el oauth de firebase para así, poder 
   * obtener la colección del usuario que se logueo.
   */
  getUserByOauthKey(user: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.userCollection.doc(user.id).get().toPromise()
        .then(docData => {
          let data: DocumentData = docData.data();
          user.image = data.image;
          user.likedPosts = data.likedPosts;
          this.getUserImage(user.id)
            .then(url => {
              user.image = url;
              resolve();
            })
            .catch(err => {
              console.log(err);
              resolve();
            })
        })
        .catch(error => {
          reject(error);
        });
    })
  }

  /**
   * Obtenemos el token de la sesion actual del usuario.
   * @param userId id del usuario
   */
  getUserSessionKey(userId: string) {
    return new Promise<string>((resolve, reject) => {
      this.userCollection.doc(userId).get().toPromise()
        .then(docData => {
          let data: DocumentData = docData.data();
          resolve(data.idToken);
        })
        .catch(error => {
          reject(error);
        });
    })
  }

  setUserOauthToken(userId: string, userOauthToken: string) {
    return this.userCollection.doc(userId).set({
      idToken: userOauthToken
    },
      { merge: true }
    )
  }

  getUserImage(userId): Promise<string> {
    return this.media.firebaseStorage.ref('users/' + userId + '.jpeg')
      .getDownloadURL().toPromise();
  }

  /**
   * Métoto que recibe un string (imagen en base 64), y añade al usuario actual de la aplicacón.
   * @param image imagen a setear en el usuario de la aplicación.
   */
  setUserImage(image: string, appUser: User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.media.firebaseStorage.ref('users/' + appUser.id + ".jpeg").putString(image, 'base64', { contentType: 'image/jpeg' })
        .then(data => {
          data.ref.getDownloadURL()
            .then(url => {
              this.userCollection.doc(appUser.id).set({
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
                  console.log(err)
                  reject(err)
                })
            })
            .catch(err => {
              console.log(err)
              reject(err)
            })
        })
        .catch(err => { console.log(err) })
    })
  }

  getPosts(userApp: User): Promise<Post[]> {
    return new Promise<Post[]>((resolve, reject) => {
      if (userApp && userApp.likedPosts) {
        let fireSQL = new FireSQL(firebase.firestore());
        //__name__ se refiere al id del documento
        let query: string = "SELECT * FROM post WHERE userId = '" + userApp.id + "'";
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
        reject();
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
  getLikedPosts(userApp: User): Promise<Post[]> {
    if (userApp && userApp.likedPosts) {
      let fireSQL = new FireSQL(firebase.firestore());
      //__name__ se refiere al id del documento
      let query: string = "SELECT * FROM post WHERE __name__ IN ('";
      userApp.likedPosts.forEach(element => {
        query += element + "',";
      });
      query = query.slice(0, -1);//Elimino ,
      query += ')';
      return new Promise<Post[]>((resolve, reject) => {
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
          .catch(err => reject())
      })
    }
  }

}






