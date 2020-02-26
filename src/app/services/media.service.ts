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
    if (option === PictureSourceType.CAMERA || option === PictureSourceType.PHOTOLIBRARY) {
      try {
        let image = await this.camera.getPicture({
          quality: 10,
          sourceType: option,
          destinationType: this.camera.DestinationType.DATA_URL,
          mediaType: this.camera.MediaType.PICTURE,
        });
        return image;
      } catch (err) {
        throw err;
      }
    } else {
      return;
    }
  }

  /**
   * Genera una nueva imágen con un tamaño y calidad en concreto a partir de
   * un base64 anterior.
   * @param img Imágen en base64
   * @param MAX_WIDTH Ancho de la imágen
   * @param MAX_HEIGHT Alto de la imágen
   * @param quality calidad de la imágen
   */
  resizeImage(img: string, MAX_WIDTH: number,
    MAX_HEIGHT: number, quality: number = 90): Promise<string> {
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
    this.file.resolveDirectoryUrl('/storage/emulated/0/DCIM/Camera')
      .then(imageBase64 => {
        return imageBase64;
      })
      .catch(err => { console.log(err) })
  }

  /**
   * Captura un vídeo, crea un thumbnail de dicho vídeo y posteriormente
   * devuelve el vídeo en base64.
   */
  getVideo(): Promise<any> {
    let options: CaptureVideoOptions = {
      duration: 1,
      quality: 10, //Lo ignora
    }

    return new Promise((resolve, reject) => {
      this.media.captureVideo(options)
        .then((data: MediaFile[]) => {
          var option: CreateThumbnailOptions = {
            fileUri: 'file:///storage/emulated/0/DCIM/Camera/' + data[0].name,
            width: 160,
            height: 206,
            atTime: 1,
            outputFileName: 'thumbnail_' + data[0].name, quality: 50,
          };
          this.videoEditor.createThumbnail(option)
            .then(async (result) => {
              /// CREA EL THUMBNAIL PERO NOSE OBTENER LA IMÁGEN
              //result --> storage/emulated/0/Android/data/io.ionic.starter/files/files/videos/
              resolve(await this.convertVideoToBase64(data[0].fullPath));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Obtiene el base64 de un vídeo en específico.
   * @param video path del vídeo.
   */
  convertVideoToBase64(video) {
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




