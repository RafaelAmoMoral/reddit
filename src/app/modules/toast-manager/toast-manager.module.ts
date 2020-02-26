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
      position: 'top',
      duration: 5000,
      closeButtonText: 'Ok',
      showCloseButton: true
    });
    toast.present();
  }

}
