import { Component, OnInit, ViewChild } from '@angular/core';
import { PostService } from 'src/app/services/post.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Post } from 'src/app/model/iPost';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
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
    private sanitizer: DomSanitizer, private platform:Platform) {
      this.platform.platforms().forEach(element => {
        console.log(element)
      });
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    })
  }

  getPostValues(): Post {
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

  async addPost() {
    await this.loading.presentLoading('Subiendo...');
    let post: Post = this.getPostValues();
    if (post) {
      this.postService.addPost(post)
        .then(async (postId) => {
          if (this.image) {
            try {
              await this.postService.saveImage(this._base64Image, postId);
            } catch (err) {
              this.toast.show(err);
            }
          } else if (this.video) {
            try {
              await this.postService.saveVideo(this._base64Video, postId)
            } catch (err) {
              this.toast.show(err);
            }
          }

          this.loading.hide();
          this.nav.navigateBack('/user')
            .then(() => { this.toast.show('¡Post subido con éxito!') })
        })
        .catch(err => this.loading.hide())
    } else {
      this.loading.hide();
      this.toast.show('¡Ocurrio un error!');
      try {
        await this.nav.back();
      } catch (err) { }
    }
  }

  getVideoFromGallery() {
    this.media.getVideoFromGallery()
      .then(data => {
        if (data) {
          this.video = data;
          this.image = null;
        }
      })
      .catch(err => {
        this.toast.show(err);
      })
  }

  getImageFromGallery() {
    this.media.getDeviceImage(PictureSourceType.PHOTOLIBRARY)
      .then(async (base64Image) => {
        if (base64Image) {
          let url: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base64Image && 'data:image/jpeg;base64,' + base64Image);
          try {
            this._base64Image = base64Image;
            url = await this.media.generateImage('data:image/jpeg;base64,' + base64Image, 100, 100, 10);
            this.image = url;
            this.video = null;
          } catch (err) {
            this.toast.show(err);
          }
        }
      })
      .catch(err => {
        this.toast.show(err);
      })
  }

  getVideo() {
    console.log('sacar un video')
    this.media.getVideo()
      .then(base64video => {
        if (base64video) {
          this._base64Video = base64video;
          this.video = 'data:video/mp4;base64,' + base64video;
          this.image = null;
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  getImage() {
    this.media.getDeviceImage(PictureSourceType.CAMERA)
      .then(base64Image => {
        if (base64Image) {
          this._base64Image = base64Image;
          this.image = this.sanitizer.bypassSecurityTrustResourceUrl(base64Image && 'data:image/jpeg;base64,' + base64Image);
          this.video = null;
        }
      })
      .catch(err => { this.toast.show(err) })
  }

}
