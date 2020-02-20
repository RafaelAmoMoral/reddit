import { Component, OnInit } from '@angular/core';
import { PopoverManagerModule } from 'src/app/modules/popover-manager/popover-manager.module';
import { HomeUserPopoverComponent } from 'src/app/components/popovers/home-user-popover/home-user-popover.component';
import { HomeListFilterPopoverComponent } from 'src/app/components/popovers/home-list-filter/home-list-filter-popover.component';
import { Post } from 'src/app/model/iPost';
import { PostService } from 'src/app/services/post.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { HomeLoginPopoverComponent } from 'src/app/components/popovers/home-login-popover/home-login-popover.component';
import { NavController } from '@ionic/angular';
import { User } from 'src/app/model/iUser';
import { NavigationExtras } from '@angular/router';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  public posts: Post[];
  private _user: User;
  public filterType: string;

  constructor(private popover: PopoverManagerModule, private postService: PostService,
    private authenticationService: AuthenticationService, private nav: NavController,
    private toast: ToastManagerModule, private loading: LoadingManagerModule) {
    this.posts = [];
    this.filterType = "nLikes";
  }

  ngOnInit() {
  }

  ionViewDidEnter() {//LO NECESITO PARA CUANDO VENGO DE HACER LOGIN O OBSERVABLE
    let user = this.authenticationService.getAuthenticatedUser();
    if (user !== this._user) {
      this._user = user;
      this.getPosts();
    }
  }

  async getPosts($event?: any) {
    await this.loading.presentLoading();
    this.postService.getPosts(this.filterType)
      .then((data: Post[]) => {
        this.posts = data;
        this.loading.hide();
        if ($event) {
          $event.target.complete();
        }
      })
      .catch(err => {
        this.loading.hide();
        this.toast.show(err);
        if ($event) {
          $event.target.complete();
        }
      });
  }

  async presentUserOptions($event: any) {
    if (this.authenticationService.isLogged()) {
      await this.popover.presentPopover($event, HomeUserPopoverComponent);
      this.popover.onDismiss().then(data => {
        if (data) {
          this.loading.presentLoading();
          this.authenticationService.logOut()
            .then(isLoguedOut => {
              if (isLoguedOut) {
                this._user = this.authenticationService.getAuthenticatedUser();
                this.postService.getPosts(this.filterType)
                  .then((data: Post[]) => {
                    this.posts = data;
                    this.loading.hide();
                  })
                  .catch(err => {
                    this.toast.show(err);
                    this.loading.hide();
                  });
              } else {
                this.toast.show('Intentelo más tarde');
                this.loading.hide();
              }
            })
            .catch(err => {
              this.toast.show('Intentelo más tarde');
              this.loading.hide();
            })
        }
      })
    } else {
      await this.popover.presentPopover($event, HomeLoginPopoverComponent);
    }
  }

  /**
   * Método usado al clicar en el botón del filtro en HTML.
   * Este método es encargado de presentar el popover del filtro y de esperar,
   * (si la hay) una respuesta.
   * Dicha respuesta será el nombre del nuevo filtro que será aplicado a los posts
   * de la aplicación.
   * @param $event Evento necesario para que el popover aparezca en el elemento clicado.
   */
  async presentFilterOptions($event: any) {
    await this.popover.presentPopover($event, HomeListFilterPopoverComponent);
    this.popover.onDismiss().then((data) => {
      if (data) {
        this.filterType = data;
        this.getPosts();
      }
    })
  }

  redirectToPost(post: Post) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        post: post
      }
    };
    this.nav.navigateForward('/post', navigationExtras)
      .then(() => { })
      .catch(err => this.toast.show(err))
  }

  onPostLiked(postId: string, index: number) {
    if (this._user && this._user.id) {
      if (!this.userAlreadyLikesPost(index)) {
        if (!this.posts[index].usersLikes) {  // Primero añado sin comprobar nada en la base de datos, para que visualmente no parezca un proceso lento
          this.posts[index].usersLikes = [];
        }
        this.posts[index].usersLikes.push(this._user.id);
        this.posts[index].nLikes += 1;
        if (!this._user.likedPosts) {
          this._user.likedPosts = [];
        }
        this._user.likedPosts.push(postId);

        this.postService.onPostLiked(postId, this._user.id)
          .catch(err => {                     // Si falla elimino lo visualmente hecho
            this.posts[index].usersLikes.pop();
            this.posts[index].nLikes -= 1;
            this._user.likedPosts.pop();
            this.toast.show('Ocurrio un error')
          })
      } else {
        if (this.posts[index].usersLikes) {
          this.posts[index].usersLikes.splice(this.posts[index].usersLikes.findIndex(userId => userId === this._user.id), 1);
        }
        if (this._user.likedPosts) {
          this._user.likedPosts.splice(this._user.likedPosts.findIndex(postLikedInUser => postLikedInUser === postId), 1);
        }
        this.posts[index].nLikes -= 1;
        this.postService.onPostDisLiked(postId, this._user.id)
          .catch(err => {
            this.posts[index].usersLikes.push(this._user.id);
            this._user.likedPosts.push(postId);
            this.posts[index].nLikes += 1;
            this.toast.show('Ocurrio un error')
          })
      }
    } else {
      this.toast.show("¡Debes de estar registrado!")
    }
  }

  userAlreadyLikesPost(postIndex: number): boolean {
    let found: boolean = false;
    if (this._user && this._user.id) {
      let post: Post = this.posts[postIndex];
      if (post && post.usersLikes) {
        for (let i = 0; i < post.usersLikes.length && !found; i++) {
          if (post.usersLikes[i] === this._user.id) {
            found = true;
          }
        }
      }
    }
    return found;
  }

}
