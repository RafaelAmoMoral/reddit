import { Injectable } from '@angular/core';
import { Camera as CameraCV, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { AngularFireStorage } from 'angularfire2/storage';
import { MediaCapture, CaptureVideoOptions, MediaFile } from '@ionic-native/media-capture/ngx';
import { VideoEditor, CreateThumbnailOptions } from '@ionic-native/video-editor/ngx';
import { File } from '@ionic-native/file/ngx';


@Injectable({
  providedIn: 'root'
})
export class MediaService {

  constructor(private camera: CameraCV, private _firebaseStorage: AngularFireStorage,
    private media: MediaCapture, private file: File, private videoEditor: VideoEditor) { }

  get firebaseStorage() {
    return this._firebaseStorage;
  }

  /**
   * Toma una imagen del dispositivo pudiendo ser via galería o capturando una imagen con la cámara.
   * @param option PictureSourceType(Camera|PhotoLibrary)
   */
  async getDeviceImage(option: PictureSourceType): Promise<any> {
    let image = await this.camera.getPicture({
      quality: 10,
      sourceType: option,
      destinationType: this.camera.DestinationType.DATA_URL,
      mediaType: this.camera.MediaType.PICTURE,
    });

    return image;
  }

  generateImage(img: string, MAX_WIDTH: number,
    MAX_HEIGHT: number, quality: number = 90) {
    return new Promise<string>((resolve, reject) => {
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      const image: HTMLImageElement = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = img;
      image.onload = () => {
        let width = image.width;
        let height = image.height;
        if (!MAX_HEIGHT) {
          MAX_HEIGHT = image.height;
        }
        if (!MAX_WIDTH) {
          MAX_WIDTH = image.width;
        }
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const dataUrl: string = canvas
          .toDataURL('image/jpeg', quality)
        resolve(dataUrl);
      };
      image.onerror = e => {
        console.log(6)
        console.log(e);
        reject(e);
      };
    });
  }

  getImageFromBase64(base64: string) {
    return 'data:image/jpeg;base64,' + base64;
  }

  async getVideoFromGallery(): Promise<any> {
    const options: CameraOptions = {
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      destinationType: this.camera.DestinationType.DATA_URL,
      mediaType: this.camera.MediaType.VIDEO,
    }
    let x = await this.camera.getPicture(options);

    let filename = x.replace(/^.*[\\\/]/, '');
    console.log('/storage/emulated/0/DCIM/Camera/' + filename);
    this.file.resolveDirectoryUrl('/storage/emulated/0/DCIM/Camera').then(imageBase64 => {
      console.log(imageBase64)
      return imageBase64;
    })
      .catch(err => { console.log(err) })


  }

  getVideo(): Promise<any> {
    let options: CaptureVideoOptions = {
      duration: 1,
      quality: 10,
    }

    return this.media.captureVideo(options)
      .then((data: MediaFile[]) => {
        var option: CreateThumbnailOptions = {
          fileUri: 'file:///storage/emulated/0/DCIM/Camera/' + data[0].name, width: 160, height: 206, atTime: 1, outputFileName: 'thumbnail_' + data[0].name, quality: 50
        };
        return this.videoEditor.createThumbnail(option)
          .then(result => {
            console.log(result)
            ///storage/emulated/0/Android/data/io.ionic.starter/files/files/videos/
            return this.convertVideoToBase64(data[0].fullPath);
          })
          .catch(e => {
            console.log(e)
            // alert('fail video editor');
          });
      })
      .catch(err => {
        console.log(err)
      })
  }

  async convertVideoToBase64(video) {
    return new Promise(async (resolve) => {
      let res: any = await this.file.resolveLocalFilesystemUrl(video);
      res.file((resFile) => {
        let reader = new FileReader();
        reader.readAsDataURL(resFile);
        reader.onloadend = async (evt: any) => {
          /*
           * File reader provides us with an incorrectly encoded base64 string.
           * So we have to fix it, in order to upload it correctly.
           */
          let OriginalBase64 = evt.target.result.split(',')[1]; // Remove the "data:video..." string.
          let decodedBase64 = atob(OriginalBase64); // Decode the incorrectly encoded base64 string.
          let encodedBase64 = btoa(decodedBase64); // re-encode the base64 string (correctly).
          resolve(encodedBase64);
        }
      });
    });
  }



}




