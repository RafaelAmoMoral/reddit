import { Injectable } from '@angular/core';
import { Post } from '../model/iPost';
import { environment } from 'src/environments/environment';
import * as firebase from 'firebase/app';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { MediaService } from './media.service';
import { UserService } from './user.service';
import { AuthenticationService } from './authentication.service';


@Injectable({
  providedIn: 'root'
})
export class PostService {

  private _collection: AngularFirestoreCollection;

  constructor(private fireStore: AngularFirestore, private _mediaService: MediaService,
    private userService: UserService, private authenticationService: AuthenticationService) {
    this._collection = fireStore.collection<any>(environment.postCollection);
  }

  public get collection(): AngularFirestoreCollection {
    return this._collection;
  }

  getPosts(field?: string): Promise<Post[]> {
    return new Promise((resolve, reject) => {
      this.collection.ref.orderBy(field ? field : 'nLikes', 'desc')
        .get()
        .then(list => {
          let posts: Post[] = [];
          list.docs.forEach((post: firebase.firestore.QueryDocumentSnapshot) => {
            let data: firebase.firestore.DocumentData = post.data();
            let p: Post = {
              id: post.id,
              title: data.title,
              content: data.content,
              video: data.video,
              image: data.image,
              nLikes: data.nLikes,
              usersLikes: data.usersLikes,
              date: data.date.toDate(),
              userId: data.userId,
              userName: data.userName
            }
            posts.push(p);
          });
          resolve(posts);
        })
        .catch(err => {
          reject(err);
        })
    })
  }

  /**
   * Obtiene los posts de la base de datos por un título indicado.
   * @param title Título del post a buscar.
   */
  getPostsByTitle(title: string) {
    return new Promise((resolve, reject) => {
      this.collection.ref.orderBy('title').startAt(title).endAt(title + "\uf8ff")
        .get()
        .then(list => {
          let posts: Post[] = [];
          list.docs.forEach((post: firebase.firestore.QueryDocumentSnapshot) => {
            let data: firebase.firestore.DocumentData = post.data();
            let p: Post = {
              id: post.id,
              title: data.title,
              content: data.content,
              video: data.video,
              image: data.image,
              nLikes: data.nLikes,
              usersLikes: data.usersLikes,
              date: data.date.toDate(),
              userId: data.userId,
              userName: data.userName
            }
            posts.push(p);
          });
          resolve(posts);
        })
        .catch(err => {
          reject(err);
        })
    })
  }

