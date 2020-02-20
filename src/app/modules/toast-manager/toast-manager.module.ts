import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';


@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class ToastManagerModule {
  constructor(public toastController: ToastController) { }

  async show(msg) {
    const toast = await this.toastController.create({
      message: msg,
      showCloseButton: true,
      position: 'top',
      closeButtonText: 'Ok',
      duration: 5000
    });
    toast.present();
  }

}
