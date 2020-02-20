import { Injectable } from '@angular/core';
import { Post } from '../model/iPost';
import { environment } from 'src/environments/environment';
//Diferencias entre ambas 
import * as firebase from 'firebase/app'; //https://stackoverflow.com/a/41619533
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { MediaService } from './media.service';
import { AngularFireUploadTask } from 'angularfire2/storage';


@Injectable({
  providedIn: 'root'
})
export class PostService {

  private _collection: AngularFirestoreCollection;

  constructor(private fireStore: AngularFirestore, private _mediaService: MediaService) {
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

  addPost(post: Post): Promise<string> {
    return new Promise((resolve, reject) => {
      this.collection.add(post).then(
        noteReference => resolve(noteReference.id),
        error => reject(error)
      ).catch(error => reject(error))
    });
  }

  /**
   * 
   * @param postId DEBERIA DE SER UNA TRANSACCION
   * @param video 
   */
  saveVideo(video: string, postId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
                  resolve()
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
        .catch(err => {
          console.log(err)
          reject();
        })
    })
  }

  saveImage(image: string, postId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
                  resolve()
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
        .catch(err => {
          console.log(err)
          reject();
        })
    })
  }


  /**
   * Métoto usado para guardar dentro de la coleccion del usuario la url del video,
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

  onPostLiked(post: string, user: string): Promise<void> {
    //La idea es esta pero he de mirar las transacciones de firebase. Además, compruebo solo un lado de la relación.
    return new Promise((resolve, reject) => {
      this.collection.doc(post).get().toPromise()
        .then(docData => {
          let data = docData.data();
          let userLikes: string[] = data.userLikes;
          let found: boolean = false;
          if (userLikes) {
            for (let i = 0; i < userLikes.length && !found; i++) {
              if (userLikes[i] === user) {
                found = true;
              }
            }
          }
          if (!found) {
            let batch = firebase.firestore().batch();
            batch.set(this.collection.doc(post).ref, { usersLikes: firebase.firestore.FieldValue.arrayUnion(user) }, { merge: true });
            batch.set(this.collection.doc(post).ref, { nLikes: firebase.firestore.FieldValue.increment(1) }, { merge: true })
            batch.set(this.fireStore.collection('user').doc(user).ref, { likedPosts: firebase.firestore.FieldValue.arrayUnion(post) }, { merge: true });
            batch.commit()
              .then(() => resolve())
              .catch(err => reject(err))
          } else {
            reject();
          }

        })
        .catch(error => reject());
    })

  }

  onPostDisLiked(post: string, user: string): Promise<void> {
    //La idea es esta pero he de mirar las transacciones de firebase. Además, compruebo solo un lado de la relación.
    return new Promise((resolve, reject) => {
      this.collection.doc(post).get().toPromise()
        .then(docData => {
          let data = docData.data();
          let usersLikes: string[] = data.usersLikes;
          let found: boolean = false;
          if (usersLikes) {
            for (let i = 0; i < usersLikes.length && !found; i++) {
              if (usersLikes[i] === user) {
                found = true;
              }
            }
          }
          if (found) {
            let batch = firebase.firestore().batch();
            batch.set(this.collection.doc(post).ref, { usersLikes: firebase.firestore.FieldValue.arrayRemove(user) }, { merge: true });
            batch.set(this.collection.doc(post).ref, { nLikes: firebase.firestore.FieldValue.increment(-1) }, { merge: true })
            batch.set(this.fireStore.collection('user').doc(user).ref, { likedPosts: firebase.firestore.FieldValue.arrayRemove(post) }, { merge: true });
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
