import { Component, OnInit } from '@angular/core';
import { PostService } from 'src/app/services/post.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Post } from 'src/app/model/iPost';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NavController } from '@ionic/angular';
import { LoadingManagerModule } from 'src/app/modules/loading-manager/loading-manager.module';
import { ToastManagerModule } from 'src/app/modules/toast-manager/toast-manager.module';
import { MediaService } from 'src/app/services/media.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PictureSourceType } from '@ionic-native/camera/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.page.html',
  styleUrls: ['./add-post.page.scss'],
})
export class AddPostPage implements OnInit {

  public form: FormGroup;
  public image: SafeResourceUrl;
  private _base64Image;
  public video: any;
  private _base64Video: any;

  constructor(private postService: PostService, private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService, private loading: LoadingManagerModule,
    private nav: NavController, private toast: ToastManagerModule, private media: MediaService,
    private sanitizer: DomSanitizer) {

  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    })
  }

  /**
   * Obtiene los valores del formulario, y si el usuario está autenticado,
   * añade id y nombre del usuario al post.
   * Posteriormente crea un usuario con esos valores.
   */
  getUserFromPostValues(): Post {
    let post: Post;
    let authenticatedUser = this.authenticationService.getAuthenticatedUser();
    if (authenticatedUser) {
      post = {
        title: this.form.get('title').value,
        content: this.form.get('content').value,
        date: new Date(),
        nLikes: 0,
        userId: authenticatedUser.id,
        userName: authenticatedUser.name,
      }
    }
    return post;
  }

  /**
   * Añade un post a la base de datos.
   */
  async addPost(): Promise<void> {
    await this.loading.presentLoading('Subiendo...');
    let post: Post = this.getUserFromPostValues();
    if (post) {
      this.postService.addPost(post, this._base64Image, this._base64Video)
        .then(postId => {
          this.loading.hide();
          this.nav.navigateBack('/user')
            .then(() => { this.toast.show('¡Post subido con éxito!') })
        })
        .catch(err => {
          this.loading.hide()
        })
    } else {
      this.loading.hide();
      this.toast.show('¡Ocurrio un error!');
      try {
        await this.nav.back();
      } catch (err) {
        this.toast.show(err)
      }
    }
  }

  /**
   * Obtiene una imágen de la galería, una vez obtenido el base64 de la imágen, crea
   * una url válida para mostrar la imágen.
   * Elimina el vídeo (si la había posteriormente).
   */
  getImageFromGallery(): void {
    this.media.getDeviceImage(PictureSourceType.PHOTOLIBRARY)
      .then(async (base64Image) => {
        if (base64Image) {
          let url: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base64Image && 'data:image/jpeg;base64,' + base64Image);
          try {
            this._base64Image = base64Image;
            url = await this.media.resizeImage('data:image/jpeg;base64,' + base64Image, 100, 100, 10);
            this.image = url;
            this.video = null;
            this._base64Video = null;
          } catch (err) {
            this.toast.show(err);
          }
        }
      })
      .catch(err => {
        this.toast.show(err);
      })
  }

  /**
   * Obtiene un vídeo de la cámara.
   * Elimina la imágen (si la había posteriormente).
   */
  getVideo() {
    this.media.getVideo()
      .then(base64video => {
        if (base64video) {
          this._base64Video = base64video;
          this.video = 'data:video/mp4;base64,' + base64video;
          this.image = null;
          this._base64Image = null;
        }
      })
      .catch(err => this.toast.show(err))
  }

  /**
   * Obtiene una imágen de la cámara, una vez obtenido el base64 de la imágen, crea
   * una url válida para mostrar la imágen.
   * Elimina el vídeo (si la había posteriormente).
   */
  getImage() {
    this.media.getDeviceImage(PictureSourceType.CAMERA)
      .then(base64Image => {
        if (base64Image) {
          this._base64Image = base64Image;
          this.image = this.sanitizer.bypassSecurityTrustResourceUrl(base64Image && 'data:image/jpeg;base64,' + base64Image);
          this.video = null;
          this._base64Video = null;
        }
      })
      .catch(err => this.toast.show(err))
  }

}
