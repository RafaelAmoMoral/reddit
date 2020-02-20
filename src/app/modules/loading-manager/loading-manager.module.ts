import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingController } from '@ionic/angular';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class LoadingManagerModule {

  constructor(public loadingController: LoadingController) { }

  async presentLoading(message: string = 'Cargando') {
    const loading = await this.loadingController.create({
      message: message,
    });
    await loading.present();
  }

  async hide() {
    await this.loadingController.dismiss();

  }


}


