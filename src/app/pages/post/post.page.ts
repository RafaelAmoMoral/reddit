import { Component, OnInit } from '@angular/core';
import { Post } from 'src/app/model/iPost';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { User } from 'src/app/model/iUser';
import { PostService } from 'src/app/services/post.service';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';

@Component({
  selector: 'app-post',
  templateUrl: './post.page.html',
  styleUrls: ['./post.page.scss'],
})
export class PostPage implements OnInit {

  private _user: User;
  public post: Post;
  public coments: any[] = [];

  constructor(private route: ActivatedRoute, private authenticationService: AuthenticationService,
    private postService: PostService, private toast: ToastManagerModule) {
    this._user = this.authenticationService.getAuthenticatedUser();
    this.route.queryParams.subscribe(params => {
      this.post = params['post'];
    });
    for (let i = 0; i < 14; i++) {
      let coment: any = {
        userName: 'u/khk868',
        content: 'Me encato este post!!'
      }
      this.coments.push(coment);
    }
  }

  ngOnInit() {
  }

  /**
   * Usado al hacer like en un post. 
   * En primer lugar renderiza el like del post, en segundo lugar hace una petición a la base de datos
   * para agregar dicho like. Si la petición fallase, el like sería desrenderizado.
   * @param postId Id del post al que se dio like.
   */
  onPostLiked(postId: string): void {
    if (this._user && this._user.id) {
      if (!this.userAlreadyLikesPost()) {
        if (!this.post.usersLikes) {  // Primero añado sin comprobar nada en la base de datos, para que visualmente no parezca un proceso lento
          this.post.usersLikes = [];
        }
        this.post.usersLikes.push(this._user.id);
        this.post.nLikes += 1;
        if (!this._user.likedPosts) {
          this._user.likedPosts = [];
        }
        this._user.likedPosts.push(postId);

        this.postService.onPostLiked(postId, this._user.id)
          .catch(err => {                     // Si falla elimino lo visualmente hecho
            this.post.usersLikes.pop();
            this.post.nLikes -= 1;
            this._user.likedPosts.pop();
            this.toast.show('Ocurrio un error')
          })
      } else {
        if (this.post.usersLikes) {
          this.post.usersLikes.splice(this.post.usersLikes.findIndex(userId => userId === this._user.id), 1);
        }
        if (this._user.likedPosts) {
          this._user.likedPosts.splice(this._user.likedPosts.findIndex(postLikedInUser => postLikedInUser === postId), 1);
        }
        this.post.nLikes -= 1;
        this.postService.onPostDisLiked(postId, this._user.id)
          .catch(err => {
            this.post.usersLikes.push(this._user.id);
            this._user.likedPosts.push(postId);
            this.post.nLikes += 1;
            this.toast.show('Ocurrio un error')
          })
      }
    } else {
      this.toast.show("¡Debes de estar registrado!")
    }
  }

  /**
   * Comprueba si en el array de los usuarios los cuáles le dieron a like a
   * el post, se encuentra el del usuario.
   */
  userAlreadyLikesPost(): boolean {
    let found: boolean = false;
    if (this._user && this._user.id) {
      if (this.post && this.post.usersLikes) {
        for (let i = 0; i < this.post.usersLikes.length && !found; i++) {
          if (this.post.usersLikes[i] === this._user.id) {
            found = true;
          }
        }
      }
    }
    return found;
  }

}
