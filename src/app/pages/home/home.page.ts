import { Component, OnInit } from '@angular/core';
import { PopoverManagerModule } from 'src/app/modules/popover-manager/popover-manager.module';
import { HomeUserPopoverComponent } from 'src/app/components/popovers/home-user-popover/home-user-popover.component';
import { HomeListFilterPopoverComponent } from 'src/app/components/popovers/home-list-filter/home-list-filter-popover.component';
import { Post } from 'src/app/model/iPost';
import { PostService } from 'src/app/services/post.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
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
  private _checked: boolean;
  public searchActivated: boolean;

  constructor(private popover: PopoverManagerModule, private postService: PostService,
    public authenticationService: AuthenticationService, private nav: NavController,
    private toast: ToastManagerModule, private loading: LoadingManagerModule) {
    this.posts = [];
    this.searchActivated = false;
    this.filterType = "Popular";
    this._user = this.authenticationService.getAuthenticatedUser();;
    this.getPosts();
    this._checked = true;
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    if (!this._checked) {
      let user = this.authenticationService.getAuthenticatedUser();
      if (user !== this._user) {
        this._user = user;
        this.getPosts();
      }
    } else {
      this._checked = false;
    }
  }

  /**
   * Obtiene los usuarios de la base de datos.
   * @param $event Evento producido al refrescar el ion-list
   */
  async getPosts($event?: any) {
    await this.loading.presentLoading();
    this.postService.getPosts(this.filterType === 'Popular' ? 'nLikes' : 'date')
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

  /**
   * Obtiene los usuarios de la base de datos por un título en concreto.
   * @param $event Evento producido al refrescar el ion-list.
   */
  async getPostsByTitle(value: string) {
    await this.loading.presentLoading();
    this.postService.getPostsByTitle(value)
      .then((data: Post[]) => {
        this.posts = data;
        this.loading.hide();
      })
      .catch(err => {
        this.loading.hide();
        this.toast.show(err);
      });
  }


  /**
   * Puede presentar dos tipos de popover, el de resgistro,
   * si el usuario no existe o el del usuario si existe.
   * @param $event Evento producido al clicar sobre el popover.
   */
  async presentUserOptions($event: any) {
    if (this._user) {
      await this.popover.presentPopover($event, HomeUserPopoverComponent);
      this.popover.onDismiss().then(data => {
        if (data !== undefined) {
          if (data) {
            this.loading.presentLoading();
            this.authenticationService.logOut()
              .then(isLoguedOut => {
                if (isLoguedOut) {
                  this._user = this.authenticationService.getAuthenticatedUser();
                  this.postService.getPosts(this.filterType === 'Popular' ? 'nLikes' : 'date')
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
          } else {
            let navigationExtras: NavigationExtras = {
              queryParams: {
                user: this._user
              }
            };
            this.nav.navigateForward('user', navigationExtras);
          }
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

  presentSearchBar(present: boolean) {
    this.searchActivated = present;
  }

  /**
   * Redirige al usuario a la página del post clicado.
   * @param post Post a visualizar.
   */
  redirectToPost(post: Post) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        post: post
      },
      queryParamsHandling: "preserve",
    };
    this.nav.navigateForward('/post', navigationExtras)
      .then(() => { })
      .catch(err => this.toast.show(err))
  }

  /**
   * Redirige al usuario a la página del usuario clicado.
   * @param user Usuario a visualizar.
   */
  redirectToUser(user: User) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        user: user
      }
    };
    this.nav.navigateForward('/user', navigationExtras)
      .then(() => { })
      .catch(err => this.toast.show(err))
  }

  /**
   * Usado al hacer like en un post. 
   * En primer lugar renderiza el like del post, en segundo lugar hace una petición a la base de datos
   * para agregar dicho like. Si la petición fallase, el like sería desrenderizado.
   * @param postId Id del post al que se dio like.
   * @param index índice del post al que se le dio like.
   */
  onPostLiked(postId: string, index: number) {
    if (this._user && this._user.id) {
      if (!this.userAlreadyLikesPost(index)) {
        if (!this.posts[index].usersLikes) {  
          this.posts[index].usersLikes = [];
        }
        this.posts[index].usersLikes.push(this._user.id); // Primero añado sin comprobar nada en la base de datos, para que visualmente no parezca un proceso lento
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

  /**
   * Comprueba si en el array de los usuarios los cuáles le dieron a like a
   * el post, se encuentra el del usuario.
   * @param postIndex Índice del post gustado.
   */
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