  /**
   * Método usado para añadir a la colección de posts uno nuevo.
   * Una vez añadido, si posee imágenes o vídeos se guardan en 
   * firebase storage. Además, añade el post creado al usuario actual de
   * la aplicación y lo modifica tanto en firebase como localmente.
   * @param post Post a añadir.
   */
  addPost(post: Post, base64Image:string, base64Video:string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.collection.add(post)
        .then(async (noteReference) => {
          post.id = noteReference.id;
          if (base64Image) {
            try {
              post.image = await this.saveImage(base64Image, noteReference.id);
            } catch (err) {
              reject(err);
            }
          } else if (base64Video) {
            try {
              post.video = await this.saveVideo(base64Video, noteReference.id);
            } catch (err) {
              reject(err);
            }
          }

          let userApp = this.authenticationService.getAuthenticatedUser();
          if (userApp) {
            if (!userApp.userPosts) {
              userApp.userPosts = [];
            }
            userApp.userPosts.push(noteReference.id);
          }
          try {
            this.userService.updateUser(userApp);
          } catch (err) {
            reject(err);
          }
          resolve();
        })
        .catch(error => reject(error))
    });
  }

  /**
   * DEBERIA DE SER UNA TRANSACCION PERO STORAGE NO LAS IMPLEMENTA, HACER A MANO.
   * @param video Vídeo en formato base64.
   * @param postId Identificador del post al que pertenece la imágen.
   */
  saveVideo(video: string, postId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this._mediaService.firebaseStorage.ref('posts/videos/' + postId + ".mp4").putString(video, 'base64', { contentType: 'video/mp4' })
        .then(data => {
          data.ref.getDownloadURL()
            .then(url => {
              this._collection.doc(postId).set({
                video: url
              },
                { merge: true }
              )
                .then(() => {
                  resolve(url)
                })
                .catch(err => {
                  reject(err)
                })
            })
            .catch(err => {
              reject(err)
            })
        })
        .catch(err => {
          reject(err);
        })
    })
  }

  /**
   * DEBERIA DE SER UNA TRANSACCION PERO STORAGE NO LAS IMPLEMENTA, HACER A MANO.
   * @param image Imagen en formato base64
   * @param postId Identificador del post al que pertenece el vídeo.
   */
  saveImage(image: string, postId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this._mediaService.firebaseStorage.ref('posts/images/' + postId + ".jpeg").putString(image, 'base64', { contentType: 'image/jpeg' })
        .then(data => {
          data.ref.getDownloadURL()
            .then(url => {
              this._collection.doc(postId).set({
                image: url
              },
                { merge: true }
              )
                .then(() => {
                  resolve(url)
                })
                .catch(err => {
                  reject(err)
                })
            })
            .catch(err => {
              reject(err)
            })
        })
        .catch(err => {
          reject();
        })
    })
  }

  /**
   * Método usado para guardar dentro de la coleccion del usuario la url del video,
   * que anteriormente se guardo en firebase storage y devolvio como resultado la misma.
   * @param postId identificador del post.
   * @param videoURL url del video.
   */
  setPostVideo(postId: string, videoURL: string) {
    return this._collection.doc(postId).set({
      video: videoURL
    },
      { merge: true }
    )
  }

  deletePost(id: string): Promise<void> {
    return this.collection.doc(id).delete();
  }

  /**
   * Comprueba si el usuario se encuentra en el array de usuarios a los que le
   * gustaron el post.
   * @param postId Identificador del post gustado.
   * @param userId Identicador del usuario.
   */
  userLikesPost(postId: string, userId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.collection.doc(postId).get().toPromise()
        .then(docData => {
          let data = docData.data();
          let userLikes: string[] = data.usersLikes;
          if (userLikes) {
            for (let i = 0; i < userLikes.length; i++) {
              if (userLikes[i] === userId) {
                resolve(true);
              }
            }
            resolve(false);
          } else {
            resolve(false);
          }
        })
        .catch(err => resolve(false));
    })
  }

  /**
   * Crea una lectura simultánea a la base de datos, añade un like al numero de likes
   *  del post, inserta en el array de usuarios en la colección de post el usuario e
   *  inserta en el array de posts a los que el usuario le dio a me gusta el post gustado.
   * @param postId Identificador del post gustado.
   * @param userId Identicador del usuario.
   */
  onPostLiked(postId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.all([this.userLikesPost(postId, userId), this.userService.isPostLiked(userId, postId)])
        .then((data: [boolean, boolean]) => {
          if (data.every(match => !match)) {
            let batch = firebase.firestore().batch();
            batch.set(this.collection.doc(postId).ref, { usersLikes: firebase.firestore.FieldValue.arrayUnion(userId) }, { merge: true });
            batch.set(this.collection.doc(postId).ref, { nLikes: firebase.firestore.FieldValue.increment(1) }, { merge: true })
            batch.set(this.fireStore.collection('user').doc(userId).ref, { likedPosts: firebase.firestore.FieldValue.arrayUnion(postId) }, { merge: true });
            batch.commit()
              .then(() => resolve())
              .catch(err => reject(err))
          } else {
            reject();
          }
        })
    })

  }

  /**
   * Crea una lectura simultánea a la base de datos, elimina un like al numero de likes
   *  del post, elimina en el array de usuarios en la colección de post el usuario y
   *  elimina en el array de posts a los que el usuario le dio a me gusta el post gustado.
   * @param postId Identificador del post gustado.
   * @param userId Identicador del usuario.
   */
  onPostDisLiked(postId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.all([this.userLikesPost(postId, userId), this.userService.isPostLiked(userId, postId)])
        .then((data: [boolean, boolean]) => {
          if (data.every(match => match)) {
            let batch = firebase.firestore().batch();
            batch.set(this.collection.doc(postId).ref, { usersLikes: firebase.firestore.FieldValue.arrayRemove(userId) }, { merge: true });
            batch.set(this.collection.doc(postId).ref, { nLikes: firebase.firestore.FieldValue.increment(-1) }, { merge: true })
            batch.set(this.fireStore.collection('user').doc(userId).ref, { likedPosts: firebase.firestore.FieldValue.arrayRemove(postId) }, { merge: true });
            batch.commit()
              .then(() => resolve())
              .catch(err => reject(err))
          } else {
            reject();
          }
        })
        .catch(err => reject(err));
    })
  }

}
