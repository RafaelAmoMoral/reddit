import { Component, OnInit } from '@angular/core';
import { Post } from 'src/app/model/iPost';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { User } from 'src/app/model/iUser';
import { PostService } from 'src/app/services/post.service';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';

@Component({
  selector: 'app-post',
  templateUrl: './post.page.html',
  styleUrls: ['./post.page.scss'],
})
export class PostPage implements OnInit {

  private user: User;
  public post: Post;
  public coments: any[] = [];

  constructor(private route: ActivatedRoute, private authenticationService: AuthenticationService,
    private postService: PostService, private toast: ToastManagerModule) {
    this.user = this.authenticationService.getAuthenticatedUser();
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

  onPostLiked(postId: string) {
    if (this.user && this.user.id) {
      if (!this.userAlreadyLikesPost()) {
        if (!this.post.usersLikes) {  // Primero añado sin comprobar nada en la base de datos, para que visualmente no parezca un proceso lento
          this.post.usersLikes = [];
        }
        this.post.usersLikes.push(this.user.id);
        this.post.nLikes += 1;
        if (!this.user.likedPosts) {
          this.user.likedPosts = [];
        }
        this.user.likedPosts.push(postId);

        this.postService.onPostLiked(postId, this.user.id)
          .catch(err => {                     // Si falla elimino lo visualmente hecho
            this.post.usersLikes.pop();
            this.post.nLikes -= 1;
            this.user.likedPosts.pop();
            this.toast.show('Ocurrio un error')
          })
      } else {
        if (this.post.usersLikes) {
          this.post.usersLikes.splice(this.post.usersLikes.findIndex(userId => userId === this.user.id), 1);
        }
        if (this.user.likedPosts) {
          this.user.likedPosts.splice(this.user.likedPosts.findIndex(postLikedInUser => postLikedInUser === postId), 1);
        }
        this.post.nLikes -= 1;
        this.postService.onPostDisLiked(postId, this.user.id)
          .catch(err => {
            this.post.usersLikes.push(this.user.id);
            this.user.likedPosts.push(postId);
            this.post.nLikes += 1;
            this.toast.show('Ocurrio un error')
          })
      }
    } else {
      this.toast.show("¡Debes de estar registrado!")
    }
  }

  userAlreadyLikesPost(): boolean {
    let found: boolean = false;
    if (this.user && this.user.id) {
      if (this.post && this.post.usersLikes) {
        for (let i = 0; i < this.post.usersLikes.length && !found; i++) {
          if (this.post.usersLikes[i] === this.user.id) {
            found = true;
          }
        }
      }
    }
    return found;
  }



}
