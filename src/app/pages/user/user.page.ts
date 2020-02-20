import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/model/iUser';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { PostService } from 'src/app/services/post.service';
import { Post } from 'src/app/model/iPost';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { MediaService } from 'src/app/services/media.service';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavController } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';
import { PictureSourceType } from '@ionic-native/camera/ngx';


@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {

  public user: User;
  public userImage: SafeResourceUrl = 'https://gravatar.com/avatar/dba6bae8c566f9d4041fb9cd9ada7741?d=identicon&f=y';
  public userPosts: Post[];

  constructor(private authentication: AuthenticationService, private postService: PostService,
    private loading: LoadingManagerModule, private media: MediaService, private nav: NavController,
    private userService: UserService, private sanitizer: DomSanitizer, private toast: ToastManagerModule) {
    this.setPage();
  }

  ngOnInit() {
  }


  /**
   * Método usado al arrastrar la lista hacia abajo. Es el encargado
   * obtener las notas para refrescar la lista.
   * @param $event Evento producido al refrescar el usuario la lista
   * arrastrando el dedo hacia abajo.
   */
  doRefresh($event) {
    this.userService.getPosts(this.user).then(
      (data: Post[]) => {
        this.userPosts = data;
        $event.target.complete();
      })
      .catch(error => {
        $event.target.complete();
      });
  }

  setPage() {
    this.user = this.authentication.getAuthenticatedUser();
    this.userService.getPosts(this.user).then(
      (data: Post[]) => {
        this.userPosts = data;
      })
      .catch(error => {
        console.log(error)
      });
  }

  openCamera() {
    this.media.getDeviceImage(PictureSourceType.CAMERA)
      .then((img) => {
        this.userService.setUserImage(img, this.user)
          .then(() => {
            this.userImage = this.sanitizer.bypassSecurityTrustResourceUrl(img && 'data:image/jpeg;base64,' + img);
            this.toast.show('Foto actualizada');
          })
          .catch((err) => { this.toast.show('La foto no se pudo actualizar') })
      })
      .catch((err) => {
        console.log(err)
      })

  }

  redirectToPost(post: Post) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        post: post
      }
    };
    this.nav.navigateForward('/post', navigationExtras);
  }

  /**
   * Método usado cuando un usuario le da 'me gusta' a un post, 
   * en primer lugar, gráficamente el like se renderiza dando una sensación de
   * instantaneidad, aunque durante ese renderizado la operación en la base de
   * datos esta siendo realizada. Si esta operación falla, el renderizado se deshace.
   * @param postId id con del post gustado.
   * @param index indice del post gustado.
   */
  onPostLiked(postId: string, index: number) {
    if (this.user && this.user.id) {
      if (!this.userAlreadyLikesPost(index)) {
        if (!this.userPosts[index].usersLikes) {
          this.userPosts[index].usersLikes = [];
        }
        this.userPosts[index].usersLikes.push(this.user.id);
        this.userPosts[index].nLikes += 1;
        if (!this.user.likedPosts) {
          this.user.likedPosts = [];
        }
        this.user.likedPosts.push(postId);

        this.postService.onPostLiked(postId, this.user.id)
          .catch(err => {
            this.userPosts[index].usersLikes.pop();
            this.userPosts[index].nLikes -= 1;
            this.user.likedPosts.pop();
            this.toast.show('Ocurrio un error')
          })
      } else {
        if (this.userPosts[index].usersLikes) {
          this.userPosts[index].usersLikes.splice(this.userPosts[index].usersLikes.findIndex(userId => userId === this.user.id), 1);
        }
        if (this.user.likedPosts) {
          this.user.likedPosts.splice(this.user.likedPosts.findIndex(postLikedInUser => postLikedInUser === postId), 1);
        }
        this.userPosts[index].nLikes -= 1;
        this.postService.onPostDisLiked(postId, this.user.id)
          .catch(err => {
            this.userPosts[index].usersLikes.push(this.user.id);
            this.user.likedPosts.push(postId);
            this.userPosts[index].nLikes += 1;
            this.toast.show('Ocurrio un error')
          })
      }
    } else {
      this.toast.show("¡Debes de estar registrado!")
    }
  }

  /**
   * Método llamado desde el HTML.
   * Comprueba si el usuario de la App le dio 'me gusta'
   * al un post en especifico.
   * @param postIndex index del post a comparar.
   */
  userAlreadyLikesPost(postIndex: number): boolean {
    let found: boolean = false;
    if (this.user && this.user.id) {
      let post: Post = this.userPosts[postIndex];
      if (post && post.usersLikes) {
        for (let i = 0; i < post.usersLikes.length && !found; i++) {
          if (post.usersLikes[i] === this.user.id) {
            found = true;
          }
        }
      }
    }
    return found;
  }

}
